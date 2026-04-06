"use client";

import { useState, useEffect } from "react";
import { usePortalAuth } from "@/contexts/PortalAuthContext";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Eye,
  MousePointer2,
  Mail,
  Send,
  Users,
  AlertTriangle,
  Calendar,
  Download,
  RefreshCw,
} from "lucide-react";

interface AnalyticsData {
  overview: {
    totalCampaigns: number;
    totalEmailsSent: number;
    totalDelivered: number;
    totalOpened: number;
    totalClicked: number;
    totalBounced: number;
    totalUnsubscribed: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    bounceRate: number;
    unsubscribeRate: number;
  };
  dailyStats: Array<{
    date: string;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
  }>;
  topCampaigns: Array<{
    id: string;
    name: string;
    openRate: number;
    clickRate: number;
    sent: number;
  }>;
  periodComparison: {
    openRateChange: number;
    clickRateChange: number;
    sentChange: number;
  };
}

export default function AnalyticsPage() {
  const { user, loading: authLoading } = usePortalAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30d");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      fetchAnalytics();
    }
  }, [authLoading, user, dateRange]);

  async function fetchAnalytics() {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/marketing?range=${dateRange}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch analytics");
      const data = await res.json();
      
      // Transform API response to analytics format
      setAnalytics({
        overview: {
          totalCampaigns: data.totalCampaigns || 0,
          totalEmailsSent: data.emailsSent || 0,
          totalDelivered: Math.round((data.emailsSent || 0) * (data.metrics?.deliveryRate || 0) / 100),
          totalOpened: Math.round((data.emailsSent || 0) * (data.openRate || 0) / 100),
          totalClicked: Math.round((data.emailsSent || 0) * (data.clickRate || 0) / 100),
          totalBounced: Math.round((data.emailsSent || 0) * (data.bounceRate || 0) / 100),
          totalUnsubscribed: Math.round((data.emailsSent || 0) * (data.unsubscribeRate || 0) / 100),
          deliveryRate: data.metrics?.deliveryRate || 0,
          openRate: data.openRate || 0,
          clickRate: data.clickRate || 0,
          bounceRate: data.bounceRate || 0,
          unsubscribeRate: data.unsubscribeRate || 0,
        },
        dailyStats: data.dailyStats || [],
        topCampaigns: (data.recentCampaigns || []).slice(0, 5).map((c: any) => ({
          id: c.id,
          name: c.name,
          openRate: c.openRate || 0,
          clickRate: c.clickRate || 0,
          sent: c.totalSent || 0,
        })),
        periodComparison: {
          openRateChange: 0,
          clickRateChange: 0,
          sentChange: 0,
        },
      });
    } catch (err) {
      console.error("Error fetching analytics:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await fetchAnalytics();
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-12 w-12 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin" />
      </div>
    );
  }

  const data = analytics || {
    overview: {
      totalCampaigns: 0,
      totalEmailsSent: 0,
      totalDelivered: 0,
      totalOpened: 0,
      totalClicked: 0,
      totalBounced: 0,
      totalUnsubscribed: 0,
      deliveryRate: 0,
      openRate: 0,
      clickRate: 0,
      bounceRate: 0,
      unsubscribeRate: 0,
    },
    dailyStats: [],
    topCampaigns: [],
    periodComparison: { openRateChange: 0, clickRateChange: 0, sentChange: 0 },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-slate-400 mt-1">Track your email campaign performance</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="365d">Last year</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Emails Sent"
          value={data.overview.totalEmailsSent.toLocaleString()}
          icon={Send}
          color="purple"
          change={data.periodComparison.sentChange}
        />
        <KPICard
          title="Open Rate"
          value={`${data.overview.openRate.toFixed(1)}%`}
          icon={Eye}
          color="green"
          change={data.periodComparison.openRateChange}
          benchmark={20}
          currentValue={data.overview.openRate}
        />
        <KPICard
          title="Click Rate"
          value={`${data.overview.clickRate.toFixed(1)}%`}
          icon={MousePointer2}
          color="blue"
          change={data.periodComparison.clickRateChange}
          benchmark={3}
          currentValue={data.overview.clickRate}
        />
        <KPICard
          title="Bounce Rate"
          value={`${data.overview.bounceRate.toFixed(2)}%`}
          icon={AlertTriangle}
          color="amber"
          invertColors
          benchmark={5}
          currentValue={data.overview.bounceRate}
        />
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MetricCard
          label="Total Campaigns"
          value={data.overview.totalCampaigns}
          icon={Mail}
        />
        <MetricCard
          label="Delivered"
          value={data.overview.totalDelivered.toLocaleString()}
          icon={Send}
        />
        <MetricCard
          label="Opened"
          value={data.overview.totalOpened.toLocaleString()}
          icon={Eye}
        />
        <MetricCard
          label="Clicked"
          value={data.overview.totalClicked.toLocaleString()}
          icon={MousePointer2}
        />
        <MetricCard
          label="Unsubscribed"
          value={data.overview.totalUnsubscribed}
          icon={Users}
        />
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily stats chart */}
        <div className="lg:col-span-2 rounded-2xl border border-white/5 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-400" />
              Email Performance Over Time
            </h2>
          </div>
          <div className="p-6">
            {data.dailyStats.length > 0 ? (
              <div className="h-64">
                {/* Simple bar chart representation */}
                <div className="flex items-end justify-between h-full gap-1">
                  {data.dailyStats.slice(-14).map((day, index) => {
                    const maxSent = Math.max(...data.dailyStats.map(d => d.sent || 0), 1);
                    const height = ((day.sent || 0) / maxSent) * 100;
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full flex flex-col justify-end h-48">
                          <div
                            className="w-full bg-gradient-to-t from-purple-500 to-purple-400 rounded-t transition-all"
                            style={{ height: `${height}%` }}
                            title={`${day.sent} sent on ${new Date(day.date).toLocaleDateString()}`}
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 rotate-45 origin-left whitespace-nowrap">
                          {new Date(day.date).toLocaleDateString("en", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-slate-500">
                No data available for this period
              </div>
            )}
          </div>
        </div>

        {/* Top campaigns */}
        <div className="rounded-2xl border border-white/5 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-400" />
              Top Performing Campaigns
            </h2>
          </div>
          <div className="p-4">
            {data.topCampaigns.length > 0 ? (
              <div className="space-y-3">
                {data.topCampaigns.map((campaign, index) => (
                  <div
                    key={campaign.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/[0.07] transition-colors"
                  >
                    <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 text-sm font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{campaign.name}</p>
                      <p className="text-xs text-slate-500">{campaign.sent.toLocaleString()} sent</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-400">{campaign.openRate.toFixed(1)}%</p>
                      <p className="text-xs text-slate-500">open</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 text-slate-500 text-sm">
                No campaigns yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rate benchmarks */}
      <div className="rounded-2xl border border-white/5 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5">
          <h2 className="text-lg font-semibold text-white">Industry Benchmarks</h2>
          <p className="text-sm text-slate-400 mt-1">How you compare to industry averages</p>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
          <BenchmarkCard
            label="Delivery Rate"
            value={data.overview.deliveryRate}
            benchmark={95}
            unit="%"
            goodAbove={true}
          />
          <BenchmarkCard
            label="Open Rate"
            value={data.overview.openRate}
            benchmark={20}
            unit="%"
            goodAbove={true}
          />
          <BenchmarkCard
            label="Click Rate"
            value={data.overview.clickRate}
            benchmark={3}
            unit="%"
            goodAbove={true}
          />
          <BenchmarkCard
            label="Bounce Rate"
            value={data.overview.bounceRate}
            benchmark={2}
            unit="%"
            goodAbove={false}
          />
        </div>
      </div>
    </div>
  );
}

function KPICard({
  title,
  value,
  icon: Icon,
  color,
  change,
  benchmark,
  currentValue,
  invertColors,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  color: "purple" | "green" | "blue" | "amber";
  change?: number;
  benchmark?: number;
  currentValue?: number;
  invertColors?: boolean;
}) {
  const colorClasses = {
    purple: "bg-purple-500/20 text-purple-400",
    green: "bg-green-500/20 text-green-400",
    blue: "bg-blue-500/20 text-blue-400",
    amber: "bg-amber-500/20 text-amber-400",
  };

  const accentClasses = {
    purple: "from-purple-500 to-purple-600",
    green: "from-green-500 to-green-600",
    blue: "from-blue-500 to-blue-600",
    amber: "from-amber-500 to-amber-600",
  };

  const isGood = benchmark !== undefined && currentValue !== undefined
    ? (invertColors ? currentValue < benchmark : currentValue >= benchmark)
    : true;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-slate-900/50 backdrop-blur-sm p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
          {change !== undefined && change !== 0 && (
            <div className={`flex items-center gap-1 mt-2 text-xs ${change > 0 ? "text-green-400" : "text-red-400"}`}>
              {change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(change).toFixed(1)}% vs last period
            </div>
          )}
          {benchmark !== undefined && (
            <p className={`text-xs mt-2 ${isGood ? "text-green-400" : "text-amber-400"}`}>
              {isGood ? "✓ " : "⚠ "}
              {invertColors ? "Below" : "Above"} {benchmark}% benchmark
            </p>
          )}
        </div>
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <div className={`absolute -bottom-px left-0 right-0 h-1 bg-gradient-to-r ${accentClasses[color]}`} />
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-slate-900/50 p-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center">
          <Icon className="h-5 w-5 text-slate-400" />
        </div>
        <div>
          <p className="text-lg font-semibold text-white">{value}</p>
          <p className="text-xs text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

function BenchmarkCard({
  label,
  value,
  benchmark,
  unit,
  goodAbove,
}: {
  label: string;
  value: number;
  benchmark: number;
  unit: string;
  goodAbove: boolean;
}) {
  const isGood = goodAbove ? value >= benchmark : value <= benchmark;
  const percentage = Math.min((value / (benchmark * 1.5)) * 100, 100);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{label}</p>
        <p className={`text-sm font-medium ${isGood ? "text-green-400" : "text-amber-400"}`}>
          {value.toFixed(1)}{unit}
        </p>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isGood ? "bg-green-500" : "bg-amber-500"}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>0{unit}</span>
        <span className="text-purple-400">Benchmark: {benchmark}{unit}</span>
        <span>{Math.round(benchmark * 1.5)}{unit}</span>
      </div>
    </div>
  );
}
