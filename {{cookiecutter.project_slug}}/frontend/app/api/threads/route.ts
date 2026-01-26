/**
 * Threads API route - proxies requests to the Python backend.
 */

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || "http://localhost:8000/api/v1";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const searchParams = url.searchParams.toString();

    const response = await fetch(`${BACKEND_URL}/chat/threads?${searchParams}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      return new Response(await response.text(), { status: response.status });
    }

    return Response.json(await response.json());
  } catch (error) {
    console.error("Threads list error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const response = await fetch(`${BACKEND_URL}/chat/threads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return new Response(await response.text(), { status: response.status });
    }

    return Response.json(await response.json());
  } catch (error) {
    console.error("Thread create error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
