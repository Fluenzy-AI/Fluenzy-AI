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

interface AuditLog {
  id: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  targetModel?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: "text-green-400 bg-green-400/10",
  UPDATE: "text-yellow-400 bg-yellow-400/10",
  DELETE: "text-red-400 bg-red-400/10",
  LOGIN: "text-blue-400 bg-blue-400/10",
  LOGOUT: "text-slate-400 bg-slate-400/10",
  APPROVE: "text-emerald-400 bg-emerald-400/10",
  REJECT: "text-rose-400 bg-rose-400/10",
  EMAIL: "text-purple-400 bg-purple-400/10",
};

function getActionColor(action: string): string {
  for (const [key, val] of Object.entries(ACTION_COLORS)) {
    if (action.includes(key)) return val;
  }
  return "text-slate-400 bg-slate-400/10";
}

export default function AuditLogsPage() {
  const { user } = usePortalAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "25" });
    if (search) params.set("search", search);
    const res = await fetch(`/api/portal/audit-logs?${params}`, { credentials: "include" });
    if (res.ok) { const d = await res.json(); setLogs(d.logs); setTotal(d.total); }
    setLoading(false);
  }, [page, search]);

  useEffect(() => { if (user) fetchLogs(); }, [user, fetchLogs]);

  return (
    <PortalLayout navItems={ADMIN_NAV} title="Audit Logs" roleLabel="Admin Portal" roleColor="text-blue-400">
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white">Audit Logs</h2>
            <p className="text-slate-400 text-sm">{total} total log entries</p>
          </div>
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by email or action..."
            className="sm:w-64 bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500" />
        </div>

        <div className="bg-slate-900 rounded-2xl border border-white/5 overflow-hidden">
          {loading ? <div className="p-8 text-center text-slate-500">Loading logs...</div> :
            logs.length === 0 ? <div className="p-8 text-center text-slate-500">No audit logs found</div> : (
              <div className="divide-y divide-white/5">
                {logs.map(log => (
                  <div key={log.id} className="hover:bg-white/2 transition cursor-pointer" onClick={() => setExpanded(expanded === log.id ? null : log.id)}>
                    <div className="flex items-center gap-3 px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${getActionColor(log.action)}`}>
                        {log.action.split("_")[0]}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-300 truncate">
                          <span className="font-medium text-white">{log.actorEmail}</span>
                          {" "}
                          <span className="text-slate-500">performed</span>
                          {" "}
                          <span className="font-mono text-indigo-300">{log.action.replace(/_/g, " ")}</span>
                          {log.targetModel && <span className="text-slate-500"> on {log.targetModel}</span>}
                        </p>
                        <p className="text-xs text-slate-600">{new Date(log.createdAt).toLocaleString("en-IN")}</p>
                      </div>
                      <span className="text-xs text-slate-500 flex-shrink-0">{log.actorRole}</span>
                      <span className="text-slate-600 text-xs">{expanded === log.id ? "▲" : "▼"}</span>
                    </div>
                    {expanded === log.id && log.metadata && Object.keys(log.metadata).length > 0 && (
                      <div className="px-4 pb-3 ml-16">
                        <pre className="text-xs text-slate-500 bg-black/20 rounded-lg p-3 overflow-x-auto">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
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
