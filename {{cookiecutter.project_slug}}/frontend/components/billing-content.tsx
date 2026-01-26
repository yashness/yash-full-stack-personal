"use client";

import { useUser } from "@clerk/nextjs";
import Link from "next/link";

export function BillingContent() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <main className="container mx-auto px-4 py-12">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Billing & Subscription</h1>
        <p className="text-muted-foreground mb-8">
          Manage your subscription and billing information
        </p>

        <div className="space-y-6">
          {/* Current Plan */}
          <div className="border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Current Plan</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Free Plan</p>
                <p className="text-sm text-muted-foreground">
                  Basic features for getting started
                </p>
              </div>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                Upgrade
              </Link>
            </div>
          </div>

          {/* Account Info */}
          <div className="border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Account Information</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span>{user?.primaryEmailAddress?.emailAddress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Account ID</span>
                <span className="font-mono text-sm">{user?.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Member since</span>
                <span>
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Billing Portal Note */}
          <div className="border rounded-lg p-6 bg-muted/50">
            <h2 className="text-lg font-semibold mb-2">Need Help?</h2>
            <p className="text-sm text-muted-foreground">
              To manage your payment methods, view invoices, or cancel your
              subscription, please visit your{" "}
              <Link href="/pricing" className="underline">
                pricing page
              </Link>{" "}
              or contact support.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
