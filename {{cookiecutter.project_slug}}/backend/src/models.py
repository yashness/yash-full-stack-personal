"""Pydantic models and SQLAlchemy models."""

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.mysql import JSON as MySQLJSON
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import TypeDecorator

from .database import Base


# =============================================================================
# Custom Types
# =============================================================================


class JSONType(TypeDecorator):
    """Platform-agnostic JSON type that uses JSONB on PostgreSQL and JSON on MySQL."""

    impl = Text
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(JSONB())
        elif dialect.name == "mysql":
            return dialect.type_descriptor(MySQLJSON())
        else:
            return dialect.type_descriptor(Text())

    def process_bind_param(self, value, dialect):
        if value is not None and dialect.name not in ("postgresql", "mysql"):
            import json
            return json.dumps(value)
        return value

    def process_result_value(self, value, dialect):
        if value is not None and dialect.name not in ("postgresql", "mysql"):
            import json
            return json.loads(value)
        return value


def generate_uuid() -> str:
    """Generate a UUID string."""
    return str(uuid.uuid4())


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

    # Relationships
    threads: Mapped[list["ThreadDB"]] = relationship("ThreadDB", back_populates="user")


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


{% if cookiecutter.copilot_ui %}
class ThreadDB(Base):
    """Chat thread database model for conversation history."""

    __tablename__ = "threads"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=generate_uuid
    )
    user_id: Mapped[str | None] = mapped_column(
        String(255), ForeignKey("users.clerk_id", ondelete="SET NULL"), nullable=True, index=True
    )
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), default="active", index=True
    )  # "active" | "archived"
    is_running: Mapped[bool] = mapped_column(
        Boolean, default=False
    )  # True when a chat is actively streaming
    extra_data: Mapped[dict[str, Any] | None] = mapped_column(JSONType, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    user: Mapped["UserDB | None"] = relationship("UserDB", back_populates="threads")
    messages: Mapped[list["MessageDB"]] = relationship(
        "MessageDB", back_populates="thread", cascade="all, delete-orphan"
    )
    session: Mapped["SessionDB | None"] = relationship(
        "SessionDB", back_populates="thread", uselist=False, cascade="all, delete-orphan"
    )


class MessageDB(Base):
    """Chat message database model."""

    __tablename__ = "messages"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=generate_uuid
    )
    thread_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("threads.id", ondelete="CASCADE"), nullable=False, index=True
    )
    role: Mapped[str] = mapped_column(String(20), nullable=False)  # "user" | "assistant" | "system"
    content: Mapped[list[dict[str, Any]]] = mapped_column(
        JSONType, nullable=False
    )  # Array of content parts
    status: Mapped[str] = mapped_column(
        String(20), default="complete"
    )  # "complete" | "running" | "error"
    extra_data: Mapped[dict[str, Any] | None] = mapped_column(
        JSONType, nullable=True
    )  # Tool calls, reasoning, etc.
    parent_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("messages.id", ondelete="SET NULL"), nullable=True
    )  # For branching support
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )

    # Relationships
    thread: Mapped["ThreadDB"] = relationship("ThreadDB", back_populates="messages")


class SessionDB(Base):
    """Claude Agent SDK session persistence for distributed servers."""

    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=generate_uuid
    )
    thread_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("threads.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    session_data: Mapped[dict[str, Any]] = mapped_column(
        JSONType, nullable=False, default=dict
    )  # Claude SDK session context
    version: Mapped[int] = mapped_column(
        Integer, default=1
    )  # Optimistic locking for concurrent updates
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    thread: Mapped["ThreadDB"] = relationship("ThreadDB", back_populates="session")
{% endif %}


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


{% if cookiecutter.copilot_ui %}
# =============================================================================
# Pydantic Models for Chat/Threads
# =============================================================================


class ContentPart(BaseModel):
    """A content part in a message."""

    type: str = Field(..., examples=["text", "image", "tool-call", "reasoning"])
    text: str | None = None
    image: str | None = None  # Base64 or URL
    tool_call_id: str | None = None
    tool_name: str | None = None
    args: dict[str, Any] | None = None
    result: Any | None = None


class ThreadCreate(BaseModel):
    """Request model for creating a thread."""

    title: str | None = Field(None, max_length=255)
    metadata: dict[str, Any] | None = None


class ThreadUpdate(BaseModel):
    """Request model for updating a thread."""

    title: str | None = Field(None, max_length=255)
    status: str | None = Field(None, pattern="^(active|archived)$")
    metadata: dict[str, Any] | None = None


class ThreadResponse(BaseModel):
    """Response model for a thread."""

    id: str
    user_id: str | None
    title: str | None
    status: str
    is_running: bool = False
    metadata: dict[str, Any] | None
    created_at: datetime
    updated_at: datetime
    message_count: int = 0

    class Config:
        from_attributes = True


class ThreadListResponse(BaseModel):
    """Response model for list of threads."""

    threads: list[ThreadResponse]
    count: int


class ChatMessageCreate(BaseModel):
    """Request model for creating a chat message."""

    role: str = Field(..., pattern="^(user|assistant|system)$")
    content: list[ContentPart]
    metadata: dict[str, Any] | None = None


class ChatMessageResponse(BaseModel):
    """Response model for a chat message."""

    id: str
    thread_id: str
    role: str
    content: list[dict[str, Any]]
    status: str
    metadata: dict[str, Any] | None
    parent_id: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class ThreadWithMessagesResponse(BaseModel):
    """Response model for a thread with its messages."""

    thread: ThreadResponse
    messages: list[ChatMessageResponse]


class ChatStreamRequest(BaseModel):
    """Chat stream request payload with thread support."""

    thread_id: str | None = None  # If None, creates new thread
    messages: list[ChatMessageCreate] | None = None  # For new messages
    continue_session: bool = True  # Load previous context from DB
    system: str | None = None  # System prompt override
{% endif %}
