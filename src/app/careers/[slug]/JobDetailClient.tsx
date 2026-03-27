"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface CandidateSession {
  id: string;
  name: string;
  email: string;
  profile?: {
    phone?: string;
    linkedin?: string;
    portfolio?: string;
    experience?: string;
    resumeUrl?: string;
    resumeName?: string;
  };
}

const LOC_LABELS: Record<string, string> = { REMOTE: "Remote", HYBRID: "Hybrid", ONSITE: "On-site" };
const LOC_COLORS: Record<string, string> = {
  REMOTE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  HYBRID: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  ONSITE: "bg-orange-500/10 text-orange-400 border-orange-500/20",
};
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
  createdAt: string;
}

// ── Application Form ──────────────────────────────────────────────────────
function ApplicationForm({ job, onClose, candidate }: { job: Job; onClose: () => void; candidate: CandidateSession | null }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "", email: "", phone: "", portfolio: "",
    coverLetter: "", experience: "", linkedin: "",
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumePreFilled, setResumePreFilled] = useState<{ url: string; name: string } | null>(null);
  const [resumeError, setResumeError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (candidate) {
      setForm({
        name: candidate.name || "",
        email: candidate.email || "",
        phone: candidate.profile?.phone || "",
        portfolio: candidate.profile?.portfolio || "",
        linkedin: candidate.profile?.linkedin || "",
        experience: candidate.profile?.experience || "",
        coverLetter: "",
      });
      if (candidate.profile?.resumeUrl) {
        setResumePreFilled({ url: candidate.profile.resumeUrl, name: candidate.profile.resumeName || "resume.pdf" });
      }
    }
  }, [candidate]);

  function set(field: string, val: string) { setForm((p) => ({ ...p, [field]: val })); }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setResumeError("");
    if (!file) return;
    if (file.type !== "application/pdf") { setResumeError("Only PDF files are allowed"); return; }
    if (file.size > 5 * 1024 * 1024) { setResumeError("File must be under 5 MB"); return; }
    setResumeFile(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    let resumeUrl = "";
    let resumeName = "";

    if (resumeFile) {
      // Upload new file
      const fd = new FormData();
      fd.append("file", resumeFile);
      const uploadRes = await fetch("/api/careers/upload-resume", { method: "POST", body: fd });
      if (!uploadRes.ok) {
        const u = await uploadRes.json();
        setError(u.error || "Resume upload failed");
        setSubmitting(false);
        return;
      }
      const up = await uploadRes.json();
      resumeUrl = up.url;
      resumeName = up.name;
    } else if (resumePreFilled) {
      resumeUrl = resumePreFilled.url;
      resumeName = resumePreFilled.name;
    } else {
      setResumeError("Please upload your resume (PDF)");
      setSubmitting(false);
      return;
    }

    // 2. Submit application
    const applyRes = await fetch("/api/careers/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: job.id, ...form, resumeUrl, resumeName, candidateId: candidate?.id || undefined }),
    });
    const applyData = await applyRes.json();
    if (!applyRes.ok) {
      setError(applyData.error || "Submission failed. Please try again.");
      setSubmitting(false);
      return;
    }
    setSuccess(true);
    setSubmitting(false);
  }

  if (success) {
    return (
      <div className="text-center py-12 px-6">
        <div className="text-6xl mb-4">🎉</div>
        <h3 className="text-xl font-bold text-foreground mb-2">Application Submitted!</h3>
        <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
          Thanks, we've received your application for <strong className="text-foreground">{job.title}</strong>. We'll be in touch within 5–7 business days.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {candidate && (
            <button 
              onClick={() => router.push(`/candidates/dashboard?success=true&job=${job.slug}`)}
              className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-purple-500 text-white text-sm font-bold rounded-xl hover:from-violet-500 hover:to-purple-400 transition-all shadow-lg shadow-violet-500/25"
            >
              Go to Dashboard →
            </button>
          )}
          <button onClick={onClose} className="px-6 py-2.5 border border-white/20 text-foreground text-sm font-medium rounded-xl hover:bg-white/5 transition-all">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      {candidate ? (
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2.5 text-xs text-emerald-400">
          <span>✓</span>
          <span>Logged in as <strong>{candidate.name}</strong> — form auto-filled from your profile.</span>
          <Link href="/candidates/dashboard" className="ml-auto underline hover:no-underline">Dashboard</Link>
        </div>
      ) : (
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-muted-foreground">
          <span>💡</span>
          <span>Have a candidate account?</span>
          <Link href={`/candidates/login?redirect=${encodeURIComponent(`/candidates/dashboard/careers/${job.slug}?autoApply=true`)}`} className="text-primary hover:underline ml-1">Login to auto-fill</Link>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Name */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Full Name *</label>
          <input required value={form.name} onChange={e => set("name", e.target.value)}
            placeholder="John Doe"
            className="w-full bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>
        {/* Email */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email Address *</label>
          <input required type="email" value={form.email} onChange={e => set("email", e.target.value)}
            placeholder="you@example.com"
            className="w-full bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>
        {/* Phone */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Phone Number *</label>
          <input required value={form.phone} onChange={e => set("phone", e.target.value)}
            placeholder="+91 98765 43210"
            className="w-full bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>
        {/* Experience */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Years of Experience *</label>
          <select required value={form.experience} onChange={e => set("experience", e.target.value)}
            className="w-full bg-white/5 border border-white/10 text-foreground rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
            <option value="">Select...</option>
            {["0–1 years (Fresher)", "1–2 years", "2–4 years", "4–6 years", "6–10 years", "10+ years"].map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
      </div>

      {/* Resume Upload */}
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Resume (PDF, max 5 MB) *</label>
        <div
          onClick={() => fileRef.current?.click()}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${(resumeFile || resumePreFilled) ? "border-primary/40 bg-primary/5" : "border-white/10 bg-white/3 hover:border-white/20"}`}
        >
          <svg className="w-5 h-5 text-muted-foreground flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
          <span className="text-sm text-muted-foreground">{resumeFile ? resumeFile.name : resumePreFilled ? resumePreFilled.name : "Click to upload PDF resume"}</span>
          {(resumeFile || resumePreFilled) && <span className="ml-auto text-xs text-emerald-400">✓ Ready</span>}
        </div>
        <input ref={fileRef} type="file" accept=".pdf,application/pdf" onChange={handleFile} className="hidden" />
        {resumeError && <p className="text-xs text-red-400 mt-1">{resumeError}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Portfolio */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Portfolio / GitHub</label>
          <input value={form.portfolio} onChange={e => set("portfolio", e.target.value)}
            placeholder="https://github.com/you"
            className="w-full bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>
        {/* LinkedIn */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">LinkedIn Profile</label>
          <input value={form.linkedin} onChange={e => set("linkedin", e.target.value)}
            placeholder="https://linkedin.com/in/you"
            className="w-full bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>
      </div>

      {/* Cover Letter */}
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Cover Letter <span className="text-muted-foreground/60">(optional)</span></label>
        <textarea value={form.coverLetter} onChange={e => set("coverLetter", e.target.value)} rows={4}
          placeholder="Tell us why you're a great fit for this role and what excites you about Fluenzy AI..."
          className="w-full bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <svg className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <button type="submit" disabled={submitting}
        className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
        {submitting ? (
          <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Submitting...</>
        ) : "Submit Application"}
      </button>
      <p className="text-xs text-center text-muted-foreground">By submitting, you agree to our <Link href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>.</p>
    </form>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function JobDetailClient({ job }: { job: Job }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [showLoginGate, setShowLoginGate] = useState(false);
  const [copied, setCopied] = useState(false);
  const [candidate, setCandidate] = useState<CandidateSession | null | undefined>(undefined);

  useEffect(() => {
    fetch("/api/candidates/me")
      .then(r => r.ok ? r.json() : null)
      .then(d => setCandidate(d?.candidate ? { ...d.candidate, profile: d.candidate.profile } : null))
      .catch(() => setCandidate(null));
  }, []);

  const handleApplyClick = useCallback(() => {
    if (candidate === undefined) return; // still loading
    if (!candidate) {
      setShowLoginGate(true);
    } else {
      setShowForm(true);
    }
  }, [candidate]);

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Gradient bg */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-violet-600/8 blur-[120px]" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 pt-8 pb-20">
        {/* Back */}
        <Link href="/careers" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 group">
          <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m7-7l-7 7 7 7" /></svg>
          All open positions
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Right: Sticky Apply Card (appears first on mobile) */}
          <div className="lg:col-span-1 order-first lg:order-last">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="sticky top-6 rounded-2xl border border-white/10 bg-card/60 backdrop-blur-sm p-6 space-y-4"
            >
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Job Summary</p>
                <div className="space-y-2.5 text-sm">
                  {[
                    { label: "Department", value: job.department },
                    { label: "Location", value: LOC_LABELS[job.location] },
                    { label: "Type", value: TYPE_LABELS[job.employmentType] },
                    { label: "Experience", value: job.experienceYears },
                    ...(job.salaryRange ? [{ label: "Salary", value: job.salaryRange }] : []),
                    { label: "Posted", value: new Date(job.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between gap-2">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className="text-foreground font-medium text-right">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-white/8 pt-4 space-y-2.5">
                <button
                  onClick={handleApplyClick}
                  disabled={candidate === undefined}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-primary/20 disabled:opacity-70 disabled:cursor-wait flex items-center justify-center gap-2"
                >
                  {candidate === undefined ? (
                    <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Loading...</>
                  ) : "Apply Now →"}
                </button>
                <button
                  onClick={copyLink}
                  className="w-full py-2.5 rounded-xl border border-white/10 bg-white/5 text-muted-foreground text-sm hover:bg-white/8 hover:text-foreground transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  {copied ? "Link Copied!" : "Copy Link"}
                </button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Questions? Email{" "}
                <a href="mailto:careers@fluenzyai.app" className="text-primary hover:underline">careers@fluenzyai.app</a>
              </p>
            </motion.div>
          </div>

          {/* Left: Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${LOC_COLORS[job.location]}`}>{LOC_LABELS[job.location]}</span>
                <span className="text-xs px-2.5 py-1 rounded-full border border-white/10 bg-white/5 text-muted-foreground">{TYPE_LABELS[job.employmentType]}</span>
                <span className="text-xs px-2.5 py-1 rounded-full border border-white/10 bg-white/5 text-muted-foreground">{job.department}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">{job.title}</h1>
              <p className="text-muted-foreground">{job.experienceYears} experience required{job.salaryRange ? ` · ${job.salaryRange}` : ""}</p>
            </motion.div>

            {/* Description */}
            {job.description && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }}>
                <div className="rounded-2xl border border-white/8 bg-card/40 p-6">
                  <h2 className="text-lg font-semibold mb-3">About this Role</h2>
                  <p className="text-muted-foreground leading-relaxed text-sm whitespace-pre-line">{job.description}</p>
                </div>
              </motion.div>
            )}

            {/* Responsibilities */}
            {job.responsibilities?.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
                <div className="rounded-2xl border border-white/8 bg-card/40 p-6">
                  <h2 className="text-lg font-semibold mb-4">Responsibilities</h2>
                  <ul className="space-y-2.5">
                    {job.responsibilities.map((r, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                        <svg className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}

            {/* Requirements */}
            {job.requirements?.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
                <div className="rounded-2xl border border-white/8 bg-card/40 p-6">
                  <h2 className="text-lg font-semibold mb-4">Requirements</h2>
                  <ul className="space-y-2.5">
                    {job.requirements.map((r, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                        <svg className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" /></svg>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}

            {/* Skills */}
            {job.skills?.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
                <div className="rounded-2xl border border-white/8 bg-card/40 p-6">
                  <h2 className="text-lg font-semibold mb-4">Skills & Technologies</h2>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((s) => (
                      <span key={s} className="px-3 py-1.5 text-sm bg-primary/8 text-primary border border-primary/20 rounded-xl font-medium">{s}</span>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* ── Login Gate Modal ── */}
      <AnimatePresence>
        {showLoginGate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowLoginGate(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="bg-card border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              {/* Top gradient strip */}
              <div className="h-1.5 w-full bg-gradient-to-r from-violet-500 to-purple-500" />

              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-5">
                  <svg className="w-8 h-8 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>

                <h2 className="text-xl font-bold text-foreground mb-2">Login Required</h2>
                <p className="text-muted-foreground text-sm mb-1">
                  You need a <strong className="text-foreground">Candidate Account</strong> to apply for this role.
                </p>
                <p className="text-muted-foreground text-xs mb-7">
                  Login or register free — takes less than a minute. Your profile will auto-fill the application form.
                </p>

                <div className="flex flex-col gap-3">
                  <a
                    href={`/api/candidates/auth/google?redirect=${encodeURIComponent(`/candidates/dashboard/careers/${job.slug}?autoApply=true`)}`}
                    className="w-full py-3 rounded-xl border border-border bg-background text-foreground font-semibold text-sm hover:bg-white/5 hover:border-white/30 transition text-center flex items-center justify-center gap-2.5"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                  </a>
                  <div className="relative flex items-center gap-2">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-[10px] text-muted-foreground">or</span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>
                  <Link
                    href={`/candidates/login?redirect=${encodeURIComponent(`/candidates/dashboard/careers/${job.slug}?autoApply=true`)}`}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 text-white font-bold text-sm hover:from-violet-500 hover:to-purple-400 transition-all shadow-lg shadow-violet-500/25 text-center"
                  >
                    Login with Email
                  </Link>
                  <Link
                    href={`/candidates/signup?redirect=${encodeURIComponent(`/candidates/dashboard/careers/${job.slug}?autoApply=true`)}`}
                    className="w-full py-3 rounded-xl border border-violet-500/30 bg-violet-500/5 text-violet-300 font-semibold text-sm hover:bg-violet-500/10 hover:border-violet-500/50 transition-all text-center"
                  >
                    Create Free Account
                  </Link>
                  <button
                    onClick={() => setShowLoginGate(false)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors pt-1"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Apply Modal ── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="bg-card border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="flex items-start justify-between p-6 border-b border-white/8 sticky top-0 bg-card z-10">
                <div>
                  <h2 className="font-bold text-lg text-foreground">Apply for this Role</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">{job.title} · {job.department}</p>
                </div>
                <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-lg bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10 flex items-center justify-center transition-all text-lg leading-none">×</button>
              </div>
              <ApplicationForm job={job} onClose={() => setShowForm(false)} candidate={candidate ?? null} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
