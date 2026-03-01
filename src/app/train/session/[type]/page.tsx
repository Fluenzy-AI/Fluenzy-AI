"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import VoiceAgent from "../../../../../Learn_English/components/VoiceAgent";
import VideoAnalysisPanel from "../../../../components/VideoAnalysisPanel";
import { UserProfile, ModuleType } from "../../../../../Learn_English/types";
import { useTheme, themeConfig } from "@/contexts/ThemeContext";
import { INITIAL_USER } from "../../../../../Learn_English/constants";

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

  // Check if this is an HR interview or Company-wise session
  const isHRInterview = type === ModuleType.HR_INTERVIEW;
  const isCompanyWise = type === ModuleType.COMPANY_WISE_HR;
  
  // Auto-enable video analysis for HR/Company interviews
  useEffect(() => {
    if (isHRInterview || isCompanyWise) {
      setIsVideoAnalysisEnabled(true);
    }
  }, [isHRInterview, isCompanyWise]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated" && type) {
      // VALIDATE-ONLY mode: Check access WITHOUT incrementing
      // Increment happens AFTER session successfully completes (via session-end endpoint)
      const moduleMap: Record<string, string> = {
        [ModuleType.ENGLISH_LEARNING]: 'english',
        [ModuleType.CONVERSATION_PRACTICE]: 'daily',
        [ModuleType.HR_INTERVIEW]: 'hr',
        [ModuleType.TECH_INTERVIEW]: 'technical',
        [ModuleType.COMPANY_WISE_HR]: 'company',
        [ModuleType.GD_COACH]: 'gdCoach',  // FIX: GD Coach has separate limit from GD Agent
        [ModuleType.GD_DISCUSSION]: 'gd',  // GD Agent parent
        [ModuleType.GD_AI_AGENTS]: 'gd',   // GD AI Agents (limited sub-feature)
        [ModuleType.GD_PRIVATE]: 'gd',     // GD Private (unlimited sub-feature)
        [ModuleType.GD_RANDOM]: 'gd',      // GD Random (unlimited sub-feature)
      };

      const moduleKey = moduleMap[type] || type.toLowerCase().replace('_', '');
      const subFeature = type === ModuleType.GD_AI_AGENTS ? 'gd_ai_agents' : 
                        type === ModuleType.GD_PRIVATE ? 'gd_private' :
                        type === ModuleType.GD_RANDOM ? 'gd_random' : undefined;

      if (moduleKey) {
        // Only VALIDATE, don't increment yet
        console.log(`[MODULE_ACCESS] User accessing ${type}, module: ${moduleKey}, subFeature: ${subFeature}`);
        fetch('/api/training-usage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            module: moduleKey,
            subFeature,
            mode: 'validate-only',  // Only validate, don't increment
          }),
        }).catch(error => console.error('Failed to validate module access:', error));
      }
    }
  }, [status, type]);

  if (status === "loading") {
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
          {/* Main Voice Agent */}
          <div className={`${isVideoAnalysisEnabled && (isHRInterview || isCompanyWise) ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
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

          {/* Video Analysis Panel - Always visible for HR/Company interviews */}
          {(isHRInterview || isCompanyWise) && (
            <div className="lg:col-span-1">
              <VideoAnalysisPanel 
                sessionId={sessionId}
                isActive={isInterviewActive}
              />
            </div>
          )}
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
