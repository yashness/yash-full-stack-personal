"use client";

/**
 * Thread List Component - Production Grade
 *
 * Features:
 * - Real-time running indicators for background chats
 * - URL-based navigation
 * - Automatic refresh on thread updates
 * - Optimistic UI updates
 */

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Plus,
  Archive,
  Trash2,
  Edit2,
  Check,
  X,
  MessageSquare,
  MoreVertical,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useChatStore,
  useThreads,
  useArchivedThreads,
  useActiveStreamingThreads,
} from "@/hooks/use-chat-store";
import type { Thread } from "@/lib/chat-api";

/**
 * Running indicator for active threads.
 */
function RunningIndicator() {
  return (
    <div className="flex items-center gap-1">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
      </span>
    </div>
  );
}

interface ThreadItemProps {
  thread: Thread;
  isActive: boolean;
  isArchived?: boolean;
  isRunning?: boolean;
  onSelect: () => void;
  onRename: (title: string) => void;
  onArchive: () => void;
  onUnarchive?: () => void;
  onDelete: () => void;
}

function ThreadItem({
  thread,
  isActive,
  isArchived = false,
  isRunning = false,
  onSelect,
  onRename,
  onArchive,
  onUnarchive,
  onDelete,
}: ThreadItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(thread.title || "");

  const handleSaveTitle = () => {
    if (editTitle.trim()) {
      onRename(editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditTitle(thread.title || "");
    setIsEditing(false);
  };

  const displayTitle = thread.title || "New Chat";
  const formattedDate = new Date(thread.updated_at).toLocaleDateString();

  return (
    <div
      className={`group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
        isActive
          ? "bg-primary/10 border border-primary/20"
          : "hover:bg-muted/50"
      }`}
      onClick={() => !isEditing && onSelect()}
    >
      {/* Icon with running indicator */}
      <div className="relative flex-shrink-0">
        <MessageSquare className="w-4 h-4 text-muted-foreground" />
        {isRunning && (
          <div className="absolute -top-1 -right-1">
            <RunningIndicator />
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="flex-1 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveTitle();
              if (e.key === "Escape") handleCancelEdit();
            }}
            className="h-7 text-sm"
            autoFocus
          />
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSaveTitle}>
            <Check className="w-3 h-3" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleCancelEdit}>
            <X className="w-3 h-3" />
          </Button>
        </div>
      ) : (
        <>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium truncate">{displayTitle}</div>
              {isRunning && (
                <span className="text-xs text-green-600 dark:text-green-400">Running</span>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {thread.message_count} messages · {formattedDate}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}>
                <Edit2 className="w-4 h-4 mr-2" />
                Rename
              </DropdownMenuItem>
              {isArchived ? (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onUnarchive?.(); }}>
                  <Archive className="w-4 h-4 mr-2" />
                  Unarchive
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onArchive(); }}>
                  <Archive className="w-4 h-4 mr-2" />
                  Archive
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
    </div>
  );
}

interface ThreadListProps {
  className?: string;
}

export function ThreadList({ className = "" }: ThreadListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [mounted, setMounted] = useState(false);

  const threads = useThreads();
  const archivedThreads = useArchivedThreads();
  const activeStreamingThreads = useActiveStreamingThreads();

  const loadThreads = useChatStore((s) => s.loadThreads);
  const isLoadingThreads = useChatStore((s) => s.isLoadingThreads);
  const createThread = useChatStore((s) => s.createThread);
  const updateThread = useChatStore((s) => s.updateThread);
  const archiveThread = useChatStore((s) => s.archiveThread);
  const unarchiveThread = useChatStore((s) => s.unarchiveThread);
  const deleteThread = useChatStore((s) => s.deleteThread);

  // Get current thread ID from URL
  const currentThreadId = pathname?.startsWith("/copilot/")
    ? pathname.split("/copilot/")[1]
    : null;

  // Load threads on mount
  useEffect(() => {
    setMounted(true);
    loadThreads();

    // Refresh threads periodically for real-time updates
    const refreshInterval = setInterval(() => {
      loadThreads();
    }, 10000); // Every 10 seconds

    return () => clearInterval(refreshInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNewChat = async () => {
    try {
      const thread = await createThread();
      router.push(`/copilot/${thread.id}`);
    } catch (error) {
      console.error("Failed to create thread:", error);
    }
  };

  const handleSelectThread = (threadId: string) => {
    router.push(`/copilot/${threadId}`);
  };

  if (!mounted) {
    return (
      <div className={`flex flex-col h-full bg-muted/30 ${className}`}>
        <div className="p-3 border-b">
          <div className="h-9 bg-muted rounded animate-pulse" />
        </div>
        <div className="flex-1 p-3 space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Filter threads by search
  const filteredThreads = threads.filter((t) => {
    if (!search) return true;
    return t.title?.toLowerCase().includes(search.toLowerCase());
  });

  const filteredArchivedThreads = archivedThreads.filter((t) => {
    if (!search) return true;
    return t.title?.toLowerCase().includes(search.toLowerCase());
  });

  // Count running threads (from both local store and backend)
  const runningCount = threads.filter(
    (t) => activeStreamingThreads.includes(t.id) || t.is_running
  ).length;

  return (
    <div className={`flex flex-col h-full bg-muted/30 ${className}`}>
      {/* Header */}
      <div className="p-3 border-b space-y-2">
        <Button
          onClick={handleNewChat}
          className="w-full justify-start gap-2"
          variant="default"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </Button>

        <Input
          placeholder="Search conversations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8"
        />

        {/* Running indicator summary */}
        {runningCount > 0 && (
          <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
            <RunningIndicator />
            <span>{runningCount} chat{runningCount > 1 ? "s" : ""} running</span>
          </div>
        )}
      </div>

      {/* Thread list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {isLoadingThreads && threads.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-4">
              <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
              Loading...
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-4">
              {search ? "No matching conversations" : "No conversations yet"}
            </div>
          ) : (
            filteredThreads.map((thread) => (
              <ThreadItem
                key={thread.id}
                thread={thread}
                isActive={currentThreadId === thread.id}
                isRunning={activeStreamingThreads.includes(thread.id) || thread.is_running}
                onSelect={() => handleSelectThread(thread.id)}
                onRename={(title) => updateThread(thread.id, { title })}
                onArchive={() => archiveThread(thread.id)}
                onDelete={() => deleteThread(thread.id)}
              />
            ))
          )}
        </div>

        {/* Archived section */}
        {(filteredArchivedThreads.length > 0 || showArchived) && (
          <div className="p-2 border-t">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground w-full py-2"
            >
              <Archive className="w-4 h-4" />
              Archived ({archivedThreads.length})
            </button>

            {showArchived && (
              <div className="space-y-1 mt-2">
                {filteredArchivedThreads.map((thread) => (
                  <ThreadItem
                    key={thread.id}
                    thread={thread}
                    isActive={currentThreadId === thread.id}
                    isArchived
                    isRunning={activeStreamingThreads.includes(thread.id) || thread.is_running}
                    onSelect={() => handleSelectThread(thread.id)}
                    onRename={(title) => updateThread(thread.id, { title })}
                    onArchive={() => {}}
                    onUnarchive={() => unarchiveThread(thread.id)}
                    onDelete={() => deleteThread(thread.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
