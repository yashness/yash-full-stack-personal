"use client";

/**
 * Copilot Chat Module
 *
 * This module provides a complete AI chat interface built with assistant-ui.
 * It includes:
 * - Rich message rendering with markdown support
 * - Tool call visualization
 * - File attachments
 * - Voice input
 * - Message actions (copy, regenerate, edit, TTS, feedback)
 * - Scroll to bottom button
 * - Welcome screen with suggestions
 */

import {
  AssistantRuntimeProvider,
  ThreadPrimitive,
} from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";

import { UserMessage, AssistantMessage } from "./messages";
import { Composer } from "./composer";
import { ThreadWelcome } from "./thread-welcome";
import { ScrollToBottom } from "./scroll-to-bottom";
import { ToolUIs } from "./tool-call-ui";

/**
 * Thread messages container.
 */
function ThreadMessages() {
  return (
    <ThreadPrimitive.Messages
      components={{
        UserMessage,
        AssistantMessage,
      }}
    />
  );
}

/**
 * Main chat thread component.
 */
function ChatThread() {
  return (
    <ThreadPrimitive.Root className="relative flex-1 flex flex-col bg-background">
      {/* Messages viewport */}
      <ThreadPrimitive.Viewport className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <ThreadWelcome />
          <ThreadMessages />
        </div>
      </ThreadPrimitive.Viewport>

      {/* Scroll to bottom */}
      <ScrollToBottom />

      {/* Composer */}
      <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Composer />
        </div>
      </div>
    </ThreadPrimitive.Root>
  );
}

/**
 * Main Copilot Chat component.
 * Wraps the chat interface with the runtime provider.
 */
export function CopilotChat() {
  // useChatRuntime defaults to /api/chat endpoint
  const runtime = useChatRuntime();

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {/* Register tool UIs */}
      {ToolUIs.map((ToolUI, index) => (
        <ToolUI key={index} />
      ))}
      <ChatThread />
    </AssistantRuntimeProvider>
  );
}

// Re-export components for customization
export { UserMessage, AssistantMessage } from "./messages";
export { Composer } from "./composer";
export { ThreadWelcome } from "./thread-welcome";
export { ScrollToBottom } from "./scroll-to-bottom";
export { MessageActions } from "./message-actions";
export { DefaultToolUI, ToolUIs } from "./tool-call-ui";
export { MarkdownText } from "./markdown-text";
