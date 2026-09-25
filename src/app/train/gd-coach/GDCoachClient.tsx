"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import GDCoachDashboard from "../../../../Learn_English/components/GDCoachDashboard";
import MobileGDCoachPage from "@/components/MobileGDCoachPage";
import { UserProfile } from "../../../../Learn_English/types";
import { INITIAL_USER } from "../../../../Learn_English/constants";
import { useTheme, themeConfig } from "@/contexts/ThemeContext";

/* ── Mobile breakpoint detection (≤ 640 px) ── */
function useMobileBreakpoint() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

const GDCoachClient = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isMobile = useMobileBreakpoint();
  
  const currentTheme = themeConfig[resolvedTheme] || themeConfig.dark;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  if (status === "loading" || isMobile === null) {
    return null;
  }

  if (!session?.user) {
    return null;
  }

  if (isMobile) {
    return <MobileGDCoachPage />;
  }

  const user: UserProfile = {
    ...INITIAL_USER,
    id: session.user.email || "u1",
    name: session.user.name || "User",
    email: session.user.email || "user@example.com",
    picture: session.user.image || undefined,
  };

  return (
    <div className={`${
      resolvedTheme === "parchment" || resolvedTheme === "light"
        ? "bg-gradient-to-br from-pink-50/60 via-white to-violet-50/40 rounded-3xl border border-slate-200 shadow-sm"
        : `${currentTheme.cardBg} backdrop-blur-xl rounded-3xl border ${currentTheme.cardBorder} shadow-2xl`
    } p-6 md:p-8 lg:p-12 theme-transition`}>
      <GDCoachDashboard user={user} />
    </div>
  );
};

export default GDCoachClient;
