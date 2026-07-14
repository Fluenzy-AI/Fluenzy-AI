import { Suspense } from "react";
import { SessionPageClient } from "./SessionPageClient";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  // Auth is handled by middleware matcher for /train/:path*
  // Quota validation happens at session start (API level), not page render

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Preparing session...</p>
        </div>
      </div>
    }>
      <SessionPageClient />
    </Suspense>
  );
}
