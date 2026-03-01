"use client";
import { useEffect, useState, useCallback } from "react";
import {
  Building2, CheckCircle, XCircle, PauseCircle, RefreshCw, Eye,
  Loader2, Search, Filter, X, User, GraduationCap,
  Activity, BookOpen, Calendar, Zap,
} from "lucide-react";

interface StudentUser {
  plan?: string; usageCount?: number; usageLimit?: number;
  hrUsage?: number; gdUsage?: number; technicalUsage?: number;
  companyUsage?: number; englishUsage?: number;
  renewalDate?: string; disabled?: boolean; createdAt?: string;
}
interface StudentDetail {
  id: string; studentName: string; email: string;
  department?: string; year?: number; rollNumber?: string;
  status: string; customPlan?: string; customPlanExpiresAt?: string;
  onboardedAt?: string; inviteSentAt?: string; createdAt: string;
  user?: StudentUser;
}

interface CollegePartner {
  id: string;
  collegeName: string;
  email: string;
  domain: string;
  status: string;
  totalSeats: number;
  usedSeats: number;
  allocatedPlan?: string;
  createdAt: string;
  approvedAt?: string;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  APPROVED: "bg-green-500/20 text-green-400 border-green-500/30",
  REJECTED: "bg-red-500/20 text-red-400 border-red-500/30",
  SUSPENDED: "bg-orange-500/20 text-orange-400 border-orange-500/30",
};

type FilterStatus = "ALL" | "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";

