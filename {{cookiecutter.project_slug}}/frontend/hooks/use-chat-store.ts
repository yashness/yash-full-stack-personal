/**
 * Chat Store with Multi-Thread Background Execution
 *
 * Production-grade state management for:
 * - Multiple concurrent chat sessions
 * - Background execution while switching threads
 * - Real-time sidebar updates
 * - URL-based thread routing
 */

"use client";

import type { ContentPart, Thread } from "@/lib/chat-api";
import * as chatApi from "@/lib/chat-api";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// =============================================================================
// Types
// =============================================================================

export interface ThreadMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: ContentPart[];
  status: "pending" | "streaming" | "complete" | "error";
  createdAt: Date;
  metadata?: Record<string, unknown>;
}

interface ThreadState {
  messages: ThreadMessage[];
  isStreaming: boolean;
}

interface ChatState {
  // Thread list
  threads: Thread[];
  archivedThreads: Thread[];
  isLoadingThreads: boolean;
  threadError: string | null;

  // Per-thread message state (keyed by threadId)
  threadStates: Record<string, ThreadState>;

  // Current view (URL determines this, store just tracks it)
  currentThreadId: string | null;

  // Active streaming connections (as array for React compatibility)
  activeStreams: string[];

  // Actions - Threads
  loadThreads: () => Promise<void>;
  createThread: (title?: string) => Promise<Thread>;
  setCurrentThread: (threadId: string | null) => void;
  updateThread: (threadId: string, data: { title?: string; status?: "active" | "archived" }) => Promise<void>;
  deleteThread: (threadId: string) => Promise<void>;
  archiveThread: (threadId: string) => Promise<void>;
  unarchiveThread: (threadId: string) => Promise<void>;

  // Actions - Messages
  loadMessages: (threadId: string) => Promise<void>;
  sendMessage: (threadId: string, content: string) => Promise<void>;
  cancelStream: (threadId: string) => void;

  // Actions - Streaming state
  isThreadStreaming: (threadId: string) => boolean;
  getActiveStreamingThreads: () => string[];

  // Internal actions
  _addMessage: (threadId: string, message: ThreadMessage) => void;
  _updateLastMessage: (threadId: string, updates: Partial<ThreadMessage>) => void;
  _appendToLastMessage: (threadId: string, text: string) => void;
  _setStreaming: (threadId: string, isStreaming: boolean) => void;
  _addActiveStream: (threadId: string, controller: AbortController) => void;
  _removeActiveStream: (threadId: string) => void;
}

// Store abort controllers separately (not in Zustand state to avoid serialization issues)
const streamControllers = new Map<string, AbortController>();

