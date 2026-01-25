"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a new todo..."
        disabled={createTodo.isPending}
      />
      <Button type="submit" disabled={!title.trim() || createTodo.isPending}>
        <Plus className="h-4 w-4" />
        Add
      </Button>
    </form>
  );
}
