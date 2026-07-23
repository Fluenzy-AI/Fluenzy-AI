"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import HRDashboard from "../../../../Learn_English/components/HRDashboard";
import { UserProfile } from "../../../../Learn_English/types";
import { INITIAL_USER } from "../../../../Learn_English/constants";
import { useTheme, themeConfig } from "@/contexts/ThemeContext";

const HRPageClient = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  
  const currentTheme = themeConfig[resolvedTheme] || themeConfig.dark;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session?.user) {
    return null;
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
      resolvedTheme === "parchment"
        ? "bg-gradient-to-br from-pink-50/60 via-white to-violet-50/40 rounded-3xl border border-slate-200 shadow-sm"
        : `${currentTheme.cardBg} backdrop-blur-xl rounded-3xl border ${currentTheme.cardBorder} shadow-2xl`
    } p-6 md:p-8 lg:p-12 theme-transition`}>
      <HRDashboard user={user} />
    </div>
  );
};

export default HRPageClient;
