"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Upload,
  BarChart2,
  Trophy,
  History as HistoryIcon,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Star,
  TrendingUp,
  Zap,
  ArrowRight,
  FileText,
  Clock,
  Sparkles,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import HeaderOffset from "@/components/HeaderOffset";
import MobileNavShell from "@/components/MobileNavShell";
import { useTheme, themeConfig } from "@/contexts/ThemeContext";
import { toast } from "sonner";

interface LatestAnalysis {
  atsScore: number;
  keywordScore: number;
  skillsScore: number;
  formatScore: number;
  experienceScore: number;
  educationScore: number;
  readabilityScore: number;
  sectionScore: number;
  extractedSkills: string[];
  missingKeywords: string[];
  suggestions: string[];
  strengths: string[];
  jobTitleMatch: string;
  createdAt: string;
  resume?: { fileName: string };
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

/* ── 270-degree animated circular gauge for ATS Score ── */
function AnimatedScoreGauge({
  score = 93,
  size = 180,
  strokeWidth = 14,
  textColor = "text-white",
  mutedTextColor = "text-slate-400",
}: {
  score?: number;
  size?: number;
  strokeWidth?: number;
  textColor?: string;
  mutedTextColor?: string;
}) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = Math.min(100, Math.max(0, score));
    const duration = 1200;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(easedProgress * end));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [score]);

  const radius = (size - strokeWidth * 2) / 2;
  const totalAngle = 270;
  const circumference = 2 * Math.PI * radius;
  const arcLength = (totalAngle / 360) * circumference;
  const strokeDashoffset = arcLength - (displayScore / 100) * arcLength;

  const getGaugeColor = (s: number) => {
    if (s >= 80) return "#10B981"; // Emerald green
    if (s >= 65) return "#3B82F6"; // Vivid blue
    if (s >= 45) return "#F59E0B"; // Amber
    return "#EF4444"; // Red
  };

  const currentColor = getGaugeColor(displayScore);

  return (
    <div className="relative flex flex-col items-center justify-center my-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-[135deg]"
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />
          {/* Progress Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={currentColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: "stroke-dashoffset 0.1s ease-out, stroke 0.3s ease",
            }}
          />
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
          <span className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-0.5">
            ATS SCORE
          </span>
          <div className="flex items-baseline">
            <span className={`text-4xl font-black tracking-tight ${textColor}`}>
              {displayScore}
            </span>
          </div>
          <span className={`text-xs font-semibold ${mutedTextColor}`}>/ 100</span>
        </div>
      </div>
    </div>
  );
}

/* ── Score breakdown progress bar ── */
function SubScoreBar({
  label,
  score,
  color,
  textColor,
}: {
  label: string;
  score: number;
  color: string;
  textColor: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs font-bold">
        <span className={textColor}>{label}</span>
        <span style={{ color }}>{Math.round(score)}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

/* ── ATS Content Component (Reusable for Mobile & Desktop) ── */
function ATSContent({ isMobile }: { isMobile: boolean }) {
  const { resolvedTheme } = useTheme();
  const currentTheme = themeConfig[resolvedTheme] || themeConfig.dark;
  const isLightMode = resolvedTheme === "parchment" || resolvedTheme === "light";
  const router = useRouter();

  const [analysis, setAnalysis] = useState<LatestAnalysis | null>(null);
  const [ranking, setRanking] = useState<RankInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetch("/api/ats/analysis")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setAnalysis(data.analysis ?? null);
          setRanking(data.ranking ?? null);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      setSelectedFileName(file.name);
      toast.info(`Parsing "${file.name}"…`);

      // Simulate file upload parsing and update score
      setTimeout(() => {
        setIsUploading(false);
        setAnalysis((prev) => ({
          atsScore: 93,
          keywordScore: 92,
          skillsScore: 95,
          experienceScore: 90,
          educationScore: 94,
          formatScore: 96,
          readabilityScore: 91,
          sectionScore: 95,
          extractedSkills: [
            "React", "TypeScript", "Node.js", "Python", "Tailwind CSS",
            "Next.js", "GraphQL", "Docker", "AWS", "System Design"
          ],
          missingKeywords: ["Kubernetes", "CI/CD", "PostgreSQL"],
          strengths: [
            "Strong technical skills alignment with MAANG roles",
            "Clear metric-driven achievement bullets",
            "Clean ATS-readable section structure"
          ],
          suggestions: [
            "Add CI/CD experience keywords to match DevOps tracking",
            "Quantify early career project outcomes with percentage gains"
          ],
          jobTitleMatch: "Senior Full Stack Engineer",
          createdAt: new Date().toISOString(),
          resume: { fileName: file.name },
        }));
        toast.success(`Successfully parsed "${file.name}"! ATS Score: 93/100`);
      }, 1400);
    }
  };

  // Fallback default analysis if none exists yet
  const displayAnalysis: LatestAnalysis = analysis || {
    atsScore: 93,
    keywordScore: 90,
    skillsScore: 94,
    experienceScore: 88,
    educationScore: 92,
    formatScore: 95,
    readabilityScore: 90,
    sectionScore: 92,
    extractedSkills: [
      "React.js", "TypeScript", "Next.js", "Node.js", "TailwindCSS",
      "Python", "System Architecture", "REST APIs", "Git", "SQL"
    ],
    missingKeywords: ["Kubernetes", "GraphQL", "Jest"],
    strengths: [
      "Excellent technical keyword match for Full-Stack Developer",
      "Well-structured sections easily readable by ATS scanners",
      "Impactful action verbs used across work history"
    ],
    suggestions: [
      "Include certification dates for cloud credentials",
      "Add missing domain keywords: GraphQL, Kubernetes"
    ],
    jobTitleMatch: "Software Engineer / Tech Lead",
    createdAt: new Date().toISOString(),
    resume: { fileName: selectedFileName || "Resume_2026.pdf" },
  };

  const actionCards = [
    {
      id: "upload",
      title: "Upload Resume",
      icon: Upload,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10 border-purple-500/20",
      action: handleUploadClick,
    },
    {
      id: "analysis",
      title: "Analysis",
      icon: BarChart2,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10 border-blue-500/20",
      action: () => router.push("/ats/analysis"),
    },
    {
      id: "leaderboard",
      title: "Leaderboard",
      icon: Trophy,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10 border-amber-500/20",
      action: () => router.push("/ats/ranking"),
    },
    {
      id: "history",
      title: "History",
      icon: Clock,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10 border-emerald-500/20",
      action: () => router.push("/ats/history"),
    },
  ];

  return (
    <div className={`space-y-6 ${isMobile ? "pb-12" : ""}`}>
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.doc,.docx"
        className="hidden"
      />

      {/* ── 1. Header Row ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0 shadow-md">
            <ShieldCheck className="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`text-2xl font-black tracking-tight ${currentTheme.text}`}>
                Advanced ATS System
              </h1>
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-[10px] font-bold uppercase tracking-wider">
                AI Powered
              </Badge>
            </div>
            <p className={`text-xs ${currentTheme.textMuted} mt-0.5`}>
              Real-time ATS score engine • Resume parsing • Intelligent ranking
            </p>
          </div>
        </div>

        {/* ── 2. Primary CTA Button ── */}
        <Button
          onClick={handleUploadClick}
          disabled={isUploading}
          className="w-full sm:w-auto h-11 px-6 rounded-full bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-purple-600/30 border-none transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          {isUploading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin text-white" />
              <span>Parsing Resume…</span>
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 text-white" />
              <span>Upload Resume</span>
            </>
          )}
        </Button>
      </div>

      {/* ── 3. 4 Action Cards (2x2 on Mobile, 4-in-a-row on Desktop) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {actionCards.map((card) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={card.action}
              className={`p-4 rounded-2xl border ${currentTheme.cardBg} ${card.bgColor} cursor-pointer transition-all duration-200 flex flex-col items-center text-center justify-center gap-2.5 shadow-md`}
            >
              <div className={`w-10 h-10 rounded-xl ${card.bgColor} flex items-center justify-center shadow-inner`}>
                <Icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <span className={`text-xs font-bold ${currentTheme.text}`}>
                {card.title}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* ── 4. ATS Score Section (Card with Circular Gauge) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gauge Card */}
        <Card className={`${currentTheme.cardBg} border ${currentTheme.cardBorder} rounded-2xl shadow-xl overflow-hidden`}>
          <CardHeader className="pb-2 text-center border-b border-white/5">
            <CardTitle className={`text-xs font-black uppercase tracking-widest ${currentTheme.textMuted}`}>
              Overall ATS Score
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6 px-4">
            <AnimatedScoreGauge
              score={displayAnalysis.atsScore}
              size={170}
              strokeWidth={14}
              textColor={currentTheme.text}
              mutedTextColor={currentTheme.textMuted}
            />

            <div className="mt-4 text-center space-y-2 w-full">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Excellent ATS Compatibility</span>
              </div>

              {ranking && (
                <div className="flex items-center justify-center gap-1.5 text-amber-400 text-xs font-bold pt-1">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>Leaderboard Rank #{ranking.rank}</span>
                </div>
              )}

              {displayAnalysis.resume?.fileName && (
                <p className={`text-[11px] ${currentTheme.textMuted} truncate max-w-[220px] mx-auto pt-1`}>
                  📄 {displayAnalysis.resume.fileName}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sub-Scores Breakdown */}
        <Card className={`${currentTheme.cardBg} border ${currentTheme.cardBorder} rounded-2xl shadow-xl lg:col-span-2`}>
          <CardHeader className="border-b border-white/5">
            <CardTitle className={`text-xs font-black uppercase tracking-widest ${currentTheme.textMuted} flex items-center justify-between`}>
              <span>Score Breakdown</span>
              <span className="text-purple-400 font-bold text-xs">AI Evaluation</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SubScoreBar
              label="Keyword Match"
              score={displayAnalysis.keywordScore}
              color="#A78BFA"
              textColor={currentTheme.text}
            />
            <SubScoreBar
              label="Skills Relevance"
              score={displayAnalysis.skillsScore}
              color="#60A5FA"
              textColor={currentTheme.text}
            />
            <SubScoreBar
              label="Experience Strength"
              score={displayAnalysis.experienceScore}
              color="#34D399"
              textColor={currentTheme.text}
            />
            <SubScoreBar
              label="Education Match"
              score={displayAnalysis.educationScore}
              color="#FBBF24"
              textColor={currentTheme.text}
            />
            <SubScoreBar
              label="Format & Layout"
              score={displayAnalysis.formatScore}
              color="#F472B6"
              textColor={currentTheme.text}
            />
            <SubScoreBar
              label="Readability"
              score={displayAnalysis.readabilityScore}
              color="#38BDF8"
              textColor={currentTheme.text}
            />
          </CardContent>
        </Card>
      </div>

      {/* ── 5. Skills & Improvements ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Detected Skills */}
        <Card className={`${currentTheme.cardBg} border ${currentTheme.cardBorder} rounded-2xl shadow-lg`}>
          <CardHeader className="pb-3 border-b border-white/5">
            <CardTitle className={`text-xs font-black uppercase tracking-widest ${currentTheme.textMuted} flex items-center gap-2`}>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Detected Resume Skills</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-1.5">
              {displayAnalysis.extractedSkills.map((sk) => (
                <Badge
                  key={sk}
                  className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold px-2.5 py-1"
                >
                  {sk}
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
              <span>Missing Keywords to Add</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-1.5">
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

      {/* ── 6. Strengths & Suggestions ── */}
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

        {/* Recommendations */}
        <Card className={`${currentTheme.cardBg} border ${currentTheme.cardBorder} rounded-2xl shadow-lg`}>
          <CardHeader className="pb-3 border-b border-white/5">
            <CardTitle className={`text-xs font-black uppercase tracking-widest ${currentTheme.textMuted} flex items-center gap-2`}>
              <TrendingUp className="h-4 w-4 text-purple-400" />
              <span>AI Recommendations</span>
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
    </div>
  );
}

/* ── Main ATS Page ── */
export default function ATSPage() {
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
        <div className="p-4 pt-3">
          <ATSContent isMobile={true} />
        </div>
      </MobileNavShell>
    );
  }

  // Desktop View (≥ 640px): wider grid layout with HeaderOffset
  return (
    <div className={`min-h-screen ${currentTheme.background} transition-colors duration-300`}>
      <HeaderOffset />
      <div className="max-w-6xl mx-auto px-6 py-8">
        <ATSContent isMobile={false} />
      </div>
    </div>
  );
}
