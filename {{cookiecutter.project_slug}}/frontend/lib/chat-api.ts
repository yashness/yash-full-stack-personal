/**
 * Chat API client for thread and message management.
 *
 * This module provides functions for interacting with the chat backend,
 * including thread CRUD operations and message retrieval.
 *
 * Uses the Next.js API routes which proxy to the backend,
 * enabling both client-side and server-side usage.
 */

// Use relative paths to hit Next.js API routes
const API_BASE = "/api/threads";

// =============================================================================
// Types
// =============================================================================

export interface ContentPart {
  type: string;
  text?: string;
  image?: string;
  toolCallId?: string;
  toolName?: string;
  args?: Record<string, unknown>;
  result?: unknown;
}

export interface Thread {
  id: string;
  user_id: string | null;
  title: string | null;
  status: "active" | "archived";
  is_running: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface Message {
  id: string;
  thread_id: string;
  role: "user" | "assistant" | "system";
  content: ContentPart[];
  status: "complete" | "running" | "error";
  metadata: Record<string, unknown> | null;
  parent_id: string | null;
  created_at: string;
}

export interface ThreadWithMessages {
  thread: Thread;
  messages: Message[];
}

export interface ThreadListResponse {
  threads: Thread[];
  count: number;
}

export interface CreateThreadRequest {
  title?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateThreadRequest {
  title?: string;
  status?: "active" | "archived";
  metadata?: Record<string, unknown>;
}

// =============================================================================
// Thread API
// =============================================================================

/**
 * List threads with optional filtering.
 */
export async function listThreads(options?: {
  status?: "active" | "archived";
  limit?: number;
  offset?: number;
  userId?: string;
}): Promise<ThreadListResponse> {
  const params = new URLSearchParams();
  if (options?.status) params.set("status", options.status);
  if (options?.limit) params.set("limit", String(options.limit));
  if (options?.offset) params.set("offset", String(options.offset));
  if (options?.userId) params.set("user_id", options.userId);

  const response = await fetch(`${API_BASE}?${params}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Failed to list threads: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Create a new thread.
 */
export async function createThread(data?: CreateThreadRequest): Promise<Thread> {
  const response = await fetch(`${API_BASE}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data || {}),
  });

  if (!response.ok) {
    throw new Error(`Failed to create thread: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get a thread with its messages.
 */
export async function getThread(threadId: string): Promise<ThreadWithMessages> {
  const response = await fetch(`${API_BASE}/${threadId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Thread not found");
    }
    throw new Error(`Failed to get thread: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Update a thread.
 */
export async function updateThread(
  threadId: string,
  data: UpdateThreadRequest
): Promise<Thread> {
  const response = await fetch(`${API_BASE}/${threadId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to update thread: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Delete a thread.
 */
export async function deleteThread(threadId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${threadId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete thread: ${response.statusText}`);
  }
}

/**
 * Archive a thread.
 */
export async function archiveThread(threadId: string): Promise<Thread> {
  return updateThread(threadId, { status: "archived" });
}

/**
 * Unarchive a thread.
 */
export async function unarchiveThread(threadId: string): Promise<Thread> {
  return updateThread(threadId, { status: "active" });
}

/**
 * Generate a title for a thread.
 */
export async function generateThreadTitle(threadId: string): Promise<Thread> {
  const response = await fetch(`${API_BASE}/${threadId}/generate-title`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Failed to generate title: ${response.statusText}`);
  }

  return response.json();
}

// =============================================================================
// Message API
// =============================================================================

/**
 * Get messages for a thread.
 */
export async function getMessages(
  threadId: string,
  limit?: number
): Promise<Message[]> {
  const params = new URLSearchParams();
  if (limit) params.set("limit", String(limit));

  const response = await fetch(
    `${API_BASE}/${threadId}/messages?${params}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get messages: ${response.statusText}`);
  }

  return response.json();
}
