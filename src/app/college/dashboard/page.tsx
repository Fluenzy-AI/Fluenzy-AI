"use client";
import { useEffect, useState } from "react";
import { useCollegeAdmin } from "@/contexts/CollegeAdminContext";
import CollegeProtectedLayout from "../components/CollegeProtectedLayout";
import {
  Users, Activity, Clock, BarChart2, TrendingUp, AlertTriangle,
  UserCheck, Download, Plus, Upload, RefreshCw
} from "lucide-react";
import Link from "next/link";

interface AnalyticsData {
  overview: {
    totalStudents: number;
    activeStudents: number;
    onboardedStudents: number;
    totalSeats: number;
    usedSeats: number;
    allocatedPlan: string;
    planExpiresAt: string | null;
    totalSessions: number;
    totalTimeSpentMinutes: number;
    avgScore: number | null;
    inactiveCount: number;
  };
  moduleBreakdown: Record<string, number>;
  departmentBreakdown: Record<string, number>;
  sessionCountByDate: Record<string, number>;
}

function StatCard({
  label, value, sub, icon: Icon, color = "indigo", trend
}: {
  label: string; value: string | number; sub?: string; icon: React.ElementType; color?: string; trend?: string;
}) {
  const colors: Record<string, string> = {
    indigo: "from-indigo-500/20 to-indigo-500/5 border-indigo-500/20 [--ic:theme(colors.indigo.400)]",
    purple: "from-purple-500/20 to-purple-500/5 border-purple-500/20 [--ic:theme(colors.purple.400)]",
    green: "from-green-500/20 to-green-500/5 border-green-500/20 [--ic:theme(colors.green.400)]",
    amber: "from-amber-500/20 to-amber-500/5 border-amber-500/20 [--ic:theme(colors.amber.400)]",
    red: "from-red-500/20 to-red-500/5 border-red-500/20 [--ic:theme(colors.red.400)]",
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-5 flex items-start gap-4`}>
      <div className={`flex-shrink-0 w-11 h-11 rounded-xl bg-${color}-500/20 border border-${color}-500/30 flex items-center justify-center`}>
        <Icon className={`w-5 h-5 text-${color}-400`} />
      </div>
      <div>
        <p className="text-slate-400 text-xs font-medium mb-1">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
        {trend && <p className="text-xs text-green-400 mt-1">{trend}</p>}
      </div>
    </div>
  );
}

export default function CollegeDashboardPage() {
  const { admin, token } = useCollegeAdmin();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch("/api/college/analytics", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setAnalytics(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnalytics(); }, [token]);

  const MODULE_LABELS: Record<string, string> = {
    english: "English Coach", hr: "HR Interview", technical: "Technical",
    company: "Company Prep", mock: "Mock Interview", gd: "Group Discussion",
    gdCoach: "GD Coach", daily: "Daily Practice", interviewGuide: "Interview Guide",
  };

  return (
    <CollegeProtectedLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Welcome back, {admin?.adminName?.split(" ")[0]} 👋
            </h1>
            <p className="text-slate-400 text-sm mt-1">{admin?.collegeName} · @{admin?.domain}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={fetchAnalytics}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600/50 text-slate-300 text-sm hover:bg-slate-700 transition-all">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <Link href="/college/students/upload"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600/50 text-slate-300 text-sm hover:bg-slate-700 transition-all">
              <Upload className="w-4 h-4" /> Upload CSV
            </Link>
            <Link href="/college/students/new"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium text-sm hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/25">
              <Plus className="w-4 h-4" /> Add Student
            </Link>
          </div>
        </div>

        {/* Plan expiry warning */}
        {admin?.planExpiresAt && new Date(admin.planExpiresAt) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>Your plan expires on <strong>{new Date(admin.planExpiresAt).toLocaleDateString()}</strong>. 
              <Link href="/college/billing" className="underline ml-1">Renew now</Link>
            </span>
          </div>
        )}

        {/* Stat Cards */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-slate-800/50 animate-pulse" />
            ))}
          </div>
        ) : analytics ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Students" value={analytics.overview.totalStudents} icon={Users} color="indigo"
                sub={`${analytics.overview.usedSeats} / ${analytics.overview.totalSeats > 0 ? analytics.overview.totalSeats : "∞"} seats`} />
              <StatCard label="Active Students" value={analytics.overview.activeStudents} icon={UserCheck} color="green"
                sub={`${analytics.overview.onboardedStudents} onboarded`} />
              <StatCard label="Total Sessions" value={analytics.overview.totalSessions} icon={Activity} color="purple" />
              <StatCard label="Time Spent" value={`${Math.round(analytics.overview.totalTimeSpentMinutes / 60)}h`}
                sub={`${analytics.overview.totalTimeSpentMinutes} minutes total`} icon={Clock} color="indigo" />
              <StatCard label="Avg Score" value={analytics.overview.avgScore !== null ? `${analytics.overview.avgScore.toFixed(1)}%` : "N/A"}
                icon={TrendingUp} color="green" />
              <StatCard label="Inactive Students" value={analytics.overview.inactiveCount} icon={AlertTriangle} color="amber"
                sub="No login in 14 days" />
              <StatCard label="Current Plan" value={analytics.overview.allocatedPlan} icon={BarChart2} color="purple"
                sub={analytics.overview.planExpiresAt ? `Expires ${new Date(analytics.overview.planExpiresAt).toLocaleDateString()}` : "Active"} />
              <StatCard label="Remaining Seats"
                value={analytics.overview.totalSeats > 0 ? analytics.overview.totalSeats - analytics.overview.usedSeats : "∞"}
                icon={Users} color="indigo" />
            </div>

            {/* Department & Module Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Module Usage */}
              <div className="bg-[#111827]/80 border border-slate-700/50 rounded-2xl p-5">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-indigo-400" /> Module Usage
                </h3>
                {Object.keys(analytics.moduleBreakdown).length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-6">No session data yet</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(analytics.moduleBreakdown)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 6)
                      .map(([mod, count]) => {
                        const total = Object.values(analytics.moduleBreakdown).reduce((a, b) => a + b, 0);
                        const pct = total ? Math.round((count / total) * 100) : 0;
                        return (
                          <div key={mod}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-slate-300">{MODULE_LABELS[mod] ?? mod}</span>
                              <span className="text-slate-400">{count} sessions ({pct}%)</span>
                            </div>
                            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Department Breakdown */}
              <div className="bg-[#111827]/80 border border-slate-700/50 rounded-2xl p-5">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" /> Students by Department
                </h3>
                {Object.keys(analytics.departmentBreakdown).length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-6">No department data yet</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(analytics.departmentBreakdown)
                      .sort(([, a], [, b]) => b - a)
                      .map(([dept, count]) => {
                        const total = analytics.overview.totalStudents;
                        const pct = total ? Math.round((count / total) * 100) : 0;
                        return (
                          <div key={dept}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-slate-300">{dept}</span>
                              <span className="text-slate-400">{count} students ({pct}%)</span>
                            </div>
                            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-[#111827]/80 border border-slate-700/50 rounded-2xl p-5">
              <h3 className="text-white font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { href: "/college/students", label: "Manage Students", icon: Users, color: "indigo" },
                  { href: "/college/students/upload", label: "Upload CSV", icon: Upload, color: "purple" },
                  { href: "/college/analytics", label: "Full Analytics", icon: BarChart2, color: "green" },
                  { href: `/api/college/export-report`, label: "Export Report", icon: Download, color: "amber" },
                ].map(({ href, label, icon: Icon, color }) => (
                  <Link key={href} href={href}
                    className={`flex items-center gap-2 p-3 rounded-xl bg-${color}-500/10 border border-${color}-500/20 text-${color}-300 text-sm font-medium hover:bg-${color}-500/20 transition-all`}>
                    <Icon className="w-4 h-4" /> {label}
                  </Link>
                ))}
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
