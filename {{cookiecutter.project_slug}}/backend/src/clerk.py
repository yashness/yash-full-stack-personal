"""Clerk authentication utilities for FastAPI."""

from functools import lru_cache
from typing import Annotated

import httpx
from clerk_backend_api import Clerk
from clerk_backend_api.security import AuthenticateRequestOptions
from fastapi import Depends, HTTPException, Request, status
from loguru import logger
from pydantic import BaseModel

from .config import get_settings


class ClerkUser(BaseModel):
    """Authenticated Clerk user."""

    user_id: str
    session_id: str | None = None
    org_id: str | None = None
    org_role: str | None = None
    org_slug: str | None = None


class ClerkUserWithSubscription(ClerkUser):
    """Clerk user with subscription info."""

    plan: str | None = None
    features: list[str] = []


@lru_cache
def get_clerk_client() -> Clerk | None:
    """Get Clerk SDK client (cached)."""
    settings = get_settings()
    if not settings.clerk_secret_key:
        return None
    return Clerk(bearer_auth=settings.clerk_secret_key)


def _request_to_httpx(request: Request) -> httpx.Request:
    """Convert FastAPI Request to httpx.Request for Clerk SDK."""
    return httpx.Request(
        method=request.method,
        url=str(request.url),
        headers=dict(request.headers),
    )


async def get_current_user(request: Request) -> ClerkUser:
    """
    Dependency to get the current authenticated user from Clerk.

    Raises HTTPException 401 if not authenticated.
    """
    clerk = get_clerk_client()
    if not clerk:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Clerk authentication not configured",
        )

    settings = get_settings()
    httpx_request = _request_to_httpx(request)

    try:
        request_state = clerk.authenticate_request(
            httpx_request,
            AuthenticateRequestOptions(
                authorized_parties=[settings.frontend_url],
            ),
        )

        if not request_state.is_signed_in:
            logger.debug(f"Auth failed: {request_state.reason}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated",
                headers={"WWW-Authenticate": "Bearer"},
            )

        payload = request_state.payload or {}
        return ClerkUser(
            user_id=payload.get("sub", ""),
            session_id=payload.get("sid"),
            org_id=payload.get("org_id"),
            org_role=payload.get("org_role"),
            org_slug=payload.get("org_slug"),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Clerk auth error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e


async def get_optional_user(request: Request) -> ClerkUser | None:
    """
    Dependency to get the current user if authenticated, None otherwise.

    Useful for routes that work for both authenticated and anonymous users.
    """
    try:
        return await get_current_user(request)
    except HTTPException:
        return None


async def get_user_with_subscription(request: Request) -> ClerkUserWithSubscription:
    """
    Dependency to get user with their subscription/billing info.

    This fetches additional data from Clerk about the user's plan.
    """
    user = await get_current_user(request)
    clerk = get_clerk_client()

    if not clerk:
        return ClerkUserWithSubscription(**user.model_dump())

    try:
        # Fetch user's billing subscription from Clerk
        subscription = clerk.users.get_billing_subscription(user_id=user.user_id)

        plan = None
        features: list[str] = []

        if subscription and hasattr(subscription, "plan"):
            plan = subscription.plan.name if subscription.plan else None
            if hasattr(subscription, "features"):
                features = [f.name for f in subscription.features if f.name]

        return ClerkUserWithSubscription(
            **user.model_dump(),
            plan=plan,
            features=features,
        )

    except Exception as e:
        logger.warning(f"Failed to fetch subscription: {e}")
        return ClerkUserWithSubscription(**user.model_dump())


def require_plan(plan: str):
    """
    Dependency factory to require a specific plan.

    Usage:
        @router.get("/premium")
        async def premium_endpoint(user: Annotated[ClerkUserWithSubscription, Depends(require_plan("pro"))]):
            ...
    """

    async def check_plan(request: Request) -> ClerkUserWithSubscription:
        user = await get_user_with_subscription(request)
        if user.plan != plan:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This endpoint requires the '{plan}' plan",
            )
        return user

    return check_plan


def require_feature(feature: str):
    """
    Dependency factory to require a specific feature.

    Usage:
        @router.get("/widgets")
        async def widgets_endpoint(user: Annotated[ClerkUserWithSubscription, Depends(require_feature("widgets"))]):
            ...
    """

    async def check_feature(request: Request) -> ClerkUserWithSubscription:
        user = await get_user_with_subscription(request)
        if feature not in user.features:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This endpoint requires the '{feature}' feature",
            )
        return user

    return check_feature


# Type aliases for cleaner dependency injection
CurrentUser = Annotated[ClerkUser, Depends(get_current_user)]
OptionalUser = Annotated[ClerkUser | None, Depends(get_optional_user)]
CurrentUserWithSubscription = Annotated[ClerkUserWithSubscription, Depends(get_user_with_subscription)]
