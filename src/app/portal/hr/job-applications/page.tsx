"use client";

import { useEffect, useState, useCallback } from "react";
import PortalLayout from "@/components/PortalLayout";
import { usePortalAuth } from "@/contexts/PortalAuthContext";

const HR_NAV = [
  { label: "Dashboard", href: "/portal/hr" },
  { label: "Employees", href: "/portal/hr/employees" },
  { label: "Candidates", href: "/portal/hr/candidates" },
  { label: "Interviews", href: "/portal/hr/interviews" },
  { label: "Manage Jobs", href: "/portal/hr/jobs" },
  { label: "Job Applications", href: "/portal/hr/job-applications" },
  { label: "Leave Requests", href: "/portal/hr/leaves" },
  { label: "Attendance", href: "/portal/hr/attendance" },
  { label: "Payroll", href: "/portal/hr/payroll" },
  { label: "Offer Letters", href: "/portal/hr/offer-letters" },
  { label: "Certificates", href: "/portal/hr/certificates" },
  { label: "Send Email", href: "/portal/hr/send-email" },
  { label: "Email Logs", href: "/portal/hr/email-logs" },
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  REVIEWED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  SHORTLISTED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  INTERVIEW_SCHEDULED: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  REJECTED: "bg-red-500/10 text-red-400 border-red-500/20",
  HIRED: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

const STATUS_OPTIONS = ["PENDING", "REVIEWED", "SHORTLISTED", "INTERVIEW_SCHEDULED", "REJECTED", "HIRED"];

interface Application {
  id: string;
  name: string;
  email: string;
  phone: string;
  resumeUrl: string;
  resumeName?: string;
  portfolio?: string;
  linkedin?: string;
  experience: string;
  coverLetter?: string;
  notes?: string;
  status: string;
  interviewDate?: string | null;
  createdAt: string;
  job: { title: string; slug: string; department: string };
}

interface Job { id: string; title: string; department: string }
interface Stat { status: string; _count: number }

export default function JobApplicationsPage() {
  const { user } = usePortalAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [jobFilter, setJobFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Application | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [interviewDate, setInterviewDate] = useState("");

  const fetchApps = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    if (jobFilter) params.set("jobId", jobFilter);
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/portal/hr/job-applications?${params}`, { credentials: "include" });
    if (res.ok) {
      const d = await res.json();
      setApplications(d.applications);
      setTotal(d.total);
      setStats(d.stats);
      if (d.jobs?.length > 0) setJobs(d.jobs);
    }
    setLoading(false);
  }, [page, search, jobFilter, statusFilter]);

  useEffect(() => { if (user) fetchApps(); }, [user, fetchApps]);

  async function updateApplication(id: string, data: { status?: string; notes?: string; interviewDate?: string | null }) {
    setActionLoading(true);
    const res = await fetch(`/api/portal/hr/job-applications/${id}`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) { await fetchApps(); setSelected(null); }
    setActionLoading(false);
  }

  const totalApplications = stats.reduce((a, s) => a + (Number(s._count) || 0), 0);

  return (
    <PortalLayout navItems={HR_NAV} title="Job Applications" roleLabel="HR Portal" roleColor="text-blue-400">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Job Applications</h2>
            <p className="text-slate-400 text-sm">{total} total applications</p>
          </div>
          <a href="/careers" target="_blank" rel="noopener noreferrer"
            className="text-sm px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition">
            View Careers Page ↗
          </a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {STATUS_OPTIONS.map((s) => {
            const st = stats.find((x) => x.status === s);
            const count = st ? Number(st._count) : 0;
            const pct = totalApplications > 0 ? Math.round((count / totalApplications) * 100) : 0;
            return (
              <button key={s} onClick={() => setStatusFilter(statusFilter === s ? "" : s)}
                className={`rounded-xl border p-3 text-left transition-all ${statusFilter === s ? STATUS_COLORS[s] + " ring-2 ring-offset-1 ring-offset-slate-950" : "border-white/5 bg-white/3 hover:bg-white/5"}`}>
                <p className="text-lg font-bold text-white">{count}</p>
                <p className="text-xs text-slate-400 mt-0.5">{s[0] + s.slice(1).toLowerCase()}</p>
                <p className="text-xs text-slate-600 mt-0.5">{pct}%</p>
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search applicant name or email..."
            className="flex-1 min-w-[200px] bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <select value={jobFilter} onChange={e => { setJobFilter(e.target.value); setPage(1); }}
            className="bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:outline-none">
            <option value="">All Positions</option>
            {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:outline-none">
            <option value="">All Status</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s[0] + s.slice(1).toLowerCase()}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="bg-slate-900 rounded-2xl border border-white/5 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading...</div>
          ) : applications.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-5xl mb-3">📋</div>
              <p className="text-slate-400">No applications yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5 text-xs text-slate-500">
                    <th className="text-left px-5 py-3">Applicant</th>
                    <th className="text-left px-5 py-3">Position</th>
                    <th className="text-left px-5 py-3">Experience</th>
                    <th className="text-left px-5 py-3">Resume</th>
                    <th className="text-left px-5 py-3">Applied</th>
                    <th className="text-left px-5 py-3">Status</th>
                    <th className="text-right px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {applications.map(app => (
                    <tr key={app.id} className="hover:bg-white/2 transition">
                      <td className="px-5 py-3">
                        <p className="text-sm font-medium text-white">{app.name}</p>
                        <p className="text-xs text-slate-500">{app.email}</p>
                        <p className="text-xs text-slate-600">{app.phone}</p>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-sm text-white">{app.job.title}</p>
                        <p className="text-xs text-slate-500">{app.job.department}</p>
                      </td>
                      <td className="px-5 py-3 text-sm text-slate-400">{app.experience}</td>
                      <td className="px-5 py-3">
                        {app.resumeUrl ? (
                          <a href={app.resumeUrl} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            View
                          </a>
                        ) : (
                          <span className="text-xs text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-400">{new Date(app.createdAt).toLocaleDateString("en-IN")}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[app.status] || "bg-slate-500/10 text-slate-400"}`}>
                          {app.status[0] + app.status.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button onClick={() => { setSelected(app); setNotes(app.notes || ""); }}
                          className="text-xs text-blue-400 hover:text-blue-300 transition">View</button>
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

      {/* ── Application Detail Modal ── */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-start justify-between p-5 border-b border-white/5 sticky top-0 bg-slate-900 z-10">
              <div>
                <h3 className="font-semibold text-white">{selected.name}</h3>
                <p className="text-sm text-slate-400">{selected.job.title} · {selected.job.department}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-white text-xl">×</button>
            </div>
            <div className="p-5 space-y-5">
              {/* Contact */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: "Email", value: selected.email },
                  { label: "Phone", value: selected.phone },
                  { label: "Experience", value: selected.experience },
                  { label: "Applied", value: new Date(selected.createdAt).toLocaleDateString("en-IN") },
                ].map(r => (
                  <div key={r.label} className="bg-white/5 rounded-xl px-3 py-2.5">
                    <p className="text-xs text-slate-500 mb-0.5">{r.label}</p>
                    <p className="text-white">{r.value}</p>
                  </div>
                ))}
              </div>

              {/* Links */}
              <div className="flex flex-wrap gap-2">
                {selected.resumeUrl && (
                  <a href={selected.resumeUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    View Resume
                  </a>
                )}
                {selected.resumeUrl && (
                  <a href={selected.resumeUrl} download target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/20 transition">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Download Resume
                  </a>
                )}
                {selected.portfolio && (
                  <a href={selected.portfolio} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white/5 border border-white/10 text-slate-400 rounded-lg hover:bg-white/10 transition">
                    Portfolio ↗
                  </a>
                )}
                {selected.linkedin && (
                  <a href={selected.linkedin} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white/5 border border-white/10 text-slate-400 rounded-lg hover:bg-white/10 transition">
                    LinkedIn ↗
                  </a>
                )}
              </div>

              {/* Resume Preview */}
              {selected.resumeUrl && (
                <div className="border border-white/8 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 bg-white/3 border-b border-white/8">
                    <p className="text-xs text-slate-400 font-medium">Resume Preview</p>
                    <span className="text-[10px] text-slate-600">{selected.resumeName || "resume.pdf"}</span>
                  </div>
                  <iframe
                    src={selected.resumeUrl}
                    className="w-full h-80 bg-slate-950"
                    title={`Resume - ${selected.name}`}
                  />
                </div>
              )}

              {/* Cover Letter */}
              {selected.coverLetter && (
                <div className="bg-white/3 border border-white/8 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-2">Cover Letter</p>
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{selected.coverLetter}</p>
                </div>
              )}

              {/* Update Status */}
              <div className="border-t border-white/5 pt-4 space-y-3">
                <p className="text-sm font-medium text-white">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map(s => (
                    <button key={s} onClick={() => {
                      if (s === "INTERVIEW_SCHEDULED") return; // handled below
                      updateApplication(selected.id, { status: s });
                    }}
                      disabled={actionLoading || selected.status === s || s === "INTERVIEW_SCHEDULED"}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all disabled:cursor-default ${selected.status === s ? STATUS_COLORS[s] + " opacity-100" : s === "INTERVIEW_SCHEDULED" ? "hidden" : "border-white/10 text-slate-400 hover:border-white/20 hover:text-white"}`}>
                      {s.replace(/_/g, " ")[0] + s.replace(/_/g, " ").slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>

                {/* Interview Date Scheduler */}
                <div className="border border-violet-500/20 bg-violet-500/5 rounded-xl p-3 space-y-2">
                  <p className="text-xs font-medium text-violet-300">📅 Schedule Interview</p>
                  <div className="flex gap-2">
                    <input type="datetime-local" value={interviewDate} onChange={e => setInterviewDate(e.target.value)}
                      className="flex-1 bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500" />
                    <button disabled={actionLoading || !interviewDate}
                      onClick={() => updateApplication(selected.id, { status: "INTERVIEW_SCHEDULED", interviewDate })}
                      className="text-xs px-4 py-2 bg-violet-500 text-white rounded-lg font-medium hover:bg-violet-600 transition disabled:opacity-50 disabled:cursor-not-allowed">
                      Schedule
                    </button>
                  </div>
                  {selected.interviewDate && (
                    <p className="text-xs text-violet-300">Current: {new Date(selected.interviewDate).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>
                  )}
                </div>
              </div>

              {/* Internal Notes */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-white">Internal Notes</p>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                  placeholder="Add internal notes about this candidate..."
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-600 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                <button onClick={() => updateApplication(selected.id, { notes })}
                  disabled={actionLoading}
                  className="text-xs px-4 py-2 bg-white/10 border border-white/10 text-white rounded-lg hover:bg-white/15 transition disabled:opacity-50">
                  Save Notes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  );
}
