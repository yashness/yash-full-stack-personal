"""Chat routes for AI copilot functionality using Claude Agent SDK."""

import json
import uuid
from collections.abc import AsyncIterator
from typing import Any

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


# Example tools that can be called by the LLM
# These demonstrate the tool calling capability
AVAILABLE_TOOLS = {
    "get_current_time": {
        "description": "Get the current date and time",
        "parameters": {},
    },
    "calculate": {
        "description": "Perform a mathematical calculation",
        "parameters": {"expression": "string"},
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
            # Safe evaluation of simple math expressions
            expression = args.get("expression", "")
            # Only allow basic math operations
            allowed = set("0123456789+-*/(). ")
            if all(c in allowed for c in expression):
                result = eval(expression)  # noqa: S307
                return {"expression": expression, "result": result}
            else:
                return {"error": "Invalid expression"}
        except Exception as e:
            return {"error": str(e)}
    else:
        return {"error": f"Unknown tool: {tool_name}"}


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
    - tool-call-start: {type: "tool-call-start", id: string, toolCallId: string, toolName: string}
    - tool-call-args-text-delta: {type: "tool-call-args-text-delta", id: string, delta: string}
    - tool-call-end: {type: "tool-call-end", id: string}
    - tool-result: {type: "tool-result", id: string, result: any}
    - finish: {type: "finish", finishReason?: string}
    """
    from claude_agent_sdk import AssistantMessage, ClaudeAgentOptions, TextBlock, ToolUseBlock, query

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
        max_turns=3,  # Allow multiple turns for tool use
    )

    message_id = str(uuid.uuid4())[:8]
    text_part_id = str(uuid.uuid4())[:8]

    try:
        # Send start message
        start_chunk = {"type": "start", "messageId": message_id}
        yield f"data: {json.dumps(start_chunk)}\n\n".encode()

        # Track if we've started text output
        text_started = False
        current_text = ""

        # Stream the response using query
        async for message in query(prompt=prompt, options=options):
            # Handle AssistantMessage with content blocks
            if isinstance(message, AssistantMessage):
                for block in message.content:
                    if isinstance(block, TextBlock):
                        # Start text part if not started
                        if not text_started:
                            text_start_chunk = {"type": "text-start", "id": text_part_id}
                            yield f"data: {json.dumps(text_start_chunk)}\n\n".encode()
                            text_started = True

                        # Send text delta in AI SDK format
                        text_chunk = {
                            "type": "text-delta",
                            "id": text_part_id,
                            "delta": block.text,
                        }
                        yield f"data: {json.dumps(text_chunk)}\n\n".encode()
                        current_text += block.text

                    elif isinstance(block, ToolUseBlock):
                        # Close any open text part
                        if text_started:
                            text_end_chunk = {"type": "text-end", "id": text_part_id}
                            yield f"data: {json.dumps(text_end_chunk)}\n\n".encode()
                            text_started = False
                            text_part_id = str(uuid.uuid4())[:8]  # New ID for next text part

                        # Tool call handling
                        tool_id = str(uuid.uuid4())[:8]
                        tool_name = block.name
                        tool_args = block.input

                        # Send tool-call-start
                        tool_start_chunk = {
                            "type": "tool-call-start",
                            "id": tool_id,
                            "toolCallId": block.id,
                            "toolName": tool_name,
                        }
                        yield f"data: {json.dumps(tool_start_chunk)}\n\n".encode()

                        # Send tool-call-args-text-delta (the args as JSON)
                        args_json = json.dumps(tool_args)
                        args_chunk = {
                            "type": "tool-call-args-text-delta",
                            "id": tool_id,
                            "delta": args_json,
                        }
                        yield f"data: {json.dumps(args_chunk)}\n\n".encode()

                        # Send tool-call-end
                        tool_end_chunk = {"type": "tool-call-end", "id": tool_id}
                        yield f"data: {json.dumps(tool_end_chunk)}\n\n".encode()

                        # Execute the tool and send result
                        tool_result = await execute_tool(tool_name, tool_args)
                        result_chunk = {
                            "type": "tool-result",
                            "id": tool_id,
                            "toolCallId": block.id,
                            "result": tool_result,
                        }
                        yield f"data: {json.dumps(result_chunk)}\n\n".encode()

        # Close text part if still open
        if text_started:
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
