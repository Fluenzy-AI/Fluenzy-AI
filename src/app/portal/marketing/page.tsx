"use client";

import { useState, useEffect } from "react";
import { usePortalAuth } from "@/contexts/PortalAuthContext";
import {
  Mail,
  Send,
  Eye,
  MousePointer2,
  Users,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Zap,
  Calendar,
  BarChart3,
  ArrowRight,
  Sparkles,
  Target,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import Link from "next/link";

interface DashboardStats {
  totalCampaigns: number;
  activeCampaigns: number;
  emailsSent: number;
  totalUsers: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  unsubscribeRate: number;
  recentCampaigns: Array<{
    id: string;
    name: string;
    status: string;
    sentAt: string;
    openRate: number;
    clickRate: number;
  }>;
  dailyStats: Array<{
    date: string;
    sent: number;
    opened: number;
    clicked: number;
  }>;
  topSegments: Array<{
    name: string;
    count: number;
  }>;
  activeTriggers: number;
}

export default function MarketingDashboardPage() {
  const { user, loading: authLoading } = usePortalAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/marketing");
        if (!res.ok) throw new Error("Failed to fetch stats");
        const data = await res.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading && user) {
      fetchStats();
    }
  }, [authLoading, user]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin" />
          <p className="text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <p className="text-red-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Fallback mock data if API returns null
  const dashboardData = stats || {
    totalCampaigns: 0,
    activeCampaigns: 0,
    emailsSent: 0,
    totalUsers: 0,
    openRate: 0,
    clickRate: 0,
    bounceRate: 0,
    unsubscribeRate: 0,
    recentCampaigns: [],
    dailyStats: [],
    topSegments: [],
    activeTriggers: 0,
  };

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Welcome back, {user?.name?.split(" ")[0] || "Marketing Admin"}! 👋
          </h1>
          <p className="text-slate-400 mt-1">
            Here&apos;s what&apos;s happening with your campaigns today.
          </p>
        </div>
        <Link
          href="/portal/marketing/campaigns"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/25"
        >
          <Mail className="h-4 w-4" />
          New Campaign
        </Link>
      </div>

      {/* Main KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Campaigns"
          value={dashboardData.totalCampaigns}
          icon={Mail}
          color="purple"
          trend={dashboardData.activeCampaigns > 0 ? `${dashboardData.activeCampaigns} active` : undefined}
        />
        <KPICard
          title="Emails Sent"
          value={formatNumber(dashboardData.emailsSent)}
          icon={Send}
          color="blue"
          subtitle="All time"
        />
        <KPICard
          title="Open Rate"
          value={`${dashboardData.openRate.toFixed(1)}%`}
          icon={Eye}
          color="green"
          trend={dashboardData.openRate > 20 ? "+Good" : dashboardData.openRate > 0 ? "Needs work" : undefined}
          trendUp={dashboardData.openRate > 20}
        />
        <KPICard
          title="Click Rate"
          value={`${dashboardData.clickRate.toFixed(1)}%`}
          icon={MousePointer2}
          color="amber"
          trend={dashboardData.clickRate > 3 ? "+Good" : dashboardData.clickRate > 0 ? "Needs work" : undefined}
          trendUp={dashboardData.clickRate > 3}
        />
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Total Users"
          value={formatNumber(dashboardData.totalUsers)}
          icon={Users}
        />
        <MetricCard
          label="Active Triggers"
          value={dashboardData.activeTriggers}
          icon={Zap}
        />
        <MetricCard
          label="Bounce Rate"
          value={`${dashboardData.bounceRate.toFixed(2)}%`}
          icon={XCircle}
          variant={dashboardData.bounceRate > 5 ? "danger" : "default"}
        />
        <MetricCard
          label="Unsubscribe Rate"
          value={`${dashboardData.unsubscribeRate.toFixed(2)}%`}
          icon={AlertCircle}
          variant={dashboardData.unsubscribeRate > 1 ? "warning" : "default"}
        />
      </div>

      {/* Charts and tables section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent campaigns */}
        <div className="lg:col-span-2 rounded-2xl border border-white/5 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-400" />
              Recent Campaigns
            </h2>
            <Link
              href="/portal/marketing/campaigns"
              className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="p-4">
            {dashboardData.recentCampaigns.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.recentCampaigns.slice(0, 5).map((campaign) => (
                  <div
                    key={campaign.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/[0.07] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        campaign.status === "SENT" ? "bg-green-500/20" :
                        campaign.status === "SCHEDULED" ? "bg-blue-500/20" :
                        "bg-slate-500/20"
                      }`}>
                        {campaign.status === "SENT" ? (
                          <CheckCircle2 className="h-5 w-5 text-green-400" />
                        ) : campaign.status === "SCHEDULED" ? (
                          <Clock className="h-5 w-5 text-blue-400" />
                        ) : (
                          <Mail className="h-5 w-5 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{campaign.name}</p>
                        <p className="text-xs text-slate-400">
                          {campaign.sentAt ? new Date(campaign.sentAt).toLocaleDateString() : "Not sent yet"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="text-green-400 font-medium">{campaign.openRate.toFixed(1)}%</p>
                        <p className="text-xs text-slate-500">Opens</p>
                      </div>
                      <div className="text-center">
                        <p className="text-amber-400 font-medium">{campaign.clickRate.toFixed(1)}%</p>
                        <p className="text-xs text-slate-500">Clicks</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Mail}
                title="No campaigns yet"
                description="Create your first campaign to start engaging users"
                actionLabel="Create Campaign"
                actionHref="/portal/marketing/campaigns"
              />
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="rounded-2xl border border-white/5 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-400" />
              Quick Actions
            </h2>
          </div>
          <div className="p-4 space-y-3">
            <QuickActionCard
              title="Create Campaign"
              description="Send emails to your users"
              icon={Mail}
              href="/portal/marketing/campaigns"
              color="purple"
            />
            <QuickActionCard
              title="View Segments"
              description="Target specific user groups"
              icon={Target}
              href="/portal/marketing/segments"
              color="blue"
            />
            <QuickActionCard
              title="Setup Automation"
              description="Create triggered emails"
              icon={Zap}
              href="/portal/marketing/automation"
              color="amber"
            />
            <QuickActionCard
              title="AI Generator"
              description="Generate email content with AI"
              icon={Sparkles}
              href="/portal/marketing/ai-generator"
              color="pink"
            />
            <QuickActionCard
              title="View Analytics"
              description="Track campaign performance"
              icon={BarChart3}
              href="/portal/marketing/analytics"
              color="green"
            />
          </div>
        </div>
      </div>

      {/* Top segments */}
      {dashboardData.topSegments.length > 0 && (
        <div className="rounded-2xl border border-white/5 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-400" />
              Top Segments
            </h2>
            <Link
              href="/portal/marketing/segments"
              className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {dashboardData.topSegments.map((segment) => (
              <div
                key={segment.name}
                className="rounded-xl bg-white/5 p-4 text-center hover:bg-white/[0.07] transition-colors"
              >
                <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-3">
                  <Users className="h-6 w-6 text-purple-400" />
                </div>
                <p className="text-2xl font-bold text-white">{formatNumber(segment.count)}</p>
                <p className="text-xs text-slate-400 mt-1">{segment.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper components
function KPICard({
  title,
  value,
  icon: Icon,
  color,
  trend,
  trendUp,
  subtitle,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: "purple" | "blue" | "green" | "amber" | "pink";
  trend?: string;
  trendUp?: boolean;
  subtitle?: string;
}) {
  const colorClasses = {
    purple: "from-purple-500 to-purple-600 shadow-purple-500/25",
    blue: "from-blue-500 to-blue-600 shadow-blue-500/25",
    green: "from-green-500 to-green-600 shadow-green-500/25",
    amber: "from-amber-500 to-amber-600 shadow-amber-500/25",
    pink: "from-pink-500 to-pink-600 shadow-pink-500/25",
  };

  const iconBgClasses = {
    purple: "bg-purple-500/20 text-purple-400",
    blue: "bg-blue-500/20 text-blue-400",
    green: "bg-green-500/20 text-green-400",
    amber: "bg-amber-500/20 text-amber-400",
    pink: "bg-pink-500/20 text-pink-400",
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-slate-900/50 backdrop-blur-sm p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs ${trendUp ? "text-green-400" : "text-amber-400"}`}>
              {trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {trend}
            </div>
          )}
        </div>
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${iconBgClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      {/* Gradient accent */}
      <div className={`absolute -bottom-px left-0 right-0 h-1 bg-gradient-to-r ${colorClasses[color]}`} />
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  variant = "default",
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  variant?: "default" | "danger" | "warning";
}) {
  const variantClasses = {
    default: "text-slate-400",
    danger: "text-red-400",
    warning: "text-amber-400",
  };

  return (
    <div className="rounded-xl border border-white/5 bg-slate-900/50 p-4 flex items-center gap-3">
      <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center">
        <Icon className={`h-5 w-5 ${variantClasses[variant]}`} />
      </div>
      <div>
        <p className="text-lg font-semibold text-white">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function QuickActionCard({
  title,
  description,
  icon: Icon,
  href,
  color,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  color: "purple" | "blue" | "green" | "amber" | "pink";
}) {
  const colorClasses = {
    purple: "bg-purple-500/20 text-purple-400 group-hover:bg-purple-500/30",
    blue: "bg-blue-500/20 text-blue-400 group-hover:bg-blue-500/30",
    green: "bg-green-500/20 text-green-400 group-hover:bg-green-500/30",
    amber: "bg-amber-500/20 text-amber-400 group-hover:bg-amber-500/30",
    pink: "bg-pink-500/20 text-pink-400 group-hover:bg-pink-500/30",
  };

  return (
    <Link
      href={href}
      className="group flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/[0.07] transition-colors"
    >
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center transition-colors ${colorClasses[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-white">{title}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
    </Link>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="h-16 w-16 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-purple-400" />
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="text-sm text-slate-400 mt-1 mb-4 max-w-sm">{description}</p>
      <Link
        href={actionHref}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500 text-white text-sm font-medium hover:bg-purple-600 transition-colors"
      >
        {actionLabel}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}
