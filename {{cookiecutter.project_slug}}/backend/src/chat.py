"""Chat routes for AI copilot functionality using Claude Agent SDK."""

import json
import uuid
from collections.abc import AsyncIterator

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from loguru import logger
from pydantic import BaseModel

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatMessage(BaseModel):
    """A single chat message."""

    role: str
    content: str


class ChatRequest(BaseModel):
    """Chat request payload."""

    messages: list[ChatMessage]
    system: str | None = None


async def stream_chat_response(
    messages: list[ChatMessage],
    system: str | None = None,
) -> AsyncIterator[bytes]:
    """Stream chat response from Claude Agent SDK in AI SDK UI Message Stream format.

    This produces SSE-formatted output compatible with useChatRuntime from @assistant-ui/react-ai-sdk.
    Format: data: <json>\n\n with final data: [DONE]\n\n

    AI SDK expects these chunk types:
    - start: {type: "start", messageId?: string}
    - text-start: {type: "text-start", id: string}
    - text-delta: {type: "text-delta", id: string, delta: string}
    - text-end: {type: "text-end", id: string}
    - finish: {type: "finish", finishReason?: string}
    """
    from claude_agent_sdk import AssistantMessage, ClaudeAgentOptions, TextBlock, query

    # Get the last user message as the prompt
    user_messages = [m for m in messages if m.role == "user"]
    if not user_messages:
        error_chunk = {"type": "error", "errorText": "No user message found"}
        yield f"data: {json.dumps(error_chunk)}\n\n".encode()
        yield b"data: [DONE]\n\n"
        return

    prompt = user_messages[-1].content
    system_prompt = system or "You are a helpful AI assistant. Be concise and helpful."

    # Configure Claude Agent options
    options = ClaudeAgentOptions(
        system_prompt=system_prompt,
        max_turns=1,  # Only allow one turn for simple chat
    )

    message_id = str(uuid.uuid4())[:8]
    text_part_id = str(uuid.uuid4())[:8]

    try:
        # Send start message
        start_chunk = {"type": "start", "messageId": message_id}
        yield f"data: {json.dumps(start_chunk)}\n\n".encode()

        # Send text-start
        text_start_chunk = {"type": "text-start", "id": text_part_id}
        yield f"data: {json.dumps(text_start_chunk)}\n\n".encode()

        # Stream the response using query
        async for message in query(prompt=prompt, options=options):
            # Handle AssistantMessage with content blocks
            if isinstance(message, AssistantMessage):
                for block in message.content:
                    if isinstance(block, TextBlock):
                        # Send text delta in AI SDK format
                        text_chunk = {
                            "type": "text-delta",
                            "id": text_part_id,
                            "delta": block.text,
                        }
                        yield f"data: {json.dumps(text_chunk)}\n\n".encode()

        # Send text-end
        text_end_chunk = {"type": "text-end", "id": text_part_id}
        yield f"data: {json.dumps(text_end_chunk)}\n\n".encode()

        # Send finish message
        finish_chunk = {"type": "finish", "finishReason": "stop"}
        yield f"data: {json.dumps(finish_chunk)}\n\n".encode()

        # Send DONE marker (required by AI SDK)
        yield b"data: [DONE]\n\n"

    except Exception as e:
        logger.error(f"Chat error: {e}")
        error_chunk = {"type": "error", "errorText": str(e)}
        yield f"data: {json.dumps(error_chunk)}\n\n".encode()
        yield b"data: [DONE]\n\n"


@router.post("")
async def chat(request: ChatRequest) -> StreamingResponse:
    """
    Stream a chat response from Claude.

    This endpoint accepts messages and returns a streaming response
    compatible with the AI SDK UI Message Stream protocol (SSE format).
    """
    logger.info(f"Chat request with {len(request.messages)} messages")

    return StreamingResponse(
        stream_chat_response(request.messages, request.system),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Content-Type-Options": "nosniff",
            "X-Accel-Buffering": "no",
        },
    )
