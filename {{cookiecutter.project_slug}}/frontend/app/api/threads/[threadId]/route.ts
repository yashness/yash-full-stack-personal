/**
 * Thread API route - proxies requests to the Python backend.
 */

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || "http://localhost:8000/api/v1";

interface RouteParams {
  params: Promise<{ threadId: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { threadId } = await params;

    const response = await fetch(`${BACKEND_URL}/chat/threads/${threadId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      return new Response(await response.text(), { status: response.status });
    }

    return Response.json(await response.json());
  } catch (error) {
    console.error("Thread get error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const { threadId } = await params;
    const body = await req.json();

    const response = await fetch(`${BACKEND_URL}/chat/threads/${threadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return new Response(await response.text(), { status: response.status });
    }

    return Response.json(await response.json());
  } catch (error) {
    console.error("Thread update error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const { threadId } = await params;

    const response = await fetch(`${BACKEND_URL}/chat/threads/${threadId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      return new Response(await response.text(), { status: response.status });
    }

    return Response.json(await response.json());
  } catch (error) {
    console.error("Thread delete error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
