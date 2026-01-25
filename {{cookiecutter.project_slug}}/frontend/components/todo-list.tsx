"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TodoItem } from "@/components/todo-item";
import { AddTodo } from "@/components/add-todo";
import { useTodos } from "@/hooks/use-todos";

export function TodoList() {
  const { data, isLoading, error } = useTodos();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Loading todos...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-destructive">
          Failed to load todos. Is the backend running?
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Todo List</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <AddTodo />
        <div className="space-y-2">
          {data?.todos.length === 0 ? (
            <p className="py-4 text-center text-muted-foreground">
              No todos yet. Add one above!
            </p>
          ) : (
            data?.todos.map((todo) => <TodoItem key={todo.id} todo={todo} />)
          )}
        </div>
        {data && data.count > 0 && (
          <p className="text-sm text-muted-foreground">
            {data.count} todo{data.count !== 1 ? "s" : ""}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
