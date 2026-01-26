"use client";

import Link from "next/link";
import { Bot } from "lucide-react";

/**
 * Copilot navigation link component.
 * Only rendered when copilot feature is enabled.
 */
export function CopilotNavLink() {
  return (
    <Link
      href="/copilot"
      className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors"
    >
      <Bot className="w-4 h-4" />
      Copilot
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
