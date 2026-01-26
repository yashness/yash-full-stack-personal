import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { BillingContent } from "@/components/billing-content";

export default async function BillingPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return <BillingContent />;
}
