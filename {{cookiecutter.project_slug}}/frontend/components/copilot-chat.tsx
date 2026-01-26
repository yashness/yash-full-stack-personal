"use client";

import {
  AssistantRuntimeProvider,
  ThreadPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
} from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { Bot, Send, User } from "lucide-react";

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

function UserMessage() {
  return (
    <MessagePrimitive.Root className="flex gap-3 py-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
        <User className="w-4 h-4 text-primary-foreground" />
      </div>
      <div className="flex-1 space-y-2">
        <div className="font-medium text-sm">You</div>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <MessagePrimitive.Content />
        </div>
      </div>
    </MessagePrimitive.Root>
  );
}

function AssistantMessage() {
  return (
    <MessagePrimitive.Root className="flex gap-3 py-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
        <Bot className="w-4 h-4 text-secondary-foreground" />
      </div>
      <div className="flex-1 space-y-2">
        <div className="font-medium text-sm">Assistant</div>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <MessagePrimitive.Content />
        </div>
      </div>
    </MessagePrimitive.Root>
  );
}

function ThreadWelcome() {
  return (
    <ThreadPrimitive.Empty>
      <div className="flex flex-col items-center justify-center text-center py-16">
        <div className="rounded-full bg-primary/10 p-4 mb-4">
          <Bot className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">AI Copilot</h2>
        <p className="text-muted-foreground max-w-md">
          Start a conversation with your AI assistant. Ask questions, get help with tasks, or explore ideas together.
        </p>
      </div>
    </ThreadPrimitive.Empty>
  );
}

function Composer() {
  return (
    <ComposerPrimitive.Root className="flex items-end gap-2 bg-muted/50 rounded-xl p-2 border">
      <ComposerPrimitive.Input
        placeholder="Type a message..."
        className="flex-1 bg-transparent border-0 focus:ring-0 focus:outline-none resize-none min-h-[44px] max-h-[200px] py-2 px-3"
      />
      <ComposerPrimitive.Send className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
        <Send className="w-5 h-5" />
      </ComposerPrimitive.Send>
    </ComposerPrimitive.Root>
  );
}

function ChatThread() {
  return (
    <ThreadPrimitive.Root className="flex-1 flex flex-col bg-background">
      <ThreadPrimitive.Viewport className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <ThreadWelcome />
          <ThreadMessages />
        </div>
      </ThreadPrimitive.Viewport>

      <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Composer />
        </div>
      </div>
    </ThreadPrimitive.Root>
  );
}

export function CopilotChat() {
  // useChatRuntime defaults to /api/chat endpoint
  const runtime = useChatRuntime();

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <ChatThread />
    </AssistantRuntimeProvider>
  );
}
