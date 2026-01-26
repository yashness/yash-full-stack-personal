/**
 * Generate Thread Title API route - proxies to backend.
 */

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || "http://localhost:8000/api/v1";

interface RouteParams {
  params: Promise<{ threadId: string }>;
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { threadId } = await params;

    const response = await fetch(
      `${BACKEND_URL}/chat/threads/${threadId}/generate-title`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!response.ok) {
      return new Response(await response.text(), { status: response.status });
    }

    return Response.json(await response.json());
  } catch (error) {
    console.error("Generate title error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
