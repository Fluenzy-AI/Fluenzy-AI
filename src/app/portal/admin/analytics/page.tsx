"use client";

import { useEffect, useState } from "react";
import PortalLayout from "@/components/PortalLayout";
import { usePortalAuth } from "@/contexts/PortalAuthContext";

const ADMIN_NAV = [
  { label: "Dashboard", href: "/portal/admin" },
  { label: "User Management", href: "/portal/admin/users" },
  { label: "Subscriptions", href: "/portal/admin/subscriptions" },
  { label: "Payment Logs", href: "/portal/admin/payments" },
  { label: "Support Tickets", href: "/portal/admin/tickets" },
  { label: "Broadcast Email", href: "/portal/admin/broadcast-email" },
  { label: "Feature Toggles", href: "/portal/admin/feature-toggles" },
  { label: "Email History", href: "/portal/admin/email-logs" },
  { label: "Audit Logs", href: "/portal/admin/audit-logs" },
  { label: "Analytics", href: "/portal/admin/analytics" },
];

interface Analytics {
  users: {
    total: number;
    newThisMonth: number;
    activeSubscriptions: number;
    byPlan: Array<{ plan: string; count: number }>;
  };
  revenue: {
    last30Days: number;
    recentPayments: Array<{
      id: string;
      finalAmount: number;
      plan: string;
      status: string;
      date: string;
      user: { name: string; email: string };
    }>;
  };
  tickets: { total: number; open: number; byStatus: Array<{ status: string; count: number }> };
  emails: { total: number; failed: number; successRate: string };
  featureToggles: Array<{ key: string; label: string; enabled: boolean }>;
  recentActivity: Array<{ id: string; actorEmail: string; actorRole: string; action: string; createdAt: string }>;
}

const PLAN_COLORS: Record<string, string> = {
  Free: "bg-slate-500",
  Standard: "bg-blue-500",
  Pro: "bg-purple-500",
};

const ACTION_COLOR = (action: string) => {
  if (action.includes("CREATE") || action.includes("SUCCESS")) return "text-green-400 bg-green-400/10";
  if (action.includes("DELETE") || action.includes("FAILED")) return "text-red-400 bg-red-400/10";
  if (action.includes("UPDATE")) return "text-yellow-400 bg-yellow-400/10";
  if (action.includes("LOGIN")) return "text-blue-400 bg-blue-400/10";
  return "text-slate-400 bg-slate-400/10";
};

