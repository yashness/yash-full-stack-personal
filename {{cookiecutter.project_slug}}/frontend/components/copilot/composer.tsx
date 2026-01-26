"use client";

import {
  ComposerPrimitive,
  useComposer,
} from "@assistant-ui/react";
import {
  Send,
  Square,
  Paperclip,
  X,
} from "lucide-react";

/**
 * Chat composer with send and cancel support.
 */
export function Composer() {
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
