"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Application {
  id: string;
  status: string;
  createdAt: string;
  job: { title: string; department: string; location: string; slug?: string };
}

interface Profile {
  profileCompletion: number;
  resumeUrl?: string;
  skills?: string[];
  phone?: string;
  bio?: string;
}

interface Candidate {
  id: string;
  name: string;
  email: string;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  REVIEWED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  SHORTLISTED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  INTERVIEW_SCHEDULED: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  REJECTED: "bg-red-500/10 text-red-400 border-red-500/20",
  HIRED: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

const TIMELINE_STEPS = [
  { key: "PENDING", label: "Applied" },
  { key: "REVIEWED", label: "Reviewed" },
  { key: "SHORTLISTED", label: "Shortlisted" },
  { key: "INTERVIEW_SCHEDULED", label: "Interview" },
  { key: "HIRED", label: "Hired" },
];

function StatusTimeline({ status }: { status: string }) {
  if (status === "REJECTED") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-red-400 mt-1">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" /> Not selected
      </span>
    );
  }
  const currentIdx = TIMELINE_STEPS.findIndex(s => s.key === status);
  return (
    <div className="flex items-center gap-1 mt-2">
      {TIMELINE_STEPS.map((step, i) => {
        const done = i <= currentIdx;
        const active = i === currentIdx;
        return (
          <div key={step.key} className="flex items-center gap-1">
            <div className="flex flex-col items-center">
              <div className={`w-2 h-2 rounded-full transition-all ${active ? "bg-violet-400 ring-2 ring-violet-400/30" : done ? "bg-emerald-400" : "bg-border"}`} />
              <span className={`text-[9px] mt-0.5 hidden sm:block ${active ? "text-violet-400 font-medium" : done ? "text-emerald-400" : "text-muted-foreground"}`}>
                {step.label}
              </span>
            </div>
            {i < TIMELINE_STEPS.length - 1 && (
              <div className={`h-px w-4 sm:w-6 mb-3 ${i < currentIdx ? "bg-emerald-400" : "bg-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function SkeletonCard() {
  return <div className="h-20 bg-card border border-border rounded-2xl animate-pulse" />;
}

function QuickActionCard({
  href, icon, label, desc, color,
}: { href: string; icon: React.ReactNode; label: string; desc: string; color: string }) {
  return (
    <Link href={href} className="group bg-card border border-border rounded-2xl p-4 hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-500/5 transition-all">
      <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <p className="text-sm font-semibold text-foreground">{label}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
    </Link>
  );
}

export default function CandidateOverviewPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/candidates/applications").then(r => r.json()),
      fetch("/api/candidates/profile").then(r => r.json()),
      fetch("/api/candidates/me").then(r => r.json()),
    ]).then(([a, p, m]) => {
      setApps(Array.isArray(a.applications) ? a.applications : []);
      setProfile(p.profile || null);
      setCandidate(m.candidate || null);
    }).finally(() => setLoading(false));
  }, []);

  const stats = {
    total: apps.length,
    pending: apps.filter(a => a.status === "PENDING").length,
    shortlisted: apps.filter(a => a.status === "SHORTLISTED").length,
    interview: apps.filter(a => a.status === "INTERVIEW_SCHEDULED").length,
    hired: apps.filter(a => a.status === "HIRED").length,
  };

  const upcoming = apps.find(a => a.status === "INTERVIEW_SCHEDULED");
  const completion = profile?.profileCompletion ?? 0;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = candidate?.name?.split(" ")[0] ?? "there";

  return (
    <div className="max-w-5xl space-y-6">
      {/* Welcome banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-2xl p-5 sm:p-6 text-white shadow-xl shadow-violet-500/20">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 70% 50%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-violet-200 text-sm font-medium">{greeting} 👋</p>
            <h1 className="text-2xl font-bold mt-0.5">{loading ? "Loading..." : firstName}</h1>
            <p className="text-violet-200 text-sm mt-1">
              {stats.total === 0
                ? "Start your journey — browse open positions below."
                : `${stats.total} application${stats.total !== 1 ? "s" : ""} · ${stats.shortlisted} shortlisted · ${stats.interview} interview${stats.interview !== 1 ? "s" : ""} scheduled`}
            </p>
          </div>
          <Link href="/careers"
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-sm font-medium text-white transition backdrop-blur-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Browse Jobs
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Applied", value: stats.total, icon: "📋", color: "text-foreground", sub: "all time" },
          { label: "Pending Review", value: stats.pending, icon: "⏳", color: "text-yellow-400", sub: "awaiting" },
          { label: "Shortlisted", value: stats.shortlisted, icon: "⭐", color: "text-emerald-400", sub: "selected" },
          { label: "Interviews", value: stats.interview, icon: "🎯", color: "text-violet-400", sub: "scheduled" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-4 hover:border-violet-500/20 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <span className="text-lg">{s.icon}</span>
              {loading && <div className="w-8 h-6 bg-border rounded animate-pulse" />}
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{loading ? "—" : s.value}</p>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">{s.label}</p>
            <p className="text-[10px] text-muted-foreground/60 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Body: 2-column */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick actions */}
          <div>
            <h2 className="text-sm font-bold text-foreground mb-3">Quick Actions</h2>
            <div className="grid grid-cols-3 gap-3">
              <QuickActionCard
                href="/candidates/dashboard/profile"
                label="Edit Profile"
                desc="Update your info"
                color="bg-violet-500/10 text-violet-400"
                icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
              />
              <QuickActionCard
                href="/candidates/dashboard/profile#resume"
                label="Upload Resume"
                desc="Attach your CV"
                color="bg-emerald-500/10 text-emerald-400"
                icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>}
              />
              <QuickActionCard
                href="/careers"
                label="Browse Jobs"
                desc="Find new roles"
                color="bg-blue-500/10 text-blue-400"
                icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
              />
            </div>
          </div>

          {/* Applied Jobs */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-foreground">Applied Jobs</h2>
              <Link href="/candidates/dashboard/applications" className="text-xs text-primary hover:underline font-medium">View all →</Link>
            </div>
            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>
            ) : apps.length === 0 ? (
              <div className="bg-card border border-dashed border-border rounded-2xl py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                  <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <p className="text-muted-foreground text-sm font-medium">No applications yet</p>
                <p className="text-xs text-muted-foreground mt-0.5 mb-4">Start applying to positions that match your skills</p>
                <Link href="/careers" className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:underline">
                  Browse open positions →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {apps.slice(0, 6).map(app => (
                  <div key={app.id} className="bg-card border border-border rounded-2xl px-4 py-4 hover:border-violet-500/20 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground truncate">{app.job.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {app.job.department}{app.job.location ? ` · ${app.job.location}` : ""} · Applied {new Date(app.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                        <StatusTimeline status={app.status} />
                      </div>
                      <span className={`shrink-0 text-[11px] px-2.5 py-1 rounded-full font-semibold border ${STATUS_COLORS[app.status] || "bg-muted text-muted-foreground border-border"}`}>
                        {app.status.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Profile strength */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <h3 className="text-sm font-bold text-foreground mb-3">Profile Strength</h3>
            {loading ? (
              <div className="space-y-2">
                <div className="h-2 bg-border rounded animate-pulse" />
                <div className="h-3 bg-border rounded w-1/2 animate-pulse" />
              </div>
            ) : (
              <>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-muted-foreground">Completion</span>
                  <span className={`font-bold ${completion >= 80 ? "text-emerald-400" : completion >= 50 ? "text-amber-400" : "text-red-400"}`}>{completion}%</span>
                </div>
                <div className="h-2 bg-border rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${completion >= 80 ? "bg-gradient-to-r from-emerald-500 to-green-400" : completion >= 50 ? "bg-gradient-to-r from-amber-500 to-yellow-400" : "bg-gradient-to-r from-red-500 to-orange-400"}`}
                    style={{ width: `${completion}%` }}
                  />
                </div>
                <ul className="space-y-1.5 mb-4">
                  {[
                    { label: "Basic info", done: (completion ?? 0) >= 10 },
                    { label: "Phone number", done: !!profile?.phone },
                    { label: "Bio / Summary", done: !!profile?.bio },
                    { label: "Skills added", done: (profile?.skills?.length ?? 0) > 0 },
                    { label: "Resume uploaded", done: !!profile?.resumeUrl },
                  ].map(item => (
                    <li key={item.label} className="flex items-center gap-2 text-xs">
                      <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 ${item.done ? "bg-emerald-500/10 text-emerald-400" : "bg-border text-muted-foreground"}`}>
                        {item.done
                          ? <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          : <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>}
                      </span>
                      <span className={item.done ? "text-muted-foreground line-through" : "text-foreground"}>{item.label}</span>
                    </li>
                  ))}
                </ul>
                {completion < 100 && (
                  <Link href="/candidates/dashboard/profile"
                    className="w-full flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 font-semibold transition">
                    Complete Profile →
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Upcoming Interview */}
          {(loading || upcoming) && (
            <div className={`rounded-2xl p-4 border ${loading ? "bg-card border-border" : "bg-violet-500/10 border-violet-500/20"}`}>
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <span>📅</span> Upcoming Interview
              </h3>
              {loading ? (
                <div className="space-y-2">
                  <div className="h-4 bg-border rounded animate-pulse" />
                  <div className="h-3 bg-border rounded w-2/3 animate-pulse" />
                </div>
              ) : upcoming ? (
                <div>
                  <p className="text-sm font-semibold text-foreground">{upcoming.job.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{upcoming.job.department}</p>
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-violet-400 font-medium">
                    <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                    Interview Scheduled
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Check your email for interview details from the HR team.</p>
                </div>
              ) : null}
            </div>
          )}

          {/* Resume */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Resume
            </h3>
            {loading ? (
              <div className="h-10 bg-border rounded-xl animate-pulse" />
            ) : profile?.resumeUrl ? (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground">Resume uploaded</p>
                  <a href={profile.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">View resume →</a>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-xs text-muted-foreground mb-3">No resume yet. Upload to auto-fill applications.</p>
                <Link href="/candidates/dashboard/profile#resume"
                  className="w-full flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 font-semibold transition">
                  Upload Resume →
                </Link>
              </div>
            )}
          </div>

          {/* Skills */}
          {!loading && (profile?.skills?.length ?? 0) > 0 && (
            <div className="bg-card border border-border rounded-2xl p-4">
              <h3 className="text-sm font-bold text-foreground mb-3">Top Skills</h3>
              <div className="flex flex-wrap gap-1.5">
                {profile?.skills?.slice(0, 8).map(skill => (
                  <span key={skill} className="text-xs px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
