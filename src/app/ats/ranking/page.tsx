"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Trophy,
  ArrowLeft,
  Medal,
  User,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Star,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import HeaderOffset from "@/components/HeaderOffset";

const ROLE_OPTIONS = [
  { value: "all",         label: "All Roles" },
  { value: "frontend",    label: "Frontend Developer" },
  { value: "backend",     label: "Backend Developer" },
  { value: "fullstack",   label: "Full Stack Developer" },
  { value: "ai",          label: "AI / ML Engineer" },
  { value: "datascience", label: "Data Scientist" },
  { value: "devops",      label: "DevOps Engineer" },
  { value: "android",     label: "Android Developer" },
  { value: "ios",         label: "iOS Developer" },
  { value: "mobile",      label: "Mobile Developer" },
  { value: "general",     label: "General" },
];

interface RankEntry {
  id: string;
  rank: number;
  totalScore: number;
  college: string | null;
  jobRole: string | null;
  updatedAt: string;
  user: { id: string; name: string; email: string; avatar: string | null };
  analysis: {
    atsScore: number;
    extractedSkills: string[];
    jobTitleMatch: string | null;
    createdAt: string;
  };
}

interface RankResponse {
  rankings: RankEntry[];
  total: number;
  page: number;
  pages: number;
  myRank: number | null;
  myScore: number | null;
  myRole: string | null;
}

