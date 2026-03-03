"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import VoiceAgent from "../../../../../Learn_English/components/VoiceAgent";
import VideoAnalysisPanel from "../../../../components/VideoAnalysisPanel";
import { UserProfile, ModuleType } from "../../../../../Learn_English/types";
import { useTheme, themeConfig } from "@/contexts/ThemeContext";
import { INITIAL_USER } from "../../../../../Learn_English/constants";

export const SessionPageClient = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { resolvedTheme } = useTheme();
  
  const currentTheme = themeConfig[resolvedTheme] || themeConfig.dark;
  const type = params.type as string;
  const [isVideoAnalysisEnabled, setIsVideoAnalysisEnabled] = useState(false);
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  const isCompanyWise = type === ModuleType.COMPANY_WISE_HR;

  useEffect(() => {
    if (isCompanyWise) {
      setIsVideoAnalysisEnabled(true);
    }
  }, [isCompanyWise]);

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

  const lessonId = searchParams.get("lessonId");
  const lessonTitle = searchParams.get("lessonTitle");

  const sessionMeta =
    lessonId && lessonTitle
      ? { lessonId, lessonTitle: decodeURIComponent(lessonTitle) }
      : {};

  return (
    <div className={`min-h-screen ${currentTheme.background} relative overflow-hidden theme-transition`}>
      <div className="absolute inset-0 bg-gradient-radial from-purple-900/10 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-gradient-radial from-blue-900/5 via-transparent to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-8 lg:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {isCompanyWise && (
            <div className="order-first lg:order-last lg:col-span-1">
              <VideoAnalysisPanel
                sessionId={sessionId}
                isActive={isInterviewActive}
              />
            </div>
          )}

          <div
            className={`${
              isVideoAnalysisEnabled && isCompanyWise
                ? "lg:col-span-2"
                : "lg:col-span-3"
            } ${isCompanyWise ? "order-last lg:order-first" : ""}`}
          >
            <div
              className={`${currentTheme.cardBg} backdrop-blur-xl rounded-3xl border ${currentTheme.cardBorder} shadow-2xl p-6 md:p-8 lg:p-12 theme-transition`}
            >
              <VoiceAgent
                user={user}
                onSessionEnd={() => setIsInterviewActive(false)}
                onInterviewStart={() => setIsInterviewActive(true)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
