"use client";

import {
  MessagePrimitive,
  useMessage,
} from "@assistant-ui/react";
import { Bot, User } from "lucide-react";
import { MessageActions } from "./message-actions";
import { MarkdownText } from "./markdown-text";

/**
 * Custom text renderer with markdown support.
 */
function TextContent(props: { text: string }) {
  return <MarkdownText text={props.text} />;
}

/**
 * Image content renderer for multimodal messages.
 */
function ImageContent(props: { image: string }) {
  return (
    <div className="my-2">
      <img
        src={props.image}
        alt="User uploaded image"
        className="max-w-full max-h-96 rounded-lg border border-border"
      />
    </div>
  );
}

/**
 * File content renderer for file attachments.
 */
function FileContent(props: { filename?: string; mimeType: string; data: string }) {
  const filename = props.filename || "file";
  const isImage = props.mimeType.startsWith("image/");

  if (isImage) {
    return (
      <div className="my-2">
        <img
          src={`data:${props.mimeType};base64,${props.data}`}
          alt={filename}
          className="max-w-full max-h-96 rounded-lg border border-border"
        />
      </div>
    );
  }

  return (
    <a
      href={`data:${props.mimeType};base64,${props.data}`}
      download={filename}
      className="inline-flex items-center gap-2 px-3 py-2 my-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
    >
      <span className="text-lg">📄</span>
      <span className="text-sm font-medium">{filename}</span>
    </a>
  );
}

/**
 * Reasoning content renderer (chain-of-thought).
 */
function ReasoningContent(props: { text: string }) {
  return (
    <details className="my-2 text-muted-foreground">
      <summary className="cursor-pointer text-sm font-medium hover:text-foreground transition-colors">
        💭 Thinking...
      </summary>
      <div className="mt-2 pl-4 border-l-2 border-muted text-sm">
        {props.text}
      </div>
    </details>
  );
}

/**
 * Source/citation renderer.
 */
function SourceContent(props: { url: string; title?: string }) {
  return (
    <a
      href={props.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
    >
      🔗 {props.title || props.url}
    </a>
  );
}

/**
 * Typing indicator shown while assistant is generating.
 */
function TypingIndicator() {
  const message = useMessage();

  if (message.status?.type !== "running") {
    return null;
  }

  return (
    <div className="flex gap-1 mt-2">
      <span
        className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
        style={{ animationDelay: "0ms" }}
      />
      <span
        className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
        style={{ animationDelay: "150ms" }}
      />
      <span
        className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
        style={{ animationDelay: "300ms" }}
      />
    </div>
  );
}

/**
 * User message component with avatar and content.
 */
export function UserMessage() {
  return (
    <MessagePrimitive.Root className="group flex gap-3 py-4 hover:bg-muted/30 px-2 -mx-2 rounded-lg transition-colors">
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
        <User className="w-4 h-4 text-primary-foreground" />
      </div>

      {/* Content */}
      <div className="flex-1 space-y-1 min-w-0">
        <div className="font-medium text-sm">You</div>

        <MessagePrimitive.Content
          components={{
            Text: TextContent,
            Image: ImageContent,
            File: FileContent,
          }}
        />

        {/* Actions */}
        <MessageActions />
      </div>
    </MessagePrimitive.Root>
  );
}

/**
 * Assistant message component with avatar, content, and actions.
 */
export function AssistantMessage() {
  const message = useMessage();

  return (
    <MessagePrimitive.Root className="group flex gap-3 py-4 hover:bg-muted/30 px-2 -mx-2 rounded-lg transition-colors">
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
        <Bot className="w-4 h-4 text-secondary-foreground" />
      </div>

      {/* Content */}
      <div className="flex-1 space-y-1 min-w-0">
        <div className="font-medium text-sm">Assistant</div>

        <MessagePrimitive.Content
          components={{
            Text: TextContent,
            Image: ImageContent,
            File: FileContent,
            Reasoning: ReasoningContent,
            Source: SourceContent,
            // ToolCall is handled by makeAssistantToolUI registration
          }}
        />

        <TypingIndicator />

        {/* Actions - only show when not running */}
        {message.status?.type === "complete" && <MessageActions />}
      </div>
    </MessagePrimitive.Root>
  );
}
