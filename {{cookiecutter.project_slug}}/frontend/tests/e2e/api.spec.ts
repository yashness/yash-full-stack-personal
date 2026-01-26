import { test, expect } from "@playwright/test";

/**
 * E2E tests for API endpoints.
 */

const BACKEND_URL =
  process.env.BACKEND_URL || "http://localhost:{{ cookiecutter.backend_port }}";

test.describe("API Endpoints", () => {
  test("backend health check", async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/health`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.status).toBe("healthy");
    expect(data.database).toBe("connected");
  });

  test("list threads endpoint", async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/api/v1/chat/threads`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty("threads");
    expect(data).toHaveProperty("count");
    expect(Array.isArray(data.threads)).toBeTruthy();
  });

  test("create thread endpoint", async ({ request }) => {
    const response = await request.post(`${BACKEND_URL}/api/v1/chat/threads`, {
      data: { title: "Test Thread" },
    });
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty("id");
    expect(data).toHaveProperty("title");
    expect(data.title).toBe("Test Thread");
    expect(data.status).toBe("active");

    // Cleanup - delete the thread
    const threadId = data.id;
    await request.delete(`${BACKEND_URL}/api/v1/chat/threads/${threadId}`);
  });

  test("chat endpoint returns SSE stream", async ({ request }) => {
    // First create a thread
    const threadResponse = await request.post(
      `${BACKEND_URL}/api/v1/chat/threads`,
      {
        data: { title: "SSE Test" },
      }
    );
    const thread = await threadResponse.json();

    // Send chat request
    const response = await request.post(`${BACKEND_URL}/api/v1/chat`, {
      data: {
        messages: [{ role: "user", content: "Say hello" }],
        thread_id: thread.id,
      },
    });

    expect(response.ok()).toBeTruthy();
    expect(response.headers()["content-type"]).toContain("text/event-stream");

    // Cleanup
    await request.delete(`${BACKEND_URL}/api/v1/chat/threads/${thread.id}`);
  });

  test("todos CRUD operations", async ({ request }) => {
    // Create todo
    const createResponse = await request.post(`${BACKEND_URL}/api/v1/todos`, {
      data: { title: "E2E Test Todo" },
    });
    expect(createResponse.ok()).toBeTruthy();
    const todo = await createResponse.json();
    expect(todo.title).toBe("E2E Test Todo");

    // Get todos
    const listResponse = await request.get(`${BACKEND_URL}/api/v1/todos`);
    expect(listResponse.ok()).toBeTruthy();
    const list = await listResponse.json();
    expect(list.todos.some((t: { id: number }) => t.id === todo.id)).toBeTruthy();

    // Update todo
    const updateResponse = await request.patch(
      `${BACKEND_URL}/api/v1/todos/${todo.id}`,
      {
        data: { completed: true },
      }
    );
    expect(updateResponse.ok()).toBeTruthy();
    const updated = await updateResponse.json();
    expect(updated.completed).toBe(true);

    // Delete todo
    const deleteResponse = await request.delete(
      `${BACKEND_URL}/api/v1/todos/${todo.id}`
    );
    expect(deleteResponse.ok()).toBeTruthy();
  });
});
