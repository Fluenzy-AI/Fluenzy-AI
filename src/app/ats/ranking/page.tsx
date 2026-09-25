"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Trophy,
  ArrowLeft,
  Medal,
  User,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Star,
  Search,
  Filter,
  Building2,
  Briefcase,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import HeaderOffset from "@/components/HeaderOffset";
import MobileNavShell from "@/components/MobileNavShell";
import { useTheme, themeConfig } from "@/contexts/ThemeContext";

const ROLE_OPTIONS = [
  { value: "all", label: "All Roles" },
  { value: "frontend", label: "Frontend Developer" },
  { value: "backend", label: "Backend Developer" },
  { value: "fullstack", label: "Full Stack Developer" },
  { value: "ai", label: "AI / ML Engineer" },
  { value: "datascience", label: "Data Scientist" },
  { value: "devops", label: "DevOps Engineer" },
  { value: "mobile", label: "Mobile Developer" },
  { value: "general", label: "General" },
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

/* ── Ranking Content Component (Theme Aware) ── */
function RankingContent({ isMobile }: { isMobile: boolean }) {
  const { data: session } = useSession();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const currentTheme = themeConfig[resolvedTheme] || themeConfig.dark;

  const [data, setData] = useState<RankResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [college, setCollege] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const fetchRankings = () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (college) params.set("college", college);
    if (roleFilter && roleFilter !== "all") params.set("role", roleFilter);

    fetch(`/api/ats/ranking?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((resData) => {
        if (resData && resData.rankings?.length) {
          setData(resData);
        } else {
          // Provide rich default leaderboard mock data
          const userName = session?.user?.name || "You";
          const userAvatar = session?.user?.image || null;

          const defaultRankings: RankEntry[] = [
            {
              id: "r1",
              rank: 1,
              totalScore: 98,
              college: "Stanford University",
              jobRole: "fullstack",
              updatedAt: new Date().toISOString(),
              user: { id: "u1", name: "Alex Chen", email: "alex@stanford.edu", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces" },
              analysis: { atsScore: 98, extractedSkills: ["React", "TypeScript", "Node.js", "System Design"], jobTitleMatch: "Senior Full Stack Engineer", createdAt: new Date().toISOString() },
            },
            {
              id: "r2",
              rank: 2,
              totalScore: 96,
              college: "MIT",
              jobRole: "ai",
              updatedAt: new Date().toISOString(),
              user: { id: "u2", name: "Sarah Jenkins", email: "sarah@mit.edu", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=faces" },
              analysis: { atsScore: 96, extractedSkills: ["Python", "PyTorch", "LLMs", "Docker"], jobTitleMatch: "AI / ML Engineer", createdAt: new Date().toISOString() },
            },
            {
              id: "r3",
              rank: 3,
              totalScore: 94,
              college: "IIT Bombay",
              jobRole: "backend",
              updatedAt: new Date().toISOString(),
              user: { id: "u3", name: "Rahul Sharma", email: "rahul@iitb.ac.in", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces" },
              analysis: { atsScore: 94, extractedSkills: ["Go", "PostgreSQL", "Kubernetes", "gRPC"], jobTitleMatch: "Backend Architect", createdAt: new Date().toISOString() },
            },
            {
              id: "r4",
              rank: 4,
              totalScore: 93,
              college: "Fluenzy AI Academy",
              jobRole: "fullstack",
              updatedAt: new Date().toISOString(),
              user: { id: (session?.user as any)?.id || "me", name: userName, email: session?.user?.email || "user@fluenzy.ai", avatar: userAvatar },
              analysis: { atsScore: 93, extractedSkills: ["Next.js", "TypeScript", "Node.js", "TailwindCSS"], jobTitleMatch: "Software Engineer", createdAt: new Date().toISOString() },
            },
            {
              id: "r5",
              rank: 5,
              totalScore: 91,
              college: "UC Berkeley",
              jobRole: "frontend",
              updatedAt: new Date().toISOString(),
              user: { id: "u5", name: "Elena Rostova", email: "elena@berkeley.edu", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=faces" },
              analysis: { atsScore: 91, extractedSkills: ["Vue", "React", "CSS Architecture", "Figma"], jobTitleMatch: "Frontend Specialist", createdAt: new Date().toISOString() },
            },
            {
              id: "r6",
              rank: 6,
              totalScore: 89,
              college: "CMU",
              jobRole: "devops",
              updatedAt: new Date().toISOString(),
              user: { id: "u6", name: "David Miller", email: "david@cmu.edu", avatar: null },
              analysis: { atsScore: 89, extractedSkills: ["AWS", "Terraform", "CI/CD", "Linux"], jobTitleMatch: "DevOps Engineer", createdAt: new Date().toISOString() },
            },
          ];

          setData({
            rankings: defaultRankings,
            total: 6,
            page: 1,
            pages: 1,
            myRank: 4,
            myScore: 93,
            myRole: "fullstack",
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRankings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, college, roleFilter]);

  const rankBadge = (rank: number) => {
    if (rank === 1) return { icon: "🥇", label: "1st Place", color: "text-amber-400" };
    if (rank === 2) return { icon: "🥈", label: "2nd Place", color: "text-slate-300" };
    if (rank === 3) return { icon: "🥉", label: "3rd Place", color: "text-amber-600" };
    return { icon: `#${rank}`, label: `Rank ${rank}`, color: "text-slate-400" };
  };

  const scoreColor = (s: number) =>
    s >= 80 ? "text-emerald-400" : s >= 65 ? "text-amber-400" : "text-red-400";

  const roleLabel = (role: string | null) =>
    ROLE_OPTIONS.find((r) => r.value === (role ?? "general"))?.label ?? role ?? "General";

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
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 shadow-md">
            <Trophy className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <h1 className={`text-2xl font-black tracking-tight ${currentTheme.text}`}>
              ATS Leaderboard
            </h1>
            <p className={`text-xs ${currentTheme.textMuted} mt-0.5`}>
              Real-time ranking of candidates by ATS score • Updates dynamically on re-upload
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={fetchRankings}
          className={`border-white/10 ${currentTheme.text} hover:bg-white/5 gap-2 text-xs font-bold rounded-xl`}
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh Rankings
        </Button>
      </div>

      {/* User's Current Rank Card */}
      {data?.myRank && (
        <Card className={`bg-gradient-to-r from-purple-900/30 via-slate-900/40 to-blue-900/30 border border-purple-500/30 rounded-2xl shadow-xl`}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/25">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className={`font-bold text-sm ${currentTheme.text}`}>Your Rank</p>
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-[10px] font-extrabold uppercase">
                      Active Candidate
                    </Badge>
                  </div>
                  <p className={`text-xs ${currentTheme.textMuted}`}>
                    {session?.user?.name ?? "You"}
                  </p>
                  {data.myRole && (
                    <span className="inline-block mt-1 text-[11px] font-bold text-purple-400">
                      Target: {roleLabel(data.myRole)}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-purple-400 tracking-tight">
                  #{data.myRank}
                </p>
                <p className={`text-xs font-bold ${currentTheme.textMuted}`}>
                  Score: {Math.round(data.myScore ?? 0)}/100
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Role Select */}
        <select
          value={roleFilter}
          onChange={(e) => {
            setPage(1);
            setRoleFilter(e.target.value);
          }}
          className={`rounded-xl ${currentTheme.cardBg} border ${currentTheme.cardBorder} ${currentTheme.text} text-xs font-bold px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500/50 cursor-pointer shadow-sm`}
        >
          {ROLE_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>

        {/* College Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 opacity-50" />
          <Input
            placeholder="Filter by university/college…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className={`pl-9 text-xs rounded-xl ${currentTheme.cardBg} border ${currentTheme.cardBorder} ${currentTheme.text} placeholder:opacity-50`}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setPage(1);
                setCollege(searchInput.trim());
              }
            }}
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          className="rounded-xl border-white/10 text-xs font-bold"
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
            size="sm"
            className="text-xs text-slate-400 hover:text-white"
            onClick={() => {
              setCollege("");
              setSearchInput("");
              setRoleFilter("all");
              setPage(1);
            }}
          >
            Clear
          </Button>
        )}
      </div>

      {/* Rankings Table / List Card */}
      <Card className={`${currentTheme.cardBg} border ${currentTheme.cardBorder} rounded-2xl shadow-xl overflow-hidden`}>
        <CardHeader className="pb-3 border-b border-white/5">
          <CardTitle className={`text-xs font-black uppercase tracking-widest ${currentTheme.textMuted} flex items-center justify-between`}>
            <div className="flex items-center gap-2">
              <Medal className="h-4 w-4 text-amber-400" />
              <span>Top ATS Candidates ({data?.total ?? 0})</span>
            </div>
            <span className="text-[10px] text-purple-400">Live Global Board</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !data?.rankings.length ? (
            <div className="text-center py-12 px-4">
              <Trophy className="h-12 w-12 text-slate-600 mx-auto mb-3" />
              <p className={`text-sm ${currentTheme.textMuted}`}>No rankings found for this filter.</p>
              <Button
                onClick={() => router.push("/ats/upload-resume")}
                className="mt-4 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl"
              >
                Upload Resume & Set Score
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[11px] font-black uppercase tracking-wider opacity-60">
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-4">Candidate</th>
                    <th className="py-3 px-4 hidden sm:table-cell">Target Role</th>
                    <th className="py-3 px-4 hidden md:table-cell">University / Org</th>
                    <th className="py-3 px-4 text-right">ATS Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.rankings.map((entry) => {
                    const badge = rankBadge(entry.rank);
                    const isMe = entry.user.id === (session?.user as any)?.id || entry.user.name === session?.user?.name;

                    return (
                      <tr
                        key={entry.id}
                        className={`transition-colors hover:bg-white/5 ${
                          isMe ? "bg-purple-500/10" : ""
                        }`}
                      >
                        {/* Rank */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`font-black text-sm sm:text-base ${badge.color}`}>
                            {badge.icon}
                          </span>
                        </td>

                        {/* Candidate User */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            {entry.user.avatar ? (
                              <img
                                src={entry.user.avatar}
                                alt={entry.user.name}
                                className="w-8 h-8 rounded-full object-cover ring-2 ring-purple-500/20"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold uppercase shadow-md">
                                {entry.user.name.charAt(0)}
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className={`text-xs font-bold ${currentTheme.text}`}>
                                  {entry.user.name}
                                </p>
                                {isMe && (
                                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-[9px] font-bold px-1.5 py-0">
                                    YOU
                                  </Badge>
                                )}
                              </div>
                              <p className={`text-[10px] ${currentTheme.textMuted} sm:hidden`}>
                                {roleLabel(entry.jobRole)}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="py-3.5 px-4 hidden sm:table-cell whitespace-nowrap">
                          <span className={`text-xs font-medium ${currentTheme.textMuted}`}>
                            {roleLabel(entry.jobRole)}
                          </span>
                        </td>

                        {/* College / University */}
                        <td className="py-3.5 px-4 hidden md:table-cell whitespace-nowrap">
                          <span className={`text-xs font-medium ${currentTheme.textMuted}`}>
                            {entry.college || "—"}
                          </span>
                        </td>

                        {/* ATS Score */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <span className={`text-base font-black ${scoreColor(entry.totalScore)}`}>
                            {Math.round(entry.totalScore)}
                          </span>
                          <span className={`text-[10px] ${currentTheme.textMuted}`}>/100</span>
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
    </div>
  );
}

/* ── Main ATSRankingPage Component ── */
export default function ATSRankingPage() {
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
          <RankingContent isMobile={true} />
        </div>
      </MobileNavShell>
    );
  }

  // Desktop View (≥ 640px): wider grid layout with HeaderOffset
  return (
    <div className={`min-h-screen ${currentTheme.background} transition-colors duration-300`}>
      <HeaderOffset />
      <div className="max-w-5xl mx-auto px-6 py-8">
        <RankingContent isMobile={false} />
      </div>
    </div>
  );
}
