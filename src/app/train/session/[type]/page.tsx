"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import VoiceAgent from "../../../../../Learn_English/components/VoiceAgent";
import VideoAnalysisPanel from "../../../../components/VideoAnalysisPanel";
import { UserProfile, ModuleType } from "../../../../../Learn_English/types";
import { useTheme, themeConfig } from "@/contexts/ThemeContext";
import { INITIAL_USER } from "../../../../../Learn_English/constants";
import { useModuleAccess } from "@/hooks/useModuleAccess";

const SessionPageContent = () => {
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

  // Compute billing module key and sub-feature from URL type param
  const SESSION_MODULE_MAP: Record<string, string> = {
    [ModuleType.ENGLISH_LEARNING]: 'english',
    [ModuleType.CONVERSATION_PRACTICE]: 'daily',
    [ModuleType.HR_INTERVIEW]: 'hr',
    [ModuleType.TECH_INTERVIEW]: 'technical',
    [ModuleType.COMPANY_WISE_HR]: 'company',
    [ModuleType.GD_COACH]: 'gdCoach',
    [ModuleType.GD_DISCUSSION]: 'gd',
    [ModuleType.GD_AI_AGENTS]: 'gd',
    [ModuleType.GD_PRIVATE]: 'gd',
    [ModuleType.GD_RANDOM]: 'gd',
  };
  const sessionModuleKey = SESSION_MODULE_MAP[type] || type.toLowerCase().replace(/_/g, '');
  const sessionSubFeature = type === ModuleType.GD_AI_AGENTS ? 'gd_ai_agents'
    : type === ModuleType.GD_PRIVATE ? 'gd_private'
    : type === ModuleType.GD_RANDOM ? 'gd_random'
    : undefined;

  // Block access if module is locked — hook redirects to /pricing automatically
  const { checking } = useModuleAccess(sessionModuleKey, sessionSubFeature);

  // Check if this is a Company-wise session (only one that gets Video Analysis)
  const isCompanyWise = type === ModuleType.COMPANY_WISE_HR;
  
  // Only enable video analysis for Company-wise sessions
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

  if (status === "loading" || checking) {
    return <div>Loading...</div>;
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

  // Get lesson info from query params
  const lessonId = searchParams.get('lessonId');
  const lessonTitle = searchParams.get('lessonTitle');

  const sessionMeta = lessonId && lessonTitle ? {
    lessonId,
    lessonTitle: decodeURIComponent(lessonTitle)
  } : {};

  return (
    <div className={`min-h-screen ${currentTheme.background} relative overflow-hidden theme-transition`}>
      {/* Subtle radial glow - adapt to theme */}
      <div className="absolute inset-0 bg-gradient-radial from-purple-900/10 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-gradient-radial from-blue-900/5 via-transparent to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-8 lg:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Analysis Panel - Only for Company interviews, shown FIRST on mobile */}
          {isCompanyWise && (
            <div className="order-first lg:order-last lg:col-span-1">
              <VideoAnalysisPanel 
                sessionId={sessionId}
                isActive={isInterviewActive}
              />
            </div>
          )}

          {/* Main Voice Agent */}
          <div className={`${isVideoAnalysisEnabled && isCompanyWise ? 'lg:col-span-2' : 'lg:col-span-3'} ${isCompanyWise ? 'order-last lg:order-first' : ''}`}>
            <div className={`${currentTheme.cardBg} backdrop-blur-xl rounded-3xl border ${currentTheme.cardBorder} shadow-2xl p-6 md:p-8 lg:p-12 theme-transition`}>
              <VoiceAgent
                user={user}
                onSessionEnd={() => {
                  setIsInterviewActive(false);
                }}
                onInterviewStart={() => {
                  setIsInterviewActive(true);
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function SessionPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SessionPageContent />
    </Suspense>
  );
}
