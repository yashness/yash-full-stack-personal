"use client";

/**
 * Copilot Chat Module - Production Grade
 *
 * Features:
 * - URL-based routing (/copilot/[threadId])
 * - Background chat execution (switch threads while chat runs)
 * - Real-time sidebar with running indicators
 * - Refresh support (URL determines state)
 * - Scalable for millions of users
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { ThreadWelcome } from "./thread-welcome";
import { ThreadList } from "./thread-list";
import { Button } from "@/components/ui/button";
import {
  useChatStore,
  useCurrentThread,
  useThreadMessages,
  useThreadStreaming,
} from "@/hooks/use-chat-store";

/**
 * Message list component that renders chat messages.
 */
function MessageList({ threadId }: { threadId: string | null }) {
  const messages = useThreadMessages(threadId);
  const isStreaming = useThreadStreaming(threadId);

  if (!threadId || messages.length === 0) {
    return <ThreadWelcome />;
  }

  return (
    <div className="space-y-6">
      {messages.map((message) => {
        if (message.role === "user") {
          return <UserMessageWrapper key={message.id} message={message} />;
        }
        if (message.role === "assistant") {
          return (
            <AssistantMessageWrapper
              key={message.id}
              message={message}
              isStreaming={message.status === "streaming"}
            />
          );
        }
        return null;
      })}

      {/* Show typing indicator when streaming but no content yet */}
      {isStreaming && messages.length > 0 && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-primary rounded-full animate-bounce" />
            <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.1s]" />
            <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
          </div>
          <span>Thinking...</span>
        </div>
      )}
    </div>
  );
}

/**
 * User message wrapper for our custom format.
 */
function UserMessageWrapper({ message }: { message: { id: string; content: { type: string; text?: string }[] } }) {
  const textContent = message.content
    .filter((p) => p.type === "text")
    .map((p) => p.text)
    .join("");

  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
        <span className="text-sm">👤</span>
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium mb-1">You</div>
        <div className="text-sm">{textContent}</div>
      </div>
    </div>
  );
}

/**
 * Assistant message wrapper for our custom format.
 */
function AssistantMessageWrapper({
  message,
  isStreaming,
}: {
  message: { id: string; content: { type: string; text?: string; toolName?: string; result?: unknown }[] };
  isStreaming: boolean;
}) {
  const textContent = message.content
    .filter((p) => p.type === "text")
    .map((p) => p.text)
    .join("");

  const toolCalls = message.content.filter((p) => p.type === "tool-call");

  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
        <span className="text-sm">🤖</span>
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium mb-1">Assistant</div>
        <div className="text-sm whitespace-pre-wrap">
          {textContent}
          {isStreaming && !textContent && (
            <span className="inline-block w-2 h-4 bg-foreground/50 animate-pulse" />
          )}
        </div>

        {/* Tool calls */}
        {toolCalls.length > 0 && (
          <div className="mt-2 space-y-2">
            {toolCalls.map((tool, idx) => (
              <div key={idx} className="border rounded-lg p-2 text-xs bg-muted/50">
                <div className="font-medium">🔧 {tool.toolName}</div>
                {tool.result && (
                  <pre className="mt-1 overflow-auto max-h-32">
                    {JSON.stringify(tool.result, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Chat composer that sends messages to the current thread.
 */
function ChatComposer({ threadId }: { threadId: string | null }) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const { createThread, sendMessage } = useChatStore();
  const isStreaming = useThreadStreaming(threadId);
  const isRunning = isStreaming;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isRunning) return;

      const message = input.trim();
      setInput("");

      if (!threadId) {
        // Create new thread first, then navigate and send
        try {
          const thread = await createThread();
          // Navigate to new thread URL
          router.push(`/copilot/${thread.id}`);
          // Send message after short delay to ensure navigation
          setTimeout(() => {
            sendMessage(thread.id, message);
          }, 100);
        } catch (error) {
          console.error("Failed to create thread:", error);
        }
      } else {
        // Send to existing thread
        sendMessage(threadId, message);
      }
    },
    [input, threadId, isRunning, createThread, sendMessage, router]
  );

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="bg-muted/50 rounded-xl border border-border focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
        <div className="flex items-end gap-1 p-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            disabled={isRunning}
            className="flex-1 bg-transparent border-0 focus:ring-0 focus:outline-none min-h-[44px] py-2.5 px-2 text-sm disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isRunning}
            className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </div>
      <div className="text-center text-xs text-muted-foreground mt-2">
        Press Enter to send
      </div>
    </form>
  );
}

/**
 * Main chat thread view.
 */
function ChatThread() {
  const currentThread = useCurrentThread();
  const threadId = currentThread?.id || null;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messages = useThreadMessages(threadId);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col bg-background min-h-0">
      {/* Messages viewport */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <MessageList threadId={threadId} />
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Composer - fixed at bottom */}
      <div className="flex-shrink-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <ChatComposer threadId={threadId} />
        </div>
      </div>
    </div>
  );
}

/**
 * Main Copilot Chat component with sidebar.
 */
export function CopilotChat() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-[calc(100vh-4rem)]">
        <div className="w-64 bg-muted/30 animate-pulse" />
        <div className="flex-1 bg-background" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar toggle button (visible when sidebar closed) */}
      {!sidebarOpen && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-2 top-2 z-10"
          onClick={() => setSidebarOpen(true)}
        >
          <PanelLeftOpen className="w-5 h-5" />
        </Button>
      )}

      {/* Thread list sidebar */}
      {sidebarOpen && (
        <div className="w-64 border-r flex flex-col">
          <div className="flex items-center justify-between p-2 border-b">
            <span className="font-semibold text-sm">Conversations</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSidebarOpen(false)}
            >
              <PanelLeftClose className="w-4 h-4" />
            </Button>
          </div>
          <ThreadList className="flex-1" />
        </div>
      )}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatThread />
      </div>
    </div>
  );
}

// Re-export components that don't require assistant-ui provider
export { ThreadWelcome } from "./thread-welcome";
export { ThreadList } from "./thread-list";
export { MarkdownText } from "./markdown-text";
