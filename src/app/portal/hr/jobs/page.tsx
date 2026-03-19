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

const LOC = ["REMOTE", "HYBRID", "ONSITE"] as const;
const TYPE = ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"] as const;
const LOC_LABELS: Record<string, string> = { REMOTE: "Remote", HYBRID: "Hybrid", ONSITE: "On-site" };
const TYPE_LABELS: Record<string, string> = { FULL_TIME: "Full-time", PART_TIME: "Part-time", CONTRACT: "Contract", INTERNSHIP: "Internship" };

interface Job {
  id: string;
  title: string;
  slug: string;
  department: string;
  location: string;
  employmentType: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  skills: string[];
  experienceYears: string;
  salaryRange?: string;
  isActive: boolean;
  createdAt: string;
  _count: { applications: number };
}

const EMPTY_FORM = {
  title: "", slug: "", department: "", location: "REMOTE" as const, employmentType: "FULL_TIME" as const,
  description: "", requirements: "", responsibilities: "", skills: "", experienceYears: "", salaryRange: "", isActive: true,
};

function toSlug(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

export default function ManageJobsPage() {
  const { user } = usePortalAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [panel, setPanel] = useState<"none" | "new" | "edit">("none");
  const [editing, setEditing] = useState<Job | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/careers/jobs?all=true", { credentials: "include" });
    if (res.ok) { const d = await res.json(); setJobs(Array.isArray(d.jobs) ? d.jobs : []); }
    setLoading(false);
  }, []);

  useEffect(() => { if (user) fetchJobs(); }, [user, fetchJobs]);

  function set(field: string, val: string | boolean) { setForm(p => ({ ...p, [field]: val })); }

  function openNew() {
    setForm({ ...EMPTY_FORM });
    setEditing(null);
    setError("");
    setPanel("new");
  }

  function openEdit(job: Job) {
    setForm({
      title: job.title, slug: job.slug, department: job.department,
      location: job.location as typeof EMPTY_FORM.location,
      employmentType: job.employmentType as typeof EMPTY_FORM.employmentType,
      description: job.description,
      requirements: Array.isArray(job.requirements) ? job.requirements.join("\n") : "",
      responsibilities: Array.isArray(job.responsibilities) ? job.responsibilities.join("\n") : "",
      skills: Array.isArray(job.skills) ? job.skills.join(", ") : "",
      experienceYears: job.experienceYears,
      salaryRange: job.salaryRange || "",
      isActive: job.isActive,
    });
    setEditing(job);
    setError("");
    setPanel("edit");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      ...form,
      requirements: form.requirements.split("\n").map(s => s.trim()).filter(Boolean),
      responsibilities: form.responsibilities.split("\n").map(s => s.trim()).filter(Boolean),
      skills: form.skills.split(",").map(s => s.trim()).filter(Boolean),
    };

    let res: Response;
    if (panel === "edit" && editing) {
      res = await fetch(`/api/careers/jobs/${editing.slug}`, {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      res = await fetch("/api/careers/jobs", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    const data = await res.json();
    if (!res.ok) { setError(data.error || "Something went wrong"); setSaving(false); return; }
    await fetchJobs();
    setPanel("none");
    setSaving(false);
  }

  async function handleToggle(job: Job) {
    setToggling(job.id);
    await fetch(`/api/careers/jobs/${job.slug}`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !job.isActive }),
    });
    await fetchJobs();
    setToggling(null);
  }

  async function handleDelete(job: Job) {
    if (!confirm(`Delete "${job.title}"? This will also delete all applications for this job.`)) return;
    setDeleting(job.id);
    await fetch(`/api/careers/jobs/${job.slug}`, { method: "DELETE", credentials: "include" });
    await fetchJobs();
    setDeleting(null);
  }

  const activeCount = jobs.filter(j => j.isActive).length;
  const totalApps = jobs.reduce((a, j) => a + (j._count?.applications || 0), 0);

  return (
    <PortalLayout navItems={HR_NAV} title="Manage Jobs" roleLabel="HR Portal" roleColor="text-emerald-400">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Manage Jobs</h2>
            <p className="text-slate-400 text-sm">{activeCount} active · {jobs.length} total · {totalApps} applications</p>
          </div>
          <div className="flex gap-2">
            <a href="/careers" target="_blank" rel="noopener noreferrer"
              className="text-sm px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition">
              Preview Page ↗
            </a>
            <button onClick={openNew}
              className="text-sm px-4 py-2 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition">
              + Post a Job
            </button>
          </div>
        </div>

        {/* Jobs list */}
        <div className="bg-slate-900 rounded-2xl border border-white/5 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading...</div>
          ) : jobs.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-5xl mb-3">💼</div>
              <p className="text-slate-400 mb-4">No jobs posted yet</p>
              <button onClick={openNew}
                className="text-sm px-5 py-2.5 bg-emerald-500 text-white font-medium rounded-xl hover:bg-emerald-600 transition">
                Post your first job
              </button>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {jobs.map(job => (
                <div key={job.id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/2 transition">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-white">{job.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${job.isActive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-slate-500/10 text-slate-400 border-slate-500/20"}`}>
                        {job.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {job.department} · {LOC_LABELS[job.location] || job.location} · {TYPE_LABELS[job.employmentType] || job.employmentType} · {job.experienceYears}
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {job._count?.applications || 0} application{(job._count?.applications || 0) !== 1 ? "s" : ""} · Posted {new Date(job.createdAt).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a href={`/careers/${job.slug}`} target="_blank" rel="noopener noreferrer"
                      className="text-xs px-3 py-1.5 bg-white/5 border border-white/10 text-slate-400 hover:text-white rounded-lg transition">
                      Preview
                    </a>
                    <a href={`/portal/hr/job-applications?jobId=${job.id}`}
                      className="text-xs px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 rounded-lg transition">
                      Applications ({job._count?.applications || 0})
                    </a>
                    <button onClick={() => openEdit(job)}
                      className="text-xs px-3 py-1.5 bg-white/5 border border-white/10 text-slate-400 hover:text-white rounded-lg transition">
                      Edit
                    </button>
                    <button onClick={() => handleToggle(job)} disabled={toggling === job.id}
                      className={`text-xs px-3 py-1.5 border rounded-lg transition disabled:opacity-50 ${job.isActive ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"}`}>
                      {toggling === job.id ? "..." : job.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button onClick={() => handleDelete(job)} disabled={deleting === job.id}
                      className="text-xs px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-lg transition disabled:opacity-50">
                      {deleting === job.id ? "..." : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Slide-over panel: Create / Edit Job ── */}
      {panel !== "none" && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setPanel("none")} />
          <div className="relative w-full max-w-2xl bg-slate-950 border-l border-white/10 h-full overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-slate-950 border-b border-white/5 px-6 py-4 flex items-center justify-between z-10">
              <h3 className="font-semibold text-white">
                {panel === "new" ? "Post a New Job" : `Edit: ${editing?.title}`}
              </h3>
              <button onClick={() => setPanel("none")} className="text-slate-400 hover:text-white text-2xl leading-none">×</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">{error}</div>
              )}

              {/* Title + Slug */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Job Title *</label>
                  <input required value={form.title}
                    onChange={e => { set("title", e.target.value); if (panel === "new") set("slug", toSlug(e.target.value)); }}
                    placeholder="e.g. Senior Frontend Engineer"
                    className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-600 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">URL Slug *</label>
                  <input required value={form.slug} onChange={e => set("slug", toSlug(e.target.value))}
                    placeholder="senior-frontend-engineer"
                    className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-600 rounded-xl px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  <p className="text-xs text-slate-600 mt-1">careers/{form.slug || "..."}</p>
                </div>
              </div>

              {/* Department + Experience */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Department *</label>
                  <input required value={form.department} onChange={e => set("department", e.target.value)}
                    placeholder="e.g. Engineering"
                    className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-600 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Experience Required *</label>
                  <input required value={form.experienceYears} onChange={e => set("experienceYears", e.target.value)}
                    placeholder="e.g. 2-4 years"
                    className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-600 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>

              {/* Location + Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Work Location *</label>
                  <select value={form.location} onChange={e => set("location", e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    {LOC.map(l => <option key={l} value={l}>{LOC_LABELS[l]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Employment Type *</label>
                  <select value={form.employmentType} onChange={e => set("employmentType", e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    {TYPE.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                  </select>
                </div>
              </div>

              {/* Salary */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Salary Range <span className="text-slate-600">(optional)</span></label>
                <input value={form.salaryRange} onChange={e => set("salaryRange", e.target.value)}
                  placeholder="e.g. ₹12L – ₹18L per year"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-600 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Job Description *</label>
                <textarea required value={form.description} onChange={e => set("description", e.target.value)}
                  rows={5} placeholder="Describe the role, team, and what the candidate will work on..."
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-600 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
              </div>

              {/* Responsibilities */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Responsibilities *</label>
                <p className="text-xs text-slate-600 mb-1.5">One per line</p>
                <textarea required value={form.responsibilities} onChange={e => set("responsibilities", e.target.value)}
                  rows={5} placeholder={"Build and ship features\nCollaborate with product team\nWrite clean, tested code"}
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-600 rounded-xl px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
              </div>

              {/* Requirements */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Requirements *</label>
                <p className="text-xs text-slate-600 mb-1.5">One per line</p>
                <textarea required value={form.requirements} onChange={e => set("requirements", e.target.value)}
                  rows={5} placeholder={"3+ years React experience\nStrong TypeScript skills\nFamiliarity with REST APIs"}
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-600 rounded-xl px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
              </div>

              {/* Skills */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Skills / Tags *</label>
                <p className="text-xs text-slate-600 mb-1.5">Comma separated</p>
                <input required value={form.skills} onChange={e => set("skills", e.target.value)}
                  placeholder="React, TypeScript, Node.js, MongoDB"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-600 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>

              {/* Active toggle */}
              <div className="flex items-center gap-3 bg-white/3 rounded-xl px-4 py-3 border border-white/5">
                <button type="button" onClick={() => set("isActive", !form.isActive)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${form.isActive ? "bg-emerald-500" : "bg-white/10"}`}>
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive ? "translate-x-5" : ""}`} />
                </button>
                <div>
                  <p className="text-sm text-white font-medium">{form.isActive ? "Active — visible on careers page" : "Inactive — hidden from careers page"}</p>
                  <p className="text-xs text-slate-500">Toggle to publish or unpublish this role</p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setPanel("none")}
                  className="flex-1 py-3 bg-white/5 border border-white/10 text-slate-400 rounded-xl text-sm hover:bg-white/10 transition">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-3 bg-emerald-500 text-white font-semibold rounded-xl text-sm hover:bg-emerald-600 transition disabled:opacity-50">
                  {saving ? "Saving..." : panel === "new" ? "Post Job" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PortalLayout>
  );
}
