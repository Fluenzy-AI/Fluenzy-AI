"use client";

import { useEffect, useState, useCallback } from "react";
import PortalLayout from "@/components/PortalLayout";
import { usePortalAuth } from "@/contexts/PortalAuthContext";

const HR_NAV = [
  { label: "Dashboard", href: "/portal/hr" },
  { label: "Employees", href: "/portal/hr/employees" },
  { label: "Candidates", href: "/portal/hr/candidates" },
  { label: "Interviews", href: "/portal/hr/interviews" },
  { label: "Leave Requests", href: "/portal/hr/leaves" },
  { label: "Attendance", href: "/portal/hr/attendance" },
  { label: "Payroll", href: "/portal/hr/payroll" },
  { label: "Offer Letters", href: "/portal/hr/offer-letters" },
  { label: "Certificates", href: "/portal/hr/certificates" },
  { label: "Send Email", href: "/portal/hr/send-email" },
  { label: "Email Logs", href: "/portal/hr/email-logs" },
  { label: "Manage Jobs", href: "/portal/hr/jobs" },
  { label: "Job Applications", href: "/portal/hr/job-applications" },
];

interface Leave {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  days: number;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "text-yellow-400 bg-yellow-400/10",
  APPROVED: "text-green-400 bg-green-400/10",
  REJECTED: "text-red-400 bg-red-400/10",
  CANCELLED: "text-slate-400 bg-slate-400/10",
};

export default function LeavesPage() {
  const { user } = usePortalAuth();
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Leave | null>(null);
  const [remark, setRemark] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    const res = await fetch(`/api/portal/hr/leaves?${params}`, { credentials: "include" });
    if (res.ok) { const d = await res.json(); setLeaves(d.leaves); setTotal(d.total); }
    setLoading(false);
  }, [page, statusFilter]);

  useEffect(() => { if (user) fetchLeaves(); }, [user, fetchLeaves]);

  async function processLeave(id: string, status: "APPROVED" | "REJECTED") {
    setProcessing(true);
    const res = await fetch(`/api/portal/hr/leaves/${id}`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, remark }),
    });
    if (res.ok) { await fetchLeaves(); setSelected(null); setRemark(""); }
    setProcessing(false);
  }

  const pending = leaves.filter(l => l.status === "PENDING").length;

  return (
    <PortalLayout navItems={HR_NAV} title="Leave Requests" roleLabel="HR Portal" roleColor="text-emerald-400">
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white">Leave Requests</h2>
            <p className="text-slate-400 text-sm">{total} total · <span className="text-yellow-400">{pending} pending</span></p>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2">
          {["ALL", "PENDING", "APPROVED", "REJECTED", "CANCELLED"].map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${statusFilter === s ? "bg-indigo-600 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"}`}>{s}</button>
          ))}
        </div>

        <div className="bg-slate-900 rounded-2xl border border-white/5 overflow-hidden">
          {loading ? <div className="p-8 text-center text-slate-500">Loading...</div> :
            leaves.length === 0 ? <div className="p-8 text-center text-slate-500">No leave requests found</div> : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/3 border-b border-white/5">
                    <tr className="text-left text-xs text-slate-500">
                      <th className="px-4 py-3">Employee</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Period</th>
                      <th className="px-4 py-3">Days</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Applied</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {leaves.map(l => (
                      <tr key={l.id} className="hover:bg-white/2 transition">
                        <td className="px-4 py-3 text-sm text-slate-300">{l.employeeName}</td>
                        <td className="px-4 py-3 text-xs text-slate-400">{l.leaveType.replace(/_/g, " ")}</td>
                        <td className="px-4 py-3 text-xs text-slate-400">
                          {new Date(l.startDate).toLocaleDateString("en-IN")} → {new Date(l.endDate).toLocaleDateString("en-IN")}
                        </td>
                        <td className="px-4 py-3 text-sm text-white font-medium">{l.days}</td>
                        <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[l.status]}`}>{l.status}</span></td>
                        <td className="px-4 py-3 text-xs text-slate-500">{new Date(l.createdAt).toLocaleDateString("en-IN")}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => setSelected(l)} className="text-xs text-indigo-400 hover:text-indigo-300">
                            {l.status === "PENDING" ? "Review" : "View"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </div>

        {total > 20 && (
          <div className="flex justify-center gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 bg-white/5 text-slate-400 text-xs rounded-lg disabled:opacity-40">← Prev</button>
            <span className="px-3 py-1.5 text-slate-400 text-xs">{page} / {Math.ceil(total / 20)}</span>
            <button disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 bg-white/5 text-slate-400 text-xs rounded-lg disabled:opacity-40">Next →</button>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h3 className="font-semibold text-white">Leave Request</h3>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/3 rounded-xl p-3">
                  <p className="text-xs text-slate-500">Employee</p>
                  <p className="text-sm text-white font-medium">{selected.employeeName}</p>
                </div>
                <div className="bg-white/3 rounded-xl p-3">
                  <p className="text-xs text-slate-500">Type</p>
                  <p className="text-sm text-white font-medium">{selected.leaveType.replace(/_/g, " ")}</p>
                </div>
                <div className="bg-white/3 rounded-xl p-3">
                  <p className="text-xs text-slate-500">From</p>
                  <p className="text-sm text-white">{new Date(selected.startDate).toLocaleDateString("en-IN")}</p>
                </div>
                <div className="bg-white/3 rounded-xl p-3">
                  <p className="text-xs text-slate-500">To</p>
                  <p className="text-sm text-white">{new Date(selected.endDate).toLocaleDateString("en-IN")}</p>
                </div>
              </div>
              <div className="bg-white/3 rounded-xl p-3">
                <p className="text-xs text-slate-500 mb-1">Reason</p>
                <p className="text-sm text-slate-300">{selected.reason || "—"}</p>
              </div>
              <div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[selected.status]}`}>{selected.status}</span>
              </div>
              {selected.status === "PENDING" && (
                <>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Remark (optional)</label>
                    <textarea value={remark} onChange={e => setRemark(e.target.value)} rows={2}
                      className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white resize-none" placeholder="Add a remark..." />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => processLeave(selected.id, "APPROVED")} disabled={processing}
                      className="flex-1 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm rounded-xl transition font-medium">
                      {processing ? "..." : "✓ Approve"}
                    </button>
                    <button onClick={() => processLeave(selected.id, "REJECTED")} disabled={processing}
                      className="flex-1 py-2 bg-red-600/70 hover:bg-red-600 disabled:opacity-50 text-white text-sm rounded-xl transition font-medium">
                      {processing ? "..." : "✗ Reject"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  );
}
