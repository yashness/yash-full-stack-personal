"""Chat routes for AI copilot functionality using Claude Agent SDK.

This module provides streaming chat endpoints with:
- Thread-based conversation history
- Database-backed session persistence for distributed servers
- Support for followup messages with context preservation
- Multimodal content support (text, images, tool calls)
"""

import json
import uuid
from collections.abc import AsyncIterator
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from loguru import logger
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from .database import get_db
from .models import (
    ChatMessageCreate,
    ChatMessageResponse,
    ChatStreamRequest,
    ContentPart,
    MessageDB,
    ThreadCreate,
    ThreadDB,
    ThreadListResponse,
    ThreadResponse,
    ThreadUpdate,
    ThreadWithMessagesResponse,
)
from .session_manager import SessionManager

router = APIRouter(prefix="/chat", tags=["chat"])


# =============================================================================
# Thread Management Endpoints
# =============================================================================


@router.get("/threads", response_model=ThreadListResponse)
async def list_threads(
    status: str = Query("active", pattern="^(active|archived)$"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user_id: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
) -> ThreadListResponse:
    """List chat threads.

    Args:
        status: Filter by thread status
        limit: Maximum number of threads to return
        offset: Pagination offset
        user_id: Optional filter by user ID
        db: Database session

    Returns:
        List of threads with count
    """
    session_mgr = SessionManager(db)
    threads = await session_mgr.list_threads(
        user_id=user_id,
        status=status,
        limit=limit,
        offset=offset,
    )

    # Get message counts for each thread
    thread_responses = []
    for thread in threads:
        result = await db.execute(
            select(func.count(MessageDB.id)).where(MessageDB.thread_id == thread.id)
        )
        message_count = result.scalar() or 0

        thread_responses.append(
            ThreadResponse(
                id=thread.id,
                user_id=thread.user_id,
                title=thread.title,
                status=thread.status,
                is_running=thread.is_running,
                metadata=thread.extra_data,
                created_at=thread.created_at,
                updated_at=thread.updated_at,
                message_count=message_count,
            )
        )

    return ThreadListResponse(threads=thread_responses, count=len(thread_responses))


@router.post("/threads", response_model=ThreadResponse, status_code=201)
async def create_thread(
    data: ThreadCreate,
    db: AsyncSession = Depends(get_db),
) -> ThreadResponse:
    """Create a new chat thread.

    Args:
        data: Thread creation data
        db: Database session

    Returns:
        The created thread
    """
    session_mgr = SessionManager(db)
    thread = await session_mgr.get_or_create_thread(
        title=data.title,
    )

    if data.metadata:
        await session_mgr.update_thread(thread.id, extra_data=data.metadata)

    return ThreadResponse(
        id=thread.id,
        user_id=thread.user_id,
        title=thread.title,
        status=thread.status,
        is_running=thread.is_running,
        metadata=thread.extra_data,
        created_at=thread.created_at,
        updated_at=thread.updated_at,
        message_count=0,
    )


@router.get("/threads/{thread_id}", response_model=ThreadWithMessagesResponse)
async def get_thread(
    thread_id: str,
    db: AsyncSession = Depends(get_db),
) -> ThreadWithMessagesResponse:
    """Get a thread with its messages.

    Args:
        thread_id: The thread ID
        db: Database session

    Returns:
        Thread with messages
    """
    session_mgr = SessionManager(db)
    thread = await session_mgr.get_thread(thread_id)

    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")

    messages = await session_mgr.get_messages(thread_id)

    # Get message count
    result = await db.execute(
        select(func.count(MessageDB.id)).where(MessageDB.thread_id == thread_id)
    )
    message_count = result.scalar() or 0

    return ThreadWithMessagesResponse(
        thread=ThreadResponse(
            id=thread.id,
            user_id=thread.user_id,
            title=thread.title,
            status=thread.status,
            is_running=thread.is_running,
            metadata=thread.extra_data,
            created_at=thread.created_at,
            updated_at=thread.updated_at,
            message_count=message_count,
        ),
        messages=[
            ChatMessageResponse(
                id=msg.id,
                thread_id=msg.thread_id,
                role=msg.role,
                content=msg.content,
                status=msg.status,
                metadata=msg.extra_data,
                parent_id=msg.parent_id,
                created_at=msg.created_at,
            )
            for msg in messages
        ],
    )


@router.patch("/threads/{thread_id}", response_model=ThreadResponse)
async def update_thread(
    thread_id: str,
    data: ThreadUpdate,
    db: AsyncSession = Depends(get_db),
) -> ThreadResponse:
    """Update a thread.

    Args:
        thread_id: The thread ID
        data: Update data
        db: Database session

    Returns:
        The updated thread
    """
    session_mgr = SessionManager(db)
    thread = await session_mgr.update_thread(
        thread_id,
        title=data.title,
        status=data.status,
        extra_data=data.metadata,
    )

    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")

    # Get message count
    result = await db.execute(
        select(func.count(MessageDB.id)).where(MessageDB.thread_id == thread_id)
    )
    message_count = result.scalar() or 0

    return ThreadResponse(
        id=thread.id,
        user_id=thread.user_id,
        title=thread.title,
        status=thread.status,
        is_running=thread.is_running,
        metadata=thread.extra_data,
        created_at=thread.created_at,
        updated_at=thread.updated_at,
        message_count=message_count,
    )


@router.delete("/threads/{thread_id}")
async def delete_thread(
    thread_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    """Delete a thread and all its messages.

    Args:
        thread_id: The thread ID
        db: Database session

    Returns:
        Confirmation message
    """
    session_mgr = SessionManager(db)
    deleted = await session_mgr.delete_thread(thread_id)

    if not deleted:
        raise HTTPException(status_code=404, detail="Thread not found")

    return {"message": f"Thread {thread_id} deleted"}


@router.post("/threads/{thread_id}/generate-title", response_model=ThreadResponse)
async def generate_thread_title(
    thread_id: str,
    db: AsyncSession = Depends(get_db),
) -> ThreadResponse:
    """Generate a title for a thread based on its content.

    Args:
        thread_id: The thread ID
        db: Database session

    Returns:
        The updated thread
    """
    session_mgr = SessionManager(db)
    thread = await session_mgr.get_thread(thread_id)

    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")

    await session_mgr.generate_thread_title(thread_id)
    thread = await session_mgr.get_thread(thread_id)

    # Get message count
    result = await db.execute(
        select(func.count(MessageDB.id)).where(MessageDB.thread_id == thread_id)
    )
    message_count = result.scalar() or 0

    return ThreadResponse(
        id=thread.id,
        user_id=thread.user_id,
        title=thread.title,
        status=thread.status,
        is_running=thread.is_running,
        metadata=thread.extra_data,
        created_at=thread.created_at,
        updated_at=thread.updated_at,
        message_count=message_count,
    )


# =============================================================================
# Message Endpoints
# =============================================================================


@router.get("/threads/{thread_id}/messages", response_model=list[ChatMessageResponse])
async def get_messages(
    thread_id: str,
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
) -> list[ChatMessageResponse]:
    """Get messages for a thread.

    Args:
        thread_id: The thread ID
        limit: Maximum number of messages
        db: Database session

    Returns:
        List of messages
    """
    session_mgr = SessionManager(db)
    messages = await session_mgr.get_messages(thread_id, limit=limit)

    return [
        ChatMessageResponse(
            id=msg.id,
            thread_id=msg.thread_id,
            role=msg.role,
            content=msg.content,
            status=msg.status,
                metadata=msg.extra_data,
            parent_id=msg.parent_id,
            created_at=msg.created_at,
        )
        for msg in messages
    ]


# =============================================================================
# Chat Streaming
# =============================================================================


# Example tools that can be called by the LLM
AVAILABLE_TOOLS = {
    "get_current_time": {
        "description": "Get the current date and time",
        "parameters": {},
    },
    "calculate": {
        "description": "Perform a mathematical calculation",
        "parameters": {"expression": "string"},
    },
    "web_search": {
        "description": "Search the web for information",
        "parameters": {"query": "string"},
    },
}


async def execute_tool(tool_name: str, args: dict[str, Any]) -> dict[str, Any]:
    """Execute a tool and return the result."""
    import datetime

    if tool_name == "get_current_time":
        now = datetime.datetime.now()
        return {
            "time": now.strftime("%H:%M:%S"),
            "date": now.strftime("%Y-%m-%d"),
            "timezone": "local",
        }
    elif tool_name == "calculate":
        try:
            expression = args.get("expression", "")
            allowed = set("0123456789+-*/(). ")
            if all(c in allowed for c in expression):
                result = eval(expression)  # noqa: S307
                return {"expression": expression, "result": result}
            else:
                return {"error": "Invalid expression"}
        except Exception as e:
            return {"error": str(e)}
    elif tool_name == "web_search":
        # Placeholder for web search - would integrate with search API
        query = args.get("query", "")
        return {
            "query": query,
            "results": [
                {"title": f"Result for: {query}", "snippet": "This is a placeholder result."}
            ],
        }
    else:
        return {"error": f"Unknown tool: {tool_name}"}


async def stream_chat_response(
    thread_id: str,
    user_content: list[dict[str, Any]],
    session_mgr: SessionManager,
    system: str | None = None,
    continue_session: bool = True,
) -> AsyncIterator[bytes]:
    """Stream chat response from Claude Agent SDK in AI SDK UI Message Stream format.

    Args:
        thread_id: The thread ID for persistence
        user_content: The user message content parts
        session_mgr: Session manager for DB operations
        system: Optional system prompt override
        continue_session: Whether to load previous context

    Yields:
        SSE-formatted chunks compatible with assistant-ui
    """
    from claude_agent_sdk import AssistantMessage, ClaudeAgentOptions, TextBlock, ToolUseBlock, query

    message_id = str(uuid.uuid4())[:8]
    text_part_id = str(uuid.uuid4())[:8]

    try:
        # Mark thread as running
        await session_mgr.set_thread_running(thread_id, True)

        # Save user message to database
        user_text = ""
        for part in user_content:
            if part.get("type") == "text":
                user_text = part.get("text", "")
                break

        await session_mgr.add_message(
            thread_id=thread_id,
            role="user",
            content=user_content,
            status="complete",
        )

        # Build conversation context from history if continuing session
        context_messages = []
        if continue_session:
            context_messages = await session_mgr.build_conversation_context(
                thread_id, max_messages=50
            )

        # Get system prompt
        system_prompt = system or "You are a helpful AI assistant. Be concise and helpful."

        # Configure Claude Agent options
        options = ClaudeAgentOptions(
            system_prompt=system_prompt,
            max_turns=3,
        )

        # Send start message
        start_chunk = {"type": "start", "messageId": message_id}
        yield f"data: {json.dumps(start_chunk)}\n\n".encode()

        text_started = False
        current_text = ""
        assistant_content: list[dict[str, Any]] = []
        tool_results: list[dict[str, Any]] = []

        # Stream the response
        async for message in query(prompt=user_text, options=options):
            if isinstance(message, AssistantMessage):
                for block in message.content:
                    if isinstance(block, TextBlock):
                        if not text_started:
                            text_start_chunk = {"type": "text-start", "id": text_part_id}
                            yield f"data: {json.dumps(text_start_chunk)}\n\n".encode()
                            text_started = True

                        text_chunk = {
                            "type": "text-delta",
                            "id": text_part_id,
                            "delta": block.text,
                        }
                        yield f"data: {json.dumps(text_chunk)}\n\n".encode()
                        current_text += block.text

                    elif isinstance(block, ToolUseBlock):
                        # Close text part if open
                        if text_started:
                            text_end_chunk = {"type": "text-end", "id": text_part_id}
                            yield f"data: {json.dumps(text_end_chunk)}\n\n".encode()
                            text_started = False

                            # Save text content
                            if current_text:
                                assistant_content.append({
                                    "type": "text",
                                    "text": current_text,
                                })
                                current_text = ""

                            text_part_id = str(uuid.uuid4())[:8]

                        # Tool call handling
                        tool_id = str(uuid.uuid4())[:8]
                        tool_name = block.name
                        tool_args = block.input

                        tool_start_chunk = {
                            "type": "tool-call-start",
                            "id": tool_id,
                            "toolCallId": block.id,
                            "toolName": tool_name,
                        }
                        yield f"data: {json.dumps(tool_start_chunk)}\n\n".encode()

                        args_json = json.dumps(tool_args)
                        args_chunk = {
                            "type": "tool-call-args-text-delta",
                            "id": tool_id,
                            "delta": args_json,
                        }
                        yield f"data: {json.dumps(args_chunk)}\n\n".encode()

                        tool_end_chunk = {"type": "tool-call-end", "id": tool_id}
                        yield f"data: {json.dumps(tool_end_chunk)}\n\n".encode()

                        # Execute tool
                        tool_result = await execute_tool(tool_name, tool_args)
                        result_chunk = {
                            "type": "tool-result",
                            "id": tool_id,
                            "toolCallId": block.id,
                            "result": tool_result,
                        }
                        yield f"data: {json.dumps(result_chunk)}\n\n".encode()

                        # Store tool call in content
                        assistant_content.append({
                            "type": "tool-call",
                            "toolCallId": block.id,
                            "toolName": tool_name,
                            "args": tool_args,
                            "result": tool_result,
                        })

        # Close text part if still open
        if text_started:
            text_end_chunk = {"type": "text-end", "id": text_part_id}
            yield f"data: {json.dumps(text_end_chunk)}\n\n".encode()

            if current_text:
                assistant_content.append({
                    "type": "text",
                    "text": current_text,
                })

        # Save assistant message to database
        await session_mgr.add_message(
            thread_id=thread_id,
            role="assistant",
            content=assistant_content if assistant_content else [{"type": "text", "text": ""}],
            status="complete",
        )

        # Update session data
        session = await session_mgr.get_or_create_session(thread_id)
        session_data = session.session_data or {}
        session_data["last_interaction"] = str(uuid.uuid4())
        await session_mgr.save_session(thread_id, session_data)

        # Send finish message
        finish_chunk = {"type": "finish", "finishReason": "stop"}
        yield f"data: {json.dumps(finish_chunk)}\n\n".encode()

        yield b"data: [DONE]\n\n"

        # Mark thread as no longer running
        await session_mgr.set_thread_running(thread_id, False)

    except Exception as e:
        logger.error(f"Chat error: {e}")

        # Mark thread as no longer running
        try:
            await session_mgr.set_thread_running(thread_id, False)
        except Exception:
            pass  # Best effort cleanup

        # Update message status to error if we created one
        error_chunk = {"type": "error", "errorText": str(e)}
        yield f"data: {json.dumps(error_chunk)}\n\n".encode()
        yield b"data: [DONE]\n\n"


# Legacy chat endpoint for backward compatibility
class ChatMessage(BaseModel):
    """A single chat message (legacy format)."""
    role: str
    content: str


class LegacyChatRequest(BaseModel):
    """Legacy chat request payload."""
    messages: list[ChatMessage]
    system: str | None = None
    thread_id: str | None = None
    continue_session: bool = True


@router.post("")
async def chat(
    request: LegacyChatRequest,
    db: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    """Stream a chat response from Claude.

    This endpoint supports both legacy format (messages array) and new format
    with thread_id for persistent conversations.

    Args:
        request: Chat request with messages
        db: Database session

    Returns:
        Streaming response with SSE events
    """
    session_mgr = SessionManager(db)

    # Get or create thread
    thread = await session_mgr.get_or_create_thread(thread_id=request.thread_id)

    # Extract user message content
    user_messages = [m for m in request.messages if m.role == "user"]
    if not user_messages:
        return StreamingResponse(
            iter([b'data: {"type": "error", "errorText": "No user message found"}\n\n', b"data: [DONE]\n\n"]),
            media_type="text/event-stream",
        )

    # Convert to content parts format
    user_content = [{"type": "text", "text": user_messages[-1].content}]

    logger.info(f"Chat request for thread {thread.id} with continue_session={request.continue_session}")

    return StreamingResponse(
        stream_chat_response(
            thread_id=thread.id,
            user_content=user_content,
            session_mgr=session_mgr,
            system=request.system,
            continue_session=request.continue_session,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Content-Type-Options": "nosniff",
            "X-Accel-Buffering": "no",
            "X-Thread-Id": thread.id,  # Return thread ID in header
        },
    )