export default function ATSRankingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [data, setData] = useState<RankResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [college, setCollege] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  const fetchRankings = () => {
    if (status !== "authenticated") return;
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (college) params.set("college", college);
    if (roleFilter && roleFilter !== "all") params.set("role", roleFilter);
    fetch(`/api/ats/ranking?${params}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRankings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, page, college, roleFilter]);

  const rankBadge = (rank: number) => {
    if (rank === 1) return { icon: "🥇", color: "text-yellow-400" };
    if (rank === 2) return { icon: "🥈", color: "text-slate-300" };
    if (rank === 3) return { icon: "🥉", color: "text-amber-600" };
    return { icon: `#${rank}`, color: "text-slate-400" };
  };

  const scoreColor = (s: number) =>
    s >= 70 ? "text-emerald-400" : s >= 45 ? "text-amber-400" : "text-red-400";

  const roleLabel = (role: string | null) =>
    ROLE_OPTIONS.find((r) => r.value === (role ?? "general"))?.label ?? role ?? "—";

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
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="h-6 w-6 text-amber-400" />
              <h1 className="text-2xl font-black">ATS Leaderboard</h1>
            </div>
            <p className="text-slate-400 text-sm">
              Real-time ranking of students by ATS score • Updates instantly on re-upload
            </p>
          </div>
          <Button
            variant="outline"
            className="border-white/10 text-slate-300 hover:text-white gap-2"
            onClick={fetchRankings}
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>

        {/* My rank card */}
        {data?.myRank && (
          <Card className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-purple-500/20 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Star className="h-6 w-6 text-purple-400" />
                  </div>
                  <div>
                    <p className="font-bold text-white">Your Ranking</p>
                    <p className="text-sm text-slate-400">
                      {session?.user?.name ?? "You"}
                    </p>
                    {data.myRole && (
                      <Badge className="mt-1 text-[10px] bg-purple-500/20 text-purple-300 border-purple-500/20">
                        {roleLabel(data.myRole)}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-purple-400">
                    #{data.myRank}
                  </p>
                  <p className="text-sm text-slate-400">
                    Score: {Math.round(data.myScore ?? 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          {/* Role filter */}
          <select
            value={roleFilter}
            onChange={(e) => { setPage(1); setRoleFilter(e.target.value); }}
            className="rounded-md bg-slate-900 border border-white/10 text-slate-300 text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>

          {/* College filter */}
          <Input
            placeholder="Filter by college…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="bg-slate-900 border-white/10 text-white placeholder:text-slate-500 max-w-xs"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setPage(1);
                setCollege(searchInput.trim());
              }
            }}
          />
          <Button
            variant="outline"
            className="border-white/10 text-slate-300"
            onClick={() => {
              setPage(1);
              setCollege(searchInput.trim());
            }}
          >
            Filter
          </Button>
          {(college || roleFilter !== "all") && (
            <Button
              variant="ghost"
              className="text-slate-400"
              onClick={() => {
                setCollege("");
                setSearchInput("");
                setRoleFilter("all");
                setPage(1);
              }}
            >
              Clear All
            </Button>
          )}
        </div>

        {/* Rankings Table */}
        <Card className="bg-slate-900/80 border-white/5 mb-6">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Medal className="h-4 w-4 text-amber-400" />
              Top Students {data?.total ? `(${data.total} total)` : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !data?.rankings.length ? (
              <div className="text-center py-12">
                <Trophy className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No rankings yet. Be the first to upload!</p>
                <Link href="/ats/upload-resume" className="mt-4 inline-block">
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white mt-3">
                    Upload Resume
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left py-3 px-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                        Rank
                      </th>
                      <th className="text-left py-3 px-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                        Student
                      </th>
                      <th className="text-left py-3 px-2 text-xs font-bold text-slate-500 uppercase tracking-widest hidden sm:table-cell">
                        Role
                      </th>
                      <th className="text-left py-3 px-2 text-xs font-bold text-slate-500 uppercase tracking-widest hidden sm:table-cell">
                        College
                      </th>
                      <th className="text-left py-3 px-2 text-xs font-bold text-slate-500 uppercase tracking-widest hidden md:table-cell">
                        Top Skills
                      </th>
                      <th className="text-right py-3 px-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                        ATS Score
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rankings.map((entry) => {
                      const badge = rankBadge(entry.rank);
                      const isMe = entry.user.id === (session?.user as any)?.id;
                      return (
                        <tr
                          key={entry.id}
                          className={`border-b border-white/5 hover:bg-white/3 transition-colors ${isMe ? "bg-purple-500/5 border-purple-500/20" : ""}`}
                        >
                          <td className="py-3 px-2">
                            <span className={`font-black text-base ${badge.color}`}>
                              {badge.icon}
                            </span>
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              {entry.user.avatar ? (
                                <img
                                  src={entry.user.avatar}
                                  alt=""
                                  className="h-7 w-7 rounded-full object-cover"
                                />
                              ) : (
                                <div className="h-7 w-7 rounded-full bg-slate-700 flex items-center justify-center">
                                  <User className="h-3.5 w-3.5 text-slate-400" />
                                </div>
                              )}
                              <div>
                                <p className="font-semibold text-white text-sm">
                                  {entry.user.name}
                                  {isMe && (
                                    <Badge className="ml-2 text-[10px] bg-purple-500/20 text-purple-400 border-purple-500/20 py-0">
                                      You
                                    </Badge>
                                  )}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-xs text-slate-400 hidden sm:table-cell">
                            {roleLabel(entry.jobRole)}
                          </td>
                          <td className="py-3 px-2 text-slate-400 text-xs hidden sm:table-cell">
                            {entry.college ?? "—"}
                          </td>
                          <td className="py-3 px-2 hidden md:table-cell">
                            <div className="flex flex-wrap gap-1">
                              {entry.analysis.extractedSkills.slice(0, 3).map((sk) => (
                                <Badge
                                  key={sk}
                                  className="text-[10px] bg-white/5 text-slate-400 border-white/10"
                                >
                                  {sk}
                                </Badge>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-2 text-right">
                            <span
                              className={`text-lg font-black ${scoreColor(entry.totalScore)}`}
                            >
                              {Math.round(entry.totalScore)}
                            </span>
                            <span className="text-xs text-slate-500">/100</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="flex items-center justify-between">
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
      </div>
    </div>
  );
}
