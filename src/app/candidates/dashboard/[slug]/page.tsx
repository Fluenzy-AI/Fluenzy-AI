"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  Building,
  Clock,
  IndianRupee,
  CheckCircle,
  Upload,
  FileText,
  Loader2,
  Send,
  GraduationCap,
  ChevronRight,
} from "lucide-react";

interface JobDetails {
  id: string;
  title: string;
  slug: string;
  department: string;
  location: string;
  employmentType: string;
  experienceLevel: string;
  salaryRange?: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  isActive: boolean;
}

interface CandidateProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  skills?: string[];
  experience?: string;
  education?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  resumeUrl?: string;
}

export default function JobApplicationPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [job, setJob] = useState<JobDetails | null>(null);
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  // Form state
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [useExistingResume, setUseExistingResume] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch job details
        const jobRes = await fetch(`/api/careers/${slug}`);
        if (!jobRes.ok) throw new Error("Job not found");
        const jobData = await jobRes.json();
        setJob(jobData.job);

        // Fetch candidate profile
        const profileRes = await fetch("/api/candidates/me");
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData.candidate);
        }

        // Check if already applied
        const appsRes = await fetch(`/api/candidates/applications?type=internal`);
        if (appsRes.ok) {
          const appsData = await appsRes.json();
          const existing = appsData.applications?.find(
            (app: any) => app.job?.slug === slug
          );
          if (existing) {
            setAlreadyApplied(true);
          }
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job || alreadyApplied) return;

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("jobId", job.id);
      formData.append("coverLetter", coverLetter);

      if (!useExistingResume && resumeFile) {
        formData.append("resume", resumeFile);
      }

      const res = await fetch("/api/careers/apply", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit application");
      }

      setSubmitted(true);
    } catch (error: any) {
      console.error("Application failed:", error);
      alert(error.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-white/5 rounded-xl w-32" />
        <div className="h-48 bg-white/5 rounded-xl" />
        <div className="h-64 bg-white/5 rounded-xl" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
          <Briefcase className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Job Not Found</h2>
        <p className="text-slate-400 text-sm mb-6">
          This job posting may have been removed or is no longer available
        </p>
        <Link
          href="/candidates/dashboard"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-violet-500 text-white text-sm font-semibold hover:bg-violet-400 transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  // Success state after submission
  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Application Submitted! 🎉</h2>
        <p className="text-slate-400 text-sm mb-8 max-w-md mx-auto">
          Your application for <span className="text-white font-medium">{job.title}</span> has been
          received. Our team will review it and get back to you soon.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/candidates/dashboard/applications"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-violet-500 text-white text-sm font-semibold hover:bg-violet-400 transition-colors"
          >
            Track Application
            <ChevronRight className="w-4 h-4" />
          </Link>
          <Link
            href="/careers"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full border border-white/10 text-white text-sm font-medium hover:bg-white/5 transition-colors"
          >
            Browse More Jobs
          </Link>
        </div>
      </motion.div>
    );
  }

  // Already applied state
  if (alreadyApplied) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/10 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-amber-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Already Applied</h2>
        <p className="text-slate-400 text-sm mb-6">
          You have already applied for <span className="text-white">{job.title}</span>
        </p>
        <Link
          href="/candidates/dashboard/applications"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-violet-500 text-white text-sm font-semibold hover:bg-violet-400 transition-colors"
        >
          View Application Status
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        href="/candidates/dashboard"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      {/* Job Header */}
      <div className="bg-[#13161E] rounded-xl border border-white/5 p-6">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-medium text-violet-400 mb-1 block">Apply for this Role</span>
            <h1 className="text-xl font-bold text-white mb-2">{job.title}</h1>
            <div className="flex flex-wrap gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Building className="w-3 h-3" />
                Fluenzy AI
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {job.location}
              </span>
              <span className="flex items-center gap-1">
                <Briefcase className="w-3 h-3" />
                {job.employmentType.replace("_", " ")}
              </span>
              <span className="flex items-center gap-1">
                <GraduationCap className="w-3 h-3" />
                {job.experienceLevel}
              </span>
              {job.salaryRange && (
                <span className="flex items-center gap-1">
                  <IndianRupee className="w-3 h-3" />
                  {job.salaryRange}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Application Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Preview */}
            <div className="bg-[#13161E] rounded-xl border border-white/5 p-6">
              <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Your Profile Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-xs text-slate-500">Full Name</label>
                  <p className="text-white">{profile?.name || "—"}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500">Email</label>
                  <p className="text-white">{profile?.email || "—"}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500">Phone</label>
                  <p className="text-white">{profile?.phone || "—"}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500">Location</label>
                  <p className="text-white">{profile?.location || "—"}</p>
                </div>
              </div>
              <Link
                href="/candidates/dashboard/profile"
                className="inline-flex items-center gap-1 mt-4 text-xs text-violet-400 hover:text-violet-300 transition-colors"
              >
                Edit Profile
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Resume */}
            <div className="bg-[#13161E] rounded-xl border border-white/5 p-6">
              <h2 className="text-sm font-semibold text-white mb-4">Resume</h2>

              {profile?.resumeUrl && (
                <label className="flex items-center gap-3 p-4 rounded-xl border border-white/5 mb-4 cursor-pointer hover:border-violet-500/30 transition-colors">
                  <input
                    type="radio"
                    name="resume-option"
                    checked={useExistingResume}
                    onChange={() => setUseExistingResume(true)}
                    className="w-4 h-4 accent-violet-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-white font-medium">Use existing resume</p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {profile.resumeUrl.split("/").pop()}
                    </p>
                  </div>
                  <FileText className="w-5 h-5 text-violet-400" />
                </label>
              )}

              <label className="flex items-center gap-3 p-4 rounded-xl border border-white/5 cursor-pointer hover:border-violet-500/30 transition-colors">
                <input
                  type="radio"
                  name="resume-option"
                  checked={!useExistingResume}
                  onChange={() => setUseExistingResume(false)}
                  className="w-4 h-4 accent-violet-500"
                />
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">
                    {profile?.resumeUrl ? "Upload new resume" : "Upload your resume"}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">PDF, DOC, DOCX (Max 5MB)</p>
                </div>
                <Upload className="w-5 h-5 text-slate-500" />
              </label>

              <AnimatePresence>
                {!useExistingResume && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4"
                  >
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                      className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-violet-500/10 file:text-violet-400 hover:file:bg-violet-500/20 cursor-pointer"
                    />
                    {resumeFile && (
                      <p className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        {resumeFile.name}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Cover Letter */}
            <div className="bg-[#13161E] rounded-xl border border-white/5 p-6">
              <h2 className="text-sm font-semibold text-white mb-4">
                Cover Letter <span className="text-slate-500 font-normal">(Optional)</span>
              </h2>
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={6}
                placeholder="Tell us why you're interested in this role and what makes you a great fit..."
                className="w-full bg-[#0A0C10] border border-white/5 text-white rounded-xl px-4 py-3 text-sm placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 resize-none"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || (!useExistingResume && !resumeFile && !profile?.resumeUrl)}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-violet-500 text-white font-semibold hover:bg-violet-400 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit Application
                </>
              )}
            </button>
          </form>
        </div>

        {/* Job Details Sidebar */}
        <div className="space-y-6">
          {/* Description */}
          <div className="bg-[#13161E] rounded-xl border border-white/5 p-6">
            <h3 className="text-sm font-semibold text-white mb-3">About the Role</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{job.description}</p>
          </div>

          {/* Requirements */}
          {job.requirements && job.requirements.length > 0 && (
            <div className="bg-[#13161E] rounded-xl border border-white/5 p-6">
              <h3 className="text-sm font-semibold text-white mb-3">Requirements</h3>
              <ul className="space-y-2">
                {job.requirements.slice(0, 5).map((req, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-2 flex-shrink-0" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* View Full Details */}
          <Link
            href={`/careers/${job.slug}`}
            target="_blank"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-sm text-slate-300 hover:bg-white/5 transition-colors"
          >
            View Full Job Details
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
