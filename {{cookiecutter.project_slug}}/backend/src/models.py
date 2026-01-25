"""Pydantic models for request/response schemas."""

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """Health check response."""

    status: str = Field(default="healthy", examples=["healthy"])
    service: str = Field(examples=["{{ cookiecutter.project_slug }}-backend"])


class MessageResponse(BaseModel):
    """Generic message response."""

    message: str = Field(examples=["Operation successful"])


class ErrorResponse(BaseModel):
    """Error response."""

    error: str = Field(examples=["Resource not found"])
    detail: str | None = Field(default=None, examples=["Additional context"])


class WelcomeResponse(BaseModel):
    """API welcome response."""

    message: str
    version: str
    docs: str
