"use client";

import { useEffect, useState } from "react";

interface Application {
  id: string;
  status: string;
  createdAt: string;
  interviewDate?: string | null;
  coverLetter?: string;
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
        return (
          <div key={step} className="flex items-center gap-1 shrink-0">
            <div className={`h-2 w-2 rounded-full transition-colors ${done ? "bg-primary" : "bg-border"}`} />
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

  useEffect(() => {
    fetch("/api/candidates/applications")
      .then(r => r.json())
      .then(d => setApps(Array.isArray(d.applications) ? d.applications : []))
      .finally(() => setLoading(false));
  }, []);

  const FILTERS = ["ALL", "PENDING", "REVIEWED", "SHORTLISTED", "INTERVIEW_SCHEDULED", "HIRED", "REJECTED"];
  const filtered = filter === "ALL" ? apps : apps.filter(a => a.status === filter);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">My Applications</h1>
        <p className="text-muted-foreground text-sm">Track the status of all your job applications</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1 rounded-full border transition ${filter === f ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary hover:text-foreground"}`}>
            {f.replace(/_/g, " ")}
            {f !== "ALL" && ` (${apps.filter(a => a.status === f).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-28 bg-card border border-border rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl py-12 text-center">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-muted-foreground text-sm">
            {filter === "ALL" ? "You haven't applied to any jobs yet." : `No applications with status "${filter.replace(/_/g, " ")}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(app => (
            <div key={app.id} className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground text-sm truncate">{app.job.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {app.job.department} · {app.job.location} · {app.job.employmentType?.replace(/_/g, " ")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Applied {new Date(app.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[app.status] || "bg-muted text-muted-foreground"}`}>
                  {app.status.replace(/_/g, " ")}
                </span>
              </div>

              {app.interviewDate && (
                <div className="mt-3 flex items-center gap-2 text-xs text-violet-400 bg-violet-500/10 px-3 py-2 rounded-lg">
                  <span>📅</span>
                  <span>Interview scheduled: <strong>{new Date(app.interviewDate).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</strong></span>
                </div>
              )}

              <StatusTimeline current={app.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