// =============================================================================
// Store
// =============================================================================

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      // Initial state
      threads: [],
      archivedThreads: [],
      isLoadingThreads: false,
      threadError: null,
      threadStates: {},
      currentThreadId: null,
      activeStreams: [],

      // Thread list actions
      loadThreads: async () => {
        set({ isLoadingThreads: true, threadError: null });
        try {
          const [activeResponse, archivedResponse] = await Promise.all([
            chatApi.listThreads({ status: "active", limit: 100 }),
            chatApi.listThreads({ status: "archived", limit: 50 }),
          ]);
          set({
            threads: activeResponse.threads,
            archivedThreads: archivedResponse.threads,
            isLoadingThreads: false,
          });
        } catch (error) {
          set({
            threadError: error instanceof Error ? error.message : "Failed to load threads",
            isLoadingThreads: false,
          });
        }
      },

      createThread: async (title?: string) => {
        try {
          const thread = await chatApi.createThread({ title });
          set((state) => ({
            threads: [thread, ...state.threads],
            threadStates: {
              ...state.threadStates,
              [thread.id]: { messages: [], isStreaming: false },
            },
          }));
          return thread;
        } catch (error) {
          set({
            threadError: error instanceof Error ? error.message : "Failed to create thread",
          });
          throw error;
        }
      },

      setCurrentThread: (threadId: string | null) => {
        set({ currentThreadId: threadId });
      },

      updateThread: async (threadId: string, data) => {
        try {
          const updated = await chatApi.updateThread(threadId, data);
          set((state) => ({
            threads: state.threads.map((t) => (t.id === threadId ? updated : t)),
            archivedThreads: state.archivedThreads.map((t) => (t.id === threadId ? updated : t)),
          }));
        } catch (error) {
          set({
            threadError: error instanceof Error ? error.message : "Failed to update thread",
          });
        }
      },

      deleteThread: async (threadId: string) => {
        try {
          // Cancel any running stream first
          get().cancelStream(threadId);
          await chatApi.deleteThread(threadId);
          set((state) => {
            const { [threadId]: removed, ...remainingStates } = state.threadStates;
            return {
              threads: state.threads.filter((t) => t.id !== threadId),
              archivedThreads: state.archivedThreads.filter((t) => t.id !== threadId),
              threadStates: remainingStates,
            };
          });
        } catch (error) {
          set({
            threadError: error instanceof Error ? error.message : "Failed to delete thread",
          });
        }
      },

      archiveThread: async (threadId: string) => {
        try {
          const updated = await chatApi.archiveThread(threadId);
          set((state) => ({
            threads: state.threads.filter((t) => t.id !== threadId),
            archivedThreads: [updated, ...state.archivedThreads],
          }));
        } catch (error) {
          set({
            threadError: error instanceof Error ? error.message : "Failed to archive thread",
          });
        }
      },

      unarchiveThread: async (threadId: string) => {
        try {
          const updated = await chatApi.unarchiveThread(threadId);
          set((state) => ({
            archivedThreads: state.archivedThreads.filter((t) => t.id !== threadId),
            threads: [updated, ...state.threads],
          }));
        } catch (error) {
          set({
            threadError: error instanceof Error ? error.message : "Failed to unarchive thread",
          });
        }
      },

      // Message actions
      loadMessages: async (threadId: string) => {
        try {
          const messages = await chatApi.getMessages(threadId);
          const threadMessages: ThreadMessage[] = messages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            status: "complete" as const,
            createdAt: new Date(m.created_at),
            metadata: m.metadata || undefined,
          }));

          set((state) => ({
            threadStates: {
              ...state.threadStates,
              [threadId]: {
                messages: threadMessages,
                isStreaming: state.threadStates[threadId]?.isStreaming || false,
              },
            },
          }));
        } catch (error) {
          console.error("Failed to load messages:", error);
        }
      },

      sendMessage: async (threadId: string, content: string) => {
        const state = get();

        // Add optimistic user message
        const userMessage: ThreadMessage = {
          id: `temp-user-${Date.now()}`,
          role: "user",
          content: [{ type: "text", text: content }],
          status: "complete",
          createdAt: new Date(),
        };
        get()._addMessage(threadId, userMessage);

        // Add optimistic assistant message (streaming placeholder)
        const assistantMessage: ThreadMessage = {
          id: `temp-assistant-${Date.now()}`,
          role: "assistant",
          content: [{ type: "text", text: "" }],
          status: "streaming",
          createdAt: new Date(),
        };
        get()._addMessage(threadId, assistantMessage);
        get()._setStreaming(threadId, true);

        // Create abort controller
        const controller = new AbortController();
        get()._addActiveStream(threadId, controller);

        try {
          const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: [{ role: "user", content }],
              thread_id: threadId,
              continue_session: true,
            }),
            signal: controller.signal,
          });

          if (!response.ok) {
            throw new Error(`Chat request failed: ${response.status}`);
          }

          // Process the stream
          const reader = response.body?.getReader();
          if (!reader) throw new Error("No response body");

          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              if (line === "data: [DONE]") continue;

              try {
                const data = JSON.parse(line.slice(6));

                if (data.type === "text-delta" && data.delta) {
                  get()._appendToLastMessage(threadId, data.delta);
                } else if (data.type === "finish") {
                  get()._updateLastMessage(threadId, { status: "complete" });
                } else if (data.type === "error") {
                  get()._updateLastMessage(threadId, {
                    status: "error",
                    content: [{ type: "text", text: data.errorText || "An error occurred" }],
                  });
                }
              } catch (e) {
                // Ignore parse errors for partial data
              }
            }
          }

          // Stream complete, refresh from DB
          get()._setStreaming(threadId, false);
          get()._removeActiveStream(threadId);
          await get().loadMessages(threadId);
          await get().loadThreads();

          // Auto-generate title if this is a new thread (title is null or "New Chat")
          const thread = get().threads.find((t) => t.id === threadId);
          if (thread && (!thread.title || thread.title === "New Chat")) {
            try {
              await chatApi.generateThreadTitle(threadId);
              await get().loadThreads();
            } catch (e) {
              console.error("Failed to generate title:", e);
            }
          }
        } catch (error) {
          if ((error as Error).name === "AbortError") {
            // Intentionally cancelled
            get()._setStreaming(threadId, false);
            get()._removeActiveStream(threadId);
            return;
          }

          console.error(`Chat error for thread ${threadId}:`, error);
          get()._updateLastMessage(threadId, {
            status: "error",
            content: [{ type: "text", text: (error as Error).message }],
          });
          get()._setStreaming(threadId, false);
          get()._removeActiveStream(threadId);
        }
      },

      cancelStream: (threadId: string) => {
        const controller = streamControllers.get(threadId);
        if (controller) {
          controller.abort();
          streamControllers.delete(threadId);
        }
        get()._setStreaming(threadId, false);
        set((state) => ({
          activeStreams: state.activeStreams.filter((id) => id !== threadId),
        }));
      },

      isThreadStreaming: (threadId: string) => {
        return get().threadStates[threadId]?.isStreaming || false;
      },

      getActiveStreamingThreads: () => {
        return get().activeStreams;
      },

      // Internal actions
      _addMessage: (threadId: string, message: ThreadMessage) => {
        set((state) => {
          const currentState = state.threadStates[threadId] || { messages: [], isStreaming: false };
          return {
            threadStates: {
              ...state.threadStates,
              [threadId]: {
                ...currentState,
                messages: [...currentState.messages, message],
              },
            },
          };
        });
      },

      _updateLastMessage: (threadId: string, updates: Partial<ThreadMessage>) => {
        set((state) => {
          const currentState = state.threadStates[threadId];
          if (!currentState || currentState.messages.length === 0) return state;

          const messages = [...currentState.messages];
          const lastMessage = { ...messages[messages.length - 1], ...updates };
          messages[messages.length - 1] = lastMessage;

          return {
            threadStates: {
              ...state.threadStates,
              [threadId]: { ...currentState, messages },
            },
          };
        });
      },

      _appendToLastMessage: (threadId: string, text: string) => {
        set((state) => {
          const currentState = state.threadStates[threadId];
          if (!currentState || currentState.messages.length === 0) return state;

          const messages = [...currentState.messages];
          const lastMessage = messages[messages.length - 1];

          // Find or create text content part
          const content = [...lastMessage.content];
          const textPart = content.find((p) => p.type === "text");
          if (textPart) {
            textPart.text = (textPart.text || "") + text;
          } else {
            content.push({ type: "text", text });
          }

          messages[messages.length - 1] = { ...lastMessage, content };

          return {
            threadStates: {
              ...state.threadStates,
              [threadId]: { ...currentState, messages },
            },
          };
        });
      },

      _setStreaming: (threadId: string, isStreaming: boolean) => {
        set((state) => {
          const currentState = state.threadStates[threadId] || { messages: [], isStreaming: false };
          return {
            threadStates: {
              ...state.threadStates,
              [threadId]: { ...currentState, isStreaming },
            },
          };
        });
      },

      _addActiveStream: (threadId: string, controller: AbortController) => {
        streamControllers.set(threadId, controller);
        set((state) => ({
          activeStreams: state.activeStreams.includes(threadId)
            ? state.activeStreams
            : [...state.activeStreams, threadId],
        }));
      },

      _removeActiveStream: (threadId: string) => {
        streamControllers.delete(threadId);
        set((state) => ({
          activeStreams: state.activeStreams.filter((id) => id !== threadId),
        }));
      },
    }),
    {
      name: "chat-store-v3",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist minimal data - don't persist Set
        currentThreadId: state.currentThreadId,
      }),
    }
  )
);

// =============================================================================
// Selector Hooks - Using stable selectors to avoid React 19 issues
// =============================================================================

// Empty array constant to avoid creating new references
const EMPTY_MESSAGES: ThreadMessage[] = [];

export const useCurrentThread = () => {
  return useChatStore((s) => {
    if (!s.currentThreadId) return null;
    return (
      s.threads.find((t) => t.id === s.currentThreadId) ||
      s.archivedThreads.find((t) => t.id === s.currentThreadId) ||
      null
    );
  });
};

export const useThreadMessages = (threadId: string | null) => {
  return useChatStore((s) => {
    if (!threadId) return EMPTY_MESSAGES;
    return s.threadStates[threadId]?.messages ?? EMPTY_MESSAGES;
  });
};

export const useThreadStreaming = (threadId: string | null) => {
  return useChatStore((s) => {
    if (!threadId) return false;
    return s.threadStates[threadId]?.isStreaming ?? false;
  });
};

export const useActiveStreamingThreads = () => {
  return useChatStore((s) => s.activeStreams);
};

export const useThreads = () => useChatStore((s) => s.threads);
export const useArchivedThreads = () => useChatStore((s) => s.archivedThreads);

// Legacy exports for compatibility
export const useThreadStatus = useThreadStreaming;
