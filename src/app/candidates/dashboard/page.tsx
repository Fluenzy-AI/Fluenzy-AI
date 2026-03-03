"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Application {
  id: string;
  status: string;
  createdAt: string;
  job: { title: string; department: string; location: string };
}

interface Profile {
  profileCompletion: number;
  resumeUrl?: string;
  skills?: string[];
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-400",
  REVIEWED: "bg-blue-500/10 text-blue-400",
  SHORTLISTED: "bg-emerald-500/10 text-emerald-400",
  INTERVIEW_SCHEDULED: "bg-violet-500/10 text-violet-400",
  REJECTED: "bg-red-500/10 text-red-400",
  HIRED: "bg-purple-500/10 text-purple-400",
};

export default function CandidateOverviewPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/candidates/applications").then(r => r.json()),
      fetch("/api/candidates/profile").then(r => r.json()),
    ]).then(([a, p]) => {
      setApps(Array.isArray(a.applications) ? a.applications : []);
      setProfile(p.profile || null);
    }).finally(() => setLoading(false));
  }, []);

  const stats = {
    total: apps.length,
    pending: apps.filter(a => a.status === "PENDING").length,
    shortlisted: apps.filter(a => a.status === "SHORTLISTED").length,
    interview: apps.filter(a => a.status === "INTERVIEW_SCHEDULED").length,
    hired: apps.filter(a => a.status === "HIRED").length,
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Overview</h1>
          <p className="text-muted-foreground text-sm">Welcome back to your candidate dashboard</p>
        </div>
        <Link href="/careers"
          className="text-sm px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition">
          Browse Jobs
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Applied", value: stats.total, color: "text-foreground" },
          { label: "Pending", value: stats.pending, color: "text-yellow-400" },
          { label: "Shortlisted", value: stats.shortlisted, color: "text-emerald-400" },
          { label: "Interviews", value: stats.interview, color: "text-violet-400" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <p className={`text-2xl font-bold ${s.color}`}>{loading ? "—" : s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Profile completion CTA */}
      {profile && profile.profileCompletion < 80 && (
        <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-5 flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-foreground text-sm">Complete your profile</p>
            <p className="text-muted-foreground text-xs mt-0.5">Your profile is {profile.profileCompletion}% complete. Add more details to stand out to recruiters.</p>
          </div>
          <Link href="/candidates/dashboard/profile"
            className="shrink-0 text-sm px-4 py-2 rounded-xl bg-violet-500 text-white font-medium hover:bg-violet-600 transition">
            Complete Profile
          </Link>
        </div>
      )}

      {/* Recent Applications */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">Recent Applications</h2>
          <Link href="/candidates/dashboard/applications" className="text-xs text-primary hover:underline">View all</Link>
        </div>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-card border border-border rounded-xl animate-pulse" />)}
          </div>
        ) : apps.length === 0 ? (
          <div className="bg-card border border-border rounded-xl py-10 text-center">
            <p className="text-3xl mb-2">📭</p>
            <p className="text-muted-foreground text-sm">No applications yet</p>
            <Link href="/careers" className="text-primary text-sm hover:underline mt-1 block">Browse open positions →</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {apps.slice(0, 5).map(app => (
              <div key={app.id} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{app.job.title}</p>
                  <p className="text-xs text-muted-foreground">{app.job.department} · {new Date(app.createdAt).toLocaleDateString("en-IN")}</p>
                </div>
                <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[app.status] || "bg-muted text-muted-foreground"}`}>
                  {app.status.replace(/_/g, " ")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
