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

const STATUSES = ["ALL", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const PRIORITIES = ["ALL", "LOW", "MEDIUM", "HIGH", "CRITICAL"];

interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  submitterEmail: string;
  submitterName: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminTicketsPage() {
  const { user } = usePortalAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [updateNote, setUpdateNote] = useState("");
  const [updating, setUpdating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ subject: "", description: "", submitterEmail: "", submitterName: "", priority: "MEDIUM", category: "GENERAL" });

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    if (priorityFilter !== "ALL") params.set("priority", priorityFilter);
    const res = await fetch(`/api/portal/admin/tickets?${params}`, { credentials: "include" });
    if (res.ok) { const d = await res.json(); setTickets(d.tickets); setTotal(d.total); }
    setLoading(false);
  }, [page, statusFilter, priorityFilter]);

  useEffect(() => { if (user) fetchTickets(); }, [user, fetchTickets]);

  async function updateTicket(id: string, data: Record<string, string>) {
    setUpdating(true);
    const res = await fetch(`/api/portal/admin/tickets/${id}`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) { await fetchTickets(); setShowDetail(false); setUpdateNote(""); }
    setUpdating(false);
  }

  async function createTicket() {
    const res = await fetch("/api/portal/admin/tickets", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { await fetchTickets(); setShowCreate(false); setForm({ subject: "", description: "", submitterEmail: "", submitterName: "", priority: "MEDIUM", category: "GENERAL" }); }
  }

  const priorityColor: Record<string, string> = { LOW: "text-slate-400 bg-slate-400/10", MEDIUM: "text-yellow-400 bg-yellow-400/10", HIGH: "text-orange-400 bg-orange-400/10", CRITICAL: "text-red-400 bg-red-400/10" };
  const statusColor: Record<string, string> = { OPEN: "text-red-400 bg-red-400/10", IN_PROGRESS: "text-yellow-400 bg-yellow-400/10", RESOLVED: "text-green-400 bg-green-400/10", CLOSED: "text-slate-400 bg-slate-400/10" };

  return (
    <PortalLayout navItems={ADMIN_NAV} title="Support Tickets" roleLabel="Admin Portal" roleColor="text-blue-400">
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white">Support Tickets</h2>
            <p className="text-slate-400 text-sm">{total} total tickets</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-xl transition">+ Create Ticket</button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {STATUSES.map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${statusFilter === s ? "bg-indigo-600 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"}`}>{s}</button>
          ))}
          <div className="w-px bg-white/10" />
          {PRIORITIES.map(p => (
            <button key={p} onClick={() => { setPriorityFilter(p); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${priorityFilter === p ? "bg-indigo-600 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"}`}>{p}</button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-slate-900 rounded-2xl border border-white/5 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading...</div>
          ) : tickets.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No tickets found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/3 border-b border-white/5">
                  <tr className="text-left text-xs text-slate-500">
                    <th className="px-4 py-3">Ticket</th>
                    <th className="px-4 py-3">Submitter</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {tickets.map(t => (
                    <tr key={t.id} className="hover:bg-white/2 transition">
                      <td className="px-4 py-3">
                        <p className="text-sm text-white font-medium">{t.subject}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{t.category}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-slate-300">{t.submitterName}</p>
                        <p className="text-xs text-slate-500">{t.submitterEmail}</p>
                      </td>
                      <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColor[t.priority]}`}>{t.priority}</span></td>
                      <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[t.status]}`}>{t.status}</span></td>
                      <td className="px-4 py-3 text-xs text-slate-500">{new Date(t.createdAt).toLocaleDateString("en-IN")}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => { setSelected(t); setShowDetail(true); }} className="text-xs text-indigo-400 hover:text-indigo-300">View</button>
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
          <div className="flex justify-center gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 bg-white/5 text-slate-400 text-xs rounded-lg disabled:opacity-40">← Prev</button>
            <span className="px-3 py-1.5 text-slate-400 text-xs">{page} / {Math.ceil(total / 20)}</span>
            <button disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 bg-white/5 text-slate-400 text-xs rounded-lg disabled:opacity-40">Next →</button>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetail && selected && (
        <Modal title={`Ticket: ${selected.subject}`} onClose={() => setShowDetail(false)}>
          <div className="space-y-4">
            <div className="flex gap-3">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColor[selected.priority]}`}>{selected.priority}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[selected.status]}`}>{selected.status}</span>
            </div>
            <p className="text-sm text-slate-300">{selected.description}</p>
            <div className="text-xs text-slate-500">From: {selected.submitterName} &lt;{selected.submitterEmail}&gt;</div>
            <div className="border-t border-white/10 pt-4 space-y-3">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Update Ticket</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Status</label>
                  <select defaultValue={selected.status} id="ticketStatus" className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
                    {["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Priority</label>
                  <select defaultValue={selected.priority} id="ticketPriority" className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
                    {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Internal Note / Reply</label>
                <textarea value={updateNote} onChange={e => setUpdateNote(e.target.value)} rows={3} className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white resize-none" placeholder="Add a note or reply to the submitter..." />
              </div>
              <button
                onClick={() => {
                  const status = (document.getElementById("ticketStatus") as HTMLSelectElement).value;
                  const priority = (document.getElementById("ticketPriority") as HTMLSelectElement).value;
                  updateTicket(selected.id, { status, priority, ...(updateNote && { note: updateNote }) });
                }}
                disabled={updating}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm rounded-xl transition"
              >{updating ? "Updating..." : "Update Ticket"}</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Modal */}
      {showCreate && (
        <Modal title="Create Ticket" onClose={() => setShowCreate(false)}>
          <div className="space-y-4">
            {(["submitterName", "submitterEmail", "subject"] as const).map(k => (
              <div key={k}>
                <label className="text-xs text-slate-400 mb-1 block capitalize">{k.replace(/([A-Z])/g, ' $1')}</label>
                <input value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
              </div>
            ))}
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Priority</label>
                <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
                  {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
                  {["GENERAL", "BILLING", "TECHNICAL", "FEATURE_REQUEST", "OTHER"].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <button onClick={createTicket} className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-xl transition">Create Ticket</button>
          </div>
        </Modal>
      )}
    </PortalLayout>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h3 className="font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition text-xl">&times;</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
