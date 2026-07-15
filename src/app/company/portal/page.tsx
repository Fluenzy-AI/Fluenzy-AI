"use client";

import { useEffect, useState } from "react";
import { PortalLayout, StatCard, EmptyState, LiveIndicator } from "@/components/portal";
import { useCompanyAuth } from "@/contexts/CompanyAuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Briefcase,
  Users,
  Plus,
  Eye,
  Clock,
  CheckCircle,
  TrendingUp,
  BarChart3,
  ScanFace,
  Brain,
  Zap,
  ArrowRight,
  FileText,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

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

interface RecentJob {
  id: string;
  title: string;
  department: string;
  applicationsCount: number;
  viewCount: number;
  isActive: boolean;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "var(--portal-warning)",
  SHORTLISTED: "var(--portal-info)",
  INTERVIEWING: "var(--portal-primary)",
  INTERVIEW_SCHEDULED: "var(--portal-primary)",
  ACCEPTED: "var(--portal-success)",
  HIRED: "var(--portal-success)",
  REJECTED: "var(--portal-danger)",
};

const CHART_COLORS = ["#7C6EF6", "#60A5FA", "#34D399", "#FBBF24", "#F87171"];

export default function CompanyPortalDashboard() {
  const { user, company, loading } = useCompanyAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentApplications, setRecentApplications] = useState<RecentApplication[]>([]);
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
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
        setRecentJobs(data.recentJobs || []);
        setDepartmentBreakdown(data.departmentBreakdown || []);
      }
    } catch {
      // Silent fail
    } finally {
      setLoadingData(false);
    }
  }

  // Compute hiring funnel
  const funnelData = stats
    ? [
        { stage: "Applied", count: stats.totalApplications },
        { stage: "Shortlisted", count: stats.shortlistedApplications },
        { stage: "Hired", count: stats.hiredApplications },
      ]
    : [];

  if (loading || loadingData) {
    return (
      <PortalLayout title="Dashboard">
        <DashboardSkeleton />
      </PortalLayout>
    );
  }

  return (
    <PortalLayout title="Dashboard">
      <div className="space-y-6">
        {/* Welcome + CTA */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2
              className="text-2xl font-bold"
              style={{ color: "var(--portal-text-primary)" }}
            >
              Welcome back, {user?.name?.split(" ")[0]}!
            </h2>
            <p className="text-sm mt-1" style={{ color: "var(--portal-text-muted)" }}>
              {company?.name} •{" "}
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <Link
            href="/company/portal/jobs/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold transition-colors"
            style={{
              backgroundColor: "var(--portal-primary)",
              color: "var(--portal-primary-text)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--portal-primary-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--portal-primary)";
            }}
          >
            <Plus className="w-4 h-4" />
            Post New Job
          </Link>
        </div>

        {/* ── Hero Metrics Row ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            label="Total Applications"
            value={stats?.totalApplications}
            variant="hero"
            icon={<Users className="w-6 h-6" />}
            trend={
              stats && stats.applicationsThisMonth > 0
                ? { direction: "up", value: `${stats.applicationsThisMonth} this month` }
                : undefined
            }
            loading={!stats}
          />
          <StatCard
            label="Active Jobs"
            value={stats?.activeJobs}
            variant="hero"
            icon={<Briefcase className="w-6 h-6" />}
            loading={!stats}
          />
          <StatCard
            label="Pending Review"
            value={stats?.pendingApplications}
            variant="hero"
            icon={<Clock className="w-6 h-6" />}
            trend={
              stats && stats.pendingApplications > 0
                ? { direction: "neutral", value: "needs attention" }
                : undefined
            }
            loading={!stats}
          />
        </div>

        {/* ── Secondary Stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Total Jobs"
            value={stats?.totalJobs}
            variant="compact"
            loading={!stats}
          />
          <StatCard
            label="Shortlisted"
            value={stats?.shortlistedApplications}
            variant="compact"
            loading={!stats}
          />
          <StatCard
            label="Hired This Month"
            value={stats?.hiredApplications}
            variant="compact"
            loading={!stats}
          />
          <StatCard
            label="Job Views"
            value={stats?.viewsThisMonth}
            variant="compact"
            loading={!stats}
          />
        </div>

        {/* ── Main Grid: Department + Funnel + Applications ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Department Breakdown Chart */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="lg:col-span-1 rounded-lg border p-5"
            style={{
              backgroundColor: "var(--portal-bg-elevated)",
              borderColor: "var(--portal-border)",
            }}
          >
            <h3
              className="text-sm font-semibold mb-4 flex items-center gap-2"
              style={{ color: "var(--portal-text-primary)" }}
            >
              <BarChart3 className="w-4 h-4" style={{ color: "var(--portal-primary)" }} />
              Department Breakdown
            </h3>
            {departmentBreakdown.length > 0 ? (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={departmentBreakdown.slice(0, 5)}
                    layout="vertical"
                    margin={{ left: 0, right: 8, top: 0, bottom: 0 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="department"
                      type="category"
                      width={80}
                      tick={{
                        fontSize: 11,
                        fill: "var(--portal-text-secondary)",
                      }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--portal-bg-elevated)",
                        border: "1px solid var(--portal-border)",
                        borderRadius: "6px",
                        color: "var(--portal-text-primary)",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={16}>
                      {departmentBreakdown.slice(0, 5).map((_, idx) => (
                        <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <BarChart3 className="w-8 h-8 mb-2" style={{ color: "var(--portal-text-muted)" }} />
                <p className="text-xs" style={{ color: "var(--portal-text-muted)" }}>
                  Post jobs to see department breakdown
                </p>
              </div>
            )}
          </motion.div>

          {/* Hiring Funnel */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1 rounded-lg border p-5"
            style={{
              backgroundColor: "var(--portal-bg-elevated)",
              borderColor: "var(--portal-border)",
            }}
          >
            <h3
              className="text-sm font-semibold mb-4 flex items-center gap-2"
              style={{ color: "var(--portal-text-primary)" }}
            >
              <TrendingUp className="w-4 h-4" style={{ color: "var(--portal-primary)" }} />
              Hiring Funnel
            </h3>
            {stats && stats.totalApplications > 0 ? (
              <div className="space-y-4">
                {funnelData.map((item, idx) => {
                  const maxCount = Math.max(...funnelData.map((d) => d.count), 1);
                  const pct = Math.round((item.count / maxCount) * 100);
                  return (
                    <div key={item.stage}>
                      <div className="flex justify-between text-xs mb-1">
                        <span style={{ color: "var(--portal-text-secondary)" }}>
                          {item.stage}
                        </span>
                        <span
                          className="portal-mono font-semibold"
                          style={{ color: "var(--portal-text-primary)" }}
                        >
                          {item.count}
                        </span>
                      </div>
                      <div
                        className="w-full h-2 rounded-full overflow-hidden"
                        style={{ backgroundColor: "var(--portal-surface)" }}
                      >
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, delay: 0.3 + idx * 0.1 }}
                          className="h-full rounded-full"
                          style={{
                            backgroundColor: CHART_COLORS[idx % CHART_COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <TrendingUp className="w-8 h-8 mb-2" style={{ color: "var(--portal-text-muted)" }} />
                <p className="text-xs" style={{ color: "var(--portal-text-muted)" }}>
                  Funnel data appears as candidates apply
                </p>
              </div>
            )}
          </motion.div>

          {/* Recent Applications */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="lg:col-span-1 rounded-lg border p-5"
            style={{
              backgroundColor: "var(--portal-bg-elevated)",
              borderColor: "var(--portal-border)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-sm font-semibold"
                style={{ color: "var(--portal-text-primary)" }}
              >
                Recent Applications
              </h3>
              <Link
                href="/company/portal/applications"
                className="text-xs font-medium transition-colors"
                style={{ color: "var(--portal-primary)" }}
              >
                View all
              </Link>
            </div>
            {recentApplications.length > 0 ? (
              <div className="space-y-2.5">
                {recentApplications.slice(0, 5).map((app) => (
                  <Link
                    key={app.id}
                    href="/company/portal/applications"
                    className="flex items-center gap-3 p-2.5 rounded-md transition-colors"
                    style={{ backgroundColor: "transparent" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "var(--portal-surface)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0"
                      style={{ backgroundColor: "var(--portal-primary)" }}
                    >
                      {app.name[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium truncate"
                        style={{ color: "var(--portal-text-primary)" }}
                      >
                        {app.name}
                      </p>
                      <p
                        className="text-xs truncate"
                        style={{ color: "var(--portal-text-muted)" }}
                      >
                        {app.jobTitle}
                      </p>
                    </div>
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor:
                          STATUS_COLORS[app.status]
                            ? `color-mix(in srgb, ${STATUS_COLORS[app.status]} 12%, transparent)`
                            : "var(--portal-disabled-bg)",
                        color: STATUS_COLORS[app.status] || "var(--portal-text-muted)",
                      }}
                    >
                      {app.status.replace(/_/g, " ")}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Users className="w-8 h-8 mb-2" style={{ color: "var(--portal-text-muted)" }} />
                <p className="text-xs" style={{ color: "var(--portal-text-muted)" }}>
                  No applications yet
                </p>
              </div>
            )}
          </motion.div>
        </div>

        {/* ── Bottom Grid: AI Insights + Recent Jobs ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* HireLens AI Insights */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Link
              href="/company/portal/hirelens"
              className="block rounded-lg border p-5 transition-shadow hover:shadow-[var(--portal-shadow-hover)] group"
              style={{
                backgroundColor: "var(--portal-bg-elevated)",
                borderColor: "var(--portal-border)",
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: "var(--portal-live-muted)",
                  }}
                >
                  <Brain className="w-5 h-5" style={{ color: "var(--portal-live)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p
                      className="text-sm font-semibold"
                      style={{ color: "var(--portal-text-primary)" }}
                    >
                      HireLens AI
                    </p>
                    <LiveIndicator label="Live" size="sm" />
                  </div>
                  <p
                    className="text-xs"
                    style={{ color: "var(--portal-text-muted)" }}
                  >
                    AI-powered interview intelligence. Real-time behavioral scoring, transcripts & insights.
                  </p>
                </div>
                <ArrowRight
                  className="w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: "var(--portal-primary)" }}
                />
              </div>
            </Link>

            {/* Quick Actions */}
            <div
              className="rounded-lg border p-5 mt-4"
              style={{
                backgroundColor: "var(--portal-bg-elevated)",
                borderColor: "var(--portal-border)",
              }}
            >
              <h3
                className="text-sm font-semibold mb-3"
                style={{ color: "var(--portal-text-primary)" }}
              >
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Post Job", href: "/company/portal/jobs/new", icon: Plus },
                  { label: "Applications", href: "/company/portal/applications", icon: Users },
                  { label: "Assessment", href: "/company/portal/assessments/new", icon: FileText },
                  { label: "HireLens", href: "/company/portal/hirelens", icon: ScanFace },
                ].map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.href}
                      href={action.href}
                      className="flex items-center gap-2.5 p-2.5 rounded-md text-sm transition-colors"
                      style={{ color: "var(--portal-text-secondary)" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "var(--portal-surface)";
                        e.currentTarget.style.color = "var(--portal-text-primary)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "";
                        e.currentTarget.style.color = "var(--portal-text-secondary)";
                      }}
                    >
                      <Icon className="w-4 h-4" style={{ color: "var(--portal-primary)" }} />
                      <span className="text-xs font-medium">{action.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Recent Jobs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="lg:col-span-2 rounded-lg border p-5"
            style={{
              backgroundColor: "var(--portal-bg-elevated)",
              borderColor: "var(--portal-border)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-sm font-semibold"
                style={{ color: "var(--portal-text-primary)" }}
              >
                Your Job Postings
              </h3>
              <Link
                href="/company/portal/jobs"
                className="text-xs font-medium transition-colors"
                style={{ color: "var(--portal-primary)" }}
              >
                Manage all
              </Link>
            </div>
            {recentJobs.length > 0 ? (
              <div className="space-y-2">
                {recentJobs.slice(0, 4).map((job) => (
                  <Link
                    key={job.id}
                    href={`/company/portal/jobs/${job.id}`}
                    className="flex items-center gap-4 p-3 rounded-md transition-colors group"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "var(--portal-surface)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "";
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: "var(--portal-primary-muted)",
                      }}
                    >
                      <Briefcase className="w-5 h-5" style={{ color: "var(--portal-primary)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium truncate"
                        style={{ color: "var(--portal-text-primary)" }}
                      >
                        {job.title}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: "var(--portal-text-muted)" }}
                      >
                        {job.department}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-xs" style={{ color: "var(--portal-text-muted)" }}>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" /> <span className="portal-mono">{job.viewCount}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> <span className="portal-mono">{job.applicationsCount}</span>
                      </span>
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: job.isActive
                            ? "var(--portal-success-muted)"
                            : "var(--portal-disabled-bg)",
                          color: job.isActive
                            ? "var(--portal-success)"
                            : "var(--portal-text-muted)",
                        }}
                      >
                        {job.isActive ? "Active" : "Closed"}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Briefcase className="w-6 h-6" />}
                title="No jobs posted yet"
                description="Create your first job posting to start receiving applications."
                action={{
                  label: "Post your first job",
                  onClick: () => router.push("/company/portal/jobs/new"),
                }}
              />
            )}
          </motion.div>
        </div>
      </div>
    </PortalLayout>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Welcome skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-64 rounded portal-skeleton" />
          <div className="h-4 w-96 rounded portal-skeleton" />
        </div>
        <div className="h-10 w-36 rounded-md portal-skeleton" />
      </div>
      {/* Hero cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-32 rounded-lg border portal-skeleton"
            style={{ borderColor: "var(--portal-border)" }}
          />
        ))}
      </div>
      {/* Secondary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-20 rounded-lg border portal-skeleton"
            style={{ borderColor: "var(--portal-border)" }}
          />
        ))}
      </div>
      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-72 rounded-lg border portal-skeleton"
            style={{ borderColor: "var(--portal-border)" }}
          />
        ))}
      </div>
    </div>
  );
}
