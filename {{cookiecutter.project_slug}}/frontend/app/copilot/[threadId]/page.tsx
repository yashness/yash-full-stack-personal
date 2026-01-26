"use client";

/**
 * Thread-specific Copilot Page
 *
 * URL: /copilot/[threadId]
 *
 * This page loads a specific thread by ID from the URL,
 * enabling refresh support and direct linking.
 */

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { CopilotChat } from "@/components/copilot";
import { useChatStore } from "@/hooks/use-chat-store";

export default function ThreadPage() {
  const params = useParams();
  const threadId = params.threadId as string;
  const setCurrentThread = useChatStore((s) => s.setCurrentThread);
  const loadMessages = useChatStore((s) => s.loadMessages);
  const loadThreads = useChatStore((s) => s.loadThreads);

  useEffect(() => {
    // Set current thread from URL
    setCurrentThread(threadId);

    // Load threads list and messages for this thread
    loadThreads();
    loadMessages(threadId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  return <CopilotChat />;
}
