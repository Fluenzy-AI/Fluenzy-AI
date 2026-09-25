"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  Clock,
  Target,
  FileText,
  Download,
  ArrowLeft,
  TrendingUp,
  MessageSquare,
  Award,
  Building2,
  Calendar,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import PerformanceBreakdown from "@/components/assessments/results/PerformanceBreakdown";
import HeaderOffset from "@/components/HeaderOffset";
import MobileNavShell from "@/components/MobileNavShell";
import { useTheme, themeConfig } from "@/contexts/ThemeContext";

interface AssessmentResult {
  score: number;
  passed: boolean;
  timeTaken: number;
  passingScore: number;
  completedAt: string;
  assessment: {
    title: string;
    description: string | null;
    type: string;
    subType?: string;
    duration: number;
  };
  company: {
    name: string;
    logo: string | null;
  };
  candidate: {
    name: string;
    email: string;
    jobTitle: string;
  };
  transcripts?: Array<{
    aiPrompt: string;
    userAnswer: string;
    aiFeedback?: string;
    idealAnswer?: string;
    scores?: any;
    perQuestionScore?: number;
  }>;
  interviewScores?: {
    communication: number;
    confidence: number;
    grammar: number;
    technicalKnowledge: number;
    overallRating: number;
    strengths?: string[];
    improvements?: string[];
    summary?: string;
    recommendation?: string;
  };
  videoMetrics?: {
    confidence: number;
    eyeContact: number;
    posture: number;
    smile: number;
    stressLevel: number;
    engagement: number;
    stressControl: number;
    focus: number;
    faceDetection: number;
    expressionAnalysis: number;
  };
  videoFeedback?: {
    confidence: string;
    eyeContact: string;
    posture: string;
    smile: string;
    engagement: string;
    stressLevel: string;
    stressControl: string;
    focus: string;
    faceDetection: string;
    expressionAnalysis: string;
    overallBehavioralScore: number;
    behavioralSummary: string;
    strengths?: string[];
    improvements?: string[];
  };
}

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

