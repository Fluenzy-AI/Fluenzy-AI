"use client";

import React, { useState, useEffect } from "react";
import { PortalLayout, StatCard } from "@/components/portal";
import { BarChart3, TrendingUp, Calendar, Target, Clock, UserCheck } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Cell,
} from "recharts";

const funnelData = [
  { stage: "Applied", candidates: 120, conversion: 100 },
  { stage: "Shortlisted", candidates: 45, conversion: 37 },
  { stage: "Interviewed", candidates: 18, conversion: 15 },
  { stage: "Hired", candidates: 4, conversion: 3 },
];

const timeToHireData = [
  { month: "Jan", days: 24 },
  { month: "Feb", days: 22 },
  { month: "Mar", days: 25 },
  { month: "Apr", days: 19 },
  { month: "May", days: 18 },
  { month: "Jun", days: 15 },
];

const sourceAttributionData = [
  { name: "Direct", value: 45 },
  { name: "LinkedIn", value: 35 },
  { name: "Referrals", value: 15 },
  { name: "Indeed", value: 5 },
];

const CHART_COLORS = ["#7C6EF6", "#60A5FA", "#34D399", "#FBBF24"];

export default function AnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial loading sequence to prevent flashing
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <PortalLayout title="Analytics">
        <div className="space-y-6">
          <div className="h-8 w-48 rounded portal-skeleton" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 rounded border portal-skeleton" style={{ borderColor: "var(--portal-border)" }} />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-80 rounded border portal-skeleton" style={{ borderColor: "var(--portal-border)" }} />
            <div className="h-80 rounded border portal-skeleton" style={{ borderColor: "var(--portal-border)" }} />
          </div>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout title="Analytics">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--portal-text-primary)" }}>
            Analytics Dashboard
          </h1>
          <p className="text-sm" style={{ color: "var(--portal-text-muted)" }}>
            Real-time pipeline metrics and recruiter hiring speed insights
          </p>
        </div>

        {/* Core KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Avg. Time to Hire" value="18 days" variant="compact" icon={<Clock className="w-4 h-4" />} />
          <StatCard label="Offer Acceptance Rate" value="88%" variant="compact" icon={<UserCheck className="w-4 h-4" />} />
          <StatCard label="Source Efficiency" value="LinkedIn (35%)" variant="compact" icon={<Target className="w-4 h-4" />} />
          <StatCard label="Sourcing Pipeline Cost" value="—" variant="compact" icon={<Calendar className="w-4 h-4" />} />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hiring Funnel */}
          <div
            className="rounded-lg border p-5"
            style={{
              backgroundColor: "var(--portal-bg-elevated)",
              borderColor: "var(--portal-border)",
            }}
          >
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--portal-text-primary)" }}>
              <TrendingUp className="w-4 h-4" style={{ color: "var(--portal-primary)" }} />
              Candidate Conversion Funnel
            </h3>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                  <XAxis dataKey="stage" tick={{ fontSize: 11, fill: "var(--portal-text-secondary)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--portal-text-secondary)" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--portal-bg-elevated)",
                      border: "1px solid var(--portal-border)",
                      borderRadius: "6px",
                      color: "var(--portal-text-primary)",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="candidates" radius={[4, 4, 0, 0]} barSize={28}>
                    {funnelData.map((_, idx) => (
                      <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sourcing Attribution */}
          <div
            className="rounded-lg border p-5"
            style={{
              backgroundColor: "var(--portal-bg-elevated)",
              borderColor: "var(--portal-border)",
            }}
          >
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--portal-text-primary)" }}>
              <Target className="w-4 h-4" style={{ color: "var(--portal-primary)" }} />
              Sourcing Channel Effectiveness (%)
            </h3>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sourceAttributionData} layout="vertical" margin={{ left: 10, right: 10, top: 10, bottom: 0 }}>
                  <XAxis type="number" tick={{ fontSize: 11, fill: "var(--portal-text-secondary)" }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "var(--portal-text-secondary)" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--portal-bg-elevated)",
                      border: "1px solid var(--portal-border)",
                      borderRadius: "6px",
                      color: "var(--portal-text-primary)",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={18}>
                    {sourceAttributionData.map((_, idx) => (
                      <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sourcing speed velocity */}
          <div
            className="rounded-lg border p-5 lg:col-span-2"
            style={{
              backgroundColor: "var(--portal-bg-elevated)",
              borderColor: "var(--portal-border)",
            }}
          >
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--portal-text-primary)" }}>
              <Clock className="w-4 h-4" style={{ color: "var(--portal-primary)" }} />
              Time-to-Hire Velocity Trend (Avg. Days)
            </h3>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeToHireData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                  <CartesianGrid stroke="var(--portal-border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--portal-text-secondary)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--portal-text-secondary)" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--portal-bg-elevated)",
                      border: "1px solid var(--portal-border)",
                      borderRadius: "6px",
                      color: "var(--portal-text-primary)",
                      fontSize: "12px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="days"
                    stroke="var(--portal-primary)"
                    strokeWidth={2}
                    dot={{ fill: "var(--portal-primary)", strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
