"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getRelativeTime } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

interface Application {
  id: string;
  status: string;
  createdAt: string;
  interviewDate?: string | null;
  coverLetter?: string;
  isAutoApplied?: boolean;
  job: {
    title: string;
    department: string;
    location: string;
    employmentType: string;
    slug: string;
  };
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-400",
  REVIEWED: "bg-blue-500/10 text-blue-400",
  SHORTLISTED: "bg-emerald-500/10 text-emerald-400",
  INTERVIEW_SCHEDULED: "bg-violet-500/10 text-violet-400",
  REJECTED: "bg-red-500/10 text-red-400",
  HIRED: "bg-purple-500/10 text-purple-400",
};

const TIMELINE = ["PENDING", "REVIEWED", "SHORTLISTED", "INTERVIEW_SCHEDULED", "HIRED"];

function StatusTimeline({ current }: { current: string }) {
  if (current === "REJECTED") {
    return (
      <div className="mt-3 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-red-400 shrink-0" />
        <span className="text-xs text-red-400 font-medium">Application not moved forward</span>
      </div>
    );
  }
  const currentIdx = TIMELINE.indexOf(current);
  return (
    <div className="mt-3 flex items-center gap-1 overflow-x-auto pb-1">
      {TIMELINE.map((step, idx) => {
        const done = idx <= currentIdx;
        const isCurrent = idx === currentIdx;
        return (
          <div key={step} className="flex items-center gap-1 shrink-0">
            <div className={`h-2 w-2 rounded-full transition-colors ${
              isCurrent ? "bg-primary animate-pulse" : done ? "bg-primary" : "bg-border"
            }`} />
            <span className={`text-[10px] whitespace-nowrap ${done ? "text-primary font-medium" : "text-muted-foreground"}`}>
              {step.replace(/_/g, " ")}
            </span>
            {idx < TIMELINE.length - 1 && <div className={`h-0.5 w-4 ${done && idx < currentIdx ? "bg-primary" : "bg-border"}`} />}
          </div>
        );
      })}
    </div>
  );
}

export default function ApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "status">("newest");
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchApplications = useCallback(() => {
    fetch("/api/candidates/applications")
      .then(r => r.json())
      .then(d => {
        setApps(Array.isArray(d.applications) ? d.applications : []);
        setLastUpdated(new Date());
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchApplications();
    // Poll every 60 seconds for status updates
    const interval = setInterval(fetchApplications, 60000);
    return () => clearInterval(interval);
  }, [fetchApplications]);

  const FILTERS = ["ALL", "PENDING", "REVIEWED", "SHORTLISTED", "INTERVIEW_SCHEDULED", "HIRED", "REJECTED"];

  // Compute counts for each filter
  const counts: Record<string, number> = {
    ALL: apps.length,
    PENDING: apps.filter(a => a.status === "PENDING").length,
    REVIEWED: apps.filter(a => a.status === "REVIEWED").length,
    SHORTLISTED: apps.filter(a => a.status === "SHORTLISTED").length,
    INTERVIEW_SCHEDULED: apps.filter(a => a.status === "INTERVIEW_SCHEDULED").length,
    HIRED: apps.filter(a => a.status === "HIRED").length,
    REJECTED: apps.filter(a => a.status === "REJECTED").length,
  };

  // Filter and sort applications
  const filtered = filter === "ALL" ? apps : apps.filter(a => a.status === filter);
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return a.status.localeCompare(b.status);
  });

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">My Applications</h1>
          <p className="text-muted-foreground text-sm">Track the status of all your job applications</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Updated {getRelativeTime(lastUpdated)}
        </p>
      </div>

      {/* Filters and Sort */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1 rounded-full border transition ${filter === f ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary hover:text-foreground"}`}>
              {f === "ALL" ? `All (${counts.ALL})` : `${f.replace(/_/g, " ")} (${counts[f]})`}
            </button>
          ))}
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="text-xs px-3 py-1.5 rounded-lg bg-card border border-border text-foreground focus:outline-none focus:border-primary"
        >
          <option value="newest">Most Recent</option>
          <option value="oldest">Oldest</option>
          <option value="status">By Status</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-28 bg-card border border-border rounded-2xl animate-pulse" />)}
        </div>
      ) : sorted.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl py-12 text-center">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-muted-foreground text-sm">
            {filter === "ALL" ? "You haven't applied to any jobs yet." : `No applications with status "${filter.replace(/_/g, " ")}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map(app => (
            <Link
              key={app.id}
              href={`/candidates/dashboard/applications/${app.id}`}
              className="block"
            >
              <div className="bg-card border border-border rounded-2xl p-5 hover:border-primary hover:shadow-lg transition-all hover:bg-card/70 cursor-pointer group">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-foreground text-sm truncate group-hover:text-primary transition-colors">{app.job.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {app.job.department} · {app.job.location} · {app.job.employmentType?.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                      <span>Applied {getRelativeTime(app.createdAt)}</span>
                      {app.isAutoApplied && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-purple-500/10 text-purple-400 rounded text-[10px] font-medium">
                          ⚡ Auto-Applied
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[app.status] || "bg-muted text-muted-foreground"}`}>
                      {app.status.replace(/_/g, " ")}
                    </span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100" />
                  </div>
                </div>

                {app.interviewDate && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-violet-400 bg-violet-500/10 px-3 py-2 rounded-lg">
                    <span>📅</span>
                    <span>Interview scheduled: <strong>{new Date(app.interviewDate).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</strong></span>
                  </div>
                )}

                <StatusTimeline current={app.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
