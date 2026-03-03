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
  { label: "Send Email", href: "/portal/hr/send-email" },
  { label: "Email Logs", href: "/portal/hr/email-logs" },
  { label: "Job Applications", href: "/portal/hr/job-applications" },
];

interface EmailLog {
  id: string;
  to: string[];
  cc?: string[];
  subject: string;
  templateId?: string;
  status: string;
  sentAt?: string;
  failReason?: string;
  senderRole: string;
  createdAt: string;
}

export default function EmailLogsPage() {
  const { user } = usePortalAuth();
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "25", role: "HR" });
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    const res = await fetch(`/api/portal/email-logs?${params}`, { credentials: "include" });
    if (res.ok) { const d = await res.json(); setLogs(d.logs); setTotal(d.total); }
    setLoading(false);
  }, [page, statusFilter]);

  useEffect(() => { if (user) fetchLogs(); }, [user, fetchLogs]);

  const statusColor: Record<string, string> = { SENT: "text-green-400 bg-green-400/10", FAILED: "text-red-400 bg-red-400/10", PENDING: "text-yellow-400 bg-yellow-400/10", RETRYING: "text-orange-400 bg-orange-400/10" };

  return (
    <PortalLayout navItems={HR_NAV} title="Email Logs" roleLabel="HR Portal" roleColor="text-emerald-400">
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white">Email Logs</h2>
            <p className="text-slate-400 text-sm">{total} emails sent via HR account</p>
          </div>
          <div className="flex gap-2">
            {["ALL", "SENT", "FAILED", "PENDING"].map(s => (
              <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${statusFilter === s ? "bg-indigo-600 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"}`}>{s}</button>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 rounded-2xl border border-white/5 overflow-hidden">
          {loading ? <div className="p-8 text-center text-slate-500">Loading...</div> :
            logs.length === 0 ? <div className="p-8 text-center text-slate-500">No email logs found</div> : (
              <div className="divide-y divide-white/5">
                {logs.map(log => (
                  <div key={log.id} className="hover:bg-white/2 transition">
                    <div className="flex items-start gap-3 px-4 py-3 cursor-pointer" onClick={() => setExpanded(expanded === log.id ? null : log.id)}>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 mt-0.5 ${statusColor[log.status] || "text-slate-400 bg-slate-400/10"}`}>{log.status}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">{log.subject}</p>
                        <p className="text-xs text-slate-500 mt-0.5">To: {(log.to || []).slice(0, 3).join(", ")}{(log.to || []).length > 3 ? ` +${(log.to || []).length - 3} more` : ""}</p>
                        {log.failReason && <p className="text-xs text-red-400 mt-0.5">{log.failReason}</p>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-slate-500">{new Date(log.createdAt).toLocaleDateString("en-IN")}</p>
                        <p className="text-xs text-slate-600">{new Date(log.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    </div>
                    {expanded === log.id && (
                      <div className="px-4 pb-3 ml-12 space-y-1">
                        <p className="text-xs text-slate-500"><span className="text-slate-400">All recipients:</span> {(log.to || []).join(", ")}</p>
                        {log.cc && log.cc.length > 0 && <p className="text-xs text-slate-500"><span className="text-slate-400">CC:</span> {log.cc.join(", ")}</p>}
                        {log.templateId && <p className="text-xs text-slate-500"><span className="text-slate-400">Template:</span> {log.templateId}</p>}
                        {log.sentAt && <p className="text-xs text-slate-500"><span className="text-slate-400">Sent at:</span> {new Date(log.sentAt).toLocaleString("en-IN")}</p>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
        </div>

        {total > 25 && (
          <div className="flex justify-center gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 bg-white/5 text-slate-400 text-xs rounded-lg disabled:opacity-40">← Prev</button>
            <span className="px-3 py-1.5 text-slate-400 text-xs">{page} / {Math.ceil(total / 25)}</span>
            <button disabled={page >= Math.ceil(total / 25)} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 bg-white/5 text-slate-400 text-xs rounded-lg disabled:opacity-40">Next →</button>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
