"use client";

import { useAuth, PricingTable } from "@clerk/nextjs";
import Link from "next/link";
import { Suspense } from "react";

// Note: PricingTable requires Clerk Billing to be enabled in your Clerk Dashboard
// See: https://dashboard.clerk.com/~/billing/settings

function PricingTableWrapper() {
  return (
    <div className="py-8">
      <PricingTable />
    </div>
  );
}

function PricingTableFallback() {
  return (
    <div className="text-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      <p className="mt-4 text-muted-foreground">Loading plans...</p>
    </div>
  );
}

export default function PricingPage() {
  const { isLoaded, isSignedIn } = useAuth();

  return (
    <main className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Pricing</h1>
          <p className="text-xl text-muted-foreground">
            Choose the plan that works best for you
          </p>
        </div>

        {!isLoaded ? (
          <PricingTableFallback />
        ) : (
          <div className="space-y-8">
            <Suspense fallback={<PricingTableFallback />}>
              <PricingTableWrapper />
            </Suspense>

            {!isSignedIn && (
              <p className="text-center text-sm text-muted-foreground">
                <Link href="/sign-up" className="underline">
                  Create an account
                </Link>{" "}
                to subscribe to a plan
              </p>
            )}
          </div>
        )}

        <div className="mt-16 border-t pt-8">
          <h2 className="text-2xl font-semibold mb-6 text-center">
            Frequently Asked Questions
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <h3 className="font-medium">Can I change plans later?</h3>
              <p className="text-sm text-muted-foreground">
                Yes, you can upgrade or downgrade your plan at any time from
                your account settings.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">What payment methods do you accept?</h3>
              <p className="text-sm text-muted-foreground">
                We accept all major credit cards through our secure payment
                provider, Stripe.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Is there a free trial?</h3>
              <p className="text-sm text-muted-foreground">
                Yes, all paid plans come with a 14-day free trial. No credit
                card required to start.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">How do I cancel my subscription?</h3>
              <p className="text-sm text-muted-foreground">
                You can cancel your subscription at any time from your account
                settings. No questions asked.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
