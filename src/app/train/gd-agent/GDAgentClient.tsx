"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import LearnEnglishWrapper from "@/modules/train/LearnEnglishWrapper";
import HeaderOffset from "@/components/HeaderOffset";
import MobileNavShell from "@/components/MobileNavShell";
import { useTheme, themeConfig } from "@/contexts/ThemeContext";

/* ── Mobile breakpoint detection (≤ 640 px) ── */
function useMobileBreakpoint() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isMobile;
}

export default function GDAgentClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const currentTheme = themeConfig[resolvedTheme] || themeConfig.dark;
  const isMobile = useMobileBreakpoint();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status === "loading" || isMobile === null) return null;

  // Mobile View (< 640px): wrapped in MobileNavShell with sticky header & bottom nav
  if (isMobile) {
    return (
      <MobileNavShell activeHref="/train/gd-agent">
        <div className="p-3 pt-2 min-h-screen">
          <LearnEnglishWrapper mode="gd" />
        </div>
      </MobileNavShell>
    );
  }

  // Desktop View (≥ 640px): wider layout with HeaderOffset
  return (
    <div className={`min-h-screen ${currentTheme.background} transition-colors duration-300`}>
      <HeaderOffset />
      <div className="max-w-6xl mx-auto px-6 py-6">
        <LearnEnglishWrapper mode="gd" />
      </div>
    </div>
  );
}
