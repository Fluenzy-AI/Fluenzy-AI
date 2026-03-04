"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart2,
  Users,
  Trophy,
  Search,
  User,
  Download,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Layers,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import HeaderOffset from "@/components/HeaderOffset";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const ADMIN_ROLES = ["SUPER_ADMIN", "Admin", "COLLEGE_ADMIN"];

interface AdminAnalysis {
  id: string;
  atsScore: number;
  keywordScore: number;
  skillsScore: number;
  createdAt: string;
  user: { id: string; name: string; email: string; avatar: string | null; createdAt: string };
  resume: { fileName: string; fileType: string; uploadedAt: string } | null;
  ranking: { rank: number; college: string | null; totalScore: number } | null;
}

interface AdminStats {
  avgScore: number;
  avgKeywordScore: number;
  avgSkillsScore: number;
  maxScore: number;
  minScore: number;
  totalAnalyses: number;
}

interface CollegeBreakdown {
  college: string | null;
  _avg: { totalScore: number | null };
  _count: number;
}

interface AdminResponse {
  analyses: AdminAnalysis[];
  total: number;
  page: number;
  pages: number;
  stats: AdminStats;
  collegeBreakdown: CollegeBreakdown[];
}

export default function ATSAdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [data, setData] = useState<AdminResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [college, setCollege] = useState("");
  const [sort, setSort] = useState<"score" | "rank" | "date">("score");

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  // Redirect non-admins
  useEffect(() => {
    if (status === "authenticated") {
      const role = (session?.user as any)?.role;
      if (!ADMIN_ROLES.includes(role)) {
        router.replace("/ats");
      }
    }
  }, [status, session, router]);

  const fetchData = () => {
    if (status !== "authenticated") return;
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: "20",
      sort,
    });
    if (search) params.set("search", search);
    if (college) params.set("college", college);

    fetch(`/api/ats/admin?${params}`)
      .then((r) => {
        if (r.status === 403) { setForbidden(true); return null; }
        return r.json();
      })
      .then((d) => { if (d) setData(d); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [status, page, search, college, sort]);

  if (forbidden) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-4">
        <ShieldCheck className="h-12 w-12 text-red-400" />
        <h1 className="text-xl font-bold">Access Denied</h1>
        <p className="text-slate-400">You must be an admin to view this page.</p>
        <Link href="/ats"><Button>Go to ATS Dashboard</Button></Link>
      </div>
    );
  }

  const scoreColor = (s: number) =>
    s >= 70 ? "#34d399" : s >= 45 ? "#fbbf24" : "#f87171";

  const scoreBg = (s: number) =>
    s >= 70 ? "bg-emerald-500/10 text-emerald-400" : s >= 45 ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-400";

  const chartColors = ["#a78bfa", "#60a5fa", "#34d399", "#fbbf24", "#f472b6", "#38bdf8", "#fb923c", "#a3e635", "#e879f9", "#2dd4bf"];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <HeaderOffset />

      <div className="max-w-7xl mx-auto px-4 py-10">
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
              <ShieldCheck className="h-6 w-6 text-purple-400" />
              <h1 className="text-2xl font-black">ATS Admin Dashboard</h1>
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/20 text-xs ml-1">
                {(session?.user as any)?.role}
              </Badge>
            </div>
            <p className="text-slate-400 text-sm">
              View all student ATS scores, rankings, and resume insights
            </p>
          </div>
          <Button
            variant="outline"
            className="border-white/10 text-slate-300 hover:text-white gap-2"
            onClick={fetchData}
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>

        {/* Stats overview */}
        {data?.stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {[
              { label: "Total Analyses", value: data.stats.totalAnalyses, color: "text-purple-400", icon: Layers },
              { label: "Avg ATS Score", value: data.stats.avgScore, color: "text-blue-400", icon: BarChart2 },
              { label: "Avg Keyword Score", value: data.stats.avgKeywordScore, color: "text-emerald-400", icon: TrendingUp },
              { label: "Top Score", value: Math.round(data.stats.maxScore), color: "text-amber-400", icon: Trophy },
              { label: "Avg Skills Score", value: data.stats.avgSkillsScore, color: "text-pink-400", icon: Users },
              { label: "Colleges", value: data.collegeBreakdown.length, color: "text-cyan-400", icon: ShieldCheck },
            ].map((item) => (
              <Card key={item.label} className="bg-slate-900/80 border-white/5">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-slate-500 font-semibold">{item.label}</p>
                    <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
                  </div>
                  <p className={`text-2xl font-black ${item.color}`}>{item.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* College breakdown chart */}
        {data?.collegeBreakdown && data.collegeBreakdown.length > 0 && (
          <Card className="bg-slate-900/80 border-white/5 mb-6">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                Average ATS Score by College
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={data.collegeBreakdown.map((c) => ({
                    name: c.college ?? "Unknown",
                    score: Math.round(c._avg.totalScore ?? 0),
                    count: c._count,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#94a3b8", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: "#94a3b8", fontSize: 10 }}
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
                    formatter={(v: number) => [`${v}`, "Avg Score"]}
                  />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                    {data.collegeBreakdown.map((_, i) => (
                      <Cell key={i} fill={chartColors[i % chartColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex gap-2 flex-1 min-w-[200px]">
            <Input
              placeholder="Search by name or email…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="bg-slate-900 border-white/10 text-white placeholder:text-slate-500"
              onKeyDown={(e) => {
                if (e.key === "Enter") { setPage(1); setSearch(searchInput.trim()); }
              }}
            />
            <Button
              variant="outline"
              className="border-white/10 text-slate-300"
              onClick={() => { setPage(1); setSearch(searchInput.trim()); }}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            {(["score", "rank", "date"] as const).map((s) => (
              <Button
                key={s}
                variant={sort === s ? "default" : "outline"}
                size="sm"
                className={`capitalize ${sort === s ? "bg-purple-600" : "border-white/10 text-slate-300"}`}
                onClick={() => { setSort(s); setPage(1); }}
              >
                {s}
              </Button>
            ))}
          </div>
        </div>

        {/* Table */}
        <Card className="bg-slate-900/80 border-white/5 mb-6">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Users className="h-4 w-4" />
              All Students {data?.total ? `(${data.total})` : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !data?.analyses.length ? (
              <div className="text-center py-12 text-slate-400">
                No student analyses found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left py-3 px-2 text-xs font-bold text-slate-500 uppercase tracking-widest">Student</th>
                      <th className="text-left py-3 px-2 text-xs font-bold text-slate-500 uppercase tracking-widest hidden md:table-cell">College</th>
                      <th className="text-left py-3 px-2 text-xs font-bold text-slate-500 uppercase tracking-widest hidden sm:table-cell">Resume</th>
                      <th className="text-right py-3 px-2 text-xs font-bold text-slate-500 uppercase tracking-widest">ATS Score</th>
                      <th className="text-right py-3 px-2 text-xs font-bold text-slate-500 uppercase tracking-widest hidden sm:table-cell">Rank</th>
                      <th className="text-right py-3 px-2 text-xs font-bold text-slate-500 uppercase tracking-widest hidden md:table-cell">Date</th>
                      <th className="text-center py-3 px-2 text-xs font-bold text-slate-500 uppercase tracking-widest">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.analyses.map((entry) => (
                      <tr
                        key={entry.id}
                        className="border-b border-white/5 hover:bg-white/3 transition-colors"
                      >
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            {entry.user.avatar ? (
                              <img src={entry.user.avatar} alt="" className="h-7 w-7 rounded-full object-cover" />
                            ) : (
                              <div className="h-7 w-7 rounded-full bg-slate-700 flex items-center justify-center">
                                <User className="h-3.5 w-3.5 text-slate-400" />
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-white text-sm">{entry.user.name}</p>
                              <p className="text-xs text-slate-500">{entry.user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-xs text-slate-400 hidden md:table-cell">
                          {entry.ranking?.college ?? "—"}
                        </td>
                        <td className="py-3 px-2 hidden sm:table-cell">
                          <p className="text-xs text-slate-400 truncate max-w-[140px]">
                            {entry.resume?.fileName ?? "—"}
                          </p>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <Badge className={`text-base font-black px-3 ${scoreBg(entry.atsScore)}`}>
                            {Math.round(entry.atsScore)}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 text-right hidden sm:table-cell">
                          {entry.ranking ? (
                            <span className="text-amber-400 font-bold text-sm">
                              #{entry.ranking.rank}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="py-3 px-2 text-right text-xs text-slate-500 hidden md:table-cell">
                          {new Date(entry.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <div className="flex justify-center gap-1">
                            <Link href={`/ats/analysis?id=${entry.id}`}>
                              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white h-8 w-8 p-0">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
      </div>
    </div>
  );
}
