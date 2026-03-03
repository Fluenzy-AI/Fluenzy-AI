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
  SENT: "bg-green-500/10 text-green-400",
  FAILED: "bg-red-500/10 text-red-400",
  PENDING: "bg-yellow-500/10 text-yellow-400",
  RETRYING: "bg-orange-500/10 text-orange-400",
};

interface EmailLog {
  id: string;
  to: string[];
  subject: string;
  status: string;
  type?: string;
  error?: string;
  sentAt?: string;
  createdAt: string;
  staff?: { name: string; email: string };
}

export default function AdminEmailHistoryPage() {
  const { user } = usePortalAuth();
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "30" });
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/portal/email-logs?${params}`, { credentials: "include" });
    if (res.ok) { const d = await res.json(); setLogs(d.logs); setTotal(d.total); }
    setLoading(false);
  }, [page, statusFilter]);

  useEffect(() => { if (user) fetchLogs(); }, [user, fetchLogs]);

  return (
    <PortalLayout navItems={ADMIN_NAV} title="Email History" roleLabel="Admin Portal" roleColor="text-amber-400">
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white">Email History</h2>
            <p className="text-slate-400 text-sm">{total} total emails sent</p>
          </div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
            <option value="">All Status</option>
            <option value="SENT">Sent</option>
            <option value="FAILED">Failed</option>
            <option value="PENDING">Pending</option>
            <option value="RETRYING">Retrying</option>
          </select>
        </div>

        <div className="bg-slate-900 rounded-2xl border border-white/5 overflow-hidden">
          {loading ? <div className="p-8 text-center text-slate-500">Loading...</div> :
            logs.length === 0 ? <div className="p-8 text-center text-slate-500">No email logs found</div> : (
              <div className="divide-y divide-white/5">
                {logs.map(log => (
                  <div key={log.id}>
                    <div
                      className="flex items-start justify-between px-5 py-3.5 hover:bg-white/2 transition cursor-pointer"
                      onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_COLORS[log.status] || "bg-slate-500/10 text-slate-400"}`}>
                            {log.status}
                          </span>
                          {log.type && <span className="text-xs text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">{log.type}</span>}
                        </div>
                        <p className="text-sm font-medium text-white truncate">{log.subject}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          To: {(log.to || []).slice(0, 2).join(", ")}
                          {(log.to || []).length > 2 && ` +${(log.to || []).length - 2} more`}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-right ml-3">
                        <p className="text-xs text-slate-500">{new Date(log.createdAt).toLocaleDateString("en-IN")}</p>
                        <p className="text-xs text-slate-600">{new Date(log.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    </div>
                    {expanded === log.id && (
                      <div className="px-5 pb-4 bg-white/2 text-xs space-y-2">
                        <div><span className="text-slate-500">To:</span> <span className="text-white">{(log.to || []).join(", ")}</span></div>
                        {log.staff && <div><span className="text-slate-500">Sent by:</span> <span className="text-white">{log.staff.name} ({log.staff.email})</span></div>}
                        {log.sentAt && <div><span className="text-slate-500">Sent at:</span> <span className="text-white">{new Date(log.sentAt).toLocaleString("en-IN")}</span></div>}
                        {log.error && <div><span className="text-slate-500">Error:</span> <span className="text-red-400">{log.error}</span></div>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
        </div>

        {total > 30 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Showing {Math.min((page-1)*30+1, total)}–{Math.min(page*30, total)} of {total}</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p-1)} className="px-3 py-1.5 bg-white/5 border border-white/10 text-sm text-white rounded-lg disabled:opacity-40">← Prev</button>
              <button disabled={page*30 >= total} onClick={() => setPage(p => p+1)} className="px-3 py-1.5 bg-white/5 border border-white/10 text-sm text-white rounded-lg disabled:opacity-40">Next →</button>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
