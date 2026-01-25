import { z } from "zod";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:{{ cookiecutter.backend_port }}";

// Zod schemas for type safety
export const TodoSchema = z.object({
  id: z.number(),
  title: z.string(),
  completed: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const TodoListSchema = z.object({
  todos: z.array(TodoSchema),
  count: z.number(),
});

export type Todo = z.infer<typeof TodoSchema>;
export type TodoList = z.infer<typeof TodoListSchema>;

// API client
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json();
}

export async function getTodos(): Promise<TodoList> {
  const data = await fetchApi<unknown>("/api/v1/todos");
  return TodoListSchema.parse(data);
}

export async function createTodo(title: string): Promise<Todo> {
  const data = await fetchApi<unknown>("/api/v1/todos", {
    method: "POST",
    body: JSON.stringify({ title }),
  });
  return TodoSchema.parse(data);
}

export async function updateTodo(
  id: number,
  updates: { title?: string; completed?: boolean }
): Promise<Todo> {
  const data = await fetchApi<unknown>(`/api/v1/todos/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
  return TodoSchema.parse(data);
}

export async function deleteTodo(id: number): Promise<void> {
  await fetchApi(`/api/v1/todos/${id}`, { method: "DELETE" });
}
