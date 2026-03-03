"use client";

import { useEffect, useState } from "react";
import PortalLayout from "@/components/PortalLayout";
import { usePortalAuth } from "@/contexts/PortalAuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

const ADMIN_NAV = [
  { label: "Dashboard", href: "/portal/admin", icon: <HomeIcon /> },
  { label: "User Management", href: "/portal/admin/users", icon: <UsersIcon /> },
  { label: "Subscriptions", href: "/portal/admin/subscriptions", icon: <CreditCardIcon /> },
  { label: "Payment Logs", href: "/portal/admin/payments", icon: <BanknotesIcon /> },
  { label: "Support Tickets", href: "/portal/admin/tickets", icon: <TicketIcon /> },
  { label: "Broadcast Email", href: "/portal/admin/broadcast-email", icon: <MailIcon /> },
  { label: "Feature Toggles", href: "/portal/admin/feature-toggles", icon: <ToggleIcon /> },
  { label: "Email History", href: "/portal/admin/email-logs", icon: <MailOpenIcon /> },
  { label: "Audit Logs", href: "/portal/admin/audit-logs", icon: <ShieldIcon /> },
  { label: "Analytics", href: "/portal/admin/analytics", icon: <ChartIcon /> },
];

interface AdminAnalytics {
  users: {
    total: number;
    newThisMonth: number;
    activeSubscriptions: number;
    byPlan: Array<{ plan: string; count: number }>;
  };
  revenue: {
    last30Days: number;
    recentPayments: Array<{ id: string; finalAmount: number; plan: string; status: string; date: string; user: { name: string; email: string } }>;
  };
  tickets: {
    total: number;
    open: number;
    byStatus: Array<{ status: string; count: number }>;
  };
  emails: { total: number; failed: number; successRate: string };
  featureToggles: Array<{ key: string; label: string; enabled: boolean }>;
  recentActivity: Array<{ id: string; actorEmail: string; actorRole: string; action: string; createdAt: string }>;
}

