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

interface Interview {
  id: string;
  candidateId?: string;
  candidate?: { id: string; name: string; email: string };
  position: string;
  department?: string;
  scheduledAt: string;
  durationMinutes?: number;
  type: string;
  meetingLink?: string;
  interviewerName?: string;
  interviewerEmail?: string;
  status: string;
  notes?: string;
  feedback?: string;
  result?: string;
  scheduledBy: string;
  createdAt: string;
}

interface Candidate { id: string; name: string; email: string; position: string; department?: string; }

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "text-blue-400 bg-blue-400/10",
  COMPLETED: "text-green-400 bg-green-400/10",
  CANCELLED: "text-red-400 bg-red-400/10",
  NO_SHOW: "text-orange-400 bg-orange-400/10",
};

const RESULT_COLORS: Record<string, string> = {
  PASS: "text-green-400",
  FAIL: "text-red-400",
  HOLD: "text-yellow-400",
};

const TYPE_ICONS: Record<string, string> = {
  VIDEO: "📹",
  PHONE: "📞",
  IN_PERSON: "🏢",
};

const defaultForm = {
  candidateId: "", position: "", department: "", scheduledAt: "", durationMinutes: 60,
  type: "VIDEO", meetingLink: "", interviewerName: "", interviewerEmail: "", notes: "",
};

