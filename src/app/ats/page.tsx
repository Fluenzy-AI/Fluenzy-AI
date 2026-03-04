"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Upload,
  BarChart2,
  Trophy,
  History,
  ArrowRight,
  FileText,
  TrendingUp,
  Target,
  Zap,
  Star,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import HeaderOffset from "@/components/HeaderOffset";

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

// Circular score ring
function ScoreRing({
  score,
  size = 140,
  strokeWidth = 10,
  color,
  label,
}: {
  score: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  label?: string;
}) {
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />
      </svg>
      <div
        className="flex flex-col items-center"
        style={{ marginTop: -(size / 2 + 12) }}
      >
        <span className="text-3xl font-black" style={{ color }}>
          {score}
        </span>
        <span className="text-xs text-slate-400">/ 100</span>
      </div>
      {label && (
        <span className="text-xs font-semibold text-slate-400 mt-2">{label}</span>
      )}
    </div>
  );
}

// Mini bar
function ScoreBar({
  label,
  score,
  color,
}: {
  label: string;
  score: number;
  color: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-semibold text-slate-400">
        <span>{label}</span>
        <span style={{ color }}>{Math.round(score)}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function ATSPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [analysis, setAnalysis] = useState<LatestAnalysis | null>(null);
  const [ranking, setRanking] = useState<RankInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    setLoading(true);
    fetch("/api/ats/analysis")
      .then((r) => r.json())
      .then((data) => {
        setAnalysis(data.analysis ?? null);
        setRanking(data.ranking ?? null);
      })
      .finally(() => setLoading(false));
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Loading ATS Dashboard…</p>
        </div>
      </div>
    );
  }

  const scoreColor = (s: number) =>
    s >= 70 ? "#34d399" : s >= 45 ? "#fbbf24" : "#f87171";

  const atsBadge = (s: number) => {
    if (s >= 80) return { label: "Excellent", color: "bg-emerald-500/20 text-emerald-400" };
    if (s >= 65) return { label: "Good", color: "bg-blue-500/20 text-blue-400" };
    if (s >= 45) return { label: "Average", color: "bg-yellow-500/20 text-yellow-400" };
    return { label: "Needs Work", color: "bg-red-500/20 text-red-400" };
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <HeaderOffset />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="h-6 w-6 text-purple-400" />
              <h1 className="text-2xl font-black text-white">Advanced ATS System</h1>
            </div>
            <p className="text-slate-400 text-sm">
              Real-time ATS score engine • Resume parsing • Intelligent ranking
            </p>
          </div>
          <Link href="/ats/upload-resume">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white font-bold gap-2">
              <Upload className="h-4 w-4" />
              Upload Resume
            </Button>
          </Link>
        </div>

        {/* Quick nav tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            {
              href: "/ats/upload-resume",
              icon: Upload,
              label: "Upload Resume",
              color: "text-purple-400",
              bg: "bg-purple-500/10",
            },
            {
              href: "/ats/analysis",
              icon: BarChart2,
              label: "Analysis",
              color: "text-blue-400",
              bg: "bg-blue-500/10",
            },
            {
              href: "/ats/ranking",
              icon: Trophy,
              label: "Leaderboard",
              color: "text-amber-400",
              bg: "bg-amber-500/10",
            },
            {
              href: "/ats/history",
              icon: History,
              label: "History",
              color: "text-emerald-400",
              bg: "bg-emerald-500/10",
            },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <div className={`rounded-xl border border-white/5 p-4 flex flex-col items-center gap-2 hover:border-white/10 cursor-pointer transition-all hover:scale-105 ${item.bg}`}>
                <item.icon className={`h-6 w-6 ${item.color}`} />
                <span className="text-xs font-bold text-slate-300">{item.label}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* No analysis state */}
        {!analysis ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/50 p-16 flex flex-col items-center text-center gap-5">
            <FileText className="h-16 w-16 text-slate-600" />
            <div>
              <h2 className="text-xl font-bold text-white mb-2">No resume uploaded yet</h2>
              <p className="text-slate-400 text-sm max-w-md">
                Upload your resume (PDF or DOCX) and our AI engine will analyze it in real-time,
                giving you a detailed ATS compatibility report.
              </p>
            </div>
            <Link href="/ats/upload-resume">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white font-bold gap-2">
                <Upload className="h-4 w-4" />
                Upload Your Resume
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Score Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main ATS Score */}
              <Card className="bg-slate-900/80 border-white/5 lg:col-span-1 flex flex-col items-center justify-center py-8">
                <CardHeader className="pb-2 text-center">
                  <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                    ATS Score
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                  <ScoreRing
                    score={Math.round(analysis.atsScore)}
                    color={scoreColor(analysis.atsScore)}
                    size={160}
                    strokeWidth={12}
                  />
                  <Badge
                    className={`text-sm font-bold px-3 py-1 ${atsBadge(analysis.atsScore).color}`}
                  >
                    {atsBadge(analysis.atsScore).label}
                  </Badge>
                  {ranking && (
                    <div className="flex items-center gap-2 text-amber-400 text-sm font-bold">
                      <Trophy className="h-4 w-4" />
                      Rank #{ranking.rank}
                    </div>
                  )}
                  {analysis.resume?.fileName && (
                    <p className="text-xs text-slate-500 truncate max-w-[180px]">
                      {analysis.resume.fileName}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Sub-scores */}
              <Card className="bg-slate-900/80 border-white/5 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                    Score Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ScoreBar
                    label="Keyword Match"
                    score={analysis.keywordScore}
                    color="#a78bfa"
                  />
                  <ScoreBar
                    label="Skills Relevance"
                    score={analysis.skillsScore}
                    color="#60a5fa"
                  />
                  <ScoreBar
                    label="Experience Strength"
                    score={analysis.experienceScore}
                    color="#34d399"
                  />
                  <ScoreBar
                    label="Education Match"
                    score={analysis.educationScore}
                    color="#fbbf24"
                  />
                  <ScoreBar
                    label="Formatting"
                    score={analysis.formatScore}
                    color="#f472b6"
                  />
                  <ScoreBar
                    label="Readability"
                    score={analysis.readabilityScore ?? 0}
                    color="#38bdf8"
                  />
                  <ScoreBar
                    label="Section Completeness"
                    score={analysis.sectionScore ?? 0}
                    color="#fb923c"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Skills & Missing Keywords */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Matched skills */}
              <Card className="bg-slate-900/80 border-white/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-widest">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    Detected Skills
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {analysis.extractedSkills.slice(0, 20).map((sk) => (
                      <Badge
                        key={sk}
                        className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs font-semibold"
                      >
                        {sk}
                      </Badge>
                    ))}
                    {analysis.extractedSkills.length === 0 && (
                      <p className="text-slate-500 text-sm">No skills detected.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Missing keywords */}
              <Card className="bg-slate-900/80 border-white/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-widest">
                    <AlertCircle className="h-4 w-4 text-amber-400" />
                    Missing Keywords
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {analysis.missingKeywords.slice(0, 15).map((kw) => (
                      <Badge
                        key={kw}
                        className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs font-semibold"
                      >
                        {kw}
                      </Badge>
                    ))}
                    {analysis.missingKeywords.length === 0 && (
                      <p className="text-slate-500 text-sm">All key terms detected!</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Strengths & Suggestions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Strengths */}
              <Card className="bg-slate-900/80 border-white/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-widest">
                    <Star className="h-4 w-4 text-yellow-400" />
                    Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Improvement Suggestions */}
              <Card className="bg-slate-900/80 border-white/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-widest">
                    <TrendingUp className="h-4 w-4 text-purple-400" />
                    Improvements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.suggestions.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <Zap className="h-4 w-4 text-purple-400 flex-shrink-0 mt-0.5" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* CTA Row */}
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/ats/upload-resume">
                <Button variant="outline" className="border-white/10 text-slate-300 hover:text-white gap-2">
                  <Upload className="h-4 w-4" /> Re-upload & Improve
                </Button>
              </Link>
              <Link href="/ats/history">
                <Button variant="outline" className="border-white/10 text-slate-300 hover:text-white gap-2">
                  <History className="h-4 w-4" /> View History
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/ats/ranking">
                <Button variant="outline" className="border-white/10 text-slate-300 hover:text-white gap-2">
                  <Trophy className="h-4 w-4" /> View Leaderboard
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
