"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

/**
 * useModuleAccess
 * Checks whether the current user has remaining sessions for a given module.
 * If the module is locked (0 remaining), redirects to /pricing.
 *
 * @param module  billing key, e.g. 'hr', 'technical', 'company', 'gdCoach', 'gd', 'english', 'daily'
 * @param subFeature  optional sub-feature, e.g. 'gd_ai_agents'
 * @returns { checking: boolean } — true while the API call is in-flight
 */
export function useModuleAccess(module: string, subFeature?: string) {
  const { status } = useSession();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/check-module-access", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ module, subFeature }),
        });

        if (cancelled) return;

        if (res.status === 401) {
          router.replace("/login");
          return;
        }

        const data = await res.json();

        if (!data.allowed) {
          router.replace(`/billing?locked=${encodeURIComponent(module)}`);
          return;
        }
      } catch (err) {
        console.error("[useModuleAccess] Check failed:", err);
        // On network error, allow access (fail open) — API will enforce on submit
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status, module, subFeature, router]);

  // While session is loading, keep checking = true
  if (status === "loading") return { checking: true };

  return { checking };
}