export default function AdminAnalyticsPage() {
  const { user } = usePortalAuth();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetch("/api/portal/admin/analytics", { credentials: "include" })
      .then(r => r.json())
      .then(d => setAnalytics(d))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <PortalLayout navItems={ADMIN_NAV} title="Analytics" roleLabel="Admin Portal" roleColor="text-amber-400">
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_,i) => <div key={i} className="h-24 bg-white/5 rounded-2xl" />)}</div>
          <div className="h-64 bg-white/5 rounded-2xl" />
        </div>
      </PortalLayout>
    );
  }

  const a = analytics;

  return (
    <PortalLayout navItems={ADMIN_NAV} title="Analytics" roleLabel="Admin Portal" roleColor="text-amber-400">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white">Platform Analytics</h2>
          <p className="text-slate-400 text-sm">Overview of all platform activity</p>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Users", value: a?.users.total ?? 0, sub: `+${a?.users.newThisMonth ?? 0} this month`, color: "text-blue-400", bg: "bg-blue-500/10" },
            { label: "Active Subscriptions", value: a?.users.activeSubscriptions ?? 0, sub: "Paid plans", color: "text-purple-400", bg: "bg-purple-500/10" },
            { label: "Revenue (30d)", value: `₹${(a?.revenue.last30Days ?? 0).toLocaleString()}`, sub: "Last 30 days", color: "text-green-400", bg: "bg-green-500/10" },
            { label: "Open Tickets", value: a?.tickets.open ?? 0, sub: `${a?.tickets.total ?? 0} total`, color: "text-orange-400", bg: "bg-orange-500/10" },
          ].map(s => (
            <div key={s.label} className="bg-slate-900 border border-white/5 rounded-2xl p-4">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                <span className={`text-lg font-bold ${s.color}`}>•</span>
              </div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-slate-400 text-xs mt-0.5">{s.label}</p>
              <p className="text-slate-600 text-xs">{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Users by Plan */}
          <div className="bg-slate-900 border border-white/5 rounded-2xl p-5">
            <h3 className="font-semibold text-white mb-4">Users by Plan</h3>
            <div className="space-y-3">
              {(a?.users.byPlan || []).map(item => {
                const total = a?.users.total || 1;
                const pct = Math.round((item.count / total) * 100);
                return (
                  <div key={item.plan}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-300">{item.plan}</span>
                      <span className="text-sm text-white font-medium">{item.count} <span className="text-slate-500 font-normal text-xs">({pct}%)</span></span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${PLAN_COLORS[item.plan] || "bg-slate-500"}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Email Stats */}
          <div className="bg-slate-900 border border-white/5 rounded-2xl p-5">
            <h3 className="font-semibold text-white mb-4">Email System</h3>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-white/5 rounded-xl px-3 py-2.5 text-center">
                <p className="text-xl font-bold text-white">{a?.emails.total ?? 0}</p>
                <p className="text-xs text-slate-500">Total Sent</p>
              </div>
              <div className="bg-white/5 rounded-xl px-3 py-2.5 text-center">
                <p className="text-xl font-bold text-red-400">{a?.emails.failed ?? 0}</p>
                <p className="text-xs text-slate-500">Failed</p>
              </div>
              <div className="bg-white/5 rounded-xl px-3 py-2.5 text-center">
                <p className="text-xl font-bold text-green-400">{a?.emails.successRate ?? "—"}</p>
                <p className="text-xs text-slate-500">Success Rate</p>
              </div>
            </div>
            <h3 className="font-semibold text-white mb-3 text-sm">Tickets by Status</h3>
            <div className="space-y-1.5">
              {(a?.tickets.byStatus || []).map(t => (
                <div key={t.status} className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">{t.status}</span>
                  <span className="text-white font-medium">{t.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Payments */}
          <div className="bg-slate-900 border border-white/5 rounded-2xl p-5">
            <h3 className="font-semibold text-white mb-4">Recent Payments</h3>
            {(a?.revenue.recentPayments || []).length === 0 ? (
              <p className="text-slate-500 text-sm">No recent payments</p>
            ) : (
              <div className="space-y-3">
                {(a?.revenue.recentPayments || []).slice(0, 6).map(p => (
                  <div key={p.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white">{p.user.name}</p>
                      <p className="text-xs text-slate-500">{p.plan} · {new Date(p.date).toLocaleDateString("en-IN")}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white">₹{Number(p.finalAmount).toLocaleString()}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${p.status === "paid" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                        {p.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-slate-900 border border-white/5 rounded-2xl p-5">
            <h3 className="font-semibold text-white mb-4">Recent Activity</h3>
            {(a?.recentActivity || []).length === 0 ? (
              <p className="text-slate-500 text-sm">No recent activity</p>
            ) : (
              <div className="space-y-2.5">
                {(a?.recentActivity || []).slice(0, 8).map(act => (
                  <div key={act.id} className="flex items-start gap-2.5">
                    <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium flex-shrink-0 mt-0.5 ${ACTION_COLOR(act.action)}`}>
                      {act.action.split("_")[0]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{act.action.replace(/_/g, " ")}</p>
                      <p className="text-xs text-slate-500">{act.actorEmail} · {new Date(act.createdAt).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Feature Toggles Summary */}
        {(a?.featureToggles || []).length > 0 && (
          <div className="bg-slate-900 border border-white/5 rounded-2xl p-5">
            <h3 className="font-semibold text-white mb-4">Feature Toggles</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {(a?.featureToggles || []).map(ft => (
                <div key={ft.key} className={`flex items-center justify-between p-3 rounded-xl border ${ft.enabled ? "border-green-500/20 bg-green-500/5" : "border-white/5 bg-white/2"}`}>
                  <span className="text-xs text-slate-300">{ft.label}</span>
                  <span className={`text-xs font-semibold ${ft.enabled ? "text-green-400" : "text-slate-600"}`}>{ft.enabled ? "ON" : "OFF"}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
