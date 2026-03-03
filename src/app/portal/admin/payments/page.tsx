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

const STATUS_COLORS: Record<string, string> = {
  paid: "bg-green-500/10 text-green-400",
  failed: "bg-red-500/10 text-red-400",
  refunded: "bg-orange-500/10 text-orange-400",
  free_via_coupon: "bg-blue-500/10 text-blue-400",
  pending: "bg-yellow-500/10 text-yellow-400",
};

interface Payment {
  id: string;
  plan?: string;
  billingCycle?: string;
  finalAmount: number;
  originalAmount?: number;
  discountAmount: number;
  status: string;
  paymentMethod?: string;
  couponUsed?: string;
  date: string;
  user: { id: string; name: string; email: string };
}

interface Stats { totalRevenue: number; totalTransactions: number; revenue30d: number }

export default function PaymentLogsPage() {
  const { user } = usePortalAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({ totalRevenue: 0, totalTransactions: 0, revenue30d: 0 });
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (statusFilter) params.set("status", statusFilter);
    if (search) params.set("search", search);
    const res = await fetch(`/api/portal/admin/payments?${params}`, { credentials: "include" });
    if (res.ok) { const d = await res.json(); setPayments(d.payments); setTotal(d.total); setStats(d.stats); }
    setLoading(false);
  }, [page, statusFilter, search]);

  useEffect(() => { if (user) fetchPayments(); }, [user, fetchPayments]);

  return (
    <PortalLayout navItems={ADMIN_NAV} title="Payment Logs" roleLabel="Admin Portal" roleColor="text-amber-400">
      <div className="space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Revenue", value: `₹${Number(stats.totalRevenue).toLocaleString()}`, sub: "All time", color: "text-green-400" },
            { label: "Revenue (30 days)", value: `₹${Number(stats.revenue30d).toLocaleString()}`, sub: "Last 30 days", color: "text-amber-400" },
            { label: "Transactions", value: stats.totalTransactions, sub: "Paid", color: "text-blue-400" },
          ].map(s => (
            <div key={s.label} className="bg-slate-900 border border-white/5 rounded-2xl p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-slate-400 text-xs mt-0.5">{s.label}</p>
              <p className="text-slate-600 text-xs">{s.sub}</p>
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
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
            <option value="free_via_coupon">Free via Coupon</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-slate-900 rounded-2xl border border-white/5 overflow-hidden">
          {loading ? <div className="p-8 text-center text-slate-500">Loading...</div> :
            payments.length === 0 ? <div className="p-8 text-center text-slate-500">No payment records found</div> : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5 text-xs text-slate-500">
                      <th className="text-left px-5 py-3">User</th>
                      <th className="text-left px-5 py-3">Plan</th>
                      <th className="text-left px-5 py-3">Amount</th>
                      <th className="text-left px-5 py-3">Discount</th>
                      <th className="text-left px-5 py-3">Status</th>
                      <th className="text-left px-5 py-3">Method</th>
                      <th className="text-left px-5 py-3">Date</th>
                      <th className="text-right px-5 py-3">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {payments.map(p => (
                      <>
                        <tr key={p.id} className="hover:bg-white/2 transition">
                          <td className="px-5 py-3">
                            <p className="text-sm font-medium text-white">{p.user.name}</p>
                            <p className="text-xs text-slate-500">{p.user.email}</p>
                          </td>
                          <td className="px-5 py-3 text-sm text-slate-300">{p.plan || "—"}</td>
                          <td className="px-5 py-3 text-sm font-semibold text-white">₹{Number(p.finalAmount).toLocaleString()}</td>
                          <td className="px-5 py-3 text-sm text-slate-400">{p.discountAmount > 0 ? `-₹${Number(p.discountAmount).toLocaleString()}` : "—"}</td>
                          <td className="px-5 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[p.status] || "bg-slate-500/10 text-slate-400"}`}>{p.status}</span>
                          </td>
                          <td className="px-5 py-3 text-xs text-slate-400">{p.paymentMethod || "—"}</td>
                          <td className="px-5 py-3 text-xs text-slate-400">{new Date(p.date).toLocaleDateString("en-IN")}</td>
                          <td className="px-5 py-3 text-right">
                            <button onClick={() => setExpanded(expanded === p.id ? null : p.id)} className="text-xs text-amber-400 hover:text-amber-300">
                              {expanded === p.id ? "Hide" : "View"}
                            </button>
                          </td>
                        </tr>
                        {expanded === p.id && (
                          <tr key={p.id + "_exp"} className="bg-white/2">
                            <td colSpan={8} className="px-5 py-3">
                              <div className="grid grid-cols-3 gap-4 text-xs text-slate-400">
                                <div><span className="text-slate-500">Billing Cycle:</span> {p.billingCycle || "—"}</div>
                                <div><span className="text-slate-500">Original Amount:</span> ₹{Number(p.originalAmount || p.finalAmount).toLocaleString()}</div>
                                <div><span className="text-slate-500">Coupon Used:</span> {p.couponUsed || "None"}</div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
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
