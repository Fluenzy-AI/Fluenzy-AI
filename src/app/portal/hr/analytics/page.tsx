"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PortalLayout from "@/components/PortalLayout";
import { usePortalAuth } from "@/contexts/PortalAuthContext";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Briefcase,
  Clock,
  Calendar,
  Download,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
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

const HR_NAV = [
  { label: "Dashboard", href: "/portal/hr", icon: <HomeIcon /> },
  { label: "Employees", href: "/portal/hr/employees", icon: <UsersIcon /> },
  { label: "Candidates", href: "/portal/hr/candidates", icon: <UserPlusIcon /> },
  { label: "Interviews", href: "/portal/hr/interviews", icon: <CalendarIcon /> },
  { label: "Manage Jobs", href: "/portal/hr/jobs", icon: <BriefcaseIcon /> },
  { label: "Assessments", href: "/portal/hr/assessments", icon: <ClipboardListIcon /> },
  { label: "Analytics", href: "/portal/hr/analytics", icon: <ChartIcon /> },
  { label: "Leave Management", href: "/portal/hr/leaves", icon: <ClockIcon /> },
  { label: "Attendance", href: "/portal/hr/attendance", icon: <CheckSquareIcon /> },
  { label: "Payroll", href: "/portal/hr/payroll", icon: <BanknotesIcon /> },
  { label: "Offer Letters", href: "/portal/hr/offer-letters", icon: <DocumentIcon /> },
  { label: "Job Applications", href: "/portal/hr/job-applications", icon: <ClipboardListIcon /> },
];

interface AnalyticsData {
  overview: {
    totalEmployees: number;
    activeEmployees: number;
    onLeave: number;
    terminated: number;
    totalCandidates: number;
    pendingLeaves: number;
    thisMonthHires: number;
    thisMonthJoins: number;
  };
  departmentBreakdown: { department: string; count: number }[];
  candidatesByStatus: { status: string; count: number }[];
  recentLeaves: Array<{
    id: string;
    type: string;
    status: string;
    days: number;
    employee: { name: string; department: string };
  }>;
  payroll: {
    totalNetThisMonth: number;
    processedCount: number;
  };
}

const COLORS = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];

