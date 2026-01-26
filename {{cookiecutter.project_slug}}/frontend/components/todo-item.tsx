"use client";

import { Trash2, MoreHorizontal, Pencil, Check, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDeleteTodo, useUpdateTodo } from "@/hooks/use-todos";
import type { Todo } from "@/lib/api";
import { cn } from "@/lib/utils";

interface TodoItemProps {
  todo: Todo;
}

export function TodoItem({ todo }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();

  const handleToggle = () => {
    updateTodo.mutate({
      id: todo.id,
      updates: { completed: !todo.completed },
    });
  };

  const handleDelete = () => {
    deleteTodo.mutate(todo.id);
  };

  const handleEdit = () => {
    setEditTitle(todo.title);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (editTitle.trim() && editTitle !== todo.title) {
      updateTodo.mutate({
        id: todo.id,
        updates: { title: editTitle.trim() },
      });
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditTitle(todo.title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveEdit();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  return (
    <TooltipProvider>
      <div
        className={cn(
          "group flex items-center gap-3 rounded-lg border p-3 transition-all hover:shadow-sm",
          todo.completed && "bg-muted/50"
        )}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Checkbox
                checked={todo.completed}
                onCheckedChange={handleToggle}
                disabled={updateTodo.isPending}
                className="h-5 w-5"
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{todo.completed ? "Mark as incomplete" : "Mark as complete"}</p>
          </TooltipContent>
        </Tooltip>

        {isEditing ? (
          <div className="flex flex-1 items-center gap-2">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              className="h-8"
            />
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
              onClick={handleSaveEdit}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={handleCancelEdit}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            <span
              className={cn(
                "flex-1 text-sm",
                todo.completed && "text-muted-foreground line-through"
              )}
            >
              {todo.title}
            </span>

            {todo.completed && (
              <Badge
                variant="outline"
                className="border-green-200 bg-green-50 text-green-700 text-xs"
              >
                Done
              </Badge>
            )}

            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleEdit}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleToggle}>
                    <Checkbox
                      checked={todo.completed}
                      className="mr-2 h-4 w-4"
                    />
                    {todo.completed ? "Mark incomplete" : "Mark complete"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        )}
      </div>
    </TooltipProvider>
  );
}
