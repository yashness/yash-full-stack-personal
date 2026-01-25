"""API routes."""

from fastapi import APIRouter
from loguru import logger

from .models import MessageResponse

router = APIRouter(tags=["api"])


@router.get("/hello", response_model=MessageResponse)
async def hello() -> MessageResponse:
    """Example endpoint."""
    logger.info("Hello endpoint called")
    return MessageResponse(message="Hello from {{ cookiecutter.project_name }}!")


# Add more routes here following the pattern:
# - Keep handlers small (<10 lines)
# - Use Pydantic models for request/response
# - Log important operations
# - Extract business logic to separate modules