export default function InterviewsPage() {
  const { user } = usePortalAuth();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<Interview | null>(null);
  const [updateForm, setUpdateForm] = useState({ status: "", result: "", feedback: "", notes: "", meetingLink: "" });
  const [updating, setUpdating] = useState(false);
  const [form, setForm] = useState({ ...defaultForm });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [intRes, candRes] = await Promise.all([
      fetch(`/api/portal/hr/interviews?page=${page}&limit=20${statusFilter ? `&status=${statusFilter}` : ""}`, { credentials: "include" }),
      fetch("/api/portal/hr/candidates?limit=100", { credentials: "include" }),
    ]);
    if (intRes.ok) { const d = await intRes.json(); setInterviews(d.interviews || []); setTotal(d.total || 0); }
    if (candRes.ok) { const d = await candRes.json(); setCandidates(d.candidates || []); }
    setLoading(false);
  }, [page, statusFilter]);

  useEffect(() => { if (user) fetchData(); }, [user, fetchData]);

  function prefillFromCandidate(id: string) {
    const c = candidates.find(x => x.id === id);
    if (c) setForm(f => ({ ...f, candidateId: id, position: c.position, department: c.department || "" }));
  }

  async function createInterview() {
    if (!form.position || !form.scheduledAt) return alert("Position and scheduled date/time are required.");
    setCreating(true);
    const res = await fetch("/api/portal/hr/interviews", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, durationMinutes: Number(form.durationMinutes) }),
    });
    if (res.ok) { await fetchData(); setShowCreate(false); setForm({ ...defaultForm }); }
    else { const d = await res.json(); alert(d.error || "Failed to schedule interview"); }
    setCreating(false);
  }

  async function updateInterview() {
    if (!selected) return;
    setUpdating(true);
    const res = await fetch(`/api/portal/hr/interviews/${selected.id}`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updateForm),
    });
    if (res.ok) { await fetchData(); setSelected(null); }
    else { const d = await res.json(); alert(d.error || "Update failed"); }
    setUpdating(false);
  }

  async function deleteInterview(id: string) {
    if (!confirm("Cancel and delete this interview?")) return;
    await fetch(`/api/portal/hr/interviews/${id}`, { method: "DELETE", credentials: "include" });
    fetchData();
  }

  const upcoming = interviews.filter(i => i.status === "SCHEDULED" && new Date(i.scheduledAt) >= new Date());
  const past = interviews.filter(i => i.status !== "SCHEDULED" || new Date(i.scheduledAt) < new Date());

  return (
    <PortalLayout navItems={HR_NAV} title="Interviews" roleLabel="HR Portal" roleColor="text-emerald-400">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white">Interview Schedule</h2>
            <p className="text-slate-400 text-sm">{total} total · {upcoming.length} upcoming</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-xl transition">+ Schedule Interview</button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {["", "SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"].map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 text-xs rounded-lg transition font-medium ${statusFilter === s ? "bg-indigo-600 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"}`}>
              {s || "All"}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Scheduled", count: interviews.filter(i => i.status === "SCHEDULED").length, color: "text-blue-400" },
            { label: "Completed", count: interviews.filter(i => i.status === "COMPLETED").length, color: "text-green-400" },
            { label: "Cancelled", count: interviews.filter(i => i.status === "CANCELLED").length, color: "text-red-400" },
            { label: "No Show", count: interviews.filter(i => i.status === "NO_SHOW").length, color: "text-orange-400" },
          ].map(s => (
            <div key={s.label} className="bg-slate-900 border border-white/5 rounded-xl p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
              <p className="text-slate-500 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Interview List */}
        <div className="bg-slate-900 rounded-2xl border border-white/5 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading...</div>
          ) : interviews.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <p className="text-4xl">📅</p>
              <p className="text-slate-500">No interviews scheduled yet</p>
              <p className="text-slate-600 text-sm">Click "+ Schedule Interview" to add one.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {interviews.map(i => {
                const dt = new Date(i.scheduledAt);
                const isPast = dt < new Date();
                return (
                  <div key={i.id} className="p-4 hover:bg-white/2 transition">
                    <div className="flex items-start gap-4">
                      {/* Date block */}
                      <div className="flex-shrink-0 w-14 text-center bg-white/5 rounded-xl p-2">
                        <p className="text-xs text-slate-500">{dt.toLocaleDateString("en-IN", { month: "short" })}</p>
                        <p className="text-xl font-bold text-white leading-none">{dt.getDate()}</p>
                        <p className="text-xs text-slate-400">{dt.getFullYear()}</p>
                      </div>
                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-white">{i.candidate?.name || "—"}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[i.status] || "text-slate-400 bg-slate-400/10"}`}>{i.status}</span>
                          {i.result && <span className={`text-xs font-bold ${RESULT_COLORS[i.result] || ""}`}>{i.result}</span>}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{i.position}{i.department ? ` · ${i.department}` : ""}</p>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs text-slate-500">
                          <span>{TYPE_ICONS[i.type]} {i.type.replace("_", " ")}</span>
                          <span>🕐 {dt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} ({i.durationMinutes || 60} min)</span>
                          {i.interviewerName && <span>👤 {i.interviewerName}</span>}
                          {i.meetingLink && <a href={i.meetingLink} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">🔗 Join</a>}
                        </div>
                        {i.feedback && <p className="text-xs text-slate-500 mt-1 italic">"{i.feedback}"</p>}
                      </div>
                      {/* Actions */}
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => { setSelected(i); setUpdateForm({ status: i.status, result: i.result || "", feedback: i.feedback || "", notes: i.notes || "", meetingLink: i.meetingLink || "" }); }}
                          className="text-xs px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 rounded-lg transition">
                          Update
                        </button>
                        <button onClick={() => deleteInterview(i.id)}
                          className="text-xs px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition">
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
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

      {/* Schedule Interview Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h3 className="font-semibold text-white">Schedule Interview</h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              {/* Candidate */}
              <div>
                <label className="text-xs text-slate-500 block mb-1">Candidate (optional)</label>
                <select value={form.candidateId} onChange={e => prefillFromCandidate(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white">
                  <option value="">No linked candidate</option>
                  {candidates.map(c => <option key={c.id} value={c.id}>{c.name} — {c.position}</option>)}
                </select>
              </div>
              {/* Position + Department */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Position *</label>
                  <input value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Department</label>
                  <input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
                </div>
              </div>
              {/* Date-time + Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Date & Time *</label>
                  <input type="datetime-local" value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Duration (mins)</label>
                  <input type="number" min={15} step={15} value={form.durationMinutes} onChange={e => setForm(f => ({ ...f, durationMinutes: +e.target.value }))}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
                </div>
              </div>
              {/* Type */}
              <div>
                <label className="text-xs text-slate-500 block mb-1">Interview Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["VIDEO", "PHONE", "IN_PERSON"] as const).map(t => (
                    <button key={t} type="button" onClick={() => setForm(f => ({ ...f, type: t }))}
                      className={`py-2 rounded-xl text-xs font-medium transition border ${form.type === t ? "bg-indigo-600 border-indigo-500 text-white" : "bg-slate-800 border-white/10 text-slate-400 hover:border-white/20"}`}>
                      {TYPE_ICONS[t]} {t.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>
              {/* Meeting link */}
              <div>
                <label className="text-xs text-slate-500 block mb-1">Meeting Link</label>
                <input value={form.meetingLink} onChange={e => setForm(f => ({ ...f, meetingLink: e.target.value }))}
                  placeholder="https://meet.google.com/..."
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
              </div>
              {/* Interviewer */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Interviewer Name</label>
                  <input value={form.interviewerName} onChange={e => setForm(f => ({ ...f, interviewerName: e.target.value }))}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Interviewer Email</label>
                  <input type="email" value={form.interviewerEmail} onChange={e => setForm(f => ({ ...f, interviewerEmail: e.target.value }))}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
                </div>
              </div>
              {/* Notes */}
              <div>
                <label className="text-xs text-slate-500 block mb-1">Notes</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white resize-none" />
              </div>
              <button onClick={createInterview} disabled={creating || !form.position || !form.scheduledAt}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm rounded-xl transition font-medium">
                {creating ? "Scheduling..." : "Schedule Interview"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Interview Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <div>
                <h3 className="font-semibold text-white">Update Interview</h3>
                <p className="text-xs text-slate-500 mt-0.5">{selected.candidate?.name || selected.position}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Status</label>
                  <select value={updateForm.status} onChange={e => setUpdateForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white">
                    <option value="SCHEDULED">SCHEDULED</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                    <option value="NO_SHOW">NO_SHOW</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Result</label>
                  <select value={updateForm.result} onChange={e => setUpdateForm(f => ({ ...f, result: e.target.value }))}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white">
                    <option value="">Pending</option>
                    <option value="PASS">PASS</option>
                    <option value="FAIL">FAIL</option>
                    <option value="HOLD">HOLD</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Meeting Link</label>
                <input value={updateForm.meetingLink} onChange={e => setUpdateForm(f => ({ ...f, meetingLink: e.target.value }))}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Feedback</label>
                <textarea rows={2} value={updateForm.feedback} onChange={e => setUpdateForm(f => ({ ...f, feedback: e.target.value }))}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white resize-none" />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Internal Notes</label>
                <textarea rows={2} value={updateForm.notes} onChange={e => setUpdateForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white resize-none" />
              </div>
              <button onClick={updateInterview} disabled={updating}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm rounded-xl transition font-medium">
                {updating ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  );
}
