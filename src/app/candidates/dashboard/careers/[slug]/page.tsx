"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
  Calendar,
  Users,
  Globe,
  Target,
  Award,
  Heart,
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
  postedAt: string;
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

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const autoApply = searchParams.get("autoApply") === "true";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [job, setJob] = useState<JobDetails | null>(null);
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  // Form state - editable fields
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    experience: "0-1 years",
    linkedin: "",
    portfolio: "",
  });
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [useExistingResume, setUseExistingResume] = useState(true);
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch job details
        const jobRes = await fetch(`/api/careers/jobs/${slug}`);
        if (!jobRes.ok) throw new Error("Job not found");
        const jobData = await jobRes.json();
        setJob(jobData.job);

        // Fetch candidate profile
        const profileRes = await fetch("/api/candidates/me");
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData.candidate);
          
          // Pre-fill form with profile data if available
          setFormData({
            name: profileData.candidate?.name || "",
            email: profileData.candidate?.email || "",
            phone: profileData.candidate?.phone || "",
            experience: profileData.candidate?.experience || "0-1 years",
            linkedin: profileData.candidate?.linkedinUrl || "",
            portfolio: profileData.candidate?.portfolioUrl || profileData.candidate?.githubUrl || "",
          });
          
          // Use existing resume if available
          setUseExistingResume(!!profileData.candidate?.resumeUrl);
        }

        // Check if already applied
        const appsRes = await fetch(`/api/candidates/applications?type=internal`);
        if (appsRes.ok) {
          const appsData = await appsRes.json();
          console.log('[FETCH_DATA] Checking if already applied:', {
            slug,
            jobId: jobData.job?.id,
            applications: appsData.applications?.map((app: any) => ({
              jobSlug: app.jobSlug,
              jobId: app.jobId,
              jobTitle: app.jobTitle,
            })),
          });
          const existing = appsData.applications?.find(
            (app: any) => app.jobSlug === slug || app.jobId === jobData.job?.id
          );
          if (existing) {
            console.log('[FETCH_DATA] Already applied!', existing);
            setAlreadyApplied(true);
          } else {
            console.log('[FETCH_DATA] Not applied yet');
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

  // Auto-apply functionality
  useEffect(() => {
    if (autoApply && job && !alreadyApplied && !showApplicationForm) {
      setShowApplicationForm(true);
    }
  }, [autoApply, job, alreadyApplied, showApplicationForm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('[APPLY_SUBMIT] Starting submission...', {
      hasJob: !!job,
      alreadyApplied,
      formData,
      useExistingResume,
      hasResumeFile: !!resumeFile,
      profileResumeUrl: profile?.resumeUrl,
    });

    if (!job) {
      alert("Job information not found. Please refresh the page.");
      return;
    }

    if (alreadyApplied) {
      alert("You have already applied for this position.");
      return;
    }

    // Validate required fields
    if (!formData.name || !formData.email || !formData.phone) {
      alert("Please fill in all required fields (Name, Email, Phone)");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert("Please enter a valid email address");
      return;
    }

    // Phone validation (basic)
    if (formData.phone.length < 7) {
      alert("Please enter a valid phone number");
      return;
    }

    setSubmitting(true);

    try {
      // If uploading new resume, do that first
      let resumeUrl = profile?.resumeUrl || "";
      let resumeName = "";

      if (!useExistingResume && resumeFile) {
        const uploadData = new FormData();
        uploadData.append("file", resumeFile);
        
        const uploadRes = await fetch("/api/careers/upload-resume", {
          method: "POST",
          body: uploadData,
        });

        if (!uploadRes.ok) {
          throw new Error("Failed to upload resume");
        }

        const uploadResult = await uploadRes.json();
        resumeUrl = uploadResult.url;
        resumeName = resumeFile.name;
      } else if (!resumeUrl) {
        alert("Please upload a resume");
        return;
      }

      // Submit application with all required fields
      const applicationData = {
        jobId: job.id,
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim(),
        phone: formData.phone.trim(),
        resumeUrl,
        resumeName: resumeName || "resume.pdf",
        portfolio: formData.portfolio.trim() || "",
        coverLetter: coverLetter.trim(),
        experience: formData.experience,
        linkedin: formData.linkedin.trim() || "",
        candidateId: profile?.id || undefined,
      };

      console.log('[APPLY] Submitting application:', applicationData);

      const res = await fetch("/api/careers/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(applicationData),
      });

      console.log('[APPLY] Response status:', res.status);

      if (!res.ok) {
        let errorMessage = "Failed to submit application";
        try {
          const data = await res.json();
          errorMessage = data.error || errorMessage;
        } catch (e) {
          console.error('[APPLY] Failed to parse error response');
        }
        throw new Error(errorMessage);
      }

      const result = await res.json();
      console.log('[APPLY] Application submitted successfully:', result);

      setSubmitted(true);
      setShowApplicationForm(false);
      setAlreadyApplied(true);
    } catch (error: any) {
      console.error("Application failed:", error);
      alert(error.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 animate-pulse">
        <div className="h-6 bg-white/5 rounded-xl w-24 sm:w-32" />
        <div className="h-36 sm:h-48 bg-white/5 rounded-xl" />
        <div className="h-48 sm:h-64 bg-white/5 rounded-xl" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-8 sm:py-12">
        <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
          <Briefcase className="w-7 h-7 sm:w-8 sm:h-8 text-red-400" />
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-white mb-2">Job Not Found</h2>
        <p className="text-slate-400 text-sm mb-6 px-4">
          This job posting may have been removed or is no longer available
        </p>
        <Link
          href="/candidates/dashboard/careers"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-violet-500 text-white text-sm font-semibold hover:bg-violet-400 transition-colors"
        >
          Back to Jobs
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
        className="text-center py-8 sm:py-12 px-4"
      >
        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-400" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">Application Submitted! 🎉</h2>
        <p className="text-slate-400 text-sm mb-6 sm:mb-8 max-w-md mx-auto">
          Your application for <span className="text-white font-medium">{job.title}</span> has been
          received. Our team will review it and get back to you soon.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/candidates/dashboard/applications"
            className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 rounded-xl bg-violet-500 text-white text-sm font-semibold hover:bg-violet-400 active:bg-violet-600 transition-colors"
          >
            Track Application
            <ChevronRight className="w-4 h-4" />
          </Link>
          <Link
            href="/candidates/dashboard/careers"
            className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 rounded-xl border border-white/10 text-white text-sm font-medium hover:bg-white/5 active:bg-white/10 transition-colors"
          >
            Browse More Jobs
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Back Button */}
      <Link
        href="/candidates/dashboard/careers"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white active:text-violet-400 transition-colors py-1"
      >
        <ArrowLeft className="w-4 h-4" />
        All open positions
      </Link>

      {/* Job Header */}
      <div className="bg-[#13161E] rounded-xl border border-white/5 p-4 sm:p-6">
        <div className="flex flex-col gap-4">
          {/* Tags */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 sm:px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {job.employmentType.replace("_", " ")}
            </span>
            <span className="px-2.5 sm:px-3 py-1 rounded-full text-xs font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20">
              {job.department}
            </span>
          </div>
          
          {/* Title */}
          <h1 className="text-xl sm:text-2xl font-bold text-white">{job.title}</h1>
          
          {/* Meta Info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-sm">
            <div className="flex items-center gap-2 text-slate-400">
              <Building className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">Fluenzy AI</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{job.location}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Users className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{job.experienceLevel}</span>
            </div>
            {job.salaryRange && (
              <div className="flex items-center gap-2 text-slate-400">
                <IndianRupee className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{job.salaryRange}</span>
              </div>
            )}
          </div>
          
          {/* Posted Date */}
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <Calendar className="w-3 h-3 flex-shrink-0" />
            Posted {new Date(job.postedAt).toLocaleDateString("en-IN", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
          
          {/* Apply Button - Full width on mobile */}
          <div className="pt-2">
            {!alreadyApplied ? (
              <button
                onClick={() => setShowApplicationForm(true)}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 rounded-xl bg-violet-500 text-white font-semibold hover:bg-violet-400 active:bg-violet-600 transition-colors"
              >
                Apply Now →
              </button>
            ) : (
              <div className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 sm:px-8 py-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Applied</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* About the Role */}
          <div className="bg-[#13161E] rounded-xl border border-white/5 p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400 flex-shrink-0" />
              About this Role
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">{job.description}</p>
          </div>

          {/* Responsibilities */}
          {job.responsibilities && job.responsibilities.length > 0 && (
            <div className="bg-[#13161E] rounded-xl border border-white/5 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
                <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400 flex-shrink-0" />
                Key Responsibilities
              </h2>
              <ul className="space-y-2.5 sm:space-y-3">
                {job.responsibilities.map((responsibility, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-2 flex-shrink-0" />
                    <span className="flex-1 min-w-0">{responsibility}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Requirements */}
          {job.requirements && job.requirements.length > 0 && (
            <div className="bg-[#13161E] rounded-xl border border-white/5 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
                <Award className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400 flex-shrink-0" />
                Requirements
              </h2>
              <ul className="space-y-2.5 sm:space-y-3">
                {job.requirements.map((requirement, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                    <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span className="flex-1 min-w-0">{requirement}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Benefits */}
          {job.benefits && job.benefits.length > 0 && (
            <div className="bg-[#13161E] rounded-xl border border-white/5 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
                <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400 flex-shrink-0" />
                What We Offer
              </h2>
              <ul className="space-y-2.5 sm:space-y-3">
                {job.benefits.map((benefit, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                    <span className="flex-1 min-w-0">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Sidebar - Shows on top on mobile via order */}
        <div className="space-y-4 sm:space-y-6 order-first lg:order-none">
          <div className="bg-[#13161E] rounded-xl border border-white/5 p-4 sm:p-6">
            <h3 className="text-sm font-semibold text-white mb-3 sm:mb-4">Job Summary</h3>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 text-sm">
              <div>
                <label className="text-xs text-slate-500 block">Department</label>
                <p className="text-white truncate">{job.department}</p>
              </div>
              <div>
                <label className="text-xs text-slate-500 block">Location</label>
                <p className="text-white truncate">{job.location}</p>
              </div>
              <div>
                <label className="text-xs text-slate-500 block">Type</label>
                <p className="text-white truncate">{job.employmentType.replace("_", " ")}</p>
              </div>
              <div>
                <label className="text-xs text-slate-500 block">Experience</label>
                <p className="text-white truncate">{job.experienceLevel}</p>
              </div>
              {job.salaryRange && (
                <div>
                  <label className="text-xs text-slate-500 block">Salary</label>
                  <p className="text-white truncate">{job.salaryRange}</p>
                </div>
              )}
              <div>
                <label className="text-xs text-slate-500 block">Posted</label>
                <p className="text-white">
                  {new Date(job.postedAt).toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#13161E] rounded-xl border border-white/5 p-4 sm:p-6 text-center">
            <Globe className="w-7 h-7 sm:w-8 sm:h-8 text-violet-400 mx-auto mb-2 sm:mb-3" />
            <h3 className="text-sm font-semibold text-white mb-1 sm:mb-2">Questions?</h3>
            <p className="text-xs text-slate-400 mb-3 sm:mb-4">
              Have questions about this role or our company culture?
            </p>
            <a
              href="mailto:careers@fluenzyai.app"
              className="text-sm text-violet-400 hover:text-violet-300 active:text-violet-500 transition-colors break-all"
            >
              careers@fluenzyai.app
            </a>
          </div>
        </div>
      </div>

      {/* Application Form Modal */}
      <AnimatePresence>
        {showApplicationForm && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="bg-[#13161E] border-t sm:border border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 z-10 p-4 sm:p-6 border-b border-white/5 bg-[#13161E]">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base sm:text-lg font-semibold text-white">Apply for this Role</h2>
                    <p className="text-sm text-slate-400 mt-0.5 truncate">
                      {job.title} • {job.department}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowApplicationForm(false);
                      router.push('/candidates/dashboard');
                    }}
                    className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 active:bg-white/10 transition-colors flex-shrink-0"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 sm:space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-sm font-semibold text-white mb-3 sm:mb-4">Personal Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1.5 sm:mb-2">
                        Full Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        placeholder="Enter your full name"
                        className="w-full bg-[#0A0C10] border border-white/5 text-white rounded-xl px-3 sm:px-4 py-2.5 text-sm placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1.5 sm:mb-2">
                        Email Address <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        placeholder="your.email@example.com"
                        className="w-full bg-[#0A0C10] border border-white/5 text-white rounded-xl px-3 sm:px-4 py-2.5 text-sm placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-2">
                        Phone Number <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                        placeholder="+91 1234567890"
                        className="w-full bg-[#0A0C10] border border-white/5 text-white rounded-xl px-4 py-2.5 text-sm placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-2">
                        Experience Level <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={formData.experience}
                        onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                        required
                        className="w-full bg-[#0A0C10] border border-white/5 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50"
                      >
                        <option value="0-1 years">0-1 years</option>
                        <option value="1-3 years">1-3 years</option>
                        <option value="3-5 years">3-5 years</option>
                        <option value="5-7 years">5-7 years</option>
                        <option value="7+ years">7+ years</option>
                      </select>
                    </div>
                  </div>

                  {/* LinkedIn and Portfolio */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="text-xs text-slate-400 block mb-2">
                        LinkedIn Profile <span className="text-slate-500">(Optional)</span>
                      </label>
                      <input
                        type="url"
                        value={formData.linkedin}
                        onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                        placeholder="https://linkedin.com/in/yourprofile"
                        className="w-full bg-[#0A0C10] border border-white/5 text-white rounded-xl px-4 py-2.5 text-sm placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-2">
                        Portfolio / GitHub <span className="text-slate-500">(Optional)</span>
                      </label>
                      <input
                        type="url"
                        value={formData.portfolio}
                        onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })}
                        placeholder="https://yourportfolio.com"
                        className="w-full bg-[#0A0C10] border border-white/5 text-white rounded-xl px-4 py-2.5 text-sm placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50"
                      />
                    </div>
                  </div>
                </div>

                {/* Resume Section */}
                <div>
                  <h3 className="text-sm font-semibold text-white mb-4">
                    Resume <span className="text-red-400">*</span>
                  </h3>

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
                      <p className="text-xs text-slate-500 mt-0.5">PDF only (Max 5MB)</p>
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
                          accept=".pdf"
                          onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                          required={!profile?.resumeUrl}
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
                <div>
                  <h3 className="text-sm font-semibold text-white mb-4">
                    Cover Letter <span className="text-slate-500 font-normal">(Optional)</span>
                  </h3>
                  <textarea
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    rows={5}
                    placeholder="Tell us why you're interested in this role and what makes you a great fit..."
                    className="w-full bg-[#0A0C10] border border-white/5 text-white rounded-xl px-4 py-3 text-sm placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 resize-none"
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    {coverLetter.length}/3000 characters
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-violet-500 text-white font-semibold hover:bg-violet-400 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Submitting Application...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Submit Application
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}