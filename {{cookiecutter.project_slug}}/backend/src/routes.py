"""API routes for todos."""

from fastapi import APIRouter, Depends, HTTPException
from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .database import get_db
from .models import (
    MessageResponse,
    TodoCreate,
    TodoDB,
    TodoListResponse,
    TodoResponse,
    TodoUpdate,
)

router = APIRouter(prefix="/todos", tags=["todos"])


@router.get("", response_model=TodoListResponse)
async def list_todos(db: AsyncSession = Depends(get_db)) -> TodoListResponse:
    """Get all todos."""
    result = await db.execute(select(TodoDB).order_by(TodoDB.created_at.desc()))
    todos = result.scalars().all()
    logger.info(f"Retrieved {len(todos)} todos")
    return TodoListResponse(
        todos=[TodoResponse.model_validate(t) for t in todos],
        count=len(todos),
    )


@router.post("", response_model=TodoResponse, status_code=201)
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


@router.get("/{todo_id}", response_model=TodoResponse)
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


@router.patch("/{todo_id}", response_model=TodoResponse)
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


@router.delete("/{todo_id}", response_model=MessageResponse)
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
