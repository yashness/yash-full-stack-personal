"use client";

import { useState, useEffect } from "react";
import {
  ComposerPrimitive,
  useComposer,
} from "@assistant-ui/react";
import {
  Send,
  Square,
  Paperclip,
} from "lucide-react";

/**
 * Inner composer that uses the useComposer hook.
 * Separated to handle React 19 SSR compatibility.
 */
function ComposerContent() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Only access the hook after mounting to avoid SSR hydration issues
  if (!mounted) {
    return (
      <ComposerPrimitive.Root className="relative">
        <div className="bg-muted/50 rounded-xl border border-border">
          <div className="flex items-end gap-1 p-2">
            <button className="p-2 rounded-lg text-muted-foreground" disabled>
              <Paperclip className="w-5 h-5" />
            </button>
            <input
              placeholder="Type a message..."
              className="flex-1 bg-transparent border-0 min-h-[44px] py-2.5 px-2 text-sm"
              disabled
            />
            <button className="p-2 rounded-lg bg-primary text-primary-foreground opacity-50" disabled>
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="text-center text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line
        </div>
      </ComposerPrimitive.Root>
    );
  }

  return <ComposerWithHook />;
}

/**
 * Composer that uses the hook - only rendered after mount.
 */
function ComposerWithHook() {
  const composer = useComposer();
  const isSubmitting = composer.isEditing === false && composer.isEmpty === false;

  return (
    <ComposerPrimitive.Root className="relative">
      <div className="bg-muted/50 rounded-xl border border-border focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
        {/* Input row */}
        <div className="flex items-end gap-1 p-2">
          {/* Attachment button */}
          <ComposerPrimitive.AddAttachment className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <Paperclip className="w-5 h-5" />
          </ComposerPrimitive.AddAttachment>

          {/* Text input */}
          <ComposerPrimitive.Input
            placeholder="Type a message..."
            className="flex-1 bg-transparent border-0 focus:ring-0 focus:outline-none resize-none min-h-[44px] max-h-[200px] py-2.5 px-2 text-sm"
            autoFocus
          />

          {/* Send / Cancel button */}
          {isSubmitting ? (
            <ComposerPrimitive.Cancel className="p-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors">
              <Square className="w-5 h-5" />
            </ComposerPrimitive.Cancel>
          ) : (
            <ComposerPrimitive.Send className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <Send className="w-5 h-5" />
            </ComposerPrimitive.Send>
          )}
        </div>
      </div>

      {/* Helpful tip */}
      <div className="text-center text-xs text-muted-foreground mt-2">
        Press Enter to send, Shift+Enter for new line
      </div>
    </ComposerPrimitive.Root>
  );
}

/**
 * Chat composer with send and cancel support.
 * Handles SSR hydration properly for React 19.
 */
export function Composer() {
  return <ComposerContent />;
}
