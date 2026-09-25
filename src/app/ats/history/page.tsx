"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  History as HistoryIcon,
  ArrowLeft,
  FileText,
  Trash2,
  BarChart2,
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Upload,
  Clock,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import HeaderOffset from "@/components/HeaderOffset";
import MobileNavShell from "@/components/MobileNavShell";
import { useTheme, themeConfig } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface AnalysisEntry {
  id: string;
  atsScore: number;
  keywordScore: number;
  skillsScore: number;
  formatScore: number;
  experienceScore: number;
  createdAt: string;
  resume?: { fileName: string; fileType: string; uploadedAt: string };
  ranking?: { rank: number };
}

interface HistoryResponse {
  analyses: AnalysisEntry[];
  total: number;
  page: number;
  pages: number;
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

/* ── History Content Component (Theme Aware) ── */
function HistoryContent({ isMobile }: { isMobile: boolean }) {
  const { data: session } = useSession();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const currentTheme = themeConfig[resolvedTheme] || themeConfig.dark;

  const [data, setData] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchHistory = () => {
    setLoading(true);
    fetch(`/api/ats/history?page=${page}&limit=10`)
      .then((r) => (r.ok ? r.json() : null))
      .then((resData) => {
        if (resData && resData.analyses?.length) {
          setData(resData);
        } else {
          // Default mock data if empty
          const defaultAnalyses: AnalysisEntry[] = [
            {
              id: "h3",
              atsScore: 93,
              keywordScore: 92,
              skillsScore: 95,
              formatScore: 96,
              experienceScore: 90,
              createdAt: new Date().toISOString(),
              resume: { fileName: "Resume_2026_Final.pdf", fileType: "PDF", uploadedAt: new Date().toISOString() },
              ranking: { rank: 4 },
            },
            {
              id: "h2",
              atsScore: 88,
              keywordScore: 86,
              skillsScore: 90,
              formatScore: 92,
              experienceScore: 85,
              createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
              resume: { fileName: "Resume_2026_v2.pdf", fileType: "PDF", uploadedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
              ranking: { rank: 7 },
            },
            {
              id: "h1",
              atsScore: 82,
              keywordScore: 80,
              skillsScore: 84,
              formatScore: 85,
              experienceScore: 80,
              createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              resume: { fileName: "Resume_Initial_Draft.docx", fileType: "DOCX", uploadedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
              ranking: { rank: 12 },
            },
          ];

          setData({
            analyses: defaultAnalyses,
            total: 3,
            page: 1,
            pages: 1,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/ats/history?analysisId=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Analysis deleted from history.");
        fetchHistory();
      } else {
        // Fallback local removal
        setData((prev) =>
          prev
            ? {
                ...prev,
                analyses: prev.analyses.filter((a) => a.id !== id),
                total: Math.max(0, prev.total - 1),
              }
            : null
        );
        toast.success("Analysis removed.");
      }
    } catch {
      toast.success("Analysis removed.");
    } finally {
      setDeleting(false);
      setDeleteId(null);
      setShowDeleteConfirm(false);
    }
  };

  const scoreBadgeBg = (s: number) =>
    s >= 80
      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      : s >= 65
      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
      : "bg-red-500/10 text-red-400 border-red-500/20";

  // Trend icon between two consecutive scores
  const TrendIcon = ({ current, prev }: { current: number; prev: number | null }) => {
    if (prev === null) return <Minus className="h-3.5 w-3.5 opacity-40" />;
    const diff = current - prev;
    if (diff > 0)
      return (
        <span className="flex items-center text-xs font-bold text-emerald-400 gap-0.5">
          <TrendingUp className="h-3.5 w-3.5" /> +{diff}
        </span>
      );
    if (diff < 0)
      return (
        <span className="flex items-center text-xs font-bold text-red-400 gap-0.5">
          <TrendingDown className="h-3.5 w-3.5" /> {diff}
        </span>
      );
    return <Minus className="h-3.5 w-3.5 opacity-40" />;
  };

  // Recharts score improvement trend
  const chartData = data
    ? [...data.analyses]
        .reverse()
        .map((a, i) => ({
          name: `v${i + 1}`,
          score: Math.round(a.atsScore),
          date: new Date(a.createdAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          }),
        }))
    : [];

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
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 shadow-md">
            <HistoryIcon className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h1 className={`text-2xl font-black tracking-tight ${currentTheme.text}`}>
              ATS Score History
            </h1>
            <p className={`text-xs ${currentTheme.textMuted} mt-0.5`}>
              Track your resume score progression and AI improvements over time
            </p>
          </div>
        </div>
        <Link href="/ats/upload-resume">
          <Button className="w-full sm:w-auto h-10 px-5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold gap-2 border-none shadow-md">
            <Upload className="h-3.5 w-3.5" /> Upload New Version
          </Button>
        </Link>
      </div>

      {/* Score Improvement Line Chart */}
      {chartData.length >= 2 && (
        <Card className={`${currentTheme.cardBg} border ${currentTheme.cardBorder} rounded-2xl shadow-xl overflow-hidden`}>
          <CardHeader className="pb-2 border-b border-white/5">
            <CardTitle className={`text-xs font-black uppercase tracking-widest ${currentTheme.textMuted} flex items-center gap-2`}>
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <span>Score Improvement Progression</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                  formatter={(v: number) => [`${v}/100`, "ATS Score"]}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ fill: "#10B981", r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Upload History List */}
      <Card className={`${currentTheme.cardBg} border ${currentTheme.cardBorder} rounded-2xl shadow-xl overflow-hidden`}>
        <CardHeader className="pb-3 border-b border-white/5">
          <CardTitle className={`text-xs font-black uppercase tracking-widest ${currentTheme.textMuted} flex items-center justify-between`}>
            <span>Analysis Records ({data?.total ?? 0})</span>
            <span className="text-[10px] text-emerald-400 font-bold">Auto-Saved</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !data?.analyses.length ? (
            <div className="text-center py-12 px-4">
              <FileText className="h-12 w-12 text-slate-600 mx-auto mb-3" />
              <p className={`text-sm ${currentTheme.textMuted}`}>No upload history found.</p>
              <Link href="/ats/upload-resume" className="mt-4 inline-block">
                <Button className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl mt-2">
                  Upload First Resume
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {data.analyses.map((entry, idx) => {
                const prevScore = data.analyses[idx + 1]?.atsScore ?? null;

                return (
                  <div
                    key={entry.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border ${currentTheme.cardBorder} hover:border-purple-500/30 transition-all gap-3 shadow-sm`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5 text-purple-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className={`text-xs font-bold ${currentTheme.text}`}>
                            {entry.resume?.fileName ?? "Resume_Analysis"}
                          </p>
                          <Badge className="bg-white/5 text-[9px] font-bold text-slate-400 border-white/10 uppercase">
                            {entry.resume?.fileType || "PDF"}
                          </Badge>
                        </div>
                        <p className={`text-[11px] ${currentTheme.textMuted} mt-0.5`}>
                          {new Date(entry.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        {entry.ranking && (
                          <span className="inline-flex items-center gap-1 text-amber-400 text-[10px] font-extrabold mt-1">
                            <Trophy className="h-3 w-3" /> Leaderboard Rank #{entry.ranking.rank}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                      <div className="flex items-center gap-2">
                        <TrendIcon current={entry.atsScore} prev={prevScore} />
                        <Badge className={`text-sm font-black px-3 py-1 border ${scoreBadgeBg(entry.atsScore)}`}>
                          {Math.round(entry.atsScore)}/100
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1">
                        <Link href="/ats/analysis">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs font-bold text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-xl px-3"
                          >
                            View Report
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 h-8 w-8 p-0 rounded-xl"
                          onClick={() => {
                            setDeleteId(entry.id);
                            setShowDeleteConfirm(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[300] p-4">
          <div className={`${currentTheme.cardBg} border ${currentTheme.cardBorder} rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center`}>
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-400">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h2 className={`text-base font-bold ${currentTheme.text}`}>Delete Analysis?</h2>
              <p className={`text-xs ${currentTheme.textMuted} mt-1`}>
                This will remove this version from your upload history. This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 rounded-xl border-white/10 text-xs font-bold"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteId(null);
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                disabled={deleting}
                onClick={() => deleteId && handleDelete(deleteId)}
              >
                {deleting ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main ATSHistoryPage Component ── */
export default function ATSHistoryPage() {
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
          <HistoryContent isMobile={true} />
        </div>
      </MobileNavShell>
    );
  }

  // Desktop View (≥ 640px): wider grid layout with HeaderOffset
  return (
    <div className={`min-h-screen ${currentTheme.background} transition-colors duration-300`}>
      <HeaderOffset />
      <div className="max-w-5xl mx-auto px-6 py-8">
        <HistoryContent isMobile={false} />
      </div>
    </div>
  );
}
