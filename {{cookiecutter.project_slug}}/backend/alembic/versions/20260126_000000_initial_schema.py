"""Initial schema with users, todos, and chat tables.

Revision ID: 0001
Revises:
Create Date: 2026-01-26 00:00:00.000000+00:00
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import mysql, postgresql

# revision identifiers, used by Alembic
revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def get_json_type():
    """Get the appropriate JSON type for the current database."""
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        return postgresql.JSONB()
    elif bind.dialect.name == "mysql":
        return mysql.JSON()
    else:
        return sa.Text()


def upgrade() -> None:
    """Upgrade database schema."""
    # Users table
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("clerk_id", sa.String(255), nullable=False),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("first_name", sa.String(255), nullable=True),
        sa.Column("last_name", sa.String(255), nullable=True),
        sa.Column("image_url", sa.String(500), nullable=True),
        sa.Column("subscription_plan", sa.String(100), nullable=True),
        sa.Column("subscription_status", sa.String(50), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("clerk_id"),
    )
    op.create_index("ix_users_clerk_id", "users", ["clerk_id"], unique=True)

    # Todos table
    op.create_table(
        "todos",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("completed", sa.Boolean(), default=False, nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    # Threads table (for chat history)
    op.create_table(
        "threads",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("user_id", sa.String(255), nullable=True),
        sa.Column("title", sa.String(255), nullable=True),
        sa.Column("status", sa.String(20), default="active", nullable=False),
        sa.Column("is_running", sa.Boolean(), default=False, nullable=False),
        sa.Column("extra_data", get_json_type(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.clerk_id"], ondelete="SET NULL"
        ),
    )
    op.create_index("ix_threads_user_id", "threads", ["user_id"])
    op.create_index("ix_threads_status", "threads", ["status"])

    # Messages table
    op.create_table(
        "messages",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("thread_id", sa.String(36), nullable=False),
        sa.Column("role", sa.String(20), nullable=False),
        sa.Column("content", get_json_type(), nullable=False),
        sa.Column("status", sa.String(20), default="complete", nullable=False),
        sa.Column("extra_data", get_json_type(), nullable=True),
        sa.Column("parent_id", sa.String(36), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["thread_id"], ["threads.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["parent_id"], ["messages.id"], ondelete="SET NULL"
        ),
    )
    op.create_index("ix_messages_thread_id", "messages", ["thread_id"])

    # Sessions table (for Claude SDK session persistence)
    op.create_table(
        "sessions",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("thread_id", sa.String(36), nullable=False),
        sa.Column("session_data", get_json_type(), nullable=False),
        sa.Column("version", sa.Integer(), default=1, nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["thread_id"], ["threads.id"], ondelete="CASCADE"
        ),
        sa.UniqueConstraint("thread_id"),
    )


def downgrade() -> None:
    """Downgrade database schema."""
    op.drop_table("sessions")
    op.drop_table("messages")
    op.drop_table("threads")
    op.drop_table("todos")
    op.drop_table("users")
