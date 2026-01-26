"use client";

import { ThreadPrimitive } from "@assistant-ui/react";
import { Bot, Sparkles, MessageSquare, Zap } from "lucide-react";

interface SuggestionButtonProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  prompt: string;
}

/**
 * Suggestion button that sends a pre-defined prompt.
 */
function SuggestionButton({ icon, title, description, prompt }: SuggestionButtonProps) {
  return (
    <ThreadPrimitive.Suggestion
      prompt={prompt}
      className="flex flex-col items-start gap-2 p-4 bg-card border border-border rounded-xl hover:bg-muted hover:border-primary/50 transition-all cursor-pointer group"
    >
      <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        {icon}
      </div>
      <div>
        <div className="font-medium text-sm">{title}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
    </ThreadPrimitive.Suggestion>
  );
}

/**
 * Welcome screen shown when thread is empty.
 */
export function ThreadWelcome() {
  return (
    <ThreadPrimitive.Empty>
      <div className="flex flex-col items-center justify-center text-center py-12">
        {/* Logo/Icon */}
        <div className="relative mb-6">
          <div className="rounded-full bg-primary/10 p-6">
            <Bot className="w-12 h-12 text-primary" />
          </div>
          <div className="absolute -top-1 -right-1 bg-primary rounded-full p-1.5">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
        </div>

        {/* Title & Description */}
        <h2 className="text-2xl font-bold mb-2">AI Copilot</h2>
        <p className="text-muted-foreground max-w-md mb-8">
          Start a conversation with your AI assistant. Ask questions, get help
          with tasks, or explore ideas together.
        </p>

        {/* Suggestion cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl w-full">
          <SuggestionButton
            icon={<MessageSquare className="w-5 h-5" />}
            title="General Help"
            description="Get answers to your questions"
            prompt="What can you help me with?"
          />
          <SuggestionButton
            icon={<Zap className="w-5 h-5" />}
            title="Quick Task"
            description="Complete a task efficiently"
            prompt="Help me draft a professional email"
          />
          <SuggestionButton
            icon={<Sparkles className="w-5 h-5" />}
            title="Creative Ideas"
            description="Brainstorm and explore"
            prompt="Give me 5 creative ideas for a weekend project"
          />
        </div>
      </div>
    </ThreadPrimitive.Empty>
  );
}
