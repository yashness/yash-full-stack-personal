"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  CheckSquare,
  Layers,
  LayoutGrid,
  Workflow,
  Wrench,
  Sparkles,
  CreditCard,
  Settings,
} from "lucide-react";
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
 * Canvas navigation link component.
 * Only rendered when canvas feature is enabled.
 */
export function CanvasNavLink() {
  const pathname = usePathname();
  const isActive = pathname === "/canvas";

  return (
    <Link
      href="/canvas"
      className={cn(
        "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
        isActive
          ? "bg-primary/10 text-primary"
          : "hover:bg-muted text-muted-foreground hover:text-foreground"
      )}
    >
      <LayoutGrid className="w-4 h-4" />
      Canvas
    </Link>
  );
}

/**
 * Flow Builder navigation link component.
 * Only rendered when flow builder feature is enabled.
 */
export function FlowBuilderNavLink() {
  const pathname = usePathname();
  const isActive = pathname === "/flow-builder";

  return (
    <Link
      href="/flow-builder"
      className={cn(
        "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
        isActive
          ? "bg-primary/10 text-primary"
          : "hover:bg-muted text-muted-foreground hover:text-foreground"
      )}
    >
      <Workflow className="w-4 h-4" />
      Flows
    </Link>
  );
}

/**
 * MCP Creator navigation link component.
 * Only rendered when MCP creator feature is enabled.
 */
export function McpCreatorNavLink() {
  const pathname = usePathname();
  const isActive = pathname === "/mcp-creator";

  return (
    <Link
      href="/mcp-creator"
      className={cn(
        "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
        isActive
          ? "bg-primary/10 text-primary"
          : "hover:bg-muted text-muted-foreground hover:text-foreground"
      )}
    >
      <Wrench className="w-4 h-4" />
      MCP Tools
    </Link>
  );
}

/**
 * Skills/Agents navigation link component.
 * Only rendered when skill creator feature is enabled.
 */
export function SkillsNavLink() {
  const pathname = usePathname();
  const isActive = pathname.startsWith("/skills") || pathname.startsWith("/agents");

  return (
    <Link
      href="/skills"
      className={cn(
        "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
        isActive
          ? "bg-primary/10 text-primary"
          : "hover:bg-muted text-muted-foreground hover:text-foreground"
      )}
    >
      <Sparkles className="w-4 h-4" />
      Skills
    </Link>
  );
}

/**
 * Pricing navigation link component.
 * Only rendered when pricing feature is enabled.
 */
export function PricingNavLink() {
  const pathname = usePathname();
  const isActive = pathname === "/pricing";

  return (
    <Link
      href="/pricing"
      className={cn(
        "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
        isActive
          ? "bg-primary/10 text-primary"
          : "hover:bg-muted text-muted-foreground hover:text-foreground"
      )}
    >
      <CreditCard className="w-4 h-4" />
      Pricing
    </Link>
  );
}

/**
 * Admin navigation link component.
 * Only rendered when admin feature is enabled.
 */
export function AdminNavLink() {
  const pathname = usePathname();
  const isActive = pathname.startsWith("/admin");

  return (
    <Link
      href="/admin"
      className={cn(
        "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
        isActive
          ? "bg-primary/10 text-primary"
          : "hover:bg-muted text-muted-foreground hover:text-foreground"
      )}
    >
      <Settings className="w-4 h-4" />
      Admin
    </Link>
  );
}
