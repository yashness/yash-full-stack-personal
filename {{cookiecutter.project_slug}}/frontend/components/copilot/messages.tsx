"use client";

import { useState } from "react";
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
 * Shows AI thinking process in a collapsible section with animation.
 */
function ReasoningContent(props: { text: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="my-2 rounded-lg border border-muted/50 bg-muted/20 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full p-3 text-left text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all"
      >
        <span
          className={`transform transition-transform duration-200 ${
            isOpen ? "rotate-90" : ""
          }`}
        >
          ▶
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-purple-100 dark:bg-purple-900/30">
            💭
          </span>
          Thinking
          {!isOpen && (
            <span className="text-xs text-muted-foreground/70">
              (click to expand)
            </span>
          )}
        </span>
      </button>

      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 pb-3 pl-10 text-sm text-muted-foreground whitespace-pre-wrap">
          {props.text}
        </div>
      </div>
    </div>
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
