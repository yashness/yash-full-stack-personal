"""Clerk webhook handlers for syncing users and billing events."""

import json
from typing import Any

from fastapi import APIRouter, Header, HTTPException, Request, status
from loguru import logger
from pydantic import BaseModel
from sqlalchemy import select
from svix.webhooks import Webhook, WebhookVerificationError

from .config import get_settings
from .database import AsyncSessionLocal
from .models import UserDB

router = APIRouter(tags=["webhooks"])


class WebhookEvent(BaseModel):
    """Clerk webhook event structure."""

    type: str
    data: dict[str, Any]
    object: str = "event"


# =============================================================================
# Webhook Verification
# =============================================================================


async def verify_webhook(
    request: Request,
    svix_id: str = Header(..., alias="svix-id"),
    svix_timestamp: str = Header(..., alias="svix-timestamp"),
    svix_signature: str = Header(..., alias="svix-signature"),
) -> bytes:
    """Verify the webhook signature using Svix."""
    settings = get_settings()

    if not settings.clerk_webhook_secret:
        logger.warning("Clerk webhook secret not configured")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Webhook secret not configured",
        )

    body = await request.body()

    try:
        wh = Webhook(settings.clerk_webhook_secret)
        wh.verify(
            body,
            {
                "svix-id": svix_id,
                "svix-timestamp": svix_timestamp,
                "svix-signature": svix_signature,
            },
        )
        return body
    except WebhookVerificationError as e:
        logger.error(f"Webhook verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid webhook signature",
        ) from e


# =============================================================================
# Webhook Endpoint
# =============================================================================


@router.post("/webhooks/clerk")
async def handle_clerk_webhook(
    request: Request,
    svix_id: str = Header(..., alias="svix-id"),
    svix_timestamp: str = Header(..., alias="svix-timestamp"),
    svix_signature: str = Header(..., alias="svix-signature"),
) -> dict[str, str]:
    """
    Handle incoming Clerk webhooks.

    Subscribe to these events in your Clerk Dashboard:
    - user.created
    - user.updated
    - user.deleted
    - session.created
    - subscription.created
    - subscription.updated
    - subscription.deleted
    """
    # Read body first (can only be read once)
    body = await request.body()

    # Verify webhook signature
    settings = get_settings()
    if not settings.clerk_webhook_secret:
        logger.warning("Clerk webhook secret not configured")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Webhook secret not configured",
        )

    try:
        wh = Webhook(settings.clerk_webhook_secret)
        wh.verify(
            body,
            {
                "svix-id": svix_id,
                "svix-timestamp": svix_timestamp,
                "svix-signature": svix_signature,
            },
        )
    except WebhookVerificationError as e:
        logger.error(f"Webhook verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid webhook signature",
        ) from e

    event_data = json.loads(body)
    event_type = event_data.get("type", "unknown") if event_data else "unknown"

    logger.info(f"Received Clerk webhook: {event_type}")

    # Route to appropriate handler
    handlers = {
        "user.created": handle_user_created,
        "user.updated": handle_user_updated,
        "user.deleted": handle_user_deleted,
        "session.created": handle_session_created,
        "subscription.created": handle_subscription_created,
        "subscription.updated": handle_subscription_updated,
        "subscription.deleted": handle_subscription_deleted,
    }

    handler = handlers.get(event_type)
    if handler:
        await handler(event_data.get("data", {}))
    else:
        logger.debug(f"Unhandled webhook event type: {event_type}")

    return {"status": "received"}


# =============================================================================
# Helper Functions
# =============================================================================


def extract_email(data: dict[str, Any]) -> str | None:
    """Extract primary email from Clerk user data."""
    email_addresses = data.get("email_addresses", [])
    if not email_addresses:
        return None

    primary_id = data.get("primary_email_address_id")
    primary = next((e for e in email_addresses if e.get("id") == primary_id), None)

    if primary:
        return primary.get("email_address")
    return email_addresses[0].get("email_address") if email_addresses else None


# =============================================================================
# User Event Handlers
# =============================================================================


async def handle_user_created(data: dict[str, Any]) -> None:
    """
    Handle user.created event.

    This is called when a new user signs up via Clerk.
    Creates a corresponding user record in the database.
    """
    clerk_id = data.get("id")
    email = extract_email(data)
    first_name = data.get("first_name") or ""
    last_name = data.get("last_name") or ""
    image_url = data.get("image_url")

    logger.info(f"Creating user in database: {clerk_id} ({email})")

    async with AsyncSessionLocal() as session:
        # Check if user already exists
        result = await session.execute(
            select(UserDB).where(UserDB.clerk_id == clerk_id)
        )
        existing_user = result.scalar_one_or_none()

        if existing_user:
            logger.warning(f"User already exists: {clerk_id}")
            return

        user = UserDB(
            clerk_id=clerk_id,
            email=email,
            first_name=first_name,
            last_name=last_name,
            image_url=image_url,
        )
        session.add(user)
        await session.commit()
        logger.info(f"User created in database: {clerk_id}")


async def handle_user_updated(data: dict[str, Any]) -> None:
    """
    Handle user.updated event.

    This is called when a user updates their profile in Clerk.
    Syncs the changes to the database.
    """
    clerk_id = data.get("id")
    email = extract_email(data)
    first_name = data.get("first_name") or ""
    last_name = data.get("last_name") or ""
    image_url = data.get("image_url")

    logger.info(f"Updating user in database: {clerk_id} ({email})")

    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(UserDB).where(UserDB.clerk_id == clerk_id)
        )
        user = result.scalar_one_or_none()

        if not user:
            # User doesn't exist, create them
            logger.warning(f"User not found, creating: {clerk_id}")
            user = UserDB(
                clerk_id=clerk_id,
                email=email,
                first_name=first_name,
                last_name=last_name,
                image_url=image_url,
            )
            session.add(user)
        else:
            user.email = email
            user.first_name = first_name
            user.last_name = last_name
            user.image_url = image_url

        await session.commit()
        logger.info(f"User updated in database: {clerk_id}")