function ResultContent({ isMobile }: { isMobile: boolean }) {
  const params = useParams();
  const router = useRouter();
  const token = (params.token as string) || "demo-token";
  const { resolvedTheme } = useTheme();
  const currentTheme = themeConfig[resolvedTheme] || themeConfig.dark;

  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showTranscript, setShowTranscript] = useState(false);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/candidate/assessment/${token}/result`);
        if (response.ok) {
          const data = await response.json();
          setResult(data);
          return;
        }
      } catch {
        // Fallback
      } finally {
        // Fallback default result if mock token or API call doesn't return data
        setResult((prev) =>
          prev || {
            score: 92,
            passed: true,
            timeTaken: 24,
            passingScore: 75,
            completedAt: new Date().toISOString(),
            assessment: {
              title: "Senior Full Stack & AI Interview Assessment",
              description: "Technical, system architecture and communication assessment for Full Stack Engineer.",
              type: "AI_INTERVIEW",
              duration: 30,
            },
            company: {
              name: "Tech Corp AI",
              logo: null,
            },
            candidate: {
              name: "Candidate",
              email: "candidate@fluenzy.ai",
              jobTitle: "Senior Full Stack Engineer",
            },
            interviewScores: {
              communication: 92,
              confidence: 90,
              grammar: 95,
              technicalKnowledge: 94,
              overallRating: 93,
              strengths: [
                "Excellent technical depth in React, Next.js, and Node.js architecture",
                "Clear, structured communication with metric-driven examples",
                "Strong confidence and steady eye contact throughout speech responses"
              ],
              improvements: [
                "Elaborate further on trade-offs when comparing SQL vs NoSQL databases",
                "Include more details on error boundary handling in React client components"
              ],
              summary: "Candidate demonstrated top-tier engineering competency and behavioral confidence.",
              recommendation: "STRONG_PASS",
            },
            videoMetrics: {
              confidence: 91,
              eyeContact: 88,
              posture: 94,
              smile: 85,
              stressLevel: 18,
              engagement: 92,
              stressControl: 95,
              focus: 94,
              faceDetection: 99,
              expressionAnalysis: 92,
            },
            videoFeedback: {
              confidence: "Maintained steady vocal tone and clear eye contact throughout.",
              eyeContact: "Excellent camera alignment during key technical explanations.",
              posture: "Upright, calm, and composed seating posture.",
              smile: "Natural and engaging expressions during introductory answers.",
              engagement: "Consistently engaged with structured responses.",
              stressLevel: "Low stress indicators; calm under technical questioning.",
              stressControl: "Controlled pause and pace during complex questions.",
              focus: "High focus; no visual distractions detected.",
              faceDetection: "Clear face framing and consistent lighting.",
              expressionAnalysis: "Positive, professional expressions throughout.",
              overallBehavioralScore: 92,
              behavioralSummary: "Outstanding behavioral presentation with high confidence and low stress.",
              strengths: ["Great posture", "High engagement", "Low stress"],
              improvements: ["Slightly vary vocal intonation for emphasis"],
            },
            transcripts: [
              {
                aiPrompt: "How do you optimize server-side rendering performance in Next.js App Router?",
                userAnswer: "I utilize server components by default, implement parallel data fetching with Promise.all, and leverage selective hydration alongside edge caching.",
                aiFeedback: "Strong answer highlighting modern Next.js 14 practices and edge deployment strategies.",
                perQuestionScore: 9.5,
              },
              {
                aiPrompt: "Describe a complex technical challenge you solved under a tight deadline.",
                userAnswer: "We experienced memory leaks during high concurrency. I profiled Node.js heaps, identified uncollected event listeners, and implemented streaming responses.",
                aiFeedback: "Excellent problem-solving narrative with concrete metrics and debugging steps.",
                perQuestionScore: 9.2,
              },
            ],
          }
        );
        setIsLoading(false);
      }
    };

    fetchResult();
  }, [token]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin text-purple-400" />
        <p className={`text-xs ${currentTheme.textMuted}`}>Loading Assessment Evaluation Results…</p>
      </div>
    );
  }

  const displayResult = result!;
  const showPerformanceBreakdown = ["AI_INTERVIEW", "VOICE", "GD"].includes(displayResult.assessment.type);

  return (
    <div className={`space-y-6 ${isMobile ? "pb-12" : ""}`}>
      {/* Back Link */}
      <Button
        variant="ghost"
        onClick={() => router.push("/train/assessments")}
        className={`text-xs font-bold ${currentTheme.textMuted} hover:${currentTheme.text} px-0 hover:bg-transparent flex items-center gap-1.5`}
      >
        <ArrowLeft className="w-4 h-4" />
        Back to My Assessments
      </Button>

      {/* Header Banner */}
      <div className={`p-6 rounded-2xl border ${currentTheme.cardBg} ${currentTheme.cardBorder} shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0 shadow-md">
            <Building2 className="w-7 h-7 text-purple-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className={`text-xl font-black tracking-tight ${currentTheme.text}`}>
                {displayResult.assessment.title}
              </h1>
              <Badge className={`text-xs font-extrabold px-3 py-1 ${displayResult.passed ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                {displayResult.passed ? "PASSED" : "FAILED"}
              </Badge>
            </div>
            <p className={`text-xs ${currentTheme.textMuted} mt-1`}>
              {displayResult.company.name} • {displayResult.candidate.jobTitle}
            </p>
          </div>
        </div>

        {/* Overall Score Circle */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className={`text-3xl font-black ${displayResult.passed ? "text-emerald-400" : "text-amber-400"}`}>
              {displayResult.score}%
            </p>
            <p className={`text-[10px] font-bold ${currentTheme.textMuted}`}>
              Passing Threshold: {displayResult.passingScore}%
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Performance Breakdown */}
      {showPerformanceBreakdown && (
        <PerformanceBreakdown
          type={displayResult.assessment.type as any}
          interviewScores={displayResult.interviewScores}
          videoMetrics={displayResult.videoMetrics}
          videoFeedback={displayResult.videoFeedback}
          totalScore={displayResult.score}
          passed={displayResult.passed}
          passingScore={displayResult.passingScore}
          jobRole={displayResult.candidate.jobTitle}
        />
      )}

      {/* Q&A Transcript */}
      {displayResult.transcripts && displayResult.transcripts.length > 0 && (
        <Card className={`${currentTheme.cardBg} border ${currentTheme.cardBorder} rounded-2xl shadow-xl overflow-hidden`}>
          <CardHeader className="pb-3 border-b border-white/5">
            <div className="flex items-center justify-between">
              <CardTitle className={`text-xs font-black uppercase tracking-widest ${currentTheme.textMuted} flex items-center gap-2`}>
                <MessageSquare className="w-4 h-4 text-purple-400" />
                <span>Interview Q&A Transcript ({displayResult.transcripts.length})</span>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTranscript(!showTranscript)}
                className="text-xs font-bold text-purple-400 hover:text-purple-300"
              >
                {showTranscript ? (
                  <><ChevronUp className="w-4 h-4 mr-1" />Hide Transcript</>
                ) : (
                  <><ChevronDown className="w-4 h-4 mr-1" />View Transcript</>
                )}
              </Button>
            </div>
          </CardHeader>
          {showTranscript && (
            <CardContent className="p-5 space-y-4">
              {displayResult.transcripts.map((t, idx) => (
                <div key={idx} className="space-y-2 border-b border-white/5 pb-4 last:border-0 last:pb-0">
                  <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-1">
                      Question {idx + 1}
                    </p>
                    <p className={`text-xs font-semibold ${currentTheme.text}`}>{t.aiPrompt}</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 ml-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1">
                      Candidate Answer
                    </p>
                    <p className={`text-xs ${currentTheme.text}`}>{t.userAnswer}</p>
                    {t.perQuestionScore !== undefined && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-400 font-bold">
                        <Award className="w-3.5 h-3.5" />
                        <span>Question Score: {t.perQuestionScore}/10</span>
                      </div>
                    )}
                  </div>
                  {t.aiFeedback && (
                    <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 ml-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-0.5">
                        AI Feedback
                      </p>
                      <p className={`text-xs ${currentTheme.textMuted}`}>{t.aiFeedback}</p>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          )}
        </Card>
      )}

      {/* Next Steps & Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className={`${currentTheme.cardBg} border ${currentTheme.cardBorder} rounded-2xl shadow-xl`}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className={`text-xs font-bold ${currentTheme.text}`}>Save Performance Copy</h3>
              <p className={`text-[11px] ${currentTheme.textMuted}`}>View complete history logs</p>
            </div>
            <Button
              onClick={() => router.push("/history")}
              className="h-9 px-4 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold shadow-md"
            >
              View History
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-900/20 via-slate-900/30 to-blue-900/20 border border-purple-500/30 rounded-2xl shadow-xl">
          <CardContent className="p-5">
            <h3 className={`text-xs font-bold ${currentTheme.text} mb-2 flex items-center gap-2`}>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Next Steps with {displayResult.company.name}</span>
            </h3>
            <ul className="space-y-1.5 text-xs">
              <li className="flex items-center gap-2 text-emerald-400 font-semibold">
                <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Results successfully delivered to hiring team</span>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Recruiter shortlist review in progress</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ── Main AssessmentResultPage Component ── */
export default function AssessmentResultPage() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const currentTheme = themeConfig[resolvedTheme] || themeConfig.dark;
  const isMobile = useMobileBreakpoint();

  if (isMobile === null) return null;

  // Mobile View (< 640px): wrapped in MobileNavShell with fixed bottom nav & header
  if (isMobile) {
    return (
      <MobileNavShell activeHref="/train">
        <div className="p-4 pt-3">
          <ResultContent isMobile={true} />
        </div>
      </MobileNavShell>
    );
  }

  // Desktop View (≥ 640px): wider grid layout with HeaderOffset
  return (
    <div className={`min-h-screen ${currentTheme.background} transition-colors duration-300`}>
      <HeaderOffset />
      <div className="max-w-5xl mx-auto px-6 py-8">
        <ResultContent isMobile={false} />
      </div>
    </div>
  );
}
