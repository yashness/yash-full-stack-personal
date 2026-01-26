"use client";

import { CopilotChat } from "@/components/copilot";

export default function CopilotPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      <CopilotChat />
    </div>
  );
}
