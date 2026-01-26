"use client";

import { ThreadPrimitive } from "@assistant-ui/react";
import { ArrowDown } from "lucide-react";

/**
 * Scroll to bottom button that appears when user scrolls up.
 */
export function ScrollToBottom() {
  return (
    <ThreadPrimitive.ScrollToBottom className="absolute bottom-24 right-4 p-2 bg-background border border-border rounded-full shadow-lg hover:bg-muted transition-all opacity-0 data-[visible]:opacity-100 pointer-events-none data-[visible]:pointer-events-auto">
      <ArrowDown className="w-5 h-5" />
    </ThreadPrimitive.ScrollToBottom>
  );
}
