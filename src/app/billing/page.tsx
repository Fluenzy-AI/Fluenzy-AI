"use client";

import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import BillingContent from "./BillingContent";
import BillingPageSkeleton from "./BillingPageSkeleton";

export default function BillingPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Manage Subscription</h1>

        <Suspense fallback={<BillingPageSkeleton />}>
          <BillingContent />
        </Suspense>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button variant="outline" asChild>
            <Link href="/">Back to App</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/billing/history">View Payment History</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}