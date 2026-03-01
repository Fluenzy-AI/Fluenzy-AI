"use client";
import { useCallback, useEffect, useState } from "react";
import { useCollegeAdmin } from "@/contexts/CollegeAdminContext";
import CollegeProtectedLayout from "../components/CollegeProtectedLayout";
import { BarChart2, Download, TrendingUp, Users, Activity, Clock, RefreshCw } from "lucide-react";

interface AnalyticsData {
  overview: {
    totalStudents: number;
    activeStudents: number;
    onboardedStudents: number;
    totalSessions: number;
    totalTimeSpentMinutes: number;
    avgScore: number | null;
    inactiveCount: number;
  };
  moduleBreakdown: Record<string, number>;
  departmentBreakdown: Record<string, number>;
  sessionCountByDate: Record<string, number>;
}

const MODULE_LABELS: Record<string, string> = {
  english: "English Coach", hr: "HR Interview", technical: "Technical",
  company: "Company Prep", mock: "Mock Interview", gd: "Group Discussion",
  gdCoach: "GD Coach", daily: "Daily Practice", interviewGuide: "Interview Guide",
};

const MODULE_COLORS = [
  "from-indigo-500 to-indigo-600", "from-purple-500 to-purple-600",
  "from-blue-500 to-blue-600", "from-cyan-500 to-cyan-600",
  "from-green-500 to-green-600", "from-teal-500 to-teal-600",
  "from-amber-500 to-amber-600", "from-orange-500 to-orange-600",
  "from-pink-500 to-pink-600",
];

export default function CollegeAnalyticsPage() {
  const { token, admin } = useCollegeAdmin();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const fetchAnalytics = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    try {
      const res = await fetch(`/api/college/analytics?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setAnalytics(await res.json());
    } finally {
      setLoading(false);
    }
  }, [token, from, to]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const handleExport = () => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    window.open(`/api/college/export-report?${params}`, "_blank");
  };

  const sortedDates = analytics
    ? Object.entries(analytics.sessionCountByDate).sort(([a], [b]) => a.localeCompare(b)).slice(-30)
    : [];
  const maxSessions = sortedDates.reduce((m, [, v]) => Math.max(m, v), 1);

  return (
    <CollegeProtectedLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-6 h-6 text-indigo-400" /> Analytics
            </h1>
            <p className="text-slate-400 text-sm mt-1">{admin?.collegeName} — performance overview</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
              className="bg-slate-800/60 border border-slate-600/60 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500" />
            <span className="text-slate-500 text-sm">to</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
              className="bg-slate-800/60 border border-slate-600/60 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500" />
            <button onClick={fetchAnalytics}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600/50 text-slate-300 text-sm hover:bg-slate-700 transition-all">
              <RefreshCw className="w-4 h-4" /> Apply
            </button>
            <button onClick={handleExport}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm hover:bg-indigo-500/30 transition-all">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-slate-800/50 animate-pulse" />)}
          </div>
        ) : analytics ? (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Total Students", value: analytics.overview.totalStudents, icon: Users, color: "indigo" },
                { label: "Active Students", value: analytics.overview.activeStudents, icon: Users, color: "green" },
                { label: "Total Sessions", value: analytics.overview.totalSessions, icon: Activity, color: "purple" },
                { label: "Time Spent", value: `${Math.round(analytics.overview.totalTimeSpentMinutes / 60)}h`, icon: Clock, color: "blue" },
                { label: "Avg Score", value: analytics.overview.avgScore !== null ? `${analytics.overview.avgScore.toFixed(1)}%` : "N/A", icon: TrendingUp, color: "green" },
                { label: "Onboarded", value: analytics.overview.onboardedStudents, icon: Users, color: "indigo" },
                { label: "Inactive", value: analytics.overview.inactiveCount, icon: Users, color: "amber" },
                { label: "Sessions/Student", value: analytics.overview.totalStudents > 0 ? (analytics.overview.totalSessions / analytics.overview.totalStudents).toFixed(1) : "0", icon: Activity, color: "purple" },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className={`bg-${color}-500/10 border border-${color}-500/20 rounded-2xl p-4`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-4 h-4 text-${color}-400`} />
                    <p className={`text-xs text-${color}-300 font-medium`}>{label}</p>
                  </div>
                  <p className="text-2xl font-bold text-white">{value}</p>
                </div>
              ))}
            </div>

            {/* Session Trend */}
            {sortedDates.length > 0 && (
              <div className="bg-[#111827]/80 border border-slate-700/50 rounded-2xl p-5">
                <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-400" /> Session Activity (Last 30 Days)
                </h3>
                <div className="flex items-end gap-1 h-32">
                  {sortedDates.map(([date, count]) => (
                    <div key={date} className="flex-1 flex flex-col items-center gap-1 group relative">
                      <div
                        className="w-full bg-gradient-to-t from-indigo-500/80 to-indigo-400/60 rounded-t transition-all hover:from-indigo-400 hover:to-indigo-300"
                        style={{ height: `${(count / maxSessions) * 100}%`, minHeight: count > 0 ? "4px" : "0" }}
                      />
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-1 hidden group-hover:block z-10 bg-slate-800 border border-slate-600 rounded-lg px-2 py-1 text-xs text-slate-200 whitespace-nowrap">
                        {date}: {count} session{count !== 1 ? "s" : ""}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-slate-600 mt-1">
                  <span>{sortedDates[0]?.[0]}</span>
                  <span>{sortedDates[sortedDates.length - 1]?.[0]}</span>
                </div>
              </div>
            )}

            {/* Module + Department */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-[#111827]/80 border border-slate-700/50 rounded-2xl p-5">
                <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-indigo-400" /> Module Usage Breakdown
                </h3>
                {Object.keys(analytics.moduleBreakdown).length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-8">No session data in this period</p>
                ) : (
                  <div className="space-y-3.5">
                    {Object.entries(analytics.moduleBreakdown)
                      .sort(([, a], [, b]) => b - a)
                      .map(([mod, count], idx) => {
                        const total = Object.values(analytics.moduleBreakdown).reduce((a, b) => a + b, 0);
                        const pct = total ? Math.round((count / total) * 100) : 0;
                        return (
                          <div key={mod}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-slate-200">{MODULE_LABELS[mod] ?? mod}</span>
                              <span className="text-slate-400">{count} ({pct}%)</span>
                            </div>
                            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                              <div className={`h-full bg-gradient-to-r ${MODULE_COLORS[idx % MODULE_COLORS.length]} rounded-full transition-all`}
                                style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              <div className="bg-[#111827]/80 border border-slate-700/50 rounded-2xl p-5">
                <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" /> Department Distribution
                </h3>
                {Object.keys(analytics.departmentBreakdown).length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-8">No department data</p>
                ) : (
                  <div className="space-y-3.5">
                    {Object.entries(analytics.departmentBreakdown)
                      .sort(([, a], [, b]) => b - a)
                      .map(([dept, count], idx) => {
                        const total = analytics.overview.totalStudents;
                        const pct = total ? Math.round((count / total) * 100) : 0;
                        return (
                          <div key={dept}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-slate-200">{dept}</span>
                              <span className="text-slate-400">{count} students ({pct}%)</span>
                            </div>
                            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                              <div className={`h-full bg-gradient-to-r ${MODULE_COLORS[(idx + 4) % MODULE_COLORS.length]} rounded-full transition-all`}
                                style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-16 text-slate-500">Failed to load analytics.</div>
        )}
      </div>
    </CollegeProtectedLayout>
  );
}
