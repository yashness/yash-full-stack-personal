"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCreateTodo } from "@/hooks/use-todos";

export function AddTodo() {
  const [title, setTitle] = useState("");
  const createTodo = useCreateTodo();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createTodo.mutate(title.trim(), {
      onSuccess: () => setTitle(""),
    });
  };

  return (
    <TooltipProvider>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to be done?"
            disabled={createTodo.isPending}
            className="pr-10"
          />
          {title.length > 0 && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              {title.length}/100
            </span>
          )}
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="submit"
              disabled={!title.trim() || createTodo.isPending}
              className="gap-2"
            >
              {createTodo.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Add Task</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Add a new task</p>
          </TooltipContent>
        </Tooltip>
      </form>
    </TooltipProvider>
  );
}
