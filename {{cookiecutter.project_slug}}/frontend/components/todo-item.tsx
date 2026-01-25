"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useDeleteTodo, useUpdateTodo } from "@/hooks/use-todos";
import type { Todo } from "@/lib/api";
import { cn } from "@/lib/utils";

interface TodoItemProps {
  todo: Todo;
}

export function TodoItem({ todo }: TodoItemProps) {
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

  return (
    <div className="flex items-center gap-3 rounded-md border p-3">
      <Checkbox
        checked={todo.completed}
        onCheckedChange={handleToggle}
        disabled={updateTodo.isPending}
      />
      <span
        className={cn(
          "flex-1",
          todo.completed && "text-muted-foreground line-through"
        )}
      >
        {todo.title}
      </span>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDelete}
        disabled={deleteTodo.isPending}
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