export default function CollegePartnersPage() {
  const [partners, setPartners] = useState<CollegePartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL");
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [seats, setSeats] = useState<Record<string, number>>({});
  const [plan, setPlan] = useState<Record<string, string>>({});
  const [editSeats, setEditSeats] = useState<Record<string, number>>({});
  const [editPlan, setEditPlan] = useState<Record<string, string>>({});
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/superadmin/college-partners${filterStatus !== "ALL" ? `?status=${filterStatus}` : ""}`);
      if (res.ok) {
        const d = await res.json();
        setPartners(d.colleges ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { fetchPartners(); }, [fetchPartners]);

  const doAction = async (id: string, action: string) => {
    setActionLoading(id + action);
    try {
      const body: Record<string, unknown> = { collegeAdminId: id, action };
      if (action === "reject" && reason) body.reason = reason;
      if (action === "approve") {
        if (seats[id]) body.totalSeats = seats[id];
        if (plan[id]) body.allocatedPlan = plan[id];
      }
      const res = await fetch("/api/superadmin/college-partners", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setExpanded(null);
        setReason("");
        await fetchPartners();
      }
    } finally {
      setActionLoading(null);
    }
  };

  const doUpdate = async (id: string) => {
    setActionLoading(id + "update");
    setUpdateSuccess(null);
    try {
      const body: Record<string, unknown> = {
        collegeAdminId: id,
        action: "update",
        totalSeats: editSeats[id],
        allocatedPlan: editPlan[id],
      };
      const res = await fetch("/api/superadmin/college-partners", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setUpdateSuccess(id);
        await fetchPartners();
        setTimeout(() => setUpdateSuccess(null), 3000);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = partners.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.collegeName.toLowerCase().includes(q) || p.email.toLowerCase().includes(q) || p.domain.toLowerCase().includes(q);
  });

  const stats = {
    pending: partners.filter((p) => p.status === "PENDING").length,
    approved: partners.filter((p) => p.status === "APPROVED").length,
    total: partners.length,
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Building2 className="w-6 h-6 text-indigo-400" /> College Partners
            </h1>
            <p className="text-slate-400 text-sm mt-1">Manage institutional partner onboarding and access.</p>
          </div>
          <button onClick={fetchPartners} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-sm transition-all">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Colleges", value: stats.total, color: "indigo" },
            { label: "Pending Approval", value: stats.pending, color: "yellow" },
            { label: "Active Partners", value: stats.approved, color: "green" },
          ].map(({ label, value, color }) => (
            <div key={label} className={`bg-[#111827]/80 border border-${color}-500/20 rounded-xl p-4`}>
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search colleges…"
              className="w-full bg-slate-800/60 border border-slate-600/60 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            {(["ALL", "PENDING", "APPROVED", "REJECTED", "SUSPENDED"] as FilterStatus[]).map((s) => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border ${filterStatus === s ? "bg-indigo-500/30 text-indigo-300 border-indigo-500/50" : "bg-slate-800/60 text-slate-400 border-slate-700/50 hover:text-slate-200"}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center h-40"><Loader2 className="w-8 h-8 text-indigo-400 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">No colleges found.</div>
        ) : (
          <div className="bg-[#111827]/80 border border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-700/50">
                <tr className="text-xs text-slate-500 uppercase tracking-wide">
                  <th className="text-left px-5 py-3 font-medium">College</th>
                  <th className="text-left px-5 py-3 font-medium">Domain</th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                  <th className="text-left px-5 py-3 font-medium">Seats</th>
                  <th className="text-left px-5 py-3 font-medium">Joined</th>
                  <th className="text-right px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {filtered.map((p) => (
                  <>
                    <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3">
                        <p className="text-slate-100 font-medium">{p.collegeName}</p>
                        <p className="text-slate-500 text-xs">{p.email}</p>
                      </td>
                      <td className="px-5 py-3 text-slate-400 font-mono text-xs">{p.domain}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2.5 py-0.5 text-xs rounded-full border ${statusColors[p.status] ?? "bg-slate-700 text-slate-400"}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-400">
                        {p.usedSeats}/{p.totalSeats}
                        <div className="w-20 h-1.5 bg-slate-700 rounded-full mt-1 overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${p.totalSeats > 0 ? (p.usedSeats / p.totalSeats) * 100 : 0}%` }} />
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-400 text-xs whitespace-nowrap">
                        {new Date(p.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                            className="p-1.5 rounded-lg bg-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-700 transition-all">
                            <Eye className="w-4 h-4" />
                          </button>
                          {p.status === "PENDING" && (
                            <button onClick={() => doAction(p.id, "approve")} disabled={!!actionLoading}
                              className="p-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 transition-all disabled:opacity-50">
                              {actionLoading === p.id + "approve" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                            </button>
                          )}
                          {p.status === "PENDING" && (
                            <button onClick={() => setExpanded(expanded === `reject-${p.id}` ? null : `reject-${p.id}`)} disabled={!!actionLoading}
                              className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 transition-all disabled:opacity-50">
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                          {p.status === "APPROVED" && (
                            <button onClick={() => doAction(p.id, "suspend")} disabled={!!actionLoading}
                              className="p-1.5 rounded-lg bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/30 transition-all disabled:opacity-50">
                              {actionLoading === p.id + "suspend" ? <Loader2 className="w-4 h-4 animate-spin" /> : <PauseCircle className="w-4 h-4" />}
                            </button>
                          )}
                          {(p.status === "SUSPENDED" || p.status === "REJECTED") && (
                            <button onClick={() => doAction(p.id, "reactivate")} disabled={!!actionLoading}
                              className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 border border-indigo-500/30 transition-all disabled:opacity-50">
                              {actionLoading === p.id + "reactivate" ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Detail Panel */}
                    {expanded === p.id && (
                      <tr key={`detail-${p.id}`}>
                        <td colSpan={6} className="px-5 py-4 bg-slate-800/30 border-t border-slate-700/30">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                            <div><p className="text-slate-500 text-xs mb-0.5">Plan</p><p className="text-slate-200">{p.allocatedPlan ?? "None"}</p></div>
                            <div><p className="text-slate-500 text-xs mb-0.5">Seat Usage</p><p className="text-slate-200">{p.usedSeats} / {p.totalSeats}</p></div>
                            <div><p className="text-slate-500 text-xs mb-0.5">Approved At</p><p className="text-slate-200">{p.approvedAt ? new Date(p.approvedAt).toLocaleDateString() : "—"}</p></div>
                            <div><p className="text-slate-500 text-xs mb-0.5">Email</p><p className="text-slate-200 break-all">{p.email}</p></div>
                          </div>

                          {/* Approve with custom seats/plan — for PENDING */}
                          {p.status === "PENDING" && (
                            <div className="mt-4 flex flex-wrap items-end gap-3">
                              <div>
                                <label className="text-xs text-slate-400 block mb-1">Seats</label>
                                <input type="number" min="1" value={seats[p.id] ?? 100}
                                  onChange={(e) => setSeats((s) => ({ ...s, [p.id]: +e.target.value }))}
                                  className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 w-24 focus:outline-none focus:border-indigo-500" />
                              </div>
                              <div>
                                <label className="text-xs text-slate-400 block mb-1">Plan</label>
                                <select value={plan[p.id] ?? "Free"}
                                  onChange={(e) => setPlan((s) => ({ ...s, [p.id]: e.target.value }))}
                                  className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500">
                                  <option value="Free">Free</option>
                                  <option value="Standard">Standard — Rs.150/student</option>
                                  <option value="Pro">Pro — Rs.20/student</option>
                                  <option value="Enterprise">Enterprise (Custom)</option>
                                </select>
                              </div>
                              <button onClick={() => doAction(p.id, "approve")} disabled={!!actionLoading}
                                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-green-500/20 text-green-300 border border-green-500/30 text-sm hover:bg-green-500/30 transition-all disabled:opacity-50">
                                <CheckCircle className="w-4 h-4" /> Approve with these settings
                              </button>
                            </div>
                          )}

                          {/* Edit plan/seats for APPROVED colleges */}
                          {(p.status === "APPROVED" || p.status === "SUSPENDED") && (
                            <div className="mt-4 border-t border-slate-700/40 pt-4">
                              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Update Plan &amp; Seats</p>
                              <div className="flex flex-wrap items-end gap-3">
                                <div>
                                  <label className="text-xs text-slate-400 block mb-1">Total Seats</label>
                                  <input type="number" min="1"
                                    value={editSeats[p.id] ?? p.totalSeats}
                                    onChange={(e) => setEditSeats((s) => ({ ...s, [p.id]: +e.target.value }))}
                                    className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 w-28 focus:outline-none focus:border-indigo-500" />
                                </div>
                                <div>
                                  <label className="text-xs text-slate-400 block mb-1">Allocated Plan</label>
                                  <select
                                    value={editPlan[p.id] ?? (p.allocatedPlan ?? "Free")}
                                    onChange={(e) => setEditPlan((s) => ({ ...s, [p.id]: e.target.value }))}
                                    className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500">
                                    <option value="Free">Free</option>
                                    <option value="Standard">Standard — Rs.150/student</option>
                                    <option value="Pro">Pro — Rs.20/student</option>
                                    <option value="Enterprise">Enterprise (Custom)</option>
                                  </select>
                                </div>
                                <button
                                  onClick={() => doUpdate(p.id)}
                                  disabled={!!actionLoading}
                                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-sm hover:bg-indigo-500/30 transition-all disabled:opacity-50">
                                  {actionLoading === p.id + "update" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                  Save Changes
                                </button>
                                {updateSuccess === p.id && (
                                  <span className="flex items-center gap-1 text-green-400 text-xs"><CheckCircle className="w-3 h-3" />Updated!</span>
                                )}
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}

                    {/* Rejection reason panel */}
                    {expanded === `reject-${p.id}` && (
                      <tr key={`reject-panel-${p.id}`}>
                        <td colSpan={6} className="px-5 py-4 bg-red-500/5 border-t border-red-500/20">
                          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
                            <div className="flex-1">
                              <label className="text-xs text-slate-400 block mb-1">Rejection Reason (optional)</label>
                              <input value={reason} onChange={(e) => setReason(e.target.value)}
                                placeholder="Reason shown to college admin…"
                                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-red-500" />
                            </div>
                            <button onClick={() => doAction(p.id, "reject")} disabled={!!actionLoading}
                              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-red-500/20 text-red-300 border border-red-500/30 text-sm hover:bg-red-500/30 transition-all disabled:opacity-50">
                              {actionLoading === p.id + "reject" ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                              Confirm Rejection
                            </button>
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
    </div>
  );
}
