"""Session Manager for distributed Claude Agent SDK sessions.

This module provides database-backed session persistence for claude-agent-sdk,
enabling distributed servers to share session state through a central database.

Key features:
- Load/save session data from/to database
- Optimistic locking for concurrent access
- Automatic session creation for new threads
- Message history reconstruction for context
"""
import json
import uuid
from datetime import datetime
from typing import Any

from loguru import logger
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from .models import MessageDB, SessionDB, ThreadDB, generate_uuid


class SessionManager:
    """Manages Claude Agent SDK session persistence in database.

    This class bridges claude-agent-sdk's session management with database storage,
    enabling distributed servers to share session state.
    """

    def __init__(self, db: AsyncSession):
        """Initialize the session manager.

        Args:
            db: SQLAlchemy async session
        """
        self.db = db

    async def get_or_create_thread(
        self,
        thread_id: str | None = None,
        user_id: str | None = None,
        title: str | None = None,
    ) -> ThreadDB:
        """Get an existing thread or create a new one.

        Args:
            thread_id: Optional existing thread ID
            user_id: Optional user ID (Clerk ID)
            title: Optional thread title

        Returns:
            The thread database object
        """
        if thread_id:
            result = await self.db.execute(
                select(ThreadDB).where(ThreadDB.id == thread_id)
            )
            thread = result.scalar_one_or_none()
            if thread:
                return thread

        # Create new thread
        thread = ThreadDB(
            id=thread_id or generate_uuid(),
            user_id=user_id,
            title=title,
            status="active",
        )
        self.db.add(thread)
        await self.db.commit()
        await self.db.refresh(thread)
        logger.info(f"Created new thread: {thread.id}")
        return thread

    async def get_session(self, thread_id: str) -> SessionDB | None:
        """Get session data for a thread.

        Args:
            thread_id: The thread ID

        Returns:
            The session database object or None
        """
        result = await self.db.execute(
            select(SessionDB).where(SessionDB.thread_id == thread_id)
        )
        return result.scalar_one_or_none()

    async def get_or_create_session(self, thread_id: str) -> SessionDB:
        """Get existing session or create a new one.

        Args:
            thread_id: The thread ID

        Returns:
            The session database object
        """
        session = await self.get_session(thread_id)
        if session:
            return session

        # Create new session
        session = SessionDB(
            id=generate_uuid(),
            thread_id=thread_id,
            session_data={
                "messages": [],
                "system_prompt": None,
                "created_at": datetime.utcnow().isoformat(),
            },
            version=1,
        )
        self.db.add(session)
        await self.db.commit()
        await self.db.refresh(session)
        logger.info(f"Created new session for thread: {thread_id}")
        return session

    async def save_session(
        self,
        thread_id: str,
        session_data: dict[str, Any],
        expected_version: int | None = None,
    ) -> SessionDB:
        """Save session data with optimistic locking.

        Args:
            thread_id: The thread ID
            session_data: The session data to save
            expected_version: Expected version for optimistic locking

        Returns:
            The updated session

        Raises:
            ValueError: If version conflict detected
        """
        session = await self.get_session(thread_id)

        if session:
            # Check version for optimistic locking
            if expected_version is not None and session.version != expected_version:
                raise ValueError(
                    f"Session version conflict: expected {expected_version}, got {session.version}"
                )

            # Update existing session
            session.session_data = session_data
            session.version += 1
            await self.db.commit()
            await self.db.refresh(session)
        else:
            # Create new session
            session = SessionDB(
                id=generate_uuid(),
                thread_id=thread_id,
                session_data=session_data,
                version=1,
            )
            self.db.add(session)
            await self.db.commit()
            await self.db.refresh(session)

        logger.debug(f"Saved session for thread {thread_id}, version {session.version}")
        return session

    async def add_message(
        self,
        thread_id: str,
        role: str,
        content: list[dict[str, Any]],
        status: str = "complete",
        extra_data: dict[str, Any] | None = None,
        parent_id: str | None = None,
    ) -> MessageDB:
        """Add a message to a thread.

        Args:
            thread_id: The thread ID
            role: Message role (user, assistant, system)
            content: Content parts array
            status: Message status
            extra_data: Optional extra data (tool calls, etc.)
            parent_id: Optional parent message ID for branching

        Returns:
            The created message
        """
        message = MessageDB(
            id=generate_uuid(),
            thread_id=thread_id,
            role=role,
            content=content,
            status=status,
            extra_data=extra_data,
            parent_id=parent_id,
        )
        self.db.add(message)
        await self.db.commit()
        await self.db.refresh(message)

        # Update thread's updated_at
        await self.db.execute(
            update(ThreadDB)
            .where(ThreadDB.id == thread_id)
            .values(updated_at=datetime.utcnow())
        )
        await self.db.commit()

        return message

    async def update_message(
        self,
        message_id: str,
        content: list[dict[str, Any]] | None = None,
        status: str | None = None,
        extra_data: dict[str, Any] | None = None,
    ) -> MessageDB | None:
        """Update an existing message.

        Args:
            message_id: The message ID
            content: Optional new content
            status: Optional new status
            extra_data: Optional new extra data

        Returns:
            The updated message or None
        """
        result = await self.db.execute(
            select(MessageDB).where(MessageDB.id == message_id)
        )
        message = result.scalar_one_or_none()
        if not message:
            return None

        if content is not None:
            message.content = content
        if status is not None:
            message.status = status
        if extra_data is not None:
            message.extra_data = extra_data

        await self.db.commit()
        await self.db.refresh(message)
        return message

    async def get_messages(
        self,
        thread_id: str,
        limit: int | None = None,
        before_id: str | None = None,
    ) -> list[MessageDB]:
        """Get messages for a thread.

        Args:
            thread_id: The thread ID
            limit: Optional limit on number of messages
            before_id: Optional message ID to get messages before

        Returns:
            List of messages
        """
        query = (
            select(MessageDB)
            .where(MessageDB.thread_id == thread_id)
            .order_by(MessageDB.created_at.asc())
        )

        if before_id:
            # Get messages before a specific message
            result = await self.db.execute(
                select(MessageDB.created_at).where(MessageDB.id == before_id)
            )
            before_time = result.scalar_one_or_none()
            if before_time:
                query = query.where(MessageDB.created_at < before_time)

        if limit:
            query = query.limit(limit)

        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def build_conversation_context(
        self,
        thread_id: str,
        max_messages: int = 50,
    ) -> list[dict[str, Any]]:
        """Build conversation context for Claude from message history.

        This reconstructs the conversation history in a format suitable
        for passing to claude-agent-sdk.

        Args:
            thread_id: The thread ID
            max_messages: Maximum number of messages to include

        Returns:
            List of messages in claude-agent-sdk format
        """
        messages = await self.get_messages(thread_id, limit=max_messages)

        context = []
        for msg in messages:
            # Convert to claude-agent-sdk format
            context_msg = {
                "role": msg.role,
                "content": msg.content,
            }
            context.append(context_msg)

        return context

    async def get_thread(self, thread_id: str) -> ThreadDB | None:
        """Get a thread by ID.

        Args:
            thread_id: The thread ID

        Returns:
            The thread or None
        """
        result = await self.db.execute(
            select(ThreadDB).where(ThreadDB.id == thread_id)
        )
        return result.scalar_one_or_none()

    async def list_threads(
        self,
        user_id: str | None = None,
        status: str = "active",
        limit: int = 50,
        offset: int = 0,
    ) -> list[ThreadDB]:
        """List threads for a user.

        Args:
            user_id: Optional user ID to filter by
            status: Thread status filter
            limit: Maximum number of threads
            offset: Pagination offset

        Returns:
            List of threads
        """
        query = (
            select(ThreadDB)
            .where(ThreadDB.status == status)
            .order_by(ThreadDB.updated_at.desc())
            .offset(offset)
            .limit(limit)
        )

        if user_id:
            query = query.where(ThreadDB.user_id == user_id)

        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def update_thread(
        self,
        thread_id: str,
        title: str | None = None,
        status: str | None = None,
        is_running: bool | None = None,
        extra_data: dict[str, Any] | None = None,
    ) -> ThreadDB | None:
        """Update a thread.

        Args:
            thread_id: The thread ID
            title: Optional new title
            status: Optional new status
            is_running: Optional running state
            extra_data: Optional new extra data

        Returns:
            The updated thread or None
        """
        result = await self.db.execute(
            select(ThreadDB).where(ThreadDB.id == thread_id)
        )
        thread = result.scalar_one_or_none()
        if not thread:
            return None

        if title is not None:
            thread.title = title
        if status is not None:
            thread.status = status
        if is_running is not None:
            thread.is_running = is_running
        if extra_data is not None:
            thread.extra_data = extra_data

        await self.db.commit()
        await self.db.refresh(thread)
        return thread

    async def set_thread_running(self, thread_id: str, is_running: bool) -> None:
        """Set the running status of a thread.

        Args:
            thread_id: The thread ID
            is_running: Whether the thread is running
        """
        await self.update_thread(thread_id, is_running=is_running)

    async def delete_thread(self, thread_id: str) -> bool:
        """Delete a thread and all its messages.

        Args:
            thread_id: The thread ID

        Returns:
            True if deleted, False if not found
        """
        result = await self.db.execute(
            select(ThreadDB).where(ThreadDB.id == thread_id)
        )
        thread = result.scalar_one_or_none()
        if not thread:
            return False

        await self.db.delete(thread)
        await self.db.commit()
        logger.info(f"Deleted thread: {thread_id}")
        return True

    async def generate_thread_title(
        self,
        thread_id: str,
        first_message: str | None = None,
    ) -> str:
        """Generate a title for a thread based on first message.

        This is a simple implementation that takes the first N characters
        of the first message. For a more sophisticated approach, you could
        use Claude to generate a summary.

        Args:
            thread_id: The thread ID
            first_message: Optional first message content

        Returns:
            Generated title
        """
        if not first_message:
            messages = await self.get_messages(thread_id, limit=1)
            if messages:
                # Extract text from first message content
                content = messages[0].content
                for part in content:
                    if part.get("type") == "text":
                        first_message = part.get("text", "")
                        break

        if not first_message:
            return "New Chat"

        # Take first 50 characters
        title = first_message[:50].strip()
        if len(first_message) > 50:
            title += "..."

        # Update thread title
        await self.update_thread(thread_id, title=title)
        return title
