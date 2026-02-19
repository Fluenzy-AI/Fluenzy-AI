"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import VoiceAgent from "../../../../Learn_English/components/VoiceAgent";
import { UserProfile } from "../../../../Learn_English/types";
import { INITIAL_USER } from "../../../../Learn_English/constants";
import { useTheme, themeConfig } from "@/contexts/ThemeContext";

const DailyPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  const currentTheme = themeConfig[resolvedTheme] || themeConfig.dark;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  if (status === "loading" || !mounted) {
    return (
      <div className={`min-h-screen ${currentTheme.background} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: currentTheme.accent }}></div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  // Convert NextAuth session to UserProfile
  const user: UserProfile = {
    ...INITIAL_USER,
    id: session.user.email || "u1",
    name: session.user.name || "User",
    email: session.user.email || "user@example.com",
    picture: session.user.image || undefined,
  };

  return (
    <div className={`min-h-screen ${currentTheme.background} p-8 theme-transition`}>
      <VoiceAgent user={user} onSessionEnd={() => {}} />
    </div>
  );
};

export default DailyPage;