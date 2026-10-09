"use client";

import React, { useState, useEffect } from "react";
import { useCompanyAuth } from "@/contexts/CompanyAuthContext";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Briefcase,
  Download,
  BarChart3,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface AnalyticsData {
  overview?: {
    totalApplications?: number;
    activeJobs?: number;
    shortlistedApplications?: number;
    hiredApplications?: number;
  };
  departmentBreakdown?: { department: string; count: number }[];
  candidatesByStatus?: { status: string; count: number }[];
  trendData?: { date: string; applications: number; hires: number }[];
}

const COLORS = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];

const STATUS_LABELS: Record<string, string> = {
  APPLIED: "Applied",
  PENDING: "Pending Review",
  SCREENING: "Screening",
  INTERVIEW_SCHEDULED: "Interview Scheduled",
  INTERVIEWED: "Interviewed",
  SELECTED: "Selected",
  SHORTLISTED: "Shortlisted",
  OFFER_SENT: "Offer Sent",
  ONBOARDED: "Onboarded",
  HIRED: "Hired",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

export default function CompanyAnalyticsPage() {
  const { user } = useCompanyAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) fetchAnalytics();
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/company/analytics`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error("Failed to fetch real analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <AnalyticsSkeleton />;
  }

  const o = analytics?.overview;
  const trendData = analytics?.trendData || [];
  const funnelData = (analytics?.candidatesByStatus || []).map((c) => ({
    status: STATUS_LABELS[c.status] || c.status,
    count: c.count,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Recruitment Analytics</h1>
          <p className="text-slate-400 text-sm mt-1">Real-time database pipeline metrics and hiring trends</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-slate-300 font-medium transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Applications"
          value={o?.totalApplications || 0}
          change="Real total in DB"
          trend="up"
          color="blue"
        />
        <MetricCard
          label="Active Jobs"
          value={o?.activeJobs || 0}
          change="Open requisitions"
          trend="neutral"
          color="purple"
        />
        <MetricCard
          label="Shortlisted"
          value={o?.shortlistedApplications || 0}
          change="Qualified pool"
          trend="neutral"
          color="amber"
        />
        <MetricCard
          label="Hired Candidates"
          value={o?.hiredApplications || 0}
          change="Completed hires"
          trend="up"
          color="green"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Application Trend */}
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Application & Hiring Activity</h3>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorApplications" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorHires" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#f8fafc" }}
                />
                <Area
                  type="monotone"
                  dataKey="applications"
                  stroke="#8b5cf6"
                  fill="url(#colorApplications)"
                  strokeWidth={2}
                  name="Applications"
                />
                <Area
                  type="monotone"
                  dataKey="hires"
                  stroke="#10b981"
                  fill="url(#colorHires)"
                  strokeWidth={2}
                  name="Hires"
                />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500">
              <BarChart3 className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm">No historical application data recorded yet.</p>
            </div>
          )}
        </div>

        {/* Candidate Pipeline Funnel */}
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Candidate Pipeline Breakdown</h3>
          {funnelData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={funnelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={12} />
                <YAxis
                  type="category"
                  dataKey="status"
                  stroke="#64748b"
                  fontSize={12}
                  width={110}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#f8fafc" }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Candidates" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500">
              <BarChart3 className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm">No candidate stage data recorded yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Department Job Distribution</h3>
        {analytics?.departmentBreakdown && analytics.departmentBreakdown.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={analytics.departmentBreakdown}
                dataKey="count"
                nameKey="department"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ department, percent }) => `${department} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {analytics.departmentBreakdown.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#f8fafc" }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-52 flex flex-col items-center justify-center text-slate-500">
            <BarChart3 className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">No active department postings found.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  change,
  trend,
  color,
}: {
  label: string;
  value: number;
  change: string;
  trend: "up" | "down" | "neutral";
  color: "blue" | "purple" | "amber" | "green";
}) {
  const colorClasses = {
    blue: "bg-blue-500/10 text-blue-400",
    purple: "bg-purple-500/10 text-purple-400",
    amber: "bg-amber-500/10 text-amber-400",
    green: "bg-emerald-500/10 text-emerald-400",
  };

  return (
    <div className="bg-slate-900 border border-white/5 rounded-2xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm">{label}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
          <p
            className={`text-xs mt-2 flex items-center gap-1 ${
              trend === "up" ? "text-emerald-400" : trend === "down" ? "text-red-400" : "text-slate-400"
            }`}
          >
            {trend === "up" && <TrendingUp className="w-3 h-3" />}
            {trend === "down" && <TrendingDown className="w-3 h-3" />}
            {change}
          </p>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
          <Users className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between">
        <div className="h-8 bg-white/5 rounded-xl w-48" />
        <div className="h-10 bg-white/5 rounded-xl w-32" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-white/5 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="h-80 bg-white/5 rounded-2xl" />
        <div className="h-80 bg-white/5 rounded-2xl" />
      </div>
    </div>
  );
}
