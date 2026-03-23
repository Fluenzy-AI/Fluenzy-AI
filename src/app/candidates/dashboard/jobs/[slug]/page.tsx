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

// Application Form Component
function ApplicationForm({ job, onClose, candidate, autoApplyMode = false }: {
  job: Job;
  onClose: () => void;
  candidate: CandidateSession;
  autoApplyMode?: boolean;
}) {
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

    const applyRes = await fetch("/api/careers/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: job.id, ...form, resumeUrl, resumeName, candidateId: candidate.id }),
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
        <h3 className="text-xl font-bold text-[#F1F0F5] mb-2">
          {autoApplyMode ? "Quick Application Submitted!" : "Application Submitted!"}
        </h3>
        <p className="text-[#8B8A99] text-sm mb-6 max-w-sm mx-auto">
          Thanks, we've received your {autoApplyMode ? "quick " : ""}application for <strong className="text-[#F1F0F5]">{job.title}</strong>. We'll be in touch within 5-7 business days.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={onClose} className="px-5 py-2.5 bg-white/[0.06] text-[#8B8A99] text-sm font-medium rounded-xl hover:bg-white/[0.1] transition-all">
            Browse More Jobs
          </button>
          <Link href="/candidates/dashboard/applications" className="px-5 py-2.5 bg-[#7C5CFC] text-white text-sm font-medium rounded-xl hover:bg-[#7C5CFC]/90 transition-all">
            View Applications
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2.5 text-xs text-emerald-400">
        <span>✓</span>
        <span>
          {autoApplyMode ? "Quick Apply ready" : "Logged in"} as <strong>{candidate.name}</strong> — form auto-filled from your profile.
        </span>
        <Link href="/candidates/dashboard/profile" className="ml-auto underline hover:no-underline">Edit Profile</Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-[#8B8A99] mb-1.5">Full Name *</label>
          <input required value={form.name} onChange={e => set("name", e.target.value)}
            placeholder="John Doe"
            className="w-full bg-white/[0.04] border border-white/[0.08] text-[#F1F0F5] placeholder:text-[#52515E] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C5CFC]/40" />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#8B8A99] mb-1.5">Email Address *</label>
          <input required type="email" value={form.email} onChange={e => set("email", e.target.value)}
            placeholder="you@example.com"
            className="w-full bg-white/[0.04] border border-white/[0.08] text-[#F1F0F5] placeholder:text-[#52515E] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C5CFC]/40" />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#8B8A99] mb-1.5">Phone Number *</label>
          <input required value={form.phone} onChange={e => set("phone", e.target.value)}
            placeholder="+91 98765 43210"
            className="w-full bg-white/[0.04] border border-white/[0.08] text-[#F1F0F5] placeholder:text-[#52515E] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C5CFC]/40" />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#8B8A99] mb-1.5">Years of Experience *</label>
          <select required value={form.experience} onChange={e => set("experience", e.target.value)}
            className="w-full bg-white/[0.04] border border-white/[0.08] text-[#F1F0F5] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C5CFC]/40">
            <option value="">Select...</option>
            {["0-1 years (Fresher)", "1-2 years", "2-4 years", "4-6 years", "6-10 years", "10+ years"].map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
      </div>

      {/* Resume Upload */}
      <div>
        <label className="block text-xs font-medium text-[#8B8A99] mb-1.5">Resume (PDF, max 5 MB) *</label>
        <div
          onClick={() => fileRef.current?.click()}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${(resumeFile || resumePreFilled) ? "border-[#7C5CFC]/40 bg-[#7C5CFC]/5" : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.16]"}`}
        >
          <svg className="w-5 h-5 text-[#8B8A99] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
          <span className="text-sm text-[#8B8A99]">{resumeFile ? resumeFile.name : resumePreFilled ? resumePreFilled.name : "Click to upload PDF resume"}</span>
          {(resumeFile || resumePreFilled) && <span className="ml-auto text-xs text-emerald-400">✓ Ready</span>}
        </div>
        <input ref={fileRef} type="file" accept=".pdf,application/pdf" onChange={handleFile} className="hidden" />
        {resumeError && <p className="text-xs text-red-400 mt-1">{resumeError}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-[#8B8A99] mb-1.5">Portfolio / GitHub</label>
          <input value={form.portfolio} onChange={e => set("portfolio", e.target.value)}
            placeholder="https://github.com/you"
            className="w-full bg-white/[0.04] border border-white/[0.08] text-[#F1F0F5] placeholder:text-[#52515E] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C5CFC]/40" />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#8B8A99] mb-1.5">LinkedIn Profile</label>
          <input value={form.linkedin} onChange={e => set("linkedin", e.target.value)}
            placeholder="https://linkedin.com/in/you"
            className="w-full bg-white/[0.04] border border-white/[0.08] text-[#F1F0F5] placeholder:text-[#52515E] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C5CFC]/40" />
        </div>
      </div>

      {/* Cover Letter */}
      <div>
        <label className="block text-xs font-medium text-[#8B8A99] mb-1.5">Cover Letter <span className="text-[#52515E]">(optional)</span></label>
        <textarea value={form.coverLetter} onChange={e => set("coverLetter", e.target.value)} rows={4}
          placeholder="Tell us why you're a great fit for this role..."
          className="w-full bg-white/[0.04] border border-white/[0.08] text-[#F1F0F5] placeholder:text-[#52515E] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C5CFC]/40 resize-none" />
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <svg className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <button type="submit" disabled={submitting}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-[#6B46FF] via-[#A855F7] to-[#EC4899] text-white font-semibold text-sm hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#7C5CFC]/25">
        {submitting ? (
          <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Submitting...</>
        ) : "Submit Application"}
      </button>
    </form>
  );
}

// Main Page Component
export default function DashboardJobDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const [slug, setSlug] = useState<string>("");
  const [job, setJob] = useState<Job | null>(null);
  const [candidate, setCandidate] = useState<CandidateSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [autoApplyMode, setAutoApplyMode] = useState(false);
  const [copied, setCopied] = useState(false);

  function copyLink() {
    const publicUrl = `${window.location.origin}/careers/${slug}`;
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Get slug from params
  useEffect(() => {
    params.then(p => setSlug(p.slug));
  }, [params]);

  // Check for auto-apply parameter in URL immediately
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const autoApply = urlParams.get('autoApply');
      if (autoApply === 'true') {
        setAutoApplyMode(true);
        // Clean up URL without this parameter
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, []);

  // Auto-open form when in autoApply mode and data is ready
  useEffect(() => {
    if (autoApplyMode && job && candidate && !loading) {
      setShowForm(true);
    }
  }, [autoApplyMode, job, candidate, loading]);

  // Fetch candidate session and job
  useEffect(() => {
    if (!slug) return;

    Promise.all([
      fetch("/api/candidates/me").then(r => r.ok ? r.json() : null),
      fetch(`/api/careers/jobs/${slug}`).then(r => r.ok ? r.json() : null),
    ]).then(([candidateData, jobData]) => {
      if (!candidateData?.candidate) {
        router.replace(`/candidates/login?redirect=${encodeURIComponent(`/candidates/dashboard/jobs/${slug}?autoApply=true`)}`);
        return;
      }
      setCandidate({ ...candidateData.candidate, profile: candidateData.candidate.profile });

      if (jobData?.job) {
        setJob({
          id: jobData.job.id,
          title: jobData.job.title,
          slug: jobData.job.slug,
          department: jobData.job.department,
          location: jobData.job.location,
          employmentType: jobData.job.employmentType,
          description: jobData.job.description || "",
          requirements: jobData.job.requirements || [],
          responsibilities: jobData.job.responsibilities || [],
          skills: jobData.job.skills || [],
          experienceYears: jobData.job.experienceYears,
          salaryRange: jobData.job.salaryRange,
          createdAt: jobData.job.createdAt,
        });
      }
    }).catch(error => {
      console.error("Error fetching data:", error);
    }).finally(() => setLoading(false));
  }, [slug, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#7C5CFC]/20 border-t-[#7C5CFC] rounded-full animate-spin" />
          <p className="text-sm text-[#8B8A99]">
            {autoApplyMode ? "Preparing application form..." : "Loading job details..."}
          </p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 rounded-full bg-[#7C5CFC]/10 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-[#7C5CFC]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-[#F1F0F5] mb-2">Job Not Found</h2>
        <p className="text-[#8B8A99] text-sm mb-6">This position may no longer be available or the link is invalid.</p>
        <Link href="/candidates/dashboard/jobs" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7C5CFC]/10 text-[#9F7FFF] hover:bg-[#7C5CFC]/20 text-sm font-medium transition-colors">
          Browse All Jobs
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      {/* Back */}
      <Link href="/candidates/dashboard/jobs" className="inline-flex items-center gap-1.5 text-sm text-[#8B8A99] hover:text-[#F1F0F5] transition-colors mb-6 group">
        <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m7-7l-7 7 7 7" /></svg>
        Back to Browse Jobs
      </Link>

      {/* Auto-apply mode indicator */}
      {autoApplyMode && (
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-[#6B46FF]/10 to-[#A855F7]/10 border border-[#7C5CFC]/20">
          <div className="flex items-center gap-2 text-sm text-[#9F7FFF]">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            <span className="font-medium">Quick Apply Mode</span>
            <span className="text-[#8B8A99]">— Application form will open automatically</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${LOC_COLORS[job.location]}`}>{LOC_LABELS[job.location]}</span>
              <span className="text-xs px-2.5 py-1 rounded-full border border-white/[0.08] bg-white/[0.04] text-[#8B8A99]">{TYPE_LABELS[job.employmentType]}</span>
              <span className="text-xs px-2.5 py-1 rounded-full border border-white/[0.08] bg-white/[0.04] text-[#8B8A99]">{job.department}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#F1F0F5] mb-2">{job.title}</h1>
            <p className="text-[#8B8A99]">{job.experienceYears} experience required{job.salaryRange ? ` · ${job.salaryRange}` : ""}</p>
          </motion.div>

          {/* Description */}
          {job.description && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }}>
              <div className="rounded-2xl border border-white/[0.06] bg-[#13161E] p-6">
                <h2 className="text-lg font-semibold text-[#F1F0F5] mb-3">About this Role</h2>
                <p className="text-[#8B8A99] leading-relaxed text-sm whitespace-pre-line">{job.description}</p>
              </div>
            </motion.div>
          )}

          {/* Responsibilities */}
          {job.responsibilities?.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
              <div className="rounded-2xl border border-white/[0.06] bg-[#13161E] p-6">
                <h2 className="text-lg font-semibold text-[#F1F0F5] mb-4">Responsibilities</h2>
                <ul className="space-y-2.5">
                  {job.responsibilities.map((r, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-[#8B8A99]">
                      <svg className="w-4 h-4 text-[#7C5CFC] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
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
              <div className="rounded-2xl border border-white/[0.06] bg-[#13161E] p-6">
                <h2 className="text-lg font-semibold text-[#F1F0F5] mb-4">Requirements</h2>
                <ul className="space-y-2.5">
                  {job.requirements.map((r, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-[#8B8A99]">
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
              <div className="rounded-2xl border border-white/[0.06] bg-[#13161E] p-6">
                <h2 className="text-lg font-semibold text-[#F1F0F5] mb-4">Skills & Technologies</h2>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((s) => (
                    <span key={s} className="px-3 py-1.5 text-sm bg-[#7C5CFC]/10 text-[#9F7FFF] border border-[#7C5CFC]/20 rounded-xl font-medium">{s}</span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Right: Sticky Apply Card */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="sticky top-6 rounded-2xl border border-white/[0.08] bg-[#13161E] p-6 space-y-4"
          >
            <div>
              <p className="text-xs text-[#8B8A99] uppercase tracking-wide mb-3">Job Summary</p>
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
                    <span className="text-[#8B8A99]">{row.label}</span>
                    <span className="text-[#F1F0F5] font-medium text-right">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-white/[0.06] pt-4 space-y-3">
              <button
                onClick={() => setShowForm(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#6B46FF] via-[#A855F7] to-[#EC4899] text-white font-semibold text-sm transition-all shadow-lg shadow-[#7C5CFC]/25 hover:opacity-90"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                Apply for this Role
              </button>

              <button
                onClick={copyLink}
                className="w-full py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.04] text-[#8B8A99] text-sm hover:bg-white/[0.08] hover:text-[#F1F0F5] transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                {copied ? "Link Copied!" : "Copy Link"}
              </button>

              <p className="text-xs text-center text-[#52515E]">
                Questions? Email{" "}
                <a href="mailto:careers@fluenzyai.app" className="text-[#7C5CFC] hover:underline">careers@fluenzyai.app</a>
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Apply Modal */}
      <AnimatePresence>
        {showForm && candidate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: autoApplyMode ? 0.9 : 0.96, y: autoApplyMode ? 0 : 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{
                duration: autoApplyMode ? 0.4 : 0.25,
                ease: autoApplyMode ? [0.16, 1, 0.3, 1] : [0.22, 1, 0.36, 1]
              }}
              className="bg-[#13161E] border border-white/[0.08] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="flex items-start justify-between p-6 border-b border-white/[0.06] sticky top-0 bg-[#13161E] z-10">
                <div>
                  <h2 className="font-bold text-lg text-[#F1F0F5]">
                    {autoApplyMode ? "Quick Apply" : "Apply for this Role"}
                  </h2>
                  <p className="text-sm text-[#8B8A99] mt-0.5">{job.title} · {job.department}</p>
                  {autoApplyMode && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-[#9F7FFF]">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      <span>Fast-track application process</span>
                    </div>
                  )}
                </div>
                <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-lg bg-white/[0.04] text-[#8B8A99] hover:text-[#F1F0F5] hover:bg-white/[0.08] flex items-center justify-center transition-all text-lg leading-none">×</button>
              </div>
              <ApplicationForm job={job} onClose={() => setShowForm(false)} candidate={candidate} autoApplyMode={autoApplyMode} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Apply Button for mobile */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 sm:hidden">
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#6B46FF] via-[#A855F7] to-[#EC4899] text-white font-semibold text-sm shadow-lg shadow-[#7C5CFC]/25 hover:opacity-90 transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Apply Now
        </button>
      </div>
    </div>
  );
}
