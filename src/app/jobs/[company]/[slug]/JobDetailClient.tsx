"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  MapPin, Briefcase, Clock, Building2, Globe, Zap, Share2, Check,
  ChevronLeft, X, Upload, FileText, Loader2, ExternalLink
} from "lucide-react";

interface Job {
  id: string;
  title: string;
  slug: string;
  department: string;
  location: "REMOTE" | "HYBRID" | "ONSITE";
  city?: string;
  employmentType: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP";
  description: string;
  requirements: string[];
  responsibilities: string[];
  skills: string[];
  experienceYears: string;
  salaryMin?: string;
  salaryMax?: string;
  autoApplyEnabled: boolean;
  createdAt: string;
  company: {
    name: string;
    slug: string;
    domain: string;
    logoUrl?: string;
    website?: string;
    description?: string;
    industry?: string;
    size?: string;
  };
}

const LOC_LABELS: Record<string, string> = {
  REMOTE: "Remote",
  HYBRID: "Hybrid",
  ONSITE: "On-site",
};

const TYPE_LABELS: Record<string, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
};

interface CandidateData {
  name?: string;
  email?: string;
  phone?: string;
  resumeUrl?: string;
  resumeName?: string;
  portfolio?: string;
  linkedin?: string;
  experience?: string;
  plan?: string;
  autoApplyEnabled?: boolean;
  autoApplyCount?: number;
  autoApplyLimit?: number;
}

export default function JobDetailClient({ job }: { job: Job }) {
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [candidate, setCandidate] = useState<CandidateData | null>(null);
  const [showAutoApplyNotice, setShowAutoApplyNotice] = useState(false);

  useEffect(() => {
    // Check if candidate is logged in and fetch profile + preferences
    Promise.all([
      fetch("/api/candidates/me", { credentials: "include" }).then(r => r.json()),
      fetch("/api/candidates/preferences", { credentials: "include" }).then(r => r.json()),
    ])
      .then(([userData, prefData]) => {
        if (userData.candidate?.profile) {
          setCandidate({
            name: userData.candidate.name,
            email: userData.candidate.email,
            phone: userData.candidate.profile.phone,
            resumeUrl: userData.candidate.profile.resumeUrl,
            resumeName: userData.candidate.profile.resumeName,
            portfolio: userData.candidate.profile.portfolio,
            linkedin: userData.candidate.profile.linkedin,
            experience: userData.candidate.profile.experience,
            plan: userData.user?.plan || "Free",
            autoApplyEnabled: prefData.preferences?.autoApplyEnabled || false,
            autoApplyCount: prefData.preferences?.autoApplyCount || 0,
            autoApplyLimit: prefData.preferences?.monthlyLimit || 0,
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: job.title, url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const postedDate = new Date(job.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#080c14]">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#0d1220] to-[#080c14] border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/jobs"
            className="inline-flex items-center gap-1 text-slate-400 hover:text-white text-sm mb-6"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Jobs
          </Link>

          <div className="flex flex-col md:flex-row md:items-start gap-6">
            {/* Company Logo */}
            <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {job.company.logoUrl ? (
                <img src={job.company.logoUrl} alt={job.company.name} className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-8 h-8 text-slate-500" />
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{job.title}</h1>
              <p className="text-lg text-indigo-400 mb-4">{job.company.name}</p>

              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {LOC_LABELS[job.location]}
                  {job.city && `, ${job.city}`}
                </span>
                <span className="flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4" />
                  {TYPE_LABELS[job.employmentType]}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {job.experienceYears}
                </span>
                {job.salaryMin && job.salaryMax && (
                  <span className="text-green-400">
                    {job.salaryMin} - {job.salaryMax}
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-3 flex-shrink-0">
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm transition"
              >
                {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                {copied ? "Copied!" : "Share"}
              </button>
              <button
                onClick={() => {
                  // If paid plan + auto-apply enabled, show notice instead of modal
                  if (candidate?.plan && candidate.plan !== "Free" && candidate.autoApplyEnabled) {
                    setShowAutoApplyNotice(true);
                  } else {
                    setShowApplyModal(true);
                  }
                }}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition"
              >
                {candidate?.plan && candidate.plan !== "Free" && candidate.autoApplyEnabled ? (
                  <>
                    <Check className="w-4 h-4" />
                    Auto-Apply Active
                  </>
                ) : (
                  "Apply Now"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1 space-y-8">
            {/* About the Role */}
            <section className="bg-slate-900/50 rounded-2xl border border-white/5 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">About the Role</h2>
              <div className="prose prose-invert prose-slate max-w-none">
                <p className="text-slate-300 whitespace-pre-wrap">{job.description}</p>
              </div>
            </section>

            {/* Responsibilities */}
            {job.responsibilities.length > 0 && (
              <section className="bg-slate-900/50 rounded-2xl border border-white/5 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Responsibilities</h2>
                <ul className="space-y-3">
                  {job.responsibilities.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Requirements */}
            {job.requirements.length > 0 && (
              <section className="bg-slate-900/50 rounded-2xl border border-white/5 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Requirements</h2>
                <ul className="space-y-3">
                  {job.requirements.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Skills */}
            <section className="bg-slate-900/50 rounded-2xl border border-white/5 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Required Skills</h2>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-lg text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="w-full lg:w-80 order-first lg:order-last space-y-6">
            {/* Job Summary Card */}
            <div className="bg-slate-900/50 rounded-2xl border border-white/5 p-6 sticky top-6">
              <h3 className="font-semibold text-white mb-4">Job Summary</h3>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Department</span>
                  <span className="text-slate-300">{job.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Location</span>
                  <span className="text-slate-300">{LOC_LABELS[job.location]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Employment</span>
                  <span className="text-slate-300">{TYPE_LABELS[job.employmentType]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Experience</span>
                  <span className="text-slate-300">{job.experienceYears}</span>
                </div>
                {job.salaryMin && job.salaryMax && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Salary</span>
                    <span className="text-green-400">{job.salaryMin} - {job.salaryMax}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Posted</span>
                  <span className="text-slate-300">{postedDate}</span>
                </div>
              </div>

              {job.autoApplyEnabled && (
                <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                  <div className="flex items-center gap-2 text-purple-400 text-sm">
                    <Zap className="w-4 h-4" />
                    <span>Auto-Apply Available</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Upgrade to auto-apply for matching jobs
                  </p>
                </div>
              )}

              <button
                onClick={() => {
                  if (candidate?.plan && candidate.plan !== "Free" && candidate.autoApplyEnabled) {
                    setShowAutoApplyNotice(true);
                  } else {
                    setShowApplyModal(true);
                  }
                }}
                className="w-full mt-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition"
              >
                {candidate?.plan && candidate.plan !== "Free" && candidate.autoApplyEnabled ? (
                  <>Auto-Apply Active</>
                ) : (
                  <>Apply for this Job</>
                )}
              </button>
            </div>

            {/* Company Card */}
            <div className="bg-slate-900/50 rounded-2xl border border-white/5 p-6">
              <h3 className="font-semibold text-white mb-4">About {job.company.name}</h3>
              {job.company.description && (
                <p className="text-slate-400 text-sm mb-4">{job.company.description}</p>
              )}
              <div className="space-y-3 text-sm">
                {job.company.industry && (
                  <div className="flex items-center gap-2 text-slate-400">
                    <Building2 className="w-4 h-4" />
                    {job.company.industry}
                  </div>
                )}
                {job.company.size && (
                  <div className="flex items-center gap-2 text-slate-400">
                    <Briefcase className="w-4 h-4" />
                    {job.company.size} employees
                  </div>
                )}
                {job.company.website && (
                  <a
                    href={job.company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300"
                  >
                    <Globe className="w-4 h-4" />
                    Visit website
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <Link
                href={`/jobs?company=${job.company.slug}`}
                className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5 text-sm text-indigo-400 hover:text-indigo-300 transition"
              >
                View all jobs from {job.company.name} →
              </Link>
            </div>

            {/* Similar Jobs */}
            <SimilarJobs jobId={job.id} />
          </aside>
        </div>
      </div>

      {/* Apply Modal */}
      <AnimatePresence>
        {showApplyModal && (
          <ApplyModal
            job={job}
            candidate={candidate}
            onClose={() => setShowApplyModal(false)}
          />
        )}
        {showAutoApplyNotice && (
          <AutoApplyNoticeModal
            job={job}
            candidate={candidate}
            onClose={() => setShowAutoApplyNotice(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ApplyModal({
  job,
  candidate,
  onClose,
}: {
  job: Job;
  candidate: CandidateData | null;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: candidate?.name || "",
    email: candidate?.email || "",
    phone: candidate?.phone || "",
    resumeUrl: candidate?.resumeUrl || "",
    resumeName: candidate?.resumeName || "",
    portfolio: candidate?.portfolio || "",
    linkedin: candidate?.linkedin || "",
    coverLetter: "",
    experience: candidate?.experience || "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  // Initialize form only once on mount with candidate data
  // Do NOT update form if candidate changes, as it would overwrite user edits
  useEffect(() => {
    setForm(prev => ({
      name: candidate?.name || prev.name,
      email: candidate?.email || prev.email,
      phone: candidate?.phone || prev.phone,
      resumeUrl: candidate?.resumeUrl || prev.resumeUrl,
      resumeName: candidate?.resumeName || prev.resumeName,
      portfolio: candidate?.portfolio || prev.portfolio,
      linkedin: candidate?.linkedin || prev.linkedin,
      coverLetter: prev.coverLetter,
      experience: candidate?.experience || prev.experience,
    }));
  }, []); // Empty dependency array - only run once on mount

  const isPaidPlan = candidate?.plan && candidate.plan !== "Free";
  const isOneClick = isPaidPlan && !candidate?.autoApplyEnabled;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    setUploading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/careers/upload-resume", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      if (!data.url) {
        throw new Error("No URL returned from server");
      }

      setForm(prev => ({ ...prev, resumeUrl: data.url, resumeName: file.name }));
      setError("");
    } catch (err) {
      console.error("Resume upload error:", err);
      setError(err instanceof Error ? err.message : "Failed to upload resume. Please try again.");
      // Reset form if upload failed
      setForm(prev => ({ ...prev, resumeUrl: "", resumeName: "" }));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate resume before submission
    if (!form.resumeUrl || form.resumeUrl.trim() === "") {
      setError("Please upload your resume before applying");
      return;
    }

    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.experience.trim()) {
      setError("Please fill all required fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/jobs/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          jobId: job.id,
          // Ensure resumeUrl is sent correctly
          resumeUrl: form.resumeUrl.trim(),
        }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.details?.resumeUrl?.[0] || "Failed to apply");
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit application");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-white">Apply for {job.title}</h2>
              {candidate?.plan && candidate.plan !== "Free" && (
                <span className="px-2 py-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs font-semibold rounded-full">
                  {candidate.plan}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400">{job.company.name}</p>
            {isOneClick && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-green-400">
                <Zap className="w-3 h-3" />
                <span>Your profile is pre-filled — just review and submit!</span>
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Application Submitted!</h3>
            <p className="text-slate-400 mb-6">
              Your application has been sent to {job.company.name}. They will contact you if your profile matches their requirements.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Pre-fill info bar */}
            {candidate && form.name && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm flex items-center gap-2">
                <Zap className="w-4 h-4" />
                {isPaidPlan ? (
                  <span>Your profile is pre-filled — just review and submit!</span>
                ) : (
                  <span>Logged in as {form.name} — form auto-filled from your profile.</span>
                )}
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Full Name *</label>
                <input
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email *</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Phone *</label>
                <input
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Experience *</label>
                <select
                  name="experience"
                  value={form.experience}
                  onChange={handleChange}
                  required
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select experience</option>
                  <option value="0-1 years">0-1 years</option>
                  <option value="1-3 years">1-3 years</option>
                  <option value="3-5 years">3-5 years</option>
                  <option value="5-10 years">5-10 years</option>
                  <option value="10+ years">10+ years</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Resume (PDF) *</label>
              {form.resumeUrl ? (
                <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <FileText className="w-5 h-5 text-green-400" />
                  <span className="flex-1 text-sm text-slate-300 truncate">
                    {form.resumeName || "Resume uploaded"}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-green-400 font-medium">
                    <Check className="w-3 h-3" />
                    Ready
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setForm({ ...form, resumeUrl: "", resumeName: "" });
                      // Reset file input so user can select the same file again
                      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                      if (fileInput) fileInput.value = "";
                    }}
                    className="text-slate-400 hover:text-red-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700 rounded-xl cursor-pointer hover:border-indigo-500/50 transition">
                  {uploading ? (
                    <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-slate-500 mb-2" />
                      <span className="text-sm text-slate-400">Click to upload PDF (max 5MB)</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Portfolio / GitHub</label>
                <input
                  name="portfolio"
                  type="url"
                  value={form.portfolio}
                  onChange={handleChange}
                  placeholder="https://"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">LinkedIn</label>
                <input
                  name="linkedin"
                  type="url"
                  value={form.linkedin}
                  onChange={handleChange}
                  placeholder="https://linkedin.com/in/..."
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Cover Letter</label>
              <textarea
                name="coverLetter"
                value={form.coverLetter}
                onChange={handleChange}
                rows={4}
                maxLength={3000}
                placeholder="Why are you interested in this role?"
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading || uploading}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-medium transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : isOneClick ? (
                <>
                  <Zap className="w-4 h-4" />
                  Submit Application (1-Click)
                </>
              ) : (
                "Submit Application"
              )}
            </button>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
}

function AutoApplyNoticeModal({
  job,
  candidate,
  onClose,
}: {
  job: Job;
  candidate: CandidateData | null;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <Zap className="w-6 h-6 text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Auto-Apply Active</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-400 mt-0.5" />
                <div>
                  <p className="text-sm text-white font-medium mb-1">
                    You&apos;re already auto-applying to jobs like this!
                  </p>
                  <p className="text-xs text-slate-400">
                    Your {candidate?.plan} plan allows you to automatically apply to {candidate?.autoApplyLimit} jobs per month.
                    You&apos;ve used {candidate?.autoApplyCount}/{candidate?.autoApplyLimit} applications this month.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white">What happens next?</h3>
              <div className="space-y-2 text-sm text-slate-300">
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
                  <p>If this job matches your preferences (role, location, skills), you&apos;ll be automatically applied</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
                  <p>Our AI checks job compatibility every 15 minutes</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
                  <p>You&apos;ll receive a notification when your application is submitted</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition"
              >
                Got it
              </button>
              <button
                onClick={() => window.location.href = "/candidates/dashboard/auto-apply"}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition"
              >
                Manage Settings
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Similar Jobs Component
function SimilarJobs({ jobId }: { jobId: string }) {
  const [jobs, setJobs] = useState<{
    id: string;
    title: string;
    slug: string;
    location: string;
    employmentType: string;
    company: { name: string; slug: string; logoUrl?: string };
  }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/jobs/similar/${jobId}`)
      .then((res) => res.json())
      .then((data) => setJobs(data.jobs || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [jobId]);

  if (loading) {
    return (
      <div className="bg-slate-900/50 rounded-2xl border border-white/5 p-6">
        <h3 className="font-semibold text-white mb-4">Similar Jobs</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-slate-800 rounded w-3/4 mb-2" />
              <div className="h-3 bg-slate-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (jobs.length === 0) return null;

  return (
    <div className="bg-slate-900/50 rounded-2xl border border-white/5 p-6">
      <h3 className="font-semibold text-white mb-4">Similar Jobs</h3>
      <div className="space-y-4">
        {jobs.map((job) => (
          <Link
            key={job.id}
            href={`/jobs/${job.company.slug}/${job.slug}`}
            className="block p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-transparent hover:border-indigo-500/30 transition"
          >
            <p className="text-sm font-medium text-white truncate">{job.title}</p>
            <p className="text-xs text-slate-400 mt-1">{job.company.name}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs px-2 py-0.5 bg-slate-700 text-slate-300 rounded">
                {LOC_LABELS[job.location] || job.location}
              </span>
              <span className="text-xs px-2 py-0.5 bg-slate-700 text-slate-300 rounded">
                {TYPE_LABELS[job.employmentType] || job.employmentType}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
