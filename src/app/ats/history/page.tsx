"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  History,
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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import HeaderOffset from "@/components/HeaderOffset";
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

export default function ATSHistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [data, setData] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  const fetchHistory = () => {
    if (status !== "authenticated") return;
    setLoading(true);
    fetch(`/api/ats/history?page=${page}&limit=10`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHistory();
  }, [status, page]);

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/ats/history?analysisId=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchHistory();
      }
    } finally {
      setDeleting(false);
      setDeleteId(null);
      setShowDeleteConfirm(false);
    }
  };

  const scoreColor = (s: number) =>
    s >= 70 ? "#34d399" : s >= 45 ? "#fbbf24" : "#f87171";

  const scoreBg = (s: number) =>
    s >= 70 ? "bg-emerald-500/10 text-emerald-400" : s >= 45 ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-400";

  // Trend icon between two consecutive scores
  const TrendIcon = ({ current, prev }: { current: number; prev: number | null }) => {
    if (prev === null) return <Minus className="h-3 w-3 text-slate-500" />;
    const diff = current - prev;
    if (diff > 0) return <TrendingUp className="h-3 w-3 text-emerald-400" />;
    if (diff < 0) return <TrendingDown className="h-3 w-3 text-red-400" />;
    return <Minus className="h-3 w-3 text-slate-500" />;
  };

  // Chart data — reversed (oldest first)
  const chartData = data
    ? [...data.analyses]
        .reverse()
        .map((a, i) => ({
          name: `Upload ${i + 1}`,
          score: Math.round(a.atsScore),
          date: new Date(a.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        }))
    : [];

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

        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <History className="h-6 w-6 text-emerald-400" />
              <h1 className="text-2xl font-black">Score History</h1>
            </div>
            <p className="text-slate-400 text-sm">
              Track your ATS score improvements over time
            </p>
          </div>
          <Link href="/ats/upload-resume">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white font-bold gap-2">
              + Upload Resume
            </Button>
          </Link>
        </div>

        {/* Score trend chart */}
        {chartData.length >= 2 && (
          <Card className="bg-slate-900/80 border-white/5 mb-6">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-400" />
                Score Improvement Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
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
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                    formatter={(v: number) => [`${v}`, "ATS Score"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#a78bfa"
                    strokeWidth={2.5}
                    dot={{ fill: "#a78bfa", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* History list */}
        <Card className="bg-slate-900/80 border-white/5">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-widest">
              Upload History {data?.total ? `(${data.total} uploads)` : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !data?.analyses.length ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No history yet.</p>
                <Link href="/ats/upload-resume" className="mt-4 inline-block">
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white mt-3">
                    Upload Your First Resume
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {data.analyses.map((entry, idx) => {
                  const prev = data.analyses[idx + 1]?.atsScore ?? null;
                  return (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-white/3 border border-white/5 hover:border-white/10 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="hidden sm:flex flex-col items-center justify-center h-12 w-12 rounded-xl bg-slate-800 border border-white/5">
                          <FileText className="h-5 w-5 text-slate-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-white text-sm">
                            {entry.resume?.fileName ?? "Resume"}
                            <span className="ml-2 text-xs uppercase text-slate-500">
                              {entry.resume?.fileType ?? ""}
                            </span>
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(entry.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          {entry.ranking && (
                            <div className="flex items-center gap-1 text-amber-400 text-xs mt-0.5">
                              <Trophy className="h-3 w-3" /> Rank #{entry.ranking.rank}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <TrendIcon current={entry.atsScore} prev={prev} />
                        </div>
                        <Badge className={`text-base font-black px-3 ${scoreBg(entry.atsScore)}`}>
                          {Math.round(entry.atsScore)}
                        </Badge>

                        <div className="flex gap-1">
                          <Link href={`/ats/analysis?id=${entry.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-slate-400 hover:text-white h-8 w-8 p-0"
                            >
                              <BarChart2 className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-600 hover:text-red-400 h-8 w-8 p-0"
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

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-slate-400">
              Page {data.page} of {data.pages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-white/10 text-slate-300"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-white/10 text-slate-300"
                disabled={page >= (data?.pages ?? 1)}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Delete confirmation modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 max-w-sm w-full mx-4">
              <div className="flex flex-col items-center gap-4 text-center">
                <AlertTriangle className="h-12 w-12 text-red-400" />
                <h2 className="text-lg font-bold text-white">Delete Analysis?</h2>
                <p className="text-sm text-slate-400">
                  This will permanently delete this resume analysis and remove your ranking
                  entry. This cannot be undone.
                </p>
                <div className="flex gap-3 w-full mt-2">
                  <Button
                    variant="outline"
                    className="flex-1 border-white/10 text-slate-300"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteId(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    disabled={deleting}
                    onClick={() => deleteId && handleDelete(deleteId)}
                  >
                    {deleting ? "Deleting…" : "Delete"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
