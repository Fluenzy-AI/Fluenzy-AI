"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import VoiceAgent from "../../../../../Learn_English/components/VoiceAgent";
import VideoAnalysisPanel from "../../../../components/VideoAnalysisPanel";
import { UserProfile, ModuleType } from "../../../../../Learn_English/types";
import { INITIAL_USER } from "../../../../../Learn_English/constants";

const SessionPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
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
      // Increment usage for the module
      const moduleMap: Record<string, string> = {
        [ModuleType.ENGLISH_LEARNING]: 'english',
        [ModuleType.CONVERSATION_PRACTICE]: 'daily',
        [ModuleType.HR_INTERVIEW]: 'hr',
        [ModuleType.TECH_INTERVIEW]: 'technical',
        [ModuleType.COMPANY_WISE_HR]: 'company',
        [ModuleType.FULL_MOCK]: 'mock',
        [ModuleType.GD_COACH]: 'gd',
      };

      const moduleKey = moduleMap[type] || type.toLowerCase().replace('_', '');
      if (moduleKey) {
        fetch('/api/training-usage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ module: moduleKey }),
        }).catch(error => console.error('Failed to increment usage:', error));
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Subtle radial glow */}
      <div className="absolute inset-0 bg-gradient-radial from-purple-900/10 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-gradient-radial from-blue-900/5 via-transparent to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-8 lg:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Voice Agent */}
          <div className={`${isVideoAnalysisEnabled && (isHRInterview || isCompanyWise) ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            <div className="bg-slate-900/30 backdrop-blur-xl rounded-3xl border border-slate-700/50 shadow-2xl p-6 md:p-8 lg:p-12">
              <VoiceAgent user={user} onSessionEnd={() => {}} />
            </div>
          </div>

          {/* Video Analysis Panel - Always visible for HR/Company interviews */}
          {(isHRInterview || isCompanyWise) && (
            <div className="lg:col-span-1">
              <VideoAnalysisPanel 
                sessionId={sessionId}
                isActive={true}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionPage;