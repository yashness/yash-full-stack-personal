"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, CheckSquare, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Copilot navigation link component.
 * Only rendered when copilot feature is enabled.
 */
export function CopilotNavLink() {
  const pathname = usePathname();
  const isActive = pathname === "/copilot";

  return (
    <Link
      href="/copilot"
      className={cn(
        "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
        isActive
          ? "bg-primary/10 text-primary"
          : "hover:bg-muted text-muted-foreground hover:text-foreground"
      )}
    >
      <Bot className="w-4 h-4" />
      Copilot
    </Link>
  );
}

/**
 * Todos navigation link component.
 */
export function TodosNavLink() {
  const pathname = usePathname();
  const isActive = pathname === "/todos";

  return (
    <Link
      href="/todos"
      className={cn(
        "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
        isActive
          ? "bg-primary/10 text-primary"
          : "hover:bg-muted text-muted-foreground hover:text-foreground"
      )}
    >
      <CheckSquare className="w-4 h-4" />
      Todos
    </Link>
  );
}

/**
 * Components navigation link component.
 */
export function ComponentsNavLink() {
  const pathname = usePathname();
  const isActive = pathname === "/components";

  return (
    <Link
      href="/components"
      className={cn(
        "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
        isActive
          ? "bg-primary/10 text-primary"
          : "hover:bg-muted text-muted-foreground hover:text-foreground"
      )}
    >
      <Layers className="w-4 h-4" />
      Components
    </Link>
  );
}

/**
 * Add more nav link components here as features are added.
 * Example:
 *
 * export function BillingNavLink() {
 *   return (
 *     <Link href="/billing" className="...">
 *       Billing
 *     </Link>
 *   );
 * }
 */
