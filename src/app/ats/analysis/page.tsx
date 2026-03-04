"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import HeaderOffset from "@/components/HeaderOffset";
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

function ScoreBar({
  label,
  score,
  color,
  weight,
}: {
  label: string;
  score: number;
  color: string;
  weight: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm font-semibold">
        <span className="text-slate-300">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">weight {weight}</span>
          <span style={{ color }} className="font-bold">
            {Math.round(score)}%
          </span>
        </div>
      </div>
      <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${score}%`,
            backgroundColor: color,
            transition: "width 0.8s ease",
          }}
        />
      </div>
    </div>
  );
}

function AnalysisContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const analysisId = searchParams.get("id");

  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [ranking, setRanking] = useState<RankInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const url = analysisId
      ? `/api/ats/analysis?id=${analysisId}`
      : "/api/ats/analysis";

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return; }
        setAnalysis(data.analysis);
        setRanking(data.ranking ?? null);
      })
      .catch(() => setError("Failed to load analysis."))
      .finally(() => setLoading(false));
  }, [status, analysisId]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-4">
        <ShieldCheck className="h-12 w-12 text-slate-600" />
        <p className="text-slate-400">{error ?? "No analysis found."}</p>
        <Link href="/ats/upload-resume">
          <Button className="bg-purple-600 hover:bg-purple-700 text-white">
            Upload Resume First
          </Button>
        </Link>
      </div>
    );
  }

  const radarData = [
    { subject: "Keywords", value: analysis.keywordScore },
    { subject: "Skills", value: analysis.skillsScore },
    { subject: "Experience", value: analysis.experienceScore },
    { subject: "Education", value: analysis.educationScore },
    { subject: "Format", value: analysis.formatScore },
    { subject: "Readability", value: analysis.readabilityScore },
    { subject: "Sections", value: analysis.sectionScore },
  ];

  const ATSGrade = (s: number) => {
    if (s >= 80) return { grade: "A+", color: "#34d399" };
    if (s >= 70) return { grade: "A", color: "#34d399" };
    if (s >= 60) return { grade: "B+", color: "#60a5fa" };
    if (s >= 50) return { grade: "B", color: "#60a5fa" };
    if (s >= 40) return { grade: "C", color: "#fbbf24" };
    return { grade: "D", color: "#f87171" };
  };

  const { grade, color } = ATSGrade(analysis.atsScore);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <HeaderOffset />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <Link
          href="/ats"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to ATS Dashboard
        </Link>

        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BarChart2 className="h-6 w-6 text-blue-400" />
              <h1 className="text-2xl font-black">Resume Analysis Report</h1>
            </div>
            {analysis.resume && (
              <p className="text-slate-400 text-sm">
                {analysis.resume.fileName} •{" "}
                {new Date(analysis.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <div
              className="text-5xl font-black"
              style={{ color }}
            >
              {Math.round(analysis.atsScore)}
              <span className="text-2xl ml-1 text-slate-500">/ 100</span>
            </div>
            <Badge className="text-lg font-black px-3 py-1" style={{ backgroundColor: `${color}22`, color }}>
              Grade: {grade}
            </Badge>
            {ranking && (
              <div className="flex items-center gap-1 text-amber-400 text-sm font-bold">
                <Trophy className="h-4 w-4" />
                Rank #{ranking.rank}
              </div>
            )}
          </div>
        </div>

        {/* Radar + Bars */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Radar Chart */}
          <Card className="bg-slate-900/80 border-white/5">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                Score Radar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.05)" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                  />
                  <Radar
                    name="Score"
                    dataKey="value"
                    stroke="#a78bfa"
                    fill="#a78bfa"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                    formatter={(v: number) => [`${Math.round(v)}%`, "Score"]}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Detailed Bars */}
          <Card className="bg-slate-900/80 border-white/5">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                Weighted Scores
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <ScoreBar label="Keyword Match" score={analysis.keywordScore} color="#a78bfa" weight="24%" />
              <ScoreBar label="Skills Relevance" score={analysis.skillsScore} color="#60a5fa" weight="20%" />
              <ScoreBar label="Experience" score={analysis.experienceScore} color="#34d399" weight="18%" />
              <ScoreBar label="Formatting" score={analysis.formatScore} color="#f472b6" weight="14%" />
              <ScoreBar label="Education" score={analysis.educationScore} color="#fbbf24" weight="10%" />
              <ScoreBar label="Readability" score={analysis.readabilityScore} color="#38bdf8" weight="8%" />
              <ScoreBar label="Section Completeness" score={analysis.sectionScore} color="#fb923c" weight="6%" />
            </CardContent>
          </Card>
        </div>

        {/* Keywords */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card className="bg-slate-900/80 border-white/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-widest">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Matched Keywords ({analysis.matchedKeywords.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                {analysis.matchedKeywords.map((kw) => (
                  <Badge
                    key={kw}
                    className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs"
                  >
                    ✓ {kw}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/80 border-white/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-widest">
                <AlertCircle className="h-4 w-4 text-amber-400" />
                Missing Keywords ({analysis.missingKeywords.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                {analysis.missingKeywords.map((kw) => (
                  <Badge
                    key={kw}
                    className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs"
                  >
                    + {kw}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Strengths + Suggestions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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

          <Card className="bg-slate-900/80 border-white/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-widest">
                <TrendingUp className="h-4 w-4 text-purple-400" />
                Actionable Improvements
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

        {/* Meta info */}
        <Card className="bg-slate-900/80 border-white/5 mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              {[
                {
                  label: "Detected Role",
                  value: analysis.jobTitleMatch || "General",
                  color: "text-purple-400",
                },
                {
                  label: "Experience Years",
                  value: `${analysis.experienceYears} yrs`,
                  color: "text-blue-400",
                },
                {
                  label: "Skills Found",
                  value: analysis.extractedSkills.length.toString(),
                  color: "text-emerald-400",
                },
                {
                  label: "Missing Keywords",
                  value: analysis.missingKeywords.length.toString(),
                  color: "text-amber-400",
                },
              ].map((item) => (
                <div key={item.label} className="space-y-1">
                  <p className={`text-2xl font-black ${item.color}`}>{item.value}</p>
                  <p className="text-xs text-slate-500">{item.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <Link href="/ats/upload-resume">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white font-bold gap-2">
              <RefreshCw className="h-4 w-4" /> Re-analyze Resume
            </Button>
          </Link>
          <Link href="/ats/history">
            <Button variant="outline" className="border-white/10 text-slate-300 hover:text-white gap-2">
              <Info className="h-4 w-4" /> View History
            </Button>
          </Link>
          <Link href="/ats/ranking">
            <Button variant="outline" className="border-white/10 text-slate-300 hover:text-white gap-2">
              <Trophy className="h-4 w-4" /> Leaderboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ATSAnalysisPage() {
  return (
    <Suspense>
      <AnalysisContent />
    </Suspense>
  );
}
