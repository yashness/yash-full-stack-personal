import { TodoList } from "@/components/todo-list";

export default function Home() {
  return (
    <main className="min-h-screen p-8 md:p-24">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-4xl font-bold text-foreground">
          {{ cookiecutter.project_name }}
        </h1>
        <p className="mb-8 text-muted-foreground">
          A fullstack todo application
        </p>
        <TodoList />
      </div>
    </main>
  );
}