async def handle_user_deleted(data: dict[str, Any]) -> None:
    """
    Handle user.deleted event.

    This is called when a user is deleted from Clerk.
    Removes the user from the database.
    """
    clerk_id = data.get("id")
    logger.info(f"Deleting user from database: {clerk_id}")

    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(UserDB).where(UserDB.clerk_id == clerk_id)
        )
        user = result.scalar_one_or_none()

        if user:
            await session.delete(user)
            await session.commit()
            logger.info(f"User deleted from database: {clerk_id}")
        else:
            logger.warning(f"User not found for deletion: {clerk_id}")


# =============================================================================
# Session Event Handlers
# =============================================================================


async def handle_session_created(data: dict[str, Any]) -> None:
    """
    Handle session.created event.

    This is called when a user signs in.
    Creates or updates the user in our database.
    """
    user_id = data.get("user_id")
    if not user_id:
        logger.warning("session.created event missing user_id")
        return

    logger.info(f"Session created for user: {user_id}")

    # Fetch user details from Clerk API
    from .clerk import get_clerk_client

    clerk = get_clerk_client()
    if not clerk:
        logger.warning("Clerk client not configured, skipping user sync")
        return

    try:
        clerk_user = clerk.users.get(user_id=user_id)
    except Exception as e:
        logger.error(f"Failed to fetch user from Clerk: {e}")
        return

    email = None
    if clerk_user.email_addresses:
        primary = next(
            (e for e in clerk_user.email_addresses if e.id == clerk_user.primary_email_address_id),
            None
        )
        email = primary.email_address if primary else clerk_user.email_addresses[0].email_address

    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(UserDB).where(UserDB.clerk_id == user_id)
        )
        existing_user = result.scalar_one_or_none()

        if existing_user:
            # Update existing user
            existing_user.email = email
            existing_user.first_name = clerk_user.first_name or ""
            existing_user.last_name = clerk_user.last_name or ""
            existing_user.image_url = clerk_user.image_url
            await session.commit()
            logger.info(f"User updated on session: {user_id}")
        else:
            # Create new user
            new_user = UserDB(
                clerk_id=user_id,
                email=email,
                first_name=clerk_user.first_name or "",
                last_name=clerk_user.last_name or "",
                image_url=clerk_user.image_url,
            )
            session.add(new_user)
            await session.commit()
            logger.info(f"User created on session: {user_id}")


# =============================================================================
# Subscription/Billing Event Handlers
# =============================================================================


async def handle_subscription_created(data: dict[str, Any]) -> None:
    """
    Handle subscription.created event.

    This is called when a user subscribes to a plan.
    """
    clerk_id = data.get("user_id") or data.get("organization_id")
    plan = data.get("plan", {})
    plan_name = plan.get("name") if isinstance(plan, dict) else None

    logger.info(f"Subscription created: user={clerk_id}, plan={plan_name}")

    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(UserDB).where(UserDB.clerk_id == clerk_id)
        )
        user = result.scalar_one_or_none()

        if user:
            user.subscription_plan = plan_name
            user.subscription_status = "active"
            await session.commit()
            logger.info(f"User subscription updated: {clerk_id} -> {plan_name}")
        else:
            logger.warning(f"User not found for subscription: {clerk_id}")


async def handle_subscription_updated(data: dict[str, Any]) -> None:
    """
    Handle subscription.updated event.

    This is called when a subscription is updated (plan change, renewal, etc).
    """
    clerk_id = data.get("user_id") or data.get("organization_id")
    plan = data.get("plan", {})
    plan_name = plan.get("name") if isinstance(plan, dict) else None
    subscription_status = data.get("status", "active")

    logger.info(f"Subscription updated: user={clerk_id}, plan={plan_name}, status={subscription_status}")

    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(UserDB).where(UserDB.clerk_id == clerk_id)
        )
        user = result.scalar_one_or_none()

        if user:
            user.subscription_plan = plan_name
            user.subscription_status = subscription_status
            await session.commit()
            logger.info(f"User subscription updated: {clerk_id}")
        else:
            logger.warning(f"User not found for subscription update: {clerk_id}")


async def handle_subscription_deleted(data: dict[str, Any]) -> None:
    """
    Handle subscription.deleted event.

    This is called when a subscription is cancelled.
    """
    clerk_id = data.get("user_id") or data.get("organization_id")

    logger.info(f"Subscription deleted: user={clerk_id}")

    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(UserDB).where(UserDB.clerk_id == clerk_id)
        )
        user = result.scalar_one_or_none()

        if user:
            user.subscription_plan = None
            user.subscription_status = "cancelled"
            await session.commit()
            logger.info(f"User subscription cancelled: {clerk_id}")
        else:
            logger.warning(f"User not found for subscription deletion: {clerk_id}")


# =============================================================================
# Admin Endpoints (for debugging)
# =============================================================================


@router.get("/users", tags=["admin"])
async def list_users() -> list[dict[str, Any]]:
    """List all users in the database (for debugging)."""
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(UserDB).order_by(UserDB.created_at.desc()))
        users = result.scalars().all()
        return [
            {
                "id": u.id,
                "clerk_id": u.clerk_id,
                "email": u.email,
                "first_name": u.first_name,
                "last_name": u.last_name,
                "subscription_plan": u.subscription_plan,
                "subscription_status": u.subscription_status,
                "created_at": u.created_at.isoformat() if u.created_at else None,
            }
            for u in users
        ]
