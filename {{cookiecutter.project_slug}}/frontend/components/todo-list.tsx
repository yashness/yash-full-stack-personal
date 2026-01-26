"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { TodoItem } from "@/components/todo-item";
import { AddTodo } from "@/components/add-todo";
import { useTodos } from "@/hooks/use-todos";
import { CheckCircle2, ListTodo } from "lucide-react";

export function TodoList() {
  const { data, isLoading, error } = useTodos();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Separator />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <ListTodo className="h-6 w-6 text-destructive" />
          </div>
          <h3 className="mb-2 font-semibold text-destructive">Connection Error</h3>
          <p className="text-sm text-muted-foreground">
            Failed to load todos. Is the backend running?
          </p>
        </CardContent>
      </Card>
    );
  }

  const completedCount = data?.todos.filter((t) => t.completed).length ?? 0;
  const totalCount = data?.count ?? 0;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <ListTodo className="h-4 w-4 text-primary" />
            </div>
            <CardTitle>Todo List</CardTitle>
          </div>
          {totalCount > 0 && (
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {completedCount}/{totalCount}
            </Badge>
          )}
        </div>
        <CardDescription>
          Manage your tasks efficiently
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <AddTodo />
        {totalCount > 0 && (
          <>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
            <Separator />
          </>
        )}
        <div className="space-y-2">
          {data?.todos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <ListTodo className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-1 font-medium">No todos yet</h3>
              <p className="text-sm text-muted-foreground">
                Add your first task to get started!
              </p>
            </div>
          ) : (
            data?.todos.map((todo) => <TodoItem key={todo.id} todo={todo} />)
          )}
        </div>
      </CardContent>
      {totalCount > 0 && (
        <CardFooter className="justify-center border-t pt-4">
          <p className="text-sm text-muted-foreground">
            {completedCount === totalCount
              ? "All tasks completed! Great job!"
              : `${totalCount - completedCount} task${totalCount - completedCount !== 1 ? "s" : ""} remaining`}
          </p>
        </CardFooter>
      )}
    </Card>
  );
}
