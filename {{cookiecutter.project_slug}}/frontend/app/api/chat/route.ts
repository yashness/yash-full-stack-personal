/**
 * Chat API route - proxies requests to the Python backend.
 * The backend handles the Claude Agent SDK integration and returns SSE stream.
 *
 * Supports:
 * - Thread-based conversations with session persistence
 * - Multimodal content (text, images)
 * - Tool execution
 */

// Use internal Docker URL for server-side requests, fall back to localhost for local dev
const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || "http://localhost:8000/api/v1";

interface MessagePart {
  type: string;
  text?: string;
  image?: string;
}

interface Message {
  role: string;
  content?: string | MessagePart[];
  parts?: MessagePart[];
}

interface ChatRequestBody {
  messages?: Message[];
  system?: string;
  thread_id?: string;
  continue_session?: boolean;
}

function extractTextContent(message: Message): string {
  // Handle direct content string
  if (typeof message.content === "string") {
    return message.content;
  }

  // Handle parts array (assistant-ui format)
  if (Array.isArray(message.parts)) {
    return message.parts
      .filter((part): part is MessagePart => part && typeof part === "object" && part.type === "text" && "text" in part)
      .map((part) => part.text || "")
      .join("");
  }

  // Handle content array
  if (Array.isArray(message.content)) {
    return message.content
      .filter((block): block is MessagePart => block && typeof block === "object" && "text" in block)
      .map((block) => block.text || "")
      .join("");
  }

  return "";
}

export async function POST(req: Request) {
  try {
    const body: ChatRequestBody = await req.json();

    // Handle different message formats from assistant-ui
    const messages = (body.messages || []).map((m: Message) => ({
      role: m.role,
      content: extractTextContent(m),
    }));

    // Build request payload with thread support
    const payload = {
      messages,
      system: body.system,
      thread_id: body.thread_id || null,
      continue_session: body.continue_session !== false, // Default to true
    };

    // Forward the request to the backend
    const response = await fetch(`${BACKEND_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Backend request failed", details: errorText }),
        { status: response.status, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get thread_id from response header if present
    const threadId = response.headers.get("X-Thread-Id");

    // Stream the SSE response back to the client
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        ...(threadId && { "X-Thread-Id": threadId }),
      },
    });
  } catch (error) {
    console.error("Chat route error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
