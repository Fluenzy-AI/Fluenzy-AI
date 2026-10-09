"use client";

import { useEffect, useState } from "react";
import { useCompanyAuth } from "@/contexts/CompanyAuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Users,
  Plus,
  Clock,
  CheckCircle,
  TrendingUp,
  Brain,
  FileText,
  ScanFace,
  UserPlus,
  Mail,
  BarChart3,
  Calendar,
} from "lucide-react";

interface DashboardStats {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  pendingApplications: number;
  shortlistedApplications: number;
  hiredApplications: number;
  rejectedApplications: number;
  viewsThisMonth: number;
  applicationsThisMonth: number;
}

interface DepartmentBreakdown {
  department: string;
  count: number;
}

interface RecentApplication {
  id: string;
  name: string;
  email: string;
  jobTitle: string;
  status: string;
  createdAt: string;
  isAutoApplied: boolean;
}

export default function CompanyPortalDashboard() {
  const { user, company, loading } = useCompanyAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentApplications, setRecentApplications] = useState<RecentApplication[]>([]);
  const [departmentBreakdown, setDepartmentBreakdown] = useState<DepartmentBreakdown[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/company/login");
      return;
    }
    if (user) fetchDashboardData();
  }, [user, loading, router]);

  async function fetchDashboardData() {
    try {
      const res = await fetch("/api/company/dashboard", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setRecentApplications(data.recentApplications || []);
        setDepartmentBreakdown(data.departmentBreakdown || []);
      }
    } catch {
      // Silent fail
    } finally {
      setLoadingData(false);
    }
  }

  if (loading || loadingData) {
    return <DashboardSkeleton />;
  }

  const statCards = [
    {
      label: "Total Applications",
      value: stats?.totalApplications ?? 0,
      icon: <Users className="w-4 h-4" />,
      color: "bg-blue-500/10 text-blue-400",
      change: `+${stats?.applicationsThisMonth ?? 0} this month`,
      href: "/company/portal/applications",
    },
    {
      label: "Active Jobs",
      value: stats?.activeJobs ?? 0,
      icon: <Briefcase className="w-4 h-4" />,
      color: "bg-green-500/10 text-green-400",
      href: "/company/portal/jobs",
    },
    {
      label: "Pending Review",
      value: stats?.pendingApplications ?? 0,
      icon: <Clock className="w-4 h-4" />,
      color: "bg-yellow-500/10 text-yellow-400",
      change: stats?.pendingApplications ? "needs attention" : undefined,
      href: "/company/portal/applications?status=PENDING",
    },
    {
      label: "Total Jobs",
      value: stats?.totalJobs ?? 0,
      icon: <FileText className="w-4 h-4" />,
      color: "bg-red-500/10 text-red-400",
      href: "/company/portal/jobs",
    },
    {
      label: "Shortlisted Candidates",
      value: stats?.shortlistedApplications ?? 0,
      icon: <UserPlus className="w-4 h-4" />,
      color: "bg-purple-500/10 text-purple-400",
      href: "/company/portal/candidates",
    },
    {
      label: "Hired This Month",
      value: stats?.hiredApplications ?? 0,
      icon: <TrendingUp className="w-4 h-4" />,
      color: "bg-indigo-500/10 text-indigo-400",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h2 className="text-xl font-bold text-white">
          Welcome back, {user?.name?.split(" ")[0]}! 👋
        </h2>
        <p className="text-slate-400 text-sm mt-0.5">
          {new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* 6 Stat Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* Main Grid: Department Breakdown + Recent Applications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Breakdown */}
        <div className="lg:col-span-2 bg-slate-900 rounded-2xl border border-white/5 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Department Breakdown</h3>
            <Link href="/company/portal/jobs" className="text-xs text-indigo-400 hover:text-indigo-300 transition">
              View all →
            </Link>
          </div>
          {departmentBreakdown.length > 0 ? (
            <div className="space-y-3">
              {departmentBreakdown.slice(0, 6).map((dept) => {
                const total = stats?.totalJobs || 1;
                const pct = Math.round((dept.count / total) * 100);
                return (
                  <div key={dept.department}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-300">{dept.department}</span>
                      <span className="text-slate-400">{dept.count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">No department data yet.</p>
          )}
        </div>

        {/* Recent Applications */}
        <div className="bg-slate-900 rounded-2xl border border-white/5 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Recent Applications</h3>
            <Link href="/company/portal/applications" className="text-xs text-indigo-400 hover:text-indigo-300 transition">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {recentApplications.length > 0 ? (
              recentApplications.slice(0, 5).map((app) => (
                <div key={app.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-semibold text-xs flex-shrink-0 mt-0.5">
                    {app.name[0]?.toUpperCase() || "A"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-300 truncate">{app.name}</p>
                    <p className="text-xs text-slate-500 truncate">{app.jobTitle} · <span className={app.status === "SHORTLISTED" || app.status === "HIRED" ? "text-green-400" : app.status === "PENDING" ? "text-yellow-400" : "text-slate-400"}>{app.status}</span></p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-sm">No recent applications.</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions (matching HR Portal Quick Actions) */}
      <div className="bg-slate-900 rounded-2xl border border-white/5 p-5">
        <h3 className="font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Post New Job", href: "/company/portal/jobs/new", icon: <Briefcase className="w-5 h-5" />, color: "bg-blue-500/10 hover:bg-blue-500/20 text-blue-400" },
            { label: "Add Candidate", href: "/company/portal/candidates", icon: <UserPlus className="w-5 h-5" />, color: "bg-purple-500/10 hover:bg-purple-500/20 text-purple-400" },
            { label: "Schedule Interview", href: "/company/portal/interviews", icon: <Calendar className="w-5 h-5" />, color: "bg-green-500/10 hover:bg-green-500/20 text-green-400" },
            { label: "Send Email", href: "/company/portal/send-email", icon: <Mail className="w-5 h-5" />, color: "bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400" },
          ].map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border border-white/5 text-sm font-medium transition-all cursor-pointer ${action.color}`}
            >
              <span>{action.icon}</span>
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Recruitment Funnel Overview */}
      {stats && (
        <div className="bg-slate-900 rounded-2xl border border-white/5 p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-white">Recruitment Funnel Overview</h3>
            <Link href="/company/portal/analytics" className="text-xs text-indigo-400 hover:text-indigo-300 transition">
              Details →
            </Link>
          </div>
          <div className="flex flex-wrap gap-8">
            <div>
              <p className="text-2xl font-bold text-white">{stats.totalApplications}</p>
              <p className="text-slate-500 text-sm">Total Applications</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.shortlistedApplications}</p>
              <p className="text-slate-500 text-sm">Shortlisted Candidates</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.hiredApplications}</p>
              <p className="text-slate-500 text-sm">Total Hired</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
  change,
  href,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  change?: string;
  href?: string;
}) {
  const content = (
    <div className={`bg-slate-900 rounded-2xl border border-white/5 p-4 hover:border-white/10 transition-all ${href ? "cursor-pointer" : ""}`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-slate-400 text-xs mt-0.5">{label}</p>
      {change && <p className="text-xs text-slate-500 mt-1">{change}</p>}
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-white/5 rounded-xl w-48" />
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-24 bg-white/5 rounded-2xl" />
        ))}
      </div>
      <div className="h-64 bg-white/5 rounded-2xl" />
    </div>
  );
}
