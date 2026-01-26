"""Pydantic models and SQLAlchemy models."""

from datetime import datetime

from pydantic import BaseModel, Field
from sqlalchemy import Boolean, DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


# =============================================================================
# SQLAlchemy Models (Database)
# =============================================================================


class UserDB(Base):
    """User database model - synced from Clerk via webhooks."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    clerk_id: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    first_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    last_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    subscription_plan: Mapped[str | None] = mapped_column(String(100), nullable=True)
    subscription_status: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )


class TodoDB(Base):
    """Todo database model."""

    __tablename__ = "todos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )


# =============================================================================
# Pydantic Models (API)
# =============================================================================


class TodoCreate(BaseModel):
    """Request model for creating a todo."""

    title: str = Field(..., min_length=1, max_length=255, examples=["Buy groceries"])


class TodoUpdate(BaseModel):
    """Request model for updating a todo."""

    title: str | None = Field(None, min_length=1, max_length=255)
    completed: bool | None = None


class TodoResponse(BaseModel):
    """Response model for a todo."""

    id: int
    title: str
    completed: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TodoListResponse(BaseModel):
    """Response model for list of todos."""

    todos: list[TodoResponse]
    count: int


class HealthResponse(BaseModel):
    """Health check response."""

    status: str = Field(default="healthy", examples=["healthy"])
    service: str = Field(examples=["{{ cookiecutter.project_slug }}-backend"])
    database: str = Field(default="connected", examples=["connected"])


class MessageResponse(BaseModel):
    """Generic message response."""

    message: str = Field(examples=["Operation successful"])


class ErrorResponse(BaseModel):
    """Error response."""

    error: str = Field(examples=["Resource not found"])
    detail: str | None = Field(default=None)


class WelcomeResponse(BaseModel):
    """API welcome response."""

    message: str
    version: str
    docs: str
