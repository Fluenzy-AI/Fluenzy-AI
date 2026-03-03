"use client";

import { useEffect, useState, useCallback } from "react";
import PortalLayout from "@/components/PortalLayout";
import { usePortalAuth } from "@/contexts/PortalAuthContext";

const HR_NAV = [
  { label: "Dashboard", href: "/portal/hr" },
  { label: "Employees", href: "/portal/hr/employees" },
  { label: "Candidates", href: "/portal/hr/candidates" },
  { label: "Leave Requests", href: "/portal/hr/leaves" },
  { label: "Attendance", href: "/portal/hr/attendance" },
  { label: "Payroll", href: "/portal/hr/payroll" },
  { label: "Offer Letters", href: "/portal/hr/offer-letters" },
  { label: "Send Email", href: "/portal/hr/send-email" },
  { label: "Email Logs", href: "/portal/hr/email-logs" },
];

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  position: string;
  department: string;
  status: string;
  source?: string;
  resumeUrl?: string;
  notes?: string;
  appliedAt: string;
  interviewDate?: string;
}

const STATUS_COLORS: Record<string, string> = {
  APPLIED: "text-blue-400 bg-blue-400/10",
  SCREENING: "text-purple-400 bg-purple-400/10",
  INTERVIEW_SCHEDULED: "text-yellow-400 bg-yellow-400/10",
  INTERVIEWED: "text-orange-400 bg-orange-400/10",
  SELECTED: "text-green-400 bg-green-400/10",
  REJECTED: "text-red-400 bg-red-400/10",
  OFFER_SENT: "text-emerald-400 bg-emerald-400/10",
  ONBOARDED: "text-teal-400 bg-teal-400/10",
  WITHDRAWN: "text-slate-400 bg-slate-400/10",
};

const PIPELINE_STAGES = ["APPLIED", "SCREENING", "INTERVIEW_SCHEDULED", "INTERVIEWED", "SELECTED", "OFFER_SENT", "ONBOARDED"];

