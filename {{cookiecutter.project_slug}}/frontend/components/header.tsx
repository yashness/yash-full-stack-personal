"use client";

import Link from "next/link";
{% if cookiecutter.copilot_ui %}import { Bot } from "lucide-react";{% endif %}

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-xl font-bold">{{ cookiecutter.project_name }}</span>
        </Link>

        <nav className="flex items-center gap-4">
{% if cookiecutter.copilot_ui %}
          <Link
            href="/copilot"
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors"
          >
            <Bot className="w-4 h-4" />
            Copilot
          </Link>
{% endif %}
          {/*
            To add authentication, run in frontend folder:
            bun run setup:clerk

            This will install Clerk components and replace this header
            with one that includes Sign In/Sign Up buttons.
          */}
        </nav>
      </div>
    </header>
  );
}
