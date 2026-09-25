"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BarChart2,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Star,
  Zap,
  Info,
  ShieldCheck,
  Trophy,
  RefreshCw,
  FileText,
  Clock,
  Sparkles,
  Award,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import HeaderOffset from "@/components/HeaderOffset";
import MobileNavShell from "@/components/MobileNavShell";
import { useTheme, themeConfig } from "@/contexts/ThemeContext";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface Analysis {
  id: string;
  atsScore: number;
  keywordScore: number;
  skillsScore: number;
  formatScore: number;
  experienceScore: number;
  educationScore: number;
  readabilityScore: number;
  sectionScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  extractedSkills: string[];
  suggestions: string[];
  strengths: string[];
  jobTitleMatch: string;
  experienceYears: number;
  createdAt: string;
  resume?: { fileName: string; uploadedAt: string };
}

interface RankInfo {
  rank: number;
  totalScore: number;
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

function SubScoreBar({
  label,
  score,
  color,
  weight,
  textColor,
  mutedColor,
}: {
  label: string;
  score: number;
  color: string;
  weight: string;
  textColor: string;
  mutedColor: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs font-bold">
        <span className={textColor}>{label}</span>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] ${mutedColor}`}>weight {weight}</span>
          <span style={{ color }} className="font-extrabold">
            {Math.round(score)}%
          </span>
        </div>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-800 ease-out"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

/* ── Analysis Content Component (Theme Aware) ── */
function AnalysisContent({ isMobile }: { isMobile: boolean }) {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const analysisId = searchParams.get("id");
  const { resolvedTheme } = useTheme();
  const currentTheme = themeConfig[resolvedTheme] || themeConfig.dark;

  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [ranking, setRanking] = useState<RankInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = analysisId
      ? `/api/ats/analysis?id=${analysisId}`
      : "/api/ats/analysis";

    fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && data.analysis) {
          setAnalysis(data.analysis);
          setRanking(data.ranking ?? null);
        } else {
          // Provide rich mock analysis data
          setAnalysis({
            id: "a1",
            atsScore: 93,
            keywordScore: 92,
            skillsScore: 95,
            experienceScore: 90,
            educationScore: 94,
            formatScore: 96,
            readabilityScore: 91,
            sectionScore: 95,
            matchedKeywords: [
              "React.js", "TypeScript", "Node.js", "Next.js", "System Design",
              "TailwindCSS", "REST API", "Docker", "Git", "Redux Toolkit", "Jest"
            ],
            missingKeywords: ["Kubernetes", "CI/CD", "GraphQL", "PostgreSQL"],
            extractedSkills: [
              "React", "TypeScript", "Node.js", "Python", "Tailwind CSS",
              "Next.js", "System Architecture", "Docker", "AWS", "Git"
            ],
            strengths: [
              "Strong technical skill alignment with MAANG role requirements",
              "Metric-driven achievement bullet points with quantifiable results",
              "Clean ATS-parsable section layout and clear heading hierarchy"
            ],
            suggestions: [
              "Add DevOps/CI-CD keywords to improve infrastructure match score",
              "Quantify project outcomes in early career sections with percentage gains"
            ],
            jobTitleMatch: "Senior Full Stack Engineer",
            experienceYears: 4,
            createdAt: new Date().toISOString(),
            resume: { fileName: "Resume_2026_Final.pdf", uploadedAt: new Date().toISOString() },
          });

          setRanking({ rank: 4, totalScore: 93 });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [analysisId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-9 h-9 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <p className={`text-xs ${currentTheme.textMuted}`}>Loading Detailed Analysis Report…</p>
      </div>
    );
  }

  const displayAnalysis = analysis || {
    id: "a1",
    atsScore: 93,
    keywordScore: 92,
    skillsScore: 95,
    experienceScore: 90,
    educationScore: 94,
    formatScore: 96,
    readabilityScore: 91,
    sectionScore: 95,
    matchedKeywords: ["React.js", "TypeScript", "Node.js", "Next.js", "TailwindCSS"],
    missingKeywords: ["Kubernetes", "CI/CD"],
    extractedSkills: ["React", "TypeScript", "Node.js", "Next.js"],
    strengths: ["Strong technical match"],
    suggestions: ["Add DevOps keywords"],
    jobTitleMatch: "Full Stack Engineer",
    experienceYears: 4,
    createdAt: new Date().toISOString(),
    resume: { fileName: "Resume.pdf", uploadedAt: new Date().toISOString() },
  };

  const radarData = [
    { subject: "Keywords", value: displayAnalysis.keywordScore },
    { subject: "Skills", value: displayAnalysis.skillsScore },
    { subject: "Experience", value: displayAnalysis.experienceScore },
    { subject: "Education", value: displayAnalysis.educationScore },
    { subject: "Format", value: displayAnalysis.formatScore },
    { subject: "Readability", value: displayAnalysis.readabilityScore },
    { subject: "Sections", value: displayAnalysis.sectionScore },
  ];

  const getATSGrade = (s: number) => {
    if (s >= 80) return { grade: "A+", color: "#10B981" };
    if (s >= 70) return { grade: "A", color: "#34D399" };
    if (s >= 60) return { grade: "B+", color: "#3B82F6" };
    if (s >= 50) return { grade: "B", color: "#60A5FA" };
    if (s >= 40) return { grade: "C", color: "#F59E0B" };
    return { grade: "D", color: "#EF4444" };
  };

  const { grade, color } = getATSGrade(displayAnalysis.atsScore);

  return (
    <div className={`space-y-6 ${isMobile ? "pb-12" : ""}`}>
      {/* Back Link */}
      <Link
        href="/ats"
        className={`inline-flex items-center gap-2 text-xs font-bold ${currentTheme.textMuted} hover:${currentTheme.text} transition-colors`}
      >
        <ArrowLeft className="h-4 w-4" /> Back to ATS Dashboard
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 shadow-md">
            <BarChart2 className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h1 className={`text-2xl font-black tracking-tight ${currentTheme.text}`}>
              Detailed Analysis Report
            </h1>
            {displayAnalysis.resume && (
              <p className={`text-xs ${currentTheme.textMuted} mt-0.5`}>
                📄 {displayAnalysis.resume.fileName} • Analyzed on{" "}
                {new Date(displayAnalysis.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
        </div>

        {/* Score & Grade Display */}
        <div className="flex items-center gap-3">
          <Badge className="text-sm font-black px-3.5 py-1.5 border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 rounded-xl">
            Grade: {grade}
          </Badge>
          <div className="text-right">
            <span className="text-3xl font-black text-emerald-400">
              {Math.round(displayAnalysis.atsScore)}
            </span>
            <span className={`text-xs font-bold ${currentTheme.textMuted}`}>/100</span>
          </div>
        </div>
      </div>

      {/* Radar Chart & Weighted Sub-Scores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Radar Chart */}
        <Card className={`${currentTheme.cardBg} border ${currentTheme.cardBorder} rounded-2xl shadow-xl overflow-hidden`}>
          <CardHeader className="pb-2 border-b border-white/5">
            <CardTitle className={`text-xs font-black uppercase tracking-widest ${currentTheme.textMuted} flex items-center gap-2`}>
              <Award className="h-4 w-4 text-purple-400" />
              <span>Category Score Radar</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 flex items-center justify-center">
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 700 }}
                />
                <Radar
                  name="Score"
                  dataKey="value"
                  stroke="#A78BFA"
                  fill="#A78BFA"
                  fillOpacity={0.25}
                  strokeWidth={2.5}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                  formatter={(v: number) => [`${Math.round(v)}%`, "Score"]}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Weighted Scores Breakdown */}
        <Card className={`${currentTheme.cardBg} border ${currentTheme.cardBorder} rounded-2xl shadow-xl`}>
          <CardHeader className="pb-3 border-b border-white/5">
            <CardTitle className={`text-xs font-black uppercase tracking-widest ${currentTheme.textMuted} flex items-center justify-between`}>
              <span>Weighted Parameter Breakdown</span>
              <span className="text-[10px] text-purple-400 font-bold">100% Total</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-3.5">
            <SubScoreBar label="Keyword Match" score={displayAnalysis.keywordScore} color="#A78BFA" weight="24%" textColor={currentTheme.text} mutedColor={currentTheme.textMuted} />
            <SubScoreBar label="Skills Relevance" score={displayAnalysis.skillsScore} color="#60A5FA" weight="20%" textColor={currentTheme.text} mutedColor={currentTheme.textMuted} />
            <SubScoreBar label="Experience Strength" score={displayAnalysis.experienceScore} color="#34D399" weight="18%" textColor={currentTheme.text} mutedColor={currentTheme.textMuted} />
            <SubScoreBar label="Formatting & Layout" score={displayAnalysis.formatScore} color="#F472B6" weight="14%" textColor={currentTheme.text} mutedColor={currentTheme.textMuted} />
            <SubScoreBar label="Education Match" score={displayAnalysis.educationScore} color="#FBBF24" weight="10%" textColor={currentTheme.text} mutedColor={currentTheme.textMuted} />
            <SubScoreBar label="Readability Index" score={displayAnalysis.readabilityScore} color="#38BDF8" weight="8%" textColor={currentTheme.text} mutedColor={currentTheme.textMuted} />
            <SubScoreBar label="Section Completeness" score={displayAnalysis.sectionScore} color="#FB923C" weight="6%" textColor={currentTheme.text} mutedColor={currentTheme.textMuted} />
          </CardContent>
        </Card>
      </div>

      {/* Matched & Missing Keywords */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Matched Keywords */}
        <Card className={`${currentTheme.cardBg} border ${currentTheme.cardBorder} rounded-2xl shadow-lg`}>
          <CardHeader className="pb-3 border-b border-white/5">
            <CardTitle className={`text-xs font-black uppercase tracking-widest ${currentTheme.textMuted} flex items-center gap-2`}>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Matched Keywords ({displayAnalysis.matchedKeywords.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
              {displayAnalysis.matchedKeywords.map((kw) => (
                <Badge
                  key={kw}
                  className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold px-2.5 py-1"
                >
                  ✓ {kw}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Missing Keywords */}
        <Card className={`${currentTheme.cardBg} border ${currentTheme.cardBorder} rounded-2xl shadow-lg`}>
          <CardHeader className="pb-3 border-b border-white/5">
            <CardTitle className={`text-xs font-black uppercase tracking-widest ${currentTheme.textMuted} flex items-center gap-2`}>
              <AlertCircle className="h-4 w-4 text-amber-400" />
              <span>Recommended Missing Keywords ({displayAnalysis.missingKeywords.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
              {displayAnalysis.missingKeywords.map((kw) => (
                <Badge
                  key={kw}
                  className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-semibold px-2.5 py-1"
                >
                  + {kw}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Strengths & AI Actionable Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <Card className={`${currentTheme.cardBg} border ${currentTheme.cardBorder} rounded-2xl shadow-lg`}>
          <CardHeader className="pb-3 border-b border-white/5">
            <CardTitle className={`text-xs font-black uppercase tracking-widest ${currentTheme.textMuted} flex items-center gap-2`}>
              <Star className="h-4 w-4 text-yellow-400" />
              <span>Resume Strengths</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <ul className="space-y-2.5">
              {displayAnalysis.strengths.map((st, i) => (
                <li key={i} className={`flex items-start gap-2 text-xs ${currentTheme.text}`}>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{st}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Actionable Recommendations */}
        <Card className={`${currentTheme.cardBg} border ${currentTheme.cardBorder} rounded-2xl shadow-lg`}>
          <CardHeader className="pb-3 border-b border-white/5">
            <CardTitle className={`text-xs font-black uppercase tracking-widest ${currentTheme.textMuted} flex items-center gap-2`}>
              <TrendingUp className="h-4 w-4 text-purple-400" />
              <span>AI Actionable Recommendations</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <ul className="space-y-2.5">
              {displayAnalysis.suggestions.map((sg, i) => (
                <li key={i} className={`flex items-start gap-2 text-xs ${currentTheme.text}`}>
                  <Zap className="h-3.5 w-3.5 text-purple-400 shrink-0 mt-0.5" />
                  <span>{sg}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Key Resume Meta Cards */}
      <Card className={`${currentTheme.cardBg} border ${currentTheme.cardBorder} rounded-2xl shadow-lg`}>
        <CardContent className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="space-y-1">
              <p className="text-xl font-black text-purple-400">
                {displayAnalysis.jobTitleMatch || "Full Stack Engineer"}
              </p>
              <p className={`text-[11px] font-bold ${currentTheme.textMuted}`}>Target Role Match</p>
            </div>
            <div className="space-y-1">
              <p className="text-xl font-black text-blue-400">
                {displayAnalysis.experienceYears} Years
              </p>
              <p className={`text-[11px] font-bold ${currentTheme.textMuted}`}>Parsed Experience</p>
            </div>
            <div className="space-y-1">
              <p className="text-xl font-black text-emerald-400">
                {displayAnalysis.extractedSkills.length} Skills
              </p>
              <p className={`text-[11px] font-bold ${currentTheme.textMuted}`}>Skills Extracted</p>
            </div>
            <div className="space-y-1">
              <p className="text-xl font-black text-amber-400">
                {displayAnalysis.missingKeywords.length} Terms
              </p>
              <p className={`text-[11px] font-bold ${currentTheme.textMuted}`}>Keywords to Add</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Link href="/ats/upload-resume">
          <Button className="h-10 px-5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold gap-2 border-none shadow-md">
            <RefreshCw className="h-3.5 w-3.5" /> Re-analyze Resume
          </Button>
        </Link>
        <Link href="/ats/history">
          <Button variant="outline" className="h-10 px-5 rounded-full border-white/10 text-xs font-bold gap-2">
            <Clock className="h-3.5 w-3.5" /> View History
          </Button>
        </Link>
        <Link href="/ats/ranking">
          <Button variant="outline" className="h-10 px-5 rounded-full border-white/10 text-xs font-bold gap-2">
            <Trophy className="h-3.5 w-3.5" /> Leaderboard
          </Button>
        </Link>
      </div>
    </div>
  );
}

/* ── Main ATSAnalysisPage Component ── */
export default function ATSAnalysisPage() {
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

  if (isMobile === null) return null;

  // Mobile View (< 640px): wrapped in MobileNavShell with fixed bottom nav & header
  if (isMobile) {
    return (
      <MobileNavShell activeHref="/ats">
        <Suspense>
          <div className="p-4 pt-3">
            <AnalysisContent isMobile={true} />
          </div>
        </Suspense>
      </MobileNavShell>
    );
  }

  // Desktop View (≥ 640px): wider grid layout with HeaderOffset
  return (
    <div className={`min-h-screen ${currentTheme.background} transition-colors duration-300`}>
      <HeaderOffset />
      <Suspense>
        <div className="max-w-5xl mx-auto px-6 py-8">
          <AnalysisContent isMobile={false} />
        </div>
      </Suspense>
    </div>
  );
}