export default function CandidatesPage() {
  const { user } = usePortalAuth();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", position: "", department: "Engineering", source: "LinkedIn", notes: "" });
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    if (search) params.set("search", search);
    const res = await fetch(`/api/portal/hr/candidates?${params}`, { credentials: "include" });
    if (res.ok) { const d = await res.json(); setCandidates(d.candidates); setTotal(d.total); }
    setLoading(false);
  }, [page, statusFilter, search]);

  useEffect(() => { if (user) fetchCandidates(); }, [user, fetchCandidates]);

  async function addCandidate() {
    if (!form.name || !form.email || !form.position) return alert("Name, email and position are required.");
    const res = await fetch("/api/portal/hr/candidates", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { await fetchCandidates(); setShowAdd(false); setForm({ name: "", email: "", phone: "", position: "", department: "Engineering", source: "LinkedIn", notes: "" }); }
  }

  async function updateStatus(id: string, status: string) {
    setUpdatingStatus(true);
    await fetch(`/api/portal/hr/candidates/${id}`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await fetchCandidates();
    setSelected(prev => prev ? { ...prev, status } : null);
    setUpdatingStatus(false);
  }

  return (
    <PortalLayout navItems={HR_NAV} title="Candidates" roleLabel="HR Portal" roleColor="text-emerald-400">
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white">Candidates</h2>
            <p className="text-slate-400 text-sm">{total} in pipeline</p>
          </div>
          <div className="flex gap-2">
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search name, email..."
              className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 w-48" />
            <button onClick={() => setShowAdd(true)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-xl transition flex-shrink-0">+ Add</button>
          </div>
        </div>

        {/* Pipeline view */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => setStatusFilter("ALL")} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex-shrink-0 ${statusFilter === "ALL" ? "bg-indigo-600 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"}`}>All</button>
          {PIPELINE_STAGES.map(s => {
            const count = candidates.filter(c => c.status === s).length;
            return (
              <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex-shrink-0 ${statusFilter === s ? "bg-indigo-600 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"}`}>
                {s.replace(/_/g, " ")} {count > 0 && <span className="ml-1 bg-white/10 px-1 rounded">{count}</span>}
              </button>
            );
          })}
        </div>

        <div className="bg-slate-900 rounded-2xl border border-white/5 overflow-hidden">
          {loading ? <div className="p-8 text-center text-slate-500">Loading...</div> :
            candidates.length === 0 ? <div className="p-8 text-center text-slate-500">No candidates found</div> : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/3 border-b border-white/5">
                    <tr className="text-left text-xs text-slate-500">
                      <th className="px-4 py-3">Candidate</th>
                      <th className="px-4 py-3">Position</th>
                      <th className="px-4 py-3">Department</th>
                      <th className="px-4 py-3">Stage</th>
                      <th className="px-4 py-3">Source</th>
                      <th className="px-4 py-3">Applied</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {candidates.map(c => (
                      <tr key={c.id} className="hover:bg-white/2 transition">
                        <td className="px-4 py-3">
                          <p className="text-sm text-white font-medium">{c.name}</p>
                          <p className="text-xs text-slate-500">{c.email}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-300">{c.position}</td>
                        <td className="px-4 py-3 text-xs text-slate-400">{c.department}</td>
                        <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[c.status]}`}>{c.status.replace(/_/g, " ")}</span></td>
                        <td className="px-4 py-3 text-xs text-slate-500">{c.source || "—"}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{new Date(c.appliedAt).toLocaleDateString("en-IN")}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => setSelected(c)} className="text-xs text-indigo-400 hover:text-indigo-300">Manage</button>
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

      {/* Candidate Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h3 className="font-semibold text-white">{selected.name}</h3>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-slate-500">Position</p><p className="text-white">{selected.position}</p></div>
                <div><p className="text-xs text-slate-500">Department</p><p className="text-white">{selected.department}</p></div>
                <div><p className="text-xs text-slate-500">Email</p><p className="text-slate-300">{selected.email}</p></div>
                <div><p className="text-xs text-slate-500">Phone</p><p className="text-slate-300">{selected.phone || "—"}</p></div>
              </div>
              {selected.notes && <div><p className="text-xs text-slate-500 mb-1">Notes</p><p className="text-sm text-slate-300">{selected.notes}</p></div>}
              {selected.resumeUrl && <a href={selected.resumeUrl} target="_blank" className="text-xs text-indigo-400 hover:text-indigo-300">📄 View Resume</a>}
              <div>
                <label className="text-xs text-slate-500 block mb-2">Move to Stage</label>
                <div className="flex flex-wrap gap-1.5">
                  {PIPELINE_STAGES.map(s => (
                    <button key={s} onClick={() => updateStatus(selected.id, s)} disabled={updatingStatus || selected.status === s}
                      className={`text-xs px-2 py-1 rounded-lg transition ${selected.status === s ? "bg-indigo-600 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10 disabled:opacity-40"}`}>
                      {s.replace(/_/g, " ")}
                    </button>
                  ))}
                  <button onClick={() => updateStatus(selected.id, "REJECTED")} disabled={updatingStatus}
                    className="text-xs px-2 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition">Reject</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h3 className="font-semibold text-white">Add Candidate</h3>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <div className="p-5 space-y-3">
              {[["name", "Full Name *"], ["email", "Email *"], ["phone", "Phone"], ["position", "Position *"]].map(([key, label]) => (
                <div key={key}>
                  <label className="text-xs text-slate-500 block mb-1">{label}</label>
                  <input value={form[key as keyof typeof form]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Department</label>
                  <select value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white">
                    {["Engineering", "Product", "Design", "Marketing", "Sales", "HR", "Finance", "Operations"].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Source</label>
                  <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white">
                    {["LinkedIn", "Naukri", "Referral", "Website", "Campus", "Agency", "Other"].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white resize-none" />
              </div>
              <button onClick={addCandidate} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-xl transition font-medium mt-2">Add Candidate</button>
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  );
}
