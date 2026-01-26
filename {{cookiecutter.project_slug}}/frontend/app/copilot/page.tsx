"use client";

/**
 * Main Copilot Page
 *
 * URL: /copilot
 *
 * This page shows the copilot UI with no thread selected.
 * Creating a new chat will navigate to /copilot/[threadId].
 */

import { useEffect } from "react";
import { CopilotChat } from "@/components/copilot";
import { useChatStore } from "@/hooks/use-chat-store";

export default function CopilotPage() {
  const setCurrentThread = useChatStore((s) => s.setCurrentThread);
  const loadThreads = useChatStore((s) => s.loadThreads);

  useEffect(() => {
    // No thread selected on this page
    setCurrentThread(null);
    // Load threads list for sidebar
    loadThreads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <CopilotChat />;
}
