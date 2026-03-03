"use client";

import { useEffect, useState, useCallback } from "react";
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

const PLAN_COLORS: Record<string, string> = {
  Free: "bg-slate-500/10 text-slate-400",
  Standard: "bg-blue-500/10 text-blue-400",
  Pro: "bg-purple-500/10 text-purple-400",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500/10 text-green-400",
  cancelled: "bg-red-500/10 text-red-400",
  failed: "bg-orange-500/10 text-orange-400",
  expired: "bg-slate-500/10 text-slate-400",
};

interface Subscription {
  id: string;
  plan: string;
  status: string;
  amount?: number;
  autoRenew: boolean;
  currentPeriodEnd?: string;
  createdAt: string;
  couponUsed?: string;
  paymentMethod?: string;
  user: { id: string; name: string; email: string; plan: string };
}

interface Stats { active: number; cancelled: number; totalRevenue: number }

export default function SubscriptionsPage() {
  const { user } = usePortalAuth();
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({ active: 0, cancelled: 0, totalRevenue: 0 });

  const fetchSubs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (statusFilter) params.set("status", statusFilter);
    if (planFilter) params.set("plan", planFilter);
    if (search) params.set("search", search);
    const res = await fetch(`/api/portal/admin/subscriptions?${params}`, { credentials: "include" });
    if (res.ok) { const d = await res.json(); setSubs(d.subscriptions); setTotal(d.total); setStats(d.stats); }
    setLoading(false);
  }, [page, statusFilter, planFilter, search]);

  useEffect(() => { if (user) fetchSubs(); }, [user, fetchSubs]);

  return (
    <PortalLayout navItems={ADMIN_NAV} title="Subscriptions" roleLabel="Admin Portal" roleColor="text-amber-400">
      <div className="space-y-5">
        {/* Header stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Active Subscriptions", value: stats.active, color: "text-green-400" },
            { label: "Cancelled", value: stats.cancelled, color: "text-red-400" },
            { label: "Total Revenue", value: `₹${Number(stats.totalRevenue).toLocaleString()}`, color: "text-amber-400" },
          ].map(s => (
            <div key={s.label} className="bg-slate-900 border border-white/5 rounded-2xl p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-slate-400 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search user name or email..."
            className="flex-1 min-w-[200px] bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:outline-none">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="cancelled">Cancelled</option>
            <option value="failed">Failed</option>
            <option value="expired">Expired</option>
          </select>
          <select value={planFilter} onChange={e => { setPlanFilter(e.target.value); setPage(1); }}
            className="bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:outline-none">
            <option value="">All Plans</option>
            <option value="Free">Free</option>
            <option value="Standard">Standard</option>
            <option value="Pro">Pro</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-slate-900 rounded-2xl border border-white/5 overflow-hidden">
          {loading ? <div className="p-8 text-center text-slate-500">Loading...</div> :
            subs.length === 0 ? <div className="p-8 text-center text-slate-500">No subscriptions found</div> : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5 text-xs text-slate-500">
                      <th className="text-left px-5 py-3">User</th>
                      <th className="text-left px-5 py-3">Plan</th>
                      <th className="text-left px-5 py-3">Status</th>
                      <th className="text-left px-5 py-3">Amount</th>
                      <th className="text-left px-5 py-3">Coupon</th>
                      <th className="text-left px-5 py-3">Renewal</th>
                      <th className="text-left px-5 py-3">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {subs.map(s => (
                      <tr key={s.id} className="hover:bg-white/2 transition">
                        <td className="px-5 py-3">
                          <p className="text-sm font-medium text-white">{s.user.name}</p>
                          <p className="text-xs text-slate-500">{s.user.email}</p>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PLAN_COLORS[s.plan] || "bg-slate-500/10 text-slate-400"}`}>{s.plan}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[s.status] || "bg-slate-500/10 text-slate-400"}`}>{s.status}</span>
                        </td>
                        <td className="px-5 py-3 text-sm text-white">{s.amount ? `₹${Number(s.amount).toLocaleString()}` : "—"}</td>
                        <td className="px-5 py-3 text-xs text-slate-400">{s.couponUsed || "—"}</td>
                        <td className="px-5 py-3 text-xs text-slate-400">
                          {s.currentPeriodEnd ? new Date(s.currentPeriodEnd).toLocaleDateString("en-IN") : "—"}
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-400">{new Date(s.createdAt).toLocaleDateString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </div>

        {total > 20 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Showing {Math.min((page-1)*20+1, total)}–{Math.min(page*20, total)} of {total}</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p-1)} className="px-3 py-1.5 bg-white/5 border border-white/10 text-sm text-white rounded-lg disabled:opacity-40">← Prev</button>
              <button disabled={page*20 >= total} onClick={() => setPage(p => p+1)} className="px-3 py-1.5 bg-white/5 border border-white/10 text-sm text-white rounded-lg disabled:opacity-40">Next →</button>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
