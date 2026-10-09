"use client";

import { useEffect, useState, useCallback } from "react";
import { useCompanyAuth } from "@/contexts/CompanyAuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

const LOC_LABELS: Record<string, string> = { REMOTE: "Remote", HYBRID: "Hybrid", ONSITE: "On-site" };
const TYPE_LABELS: Record<string, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
};

interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  employmentType: string;
  description: string;
  experience?: string;
  salaryMin?: number;
  salaryMax?: number;
  isActive: boolean;
  createdAt: string;
  applicationsCount?: number;
  viewCount?: number;
}

export default function CompanyManageJobsPage() {
  const { user, company } = useCompanyAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/company/jobs");
      if (res.ok) {
        const d = await res.json();
        setJobs(d.jobs || []);
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchJobs();
  }, [user, fetchJobs]);

  async function handleToggle(job: Job) {
    setToggling(job.id);
    await fetch(`/api/company/jobs/${job.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !job.isActive }),
    });
    await fetchJobs();
    setToggling(null);
  }

  async function handleDelete(job: Job) {
    if (!confirm(`Delete "${job.title}"? This will also delete all applications for this job.`))
      return;
    setDeleting(job.id);
    await fetch(`/api/company/jobs/${job.id}`, { method: "DELETE", credentials: "include" });
    await fetchJobs();
    setDeleting(null);
  }

  const activeCount = jobs.filter((j) => j.isActive).length;
  const totalApps = jobs.reduce((a, j) => a + (j.applicationsCount || 0), 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Manage Jobs</h2>
          <p className="text-slate-400 text-sm">
            {activeCount} active · {jobs.length} total · {totalApps} applications
          </p>
        </div>
        <div className="flex gap-2">
          {company?.slug && (
            <a
              href={`/careers/${company.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition"
            >
              Public Page ↗
            </a>
          )}
          <Link
            href="/company/portal/jobs/new"
            className="text-sm px-4 py-2 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition"
          >
            + Post a Job
          </Link>
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
            <Link
              href="/company/portal/jobs/new"
              className="text-sm px-5 py-2.5 bg-emerald-500 text-white font-medium rounded-xl hover:bg-emerald-600 transition"
            >
              Post your first job
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 hover:bg-white/2 transition"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-white">{job.title}</p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                        job.isActive
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                      }`}
                    >
                      {job.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {job.department} · {LOC_LABELS[job.location] || job.location} ·{" "}
                    {TYPE_LABELS[job.employmentType] || job.employmentType}
                    {job.experience ? ` · ${job.experience}` : ""}
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {job.applicationsCount || 0} application
                    {(job.applicationsCount || 0) !== 1 ? "s" : ""} · Posted{" "}
                    {new Date(job.createdAt).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {company?.slug && (
                    <a
                      href={`/careers/${company.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-3 py-1.5 bg-white/5 border border-white/10 text-slate-400 hover:text-white rounded-lg transition"
                    >
                      Preview
                    </a>
                  )}
                  <Link
                    href={`/company/portal/applications?jobId=${job.id}`}
                    className="text-xs px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 rounded-lg transition"
                  >
                    Applications ({job.applicationsCount || 0})
                  </Link>
                  <Link
                    href={`/company/portal/jobs/${job.id}/edit`}
                    className="text-xs px-3 py-1.5 bg-white/5 border border-white/10 text-slate-400 hover:text-white rounded-lg transition"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleToggle(job)}
                    disabled={toggling === job.id}
                    className={`text-xs px-3 py-1.5 border rounded-lg transition disabled:opacity-50 ${
                      job.isActive
                        ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20"
                        : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
                    }`}
                  >
                    {toggling === job.id ? "..." : job.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() => handleDelete(job)}
                    disabled={deleting === job.id}
                    className="text-xs px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-lg transition disabled:opacity-50"
                  >
                    {deleting === job.id ? "..." : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
