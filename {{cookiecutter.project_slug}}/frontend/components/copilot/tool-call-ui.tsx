"use client";

import { makeAssistantToolUI } from "@assistant-ui/react";
import {
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";

type ToolStatus = "running" | "complete" | "incomplete" | "requires-action";

interface ToolCallCardProps {
  toolName: string;
  args: Record<string, unknown>;
  result?: unknown;
  status: ToolStatus;
  isError?: boolean;
}

/**
 * Generic tool call card component that renders tool calls in a ChatGPT-like style.
 */
function ToolCallCard({ toolName, args, result, status, isError }: ToolCallCardProps) {
  const [expanded, setExpanded] = useState(false);

  const getStatusIcon = () => {
    switch (status) {
      case "running":
        return <Loader2 className="w-4 h-4 animate-spin text-primary" />;
      case "complete":
        return isError ? (
          <XCircle className="w-4 h-4 text-destructive" />
        ) : (
          <CheckCircle className="w-4 h-4 text-green-500" />
        );
      case "incomplete":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case "requires-action":
        return <AlertCircle className="w-4 h-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "running":
        return "Running...";
      case "complete":
        return isError ? "Failed" : "Completed";
      case "incomplete":
        return "Cancelled";
      case "requires-action":
        return "Awaiting input";
      default:
        return "";
    }
  };

  const formatToolName = (name: string) => {
    return name
      .replace(/_/g, " ")
      .replace(/([A-Z])/g, " $1")
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="my-3 border border-border rounded-lg overflow-hidden bg-card">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between bg-muted/50 hover:bg-muted transition-colors"
      >
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div className="text-left">
            <div className="font-medium text-sm">{formatToolName(toolName)}</div>
            <div className="text-xs text-muted-foreground">{getStatusText()}</div>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {/* Expandable content */}
      {expanded && (
        <div className="px-4 py-3 space-y-3 text-sm border-t border-border">
          {/* Arguments */}
          {Object.keys(args).length > 0 && (
            <div>
              <div className="font-medium text-muted-foreground mb-1">Arguments</div>
              <pre className="bg-muted rounded-md p-2 overflow-x-auto text-xs">
                {JSON.stringify(args, null, 2)}
              </pre>
            </div>
          )}

          {/* Result */}
          {status === "complete" && result !== undefined && (
            <div>
              <div className="font-medium text-muted-foreground mb-1">Result</div>
              <pre className="bg-muted rounded-md p-2 overflow-x-auto text-xs">
                {typeof result === "string" ? result : JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Helper to convert status object to simple status string.
 */
function getStatusString(status: { type: string } | undefined): ToolStatus {
  if (!status) return "running";
  switch (status.type) {
    case "running":
      return "running";
    case "complete":
      return "complete";
    case "incomplete":
      return "incomplete";
    case "requires-action":
      return "requires-action";
    default:
      return "running";
  }
}

/**
 * Default fallback tool UI that renders any tool call in a generic card format.
 * This handles tools that don't have custom UI registered.
 */
export const DefaultToolUI = makeAssistantToolUI({
  toolName: "*", // Wildcard matches all tools without specific UI
  render: ({ toolName, args, result, status }) => {
    const parsedArgs = typeof args === "string" ? JSON.parse(args) : args;
    return (
      <ToolCallCard
        toolName={toolName}
        args={parsedArgs as Record<string, unknown>}
        result={result}
        status={getStatusString(status)}
      />
    );
  },
});

/**
 * Example: Weather tool UI with custom rendering
 * Uncomment and customize for your specific tools
 */
// export const WeatherToolUI = makeAssistantToolUI({
//   toolName: "get_weather",
//   render: ({ args, result, status }) => {
//     if (getStatusString(status) === "running") {
//       return (
//         <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
//           <Loader2 className="w-4 h-4 animate-spin" />
//           <span>Checking weather for {args.city}...</span>
//         </div>
//       );
//     }
//
//     if (result) {
//       return (
//         <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 rounded-lg">
//           <div className="text-2xl font-bold">{result.temperature}°C</div>
//           <div className="text-muted-foreground">{args.city}</div>
//         </div>
//       );
//     }
//
//     return null;
//   },
// });

/**
 * Export all tool UIs that should be registered.
 * Add custom tool UIs to this array as you create them.
 */
export const ToolUIs = [DefaultToolUI];
