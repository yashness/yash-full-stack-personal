"use client";

import {
  ActionBarPrimitive,
  MessagePrimitive,
  useMessage,
} from "@assistant-ui/react";
import {
  Check,
  Copy,
  RefreshCw,
  Volume2,
  VolumeX,
  Edit2,
} from "lucide-react";
import { useState } from "react";

/**
 * Action bar for messages - provides copy, regenerate, edit, and TTS controls.
 */
export function MessageActions() {
  const message = useMessage();
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const handleCopy = async () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ActionBarPrimitive.Root
      className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
      hideWhenRunning
    >
      {/* Copy button */}
      <ActionBarPrimitive.Copy
        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        onClick={handleCopy}
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-500" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </ActionBarPrimitive.Copy>

      {/* Regenerate button (assistant messages only) */}
      {message.role === "assistant" && (
        <ActionBarPrimitive.Reload className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <RefreshCw className="w-4 h-4" />
        </ActionBarPrimitive.Reload>
      )}

      {/* Edit button (user messages only) */}
      {message.role === "user" && (
        <ActionBarPrimitive.Edit className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <Edit2 className="w-4 h-4" />
        </ActionBarPrimitive.Edit>
      )}

      {/* Text-to-speech */}
      {!speaking ? (
        <ActionBarPrimitive.Speak
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          onClick={() => setSpeaking(true)}
        >
          <Volume2 className="w-4 h-4" />
        </ActionBarPrimitive.Speak>
      ) : (
        <ActionBarPrimitive.StopSpeaking
          className="p-1.5 rounded-md text-red-500 bg-red-50 dark:bg-red-950 transition-colors"
          onClick={() => setSpeaking(false)}
        >
          <VolumeX className="w-4 h-4" />
        </ActionBarPrimitive.StopSpeaking>
      )}
    </ActionBarPrimitive.Root>
  );
}