export default function AdminDashboard() {
  const { user, loading } = usePortalAuth();
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) { router.push("/portal/login"); return; }
    if (user) fetchAnalytics();
  }, [user, loading, router]);

  async function fetchAnalytics() {
    try {
      const res = await fetch("/api/portal/admin/analytics", { credentials: "include" });
      if (res.ok) setAnalytics(await res.json());
    } catch { /* silent */ }
    finally { setLoadingData(false); }
  }

  if (loading || loadingData) {
    return (
      <PortalLayout navItems={ADMIN_NAV} title="Admin Dashboard" roleLabel="Admin Portal" roleColor="text-blue-400">
        <div className="space-y-6 animate-pulse">
          <div className="h-8 w-48 bg-white/5 rounded-xl" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-white/5 rounded-2xl" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-white/5 rounded-2xl" />
            <div className="h-64 bg-white/5 rounded-2xl" />
          </div>
        </div>
      </PortalLayout>
    );
  }

  const statCards = [
    { label: "Total Users", value: analytics?.users.total ?? 0, sub: `+${analytics?.users.newThisMonth ?? 0} this month`, color: "bg-blue-500/10 text-blue-400", icon: <UsersIcon /> },
    { label: "Active Subscriptions", value: analytics?.users.activeSubscriptions ?? 0, color: "bg-green-500/10 text-green-400", icon: <CreditCardIcon /> },
    { label: "Revenue (30d)", value: `₹${(analytics?.revenue.last30Days ?? 0).toLocaleString()}`, color: "bg-yellow-500/10 text-yellow-400", icon: <BanknotesIcon />, isString: true },
    { label: "Open Tickets", value: analytics?.tickets.open ?? 0, color: "bg-red-500/10 text-red-400", icon: <TicketIcon />, href: "/portal/admin/tickets?status=OPEN" },
  ];

  const planColors: Record<string, string> = {
    Free: "bg-slate-500/10 text-slate-400",
    Standard: "bg-blue-500/10 text-blue-400",
    Pro: "bg-purple-500/10 text-purple-400",
    Enterprise: "bg-yellow-500/10 text-yellow-400",
  };

  return (
    <PortalLayout navItems={ADMIN_NAV} title="Admin Dashboard" roleLabel="Admin Portal" roleColor="text-blue-400">
      <div className="space-y-6">
        {/* Welcome */}
        <div>
          <h2 className="text-xl font-bold text-white">Admin Dashboard</h2>
          <p className="text-slate-400 text-sm mt-0.5">Welcome back, {user?.name?.split(" ")[0]}! Here's what's happening.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <StatCard key={card.label} {...card} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Users by Plan */}
          <div className="bg-slate-900 rounded-2xl border border-white/5 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Users by Plan</h3>
              <Link href="/portal/admin/users" className="text-xs text-indigo-400 hover:text-indigo-300">Manage →</Link>
            </div>
            <div className="space-y-3">
              {analytics?.users.byPlan?.map(p => (
                <div key={p.plan} className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${planColors[p.plan] || "bg-slate-500/10 text-slate-400"}`}>{p.plan}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${analytics.users.total ? Math.round((p.count / analytics.users.total) * 100) : 0}%` }} />
                    </div>
                    <span className="text-sm text-slate-300 w-6 text-right">{p.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tickets by Status */}
          <div className="bg-slate-900 rounded-2xl border border-white/5 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Support Tickets</h3>
              <Link href="/portal/admin/tickets" className="text-xs text-indigo-400 hover:text-indigo-300">View all →</Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {analytics?.tickets.byStatus?.map(t => {
                const colors: Record<string, string> = { OPEN: "text-red-400", IN_PROGRESS: "text-yellow-400", RESOLVED: "text-green-400", CLOSED: "text-slate-400" };
                return (
                  <div key={t.status} className="bg-white/3 rounded-xl p-3 border border-white/5">
                    <p className="text-lg font-bold text-white">{t.count}</p>
                    <p className={`text-xs font-medium ${colors[t.status] || "text-slate-400"}`}>{t.status}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Payments */}
        {analytics?.revenue.recentPayments && analytics.revenue.recentPayments.length > 0 && (
          <div className="bg-slate-900 rounded-2xl border border-white/5 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Recent Payments</h3>
              <Link href="/portal/admin/payments" className="text-xs text-indigo-400 hover:text-indigo-300">View all →</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-slate-500">
                    <th className="py-2 pr-4">User</th>
                    <th className="py-2 pr-4">Plan</th>
                    <th className="py-2 pr-4">Amount</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {analytics.revenue.recentPayments.slice(0, 8).map((p) => (
                    <tr key={p.id} className="text-sm">
                      <td className="py-2.5 pr-4">
                        <p className="text-slate-300 font-medium">{p.user.name}</p>
                        <p className="text-slate-500 text-xs">{p.user.email}</p>
                      </td>
                      <td className="py-2.5 pr-4 text-slate-400">{p.plan}</td>
                      <td className="py-2.5 pr-4 text-white font-medium">₹{p.finalAmount.toLocaleString()}</td>
                      <td className="py-2.5 pr-4"><span className="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full">{p.status}</span></td>
                      <td className="py-2.5 text-slate-500">{new Date(p.date).toLocaleDateString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Feature Toggles Quick View */}
        {analytics?.featureToggles && analytics.featureToggles.length > 0 && (
          <div className="bg-slate-900 rounded-2xl border border-white/5 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Feature Toggles</h3>
              <Link href="/portal/admin/feature-toggles" className="text-xs text-indigo-400 hover:text-indigo-300">Manage →</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {analytics.featureToggles.slice(0, 8).map((ft) => (
                <div key={ft.key} className="flex items-center justify-between bg-white/3 rounded-xl p-3 border border-white/5">
                  <p className="text-sm text-slate-300 truncate">{ft.label}</p>
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ml-2 ${ft.enabled ? "bg-green-400" : "bg-slate-600"}`} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Email Stats */}
        <div className="bg-slate-900 rounded-2xl border border-white/5 p-5">
          <h3 className="font-semibold text-white mb-4">Email System Health</h3>
          <div className="flex items-center gap-8">
            <div>
              <p className="text-2xl font-bold text-white">{analytics?.emails.total ?? 0}</p>
              <p className="text-slate-500 text-sm">Total Sent</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-400">{analytics?.emails.failed ?? 0}</p>
              <p className="text-slate-500 text-sm">Failed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-400">{analytics?.emails.successRate ?? "100"}%</p>
              <p className="text-slate-500 text-sm">Success Rate</p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        {analytics?.recentActivity && analytics.recentActivity.length > 0 && (
          <div className="bg-slate-900 rounded-2xl border border-white/5 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Recent Activity</h3>
              <Link href="/portal/admin/audit-logs" className="text-xs text-indigo-400 hover:text-indigo-300">Full logs →</Link>
            </div>
            <div className="space-y-3">
              {analytics.recentActivity.map((log) => (
                <div key={log.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-300">
                      <span className="font-medium">{log.actorEmail}</span>
                      <span className="text-slate-500"> ({log.actorRole})</span>
                      {" — "}{log.action.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs text-slate-600">{new Date(log.createdAt).toLocaleString("en-IN")}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}

function StatCard({ label, value, sub, color, icon, href, isString }: {
  label: string; value: number | string; sub?: string; color: string; icon: React.ReactNode; href?: string; isString?: boolean;
}) {
  const content = (
    <div className={`bg-slate-900 rounded-2xl border border-white/5 p-5 hover:border-white/10 transition ${href ? "cursor-pointer" : ""}`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        <span className="w-4 h-4">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-slate-400 text-xs mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-600 mt-0.5">{sub}</p>}
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

// Icons
function HomeIcon() { return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>; }
function UsersIcon() { return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>; }
function CreditCardIcon() { return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>; }
function BanknotesIcon() { return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>; }
function TicketIcon() { return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>; }
function MailIcon() { return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>; }
function MailOpenIcon() { return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0L9.75 14.5" /></svg>; }
function ToggleIcon() { return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" /></svg>; }
function ShieldIcon() { return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>; }
function ChartIcon() { return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>; }
