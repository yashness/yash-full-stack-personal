"""API routes for todos and user management."""

from fastapi import APIRouter, Depends, HTTPException
from loguru import logger
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .clerk import (
    ClerkUserWithSubscription,
    CurrentUser,
    CurrentUserWithSubscription,
    OptionalUser,
    require_feature,
    require_plan,
)
from .database import get_db
from .models import (
    MessageResponse,
    TodoCreate,
    TodoDB,
    TodoListResponse,
    TodoResponse,
    TodoUpdate,
    UserDB,
)

router = APIRouter()

# =============================================================================
# User Routes (require authentication)
# =============================================================================


class UserProfileResponse(BaseModel):
    """User profile response."""

    user_id: str
    org_id: str | None = None
    org_role: str | None = None
    plan: str | None = None
    features: list[str] = []


@router.get("/me", response_model=UserProfileResponse, tags=["users"])
async def get_current_user_profile(user: CurrentUserWithSubscription) -> UserProfileResponse:
    """
    Get the current user's profile.

    Requires authentication via Clerk.
    """
    return UserProfileResponse(
        user_id=user.user_id,
        org_id=user.org_id,
        org_role=user.org_role,
        plan=user.plan,
        features=user.features,
    )


@router.post("/me/sync", tags=["users"])
async def sync_current_user(
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Sync the current user to the local database.

    This is a manual alternative to webhooks for local development.
    In production, webhooks handle this automatically.
    """
    from .clerk import get_clerk_client
    from .models import UserDB

    clerk = get_clerk_client()
    if not clerk:
        raise HTTPException(status_code=503, detail="Clerk not configured")

    # Fetch user details from Clerk
    try:
        clerk_user = clerk.users.get(user_id=user.user_id)
    except Exception as e:
        logger.error(f"Failed to fetch user from Clerk: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch user data")

    email = None
    if clerk_user.email_addresses:
        primary = next(
            (e for e in clerk_user.email_addresses if e.id == clerk_user.primary_email_address_id),
            None
        )
        email = primary.email_address if primary else clerk_user.email_addresses[0].email_address

    # Check if user exists
    result = await db.execute(select(UserDB).where(UserDB.clerk_id == user.user_id))
    existing_user = result.scalar_one_or_none()

    if existing_user:
        # Update existing user
        existing_user.email = email
        existing_user.first_name = clerk_user.first_name or ""
        existing_user.last_name = clerk_user.last_name or ""
        existing_user.image_url = clerk_user.image_url
        await db.commit()
        logger.info(f"Updated user in database: {user.user_id}")
        return {"status": "updated", "user_id": user.user_id, "email": email}
    else:
        # Create new user
        new_user = UserDB(
            clerk_id=user.user_id,
            email=email,
            first_name=clerk_user.first_name or "",
            last_name=clerk_user.last_name or "",
            image_url=clerk_user.image_url,
        )
        db.add(new_user)
        await db.commit()
        logger.info(f"Created user in database: {user.user_id}")
        return {"status": "created", "user_id": user.user_id, "email": email}


@router.get("/premium-content", tags=["premium"])
async def get_premium_content(
    user: ClerkUserWithSubscription = Depends(require_plan("pro")),
) -> dict:
    """
    Example premium endpoint that requires 'pro' plan.

    This demonstrates how to protect endpoints by subscription plan.
    """
    return {
        "message": f"Welcome to premium content, {user.user_id}!",
        "plan": user.plan,
    }


@router.get("/feature-content", tags=["premium"])
async def get_feature_content(
    user: ClerkUserWithSubscription = Depends(require_feature("widgets")),
) -> dict:
    """
    Example feature-gated endpoint that requires 'widgets' feature.

    This demonstrates how to protect endpoints by specific features.
    """
    return {
        "message": f"You have access to widgets, {user.user_id}!",
        "features": user.features,
    }


# =============================================================================
# Todo Routes
# =============================================================================

todos_router = APIRouter(prefix="/todos", tags=["todos"])


@todos_router.get("", response_model=TodoListResponse)
async def list_todos(db: AsyncSession = Depends(get_db)) -> TodoListResponse:
    """Get all todos."""
    result = await db.execute(select(TodoDB).order_by(TodoDB.created_at.desc()))
    todos = result.scalars().all()
    logger.info(f"Retrieved {len(todos)} todos")
    return TodoListResponse(
        todos=[TodoResponse.model_validate(t) for t in todos],
        count=len(todos),
    )


@todos_router.post("", response_model=TodoResponse, status_code=201)
async def create_todo(
    data: TodoCreate,
    db: AsyncSession = Depends(get_db),
) -> TodoResponse:
    """Create a new todo."""
    todo = TodoDB(title=data.title)
    db.add(todo)
    await db.commit()
    await db.refresh(todo)
    logger.info(f"Created todo: {todo.id}")
    return TodoResponse.model_validate(todo)


@todos_router.get("/{todo_id}", response_model=TodoResponse)
async def get_todo(
    todo_id: int,
    db: AsyncSession = Depends(get_db),
) -> TodoResponse:
    """Get a single todo by ID."""
    result = await db.execute(select(TodoDB).where(TodoDB.id == todo_id))
    todo = result.scalar_one_or_none()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    return TodoResponse.model_validate(todo)


@todos_router.patch("/{todo_id}", response_model=TodoResponse)
async def update_todo(
    todo_id: int,
    data: TodoUpdate,
    db: AsyncSession = Depends(get_db),
) -> TodoResponse:
    """Update a todo."""
    result = await db.execute(select(TodoDB).where(TodoDB.id == todo_id))
    todo = result.scalar_one_or_none()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")

    if data.title is not None:
        todo.title = data.title
    if data.completed is not None:
        todo.completed = data.completed

    await db.commit()
    await db.refresh(todo)
    logger.info(f"Updated todo: {todo_id}")
    return TodoResponse.model_validate(todo)


@todos_router.delete("/{todo_id}", response_model=MessageResponse)
async def delete_todo(
    todo_id: int,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    """Delete a todo."""
    result = await db.execute(select(TodoDB).where(TodoDB.id == todo_id))
    todo = result.scalar_one_or_none()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")

    await db.delete(todo)
    await db.commit()
    logger.info(f"Deleted todo: {todo_id}")
    return MessageResponse(message=f"Todo {todo_id} deleted")


# Include todos router in main router
router.include_router(todos_router)
