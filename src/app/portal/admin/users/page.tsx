"use client";

import { useEffect, useState, useCallback } from "react";
import PortalLayout from "@/components/PortalLayout";
import { usePortalAuth } from "@/contexts/PortalAuthContext";
import { useRouter } from "next/navigation";

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

interface User {
  id: string;
  name: string;
  email: string;
  plan: string;
  role: string;
  disabled: boolean;
  usageCount: number;
  usageLimit: number;
  createdAt: string;
  renewalDate?: string;
  _count: { paymentHistories: number; sessions: number };
}

export default function UserManagementPage() {
  const { user } = usePortalAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [disabledFilter, setDisabledFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    if (planFilter) params.set("plan", planFilter);
    if (disabledFilter) params.set("disabled", disabledFilter);
    const res = await fetch(`/api/portal/admin/users?${params}`, { credentials: "include" });
    if (res.ok) { const d = await res.json(); setUsers(d.users); setTotal(d.total); }
    setLoading(false);
  }, [page, search, planFilter, disabledFilter]);

  useEffect(() => { if (user) fetchUsers(); }, [user, fetchUsers]);
  useEffect(() => { if (!user && user !== undefined) router.push("/portal/login"); }, [user, router]);

  async function doAction(userId: string, action: string) {
    setActionLoading(userId + action);
    await fetch("/api/portal/admin/users", {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action }),
    });
    await fetchUsers();
    setActionLoading(null);
    setSelectedUser(null);
  }

  return (
    <PortalLayout navItems={ADMIN_NAV} title="User Management" roleLabel="Admin Portal" roleColor="text-amber-400">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white">User Management</h2>
            <p className="text-slate-400 text-sm">{total.toLocaleString()} total users</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <input
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search name or email..."
            className="flex-1 min-w-[200px] bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <select value={planFilter} onChange={e => { setPlanFilter(e.target.value); setPage(1); }}
            className="bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
            <option value="">All Plans</option>
            <option value="Free">Free</option>
            <option value="Standard">Standard</option>
            <option value="Pro">Pro</option>
          </select>
          <select value={disabledFilter} onChange={e => { setDisabledFilter(e.target.value); setPage(1); }}
            className="bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
            <option value="">All Status</option>
            <option value="false">Active</option>
            <option value="true">Disabled</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-slate-900 rounded-2xl border border-white/5 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading...</div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-slate-500">No users found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5 text-xs text-slate-500">
                    <th className="text-left px-5 py-3">User</th>
                    <th className="text-left px-5 py-3">Plan</th>
                    <th className="text-left px-5 py-3">Usage</th>
                    <th className="text-left px-5 py-3">Sessions</th>
                    <th className="text-left px-5 py-3">Joined</th>
                    <th className="text-left px-5 py-3">Status</th>
                    <th className="text-right px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-white/2 transition">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-amber-600/20 text-amber-400 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                            {u.name[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{u.name}</p>
                            <p className="text-xs text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PLAN_COLORS[u.plan] || "bg-slate-500/10 text-slate-400"}`}>
                          {u.plan}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(100, (u.usageCount / (u.usageLimit || 1)) * 100)}%` }} />
                          </div>
                          <span className="text-xs text-slate-400">{u.usageCount}/{u.usageLimit}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-slate-400">{u._count.sessions}</td>
                      <td className="px-5 py-3 text-sm text-slate-400">{new Date(u.createdAt).toLocaleDateString("en-IN")}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.disabled ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"}`}>
                          {u.disabled ? "Disabled" : "Active"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button onClick={() => setSelectedUser(u)} className="text-xs text-amber-400 hover:text-amber-300 transition">Manage</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
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

      {/* User Manage Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h3 className="font-semibold text-white">Manage User</h3>
              <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-white text-xl">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-600/20 text-amber-400 flex items-center justify-center text-lg font-bold">
                  {selectedUser.name[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-white">{selectedUser.name}</p>
                  <p className="text-sm text-slate-500">{selectedUser.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white/5 rounded-xl px-3 py-2"><p className="text-xs text-slate-500">Plan</p><p className="text-white font-medium">{selectedUser.plan}</p></div>
                <div className="bg-white/5 rounded-xl px-3 py-2"><p className="text-xs text-slate-500">Status</p><p className={selectedUser.disabled ? "text-red-400 font-medium" : "text-green-400 font-medium"}>{selectedUser.disabled ? "Disabled" : "Active"}</p></div>
                <div className="bg-white/5 rounded-xl px-3 py-2"><p className="text-xs text-slate-500">Usage</p><p className="text-white">{selectedUser.usageCount} / {selectedUser.usageLimit}</p></div>
                <div className="bg-white/5 rounded-xl px-3 py-2"><p className="text-xs text-slate-500">Payments</p><p className="text-white">{selectedUser._count.paymentHistories}</p></div>
              </div>
              <div className="space-y-2 pt-1">
                <button onClick={() => doAction(selectedUser.id, selectedUser.disabled ? "enable" : "disable")}
                  disabled={actionLoading === selectedUser.id + (selectedUser.disabled ? "enable" : "disable")}
                  className={`w-full py-2.5 rounded-xl text-sm font-medium transition ${selectedUser.disabled ? "bg-green-600/20 border border-green-500/30 text-green-400 hover:bg-green-600/30" : "bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600/30"}`}>
                  {selectedUser.disabled ? "Enable Account" : "Disable Account"}
                </button>
                <button onClick={() => doAction(selectedUser.id, "reset_usage")}
                  disabled={!!actionLoading}
                  className="w-full py-2.5 rounded-xl text-sm font-medium bg-amber-600/20 border border-amber-500/30 text-amber-400 hover:bg-amber-600/30 transition">
                  Reset Usage Counter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  );
}
