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

interface OfferLetter {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  position: string;
  department: string;
  salary: number;
  joiningDate: string;
  status: string;
  sentAt?: string;
  acceptedAt?: string;
  createdAt: string;
}

interface Candidate { id: string; name: string; email: string; position: string; department: string; }

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "text-slate-400 bg-slate-400/10",
  SENT: "text-blue-400 bg-blue-400/10",
  ACCEPTED: "text-green-400 bg-green-400/10",
  REJECTED: "text-red-400 bg-red-400/10",
  EXPIRED: "text-orange-400 bg-orange-400/10",
};

export default function OfferLettersPage() {
  const { user } = usePortalAuth();
  const [offers, setOffers] = useState<OfferLetter[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ candidateId: "", position: "", department: "Engineering", salary: 0, joiningDate: "", sendEmail: true, probationMonths: 3, workingHours: "9:00 AM - 6:00 PM", workDays: "Monday to Friday" });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [offRes, candRes] = await Promise.all([
      fetch(`/api/portal/hr/offer-letters?page=${page}&limit=20`, { credentials: "include" }),
      fetch("/api/portal/hr/candidates?status=SELECTED&limit=100", { credentials: "include" }),
    ]);
    if (offRes.ok) { const d = await offRes.json(); setOffers(d.offerLetters || []); setTotal(d.total || 0); }
    if (candRes.ok) { const d = await candRes.json(); setCandidates(d.candidates || []); }
    setLoading(false);
  }, [page]);

  useEffect(() => { if (user) fetchData(); }, [user, fetchData]);

  function prefillFromCandidate(id: string) {
    const c = candidates.find(x => x.id === id);
    if (c) setForm(f => ({ ...f, candidateId: id, position: c.position, department: c.department }));
  }

  async function createOffer() {
    if (!form.candidateId || !form.salary || !form.joiningDate) return alert("Candidate, salary and joining date are required.");
    setCreating(true);
    const res = await fetch("/api/portal/hr/offer-letters", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { await fetchData(); setShowCreate(false); }
    else { const d = await res.json(); alert(d.error); }
    setCreating(false);
  }

  return (
    <PortalLayout navItems={HR_NAV} title="Offer Letters" roleLabel="HR Portal" roleColor="text-emerald-400">
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white">Offer Letters</h2>
            <p className="text-slate-400 text-sm">{total} total · {offers.filter(o => o.status === "ACCEPTED").length} accepted</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-xl transition">+ Generate Offer</button>
        </div>

        <div className="bg-slate-900 rounded-2xl border border-white/5 overflow-hidden">
          {loading ? <div className="p-8 text-center text-slate-500">Loading...</div> :
            offers.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <p className="text-slate-500">No offer letters generated yet</p>
                <p className="text-slate-600 text-sm">Candidates with status "SELECTED" are eligible for offer letters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/3 border-b border-white/5">
                    <tr className="text-left text-xs text-slate-500">
                      <th className="px-4 py-3">Candidate</th>
                      <th className="px-4 py-3">Position</th>
                      <th className="px-4 py-3">Department</th>
                      <th className="px-4 py-3">Salary (p.a.)</th>
                      <th className="px-4 py-3">Joining Date</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Created</th>
                      <th className="px-4 py-3">PDF</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {offers.map(o => (
                      <tr key={o.id} className="hover:bg-white/2 transition">
                        <td className="px-4 py-3">
                          <p className="text-sm text-white font-medium">{o.candidateName}</p>
                          <p className="text-xs text-slate-500">{o.candidateEmail}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-300">{o.position}</td>
                        <td className="px-4 py-3 text-xs text-slate-400">{o.department}</td>
                        <td className="px-4 py-3 text-sm text-white font-medium">₹{o.salary.toLocaleString()}</td>
                        <td className="px-4 py-3 text-xs text-slate-400">{new Date(o.joiningDate).toLocaleDateString("en-IN")}</td>
                        <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[o.status]}`}>{o.status}</span></td>
                        <td className="px-4 py-3 text-xs text-slate-600">{new Date(o.createdAt).toLocaleDateString("en-IN")}</td>
                        <td className="px-4 py-3">
                          <a
                            href={`/api/portal/hr/offer-letters/${o.id}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 hover:text-indigo-300 rounded-lg transition font-medium"
                          >
                            ⬇ PDF
                          </a>
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

      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h3 className="font-semibold text-white">Generate Offer Letter</h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              {candidates.length === 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-yellow-400 text-sm">
                  No selected candidates found. Move candidates to "SELECTED" stage first.
                </div>
              )}
              <div>
                <label className="text-xs text-slate-500 block mb-1">Candidate *</label>
                <select value={form.candidateId} onChange={e => prefillFromCandidate(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white">
                  <option value="">Select candidate...</option>
                  {candidates.map(c => <option key={c.id} value={c.id}>{c.name} — {c.position}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Position *</label>
                  <input value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Department</label>
                  <select value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white">
                    {["Engineering", "Product", "Design", "Marketing", "Sales", "HR", "Finance", "Operations"].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Annual Salary (₹) *</label>
                  <input type="number" min={0} value={form.salary} onChange={e => setForm(f => ({ ...f, salary: +e.target.value }))}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Joining Date *</label>
                  <input type="date" value={form.joiningDate} onChange={e => setForm(f => ({ ...f, joiningDate: e.target.value }))}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Probation (months)</label>
                  <input type="number" min={0} max={12} value={form.probationMonths} onChange={e => setForm(f => ({ ...f, probationMonths: +e.target.value }))}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Work Hours</label>
                  <input value={form.workingHours} onChange={e => setForm(f => ({ ...f, workingHours: e.target.value }))}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
                </div>
              </div>
              <div className="flex items-center gap-3 py-1">
                <input type="checkbox" id="sendEmail" checked={form.sendEmail} onChange={e => setForm(f => ({ ...f, sendEmail: e.target.checked }))} className="rounded" />
                <label htmlFor="sendEmail" className="text-sm text-slate-300">Send offer letter via email to candidate</label>
              </div>
              <button onClick={createOffer} disabled={creating || !form.candidateId}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm rounded-xl transition font-medium">
                {creating ? "Generating..." : "Generate & Send Offer Letter"}
              </button>
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  );
}