const STATUS_LABELS: Record<string, string> = {
  APPLIED: "Applied",
  SCREENING: "Screening",
  INTERVIEW_SCHEDULED: "Interview",
  INTERVIEWED: "Interviewed",
  SELECTED: "Selected",
  OFFER_SENT: "Offer Sent",
  ONBOARDED: "Onboarded",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

export default function HRAnalyticsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = usePortalAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30d");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/portal/login");
      return;
    }
    if (user) fetchAnalytics();
  }, [user, authLoading, router, dateRange]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/portal/hr/analytics?range=${dateRange}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate mock trend data for charts (in production, this would come from API)
  const generateTrendData = () => {
    const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
    const data = [];
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
        applications: Math.floor(Math.random() * 20) + 5,
        interviews: Math.floor(Math.random() * 10) + 2,
        hires: Math.floor(Math.random() * 5),
      });
    }
    return data;
  };

  const trendData = generateTrendData();

  // Funnel data from candidates by status
  const getFunnelData = () => {
    if (!analytics?.candidatesByStatus) return [];
    const statusOrder = [
      "APPLIED",
      "SCREENING",
      "INTERVIEW_SCHEDULED",
      "INTERVIEWED",
      "SELECTED",
      "OFFER_SENT",
      "ONBOARDED",
    ];
    return statusOrder
      .map((status) => {
        const found = analytics.candidatesByStatus.find((c) => c.status === status);
        return {
          status: STATUS_LABELS[status] || status,
          count: found?.count || 0,
        };
      })
      .filter((d) => d.count > 0);
  };

  if (authLoading || isLoading) {
    return (
      <PortalLayout navItems={HR_NAV} title="Analytics" roleLabel="HR Portal" roleColor="text-emerald-400">
        <AnalyticsSkeleton />
      </PortalLayout>
    );
  }

  const o = analytics?.overview;

  return (
    <PortalLayout navItems={HR_NAV} title="Analytics" roleLabel="HR Portal" roleColor="text-emerald-400">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">HR Analytics</h1>
            <p className="text-slate-400 mt-1">Track hiring metrics and team performance</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40 bg-slate-900 border-white/5 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800">
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 3 months</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="border-white/5">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Total Employees"
            value={o?.totalEmployees || 0}
            change={`+${o?.thisMonthHires || 0} this month`}
            trend="up"
            color="blue"
          />
          <MetricCard
            label="Active Candidates"
            value={o?.totalCandidates || 0}
            change="In pipeline"
            trend="neutral"
            color="purple"
          />
          <MetricCard
            label="Pending Leaves"
            value={o?.pendingLeaves || 0}
            change="Awaiting approval"
            trend="neutral"
            color="amber"
          />
          <MetricCard
            label="Onboarded This Month"
            value={o?.thisMonthJoins || 0}
            change="New hires"
            trend="up"
            color="green"
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hiring Trend */}
          <div className="bg-slate-900 border border-white/5 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Hiring Trend</h3>
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
                <XAxis
                  dataKey="date"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
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
          </div>

          {/* Candidate Funnel */}
          <div className="bg-slate-900 border border-white/5 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Candidate Funnel</h3>
            {getFunnelData().length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={getFunnelData()} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" fontSize={12} />
                  <YAxis
                    type="category"
                    dataKey="status"
                    stroke="#64748b"
                    fontSize={12}
                    width={100}
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
              <div className="h-64 flex items-center justify-center text-slate-500">
                No candidate data yet
              </div>
            )}
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Department Distribution */}
          <div className="bg-slate-900 border border-white/5 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Department Distribution</h3>
            {analytics?.departmentBreakdown && analytics.departmentBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={analytics.departmentBreakdown}
                    dataKey="count"
                    nameKey="department"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ department, percent }) =>
                      `${department} ${(percent * 100).toFixed(0)}%`
                    }
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
              <div className="h-52 flex items-center justify-center text-slate-500">
                No department data yet
              </div>
            )}
          </div>

          {/* Interviews by Status */}
          <div className="bg-slate-900 border border-white/5 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Interview Metrics</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData.slice(-14)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="interviews"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  dot={false}
                  name="Interviews"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Payroll Summary */}
          <div className="bg-slate-900 border border-white/5 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Payroll This Month</h3>
            <div className="space-y-6">
              <div>
                <p className="text-3xl font-bold text-white">
                  ₹{(analytics?.payroll?.totalNetThisMonth || 0).toLocaleString("en-IN")}
                </p>
                <p className="text-slate-400 text-sm mt-1">Total Net Payroll</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-slate-800 rounded-lg p-4">
                  <p className="text-2xl font-bold text-white">
                    {analytics?.payroll?.processedCount || 0}
                  </p>
                  <p className="text-slate-400 text-xs">Records Processed</p>
                </div>
                <div className="flex-1 bg-slate-800 rounded-lg p-4">
                  <p className="text-2xl font-bold text-white">{o?.activeEmployees || 0}</p>
                  <p className="text-slate-400 text-xs">Active Employees</p>
                </div>
              </div>
              <div className="pt-4 border-t border-white/5">
                <p className="text-slate-400 text-sm">
                  <span className="text-emerald-400">{o?.onLeave || 0}</span> employees currently on
                  leave
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Table */}
        <div className="bg-slate-900 border border-white/5 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Candidate Status Breakdown</h3>
          {analytics?.candidatesByStatus && analytics.candidatesByStatus.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {analytics.candidatesByStatus.map((item, i) => (
                <div key={item.status} className="bg-slate-800 rounded-lg p-4">
                  <div
                    className="w-2 h-2 rounded-full mb-2"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                  <p className="text-2xl font-bold text-white">{item.count}</p>
                  <p className="text-slate-400 text-xs">
                    {STATUS_LABELS[item.status] || item.status}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-8">No candidate data available</p>
          )}
        </div>
      </div>
    </PortalLayout>
  );
}

// Metric Card Component
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
    <div className="bg-slate-900 border border-white/5 rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm">{label}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
          <p
            className={`text-xs mt-2 flex items-center gap-1 ${
              trend === "up"
                ? "text-emerald-400"
                : trend === "down"
                ? "text-red-400"
                : "text-slate-400"
            }`}
          >
            {trend === "up" && <TrendingUp className="w-3 h-3" />}
            {trend === "down" && <TrendingDown className="w-3 h-3" />}
            {change}
          </p>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <Users className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

// Skeleton loader
function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between">
        <div className="h-8 bg-white/5 rounded-lg w-48" />
        <div className="flex gap-3">
          <div className="h-10 bg-white/5 rounded-lg w-40" />
          <div className="h-10 bg-white/5 rounded-lg w-28" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-white/5 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="h-80 bg-white/5 rounded-xl" />
        <div className="h-80 bg-white/5 rounded-xl" />
      </div>
      <div className="grid grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-64 bg-white/5 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// Icon components
function HomeIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}
function UserPlusIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
      />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}
function BriefcaseIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}
function ClipboardListIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 12h6m-6 4h6"
      />
    </svg>
  );
}
function ChartIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
function CheckSquareIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
      />
    </svg>
  );
}
function BanknotesIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  );
}
function DocumentIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}
