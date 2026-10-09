"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Building2,
  MapPin,
  Briefcase,
  Globe,
  Users,
  Search,
  CheckCircle2,
  FileText,
  X,
  Sparkles,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  Eye,
  Check,
  Calendar,
} from "lucide-react";

export interface PublicJob {
  id: string;
  title: string;
  slug: string;
  department: string;
  location: string;
  city?: string;
  employmentType: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  skills: string[];
  experienceYears: string;
  salaryMin?: string;
  salaryMax?: string;
  createdAt: string;
}

export interface PublicCompany {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  logoUrl?: string;
  website?: string;
  description?: string;
  industry?: string;
  size?: string;
}

interface CompanyCareersClientProps {
  company: PublicCompany;
  jobs: PublicJob[];
}

export default function CompanyCareersClient({ company, jobs }: CompanyCareersClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [viewingJob, setViewingJob] = useState<PublicJob | null>(null);
  const [selectedJob, setSelectedJob] = useState<PublicJob | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Application form state
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    experience: "1-3 years",
    resumeUrl: "",
    resumeName: "",
    portfolio: "",
    linkedin: "",
    coverLetter: "",
  });

  const departments = Array.from(new Set(jobs.map((j) => j.department)));

  const filteredJobs = jobs.filter((j) => {
    const matchesSearch =
      j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = departmentFilter === "all" || j.department === departmentFilter;
    return matchesSearch && matchesDept;
  });

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedJob) return;
    if (!form.name || !form.email || !form.phone || !form.resumeUrl) {
      return alert("Please fill in all required fields including your resume link.");
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/company/public/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: selectedJob.id,
          ...form,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const d = await res.json();
        alert(d.error || "Failed to submit application");
      }
    } catch {
      alert("Network error submitting application");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0B0F17] text-white flex flex-col font-sans select-none">
      {/* Hero / Company Header Banner */}
      <section className="relative bg-gradient-to-b from-indigo-950/40 via-slate-900/80 to-[#0B0F17] border-b border-white/5 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Breadcrumb / Platform Badge */}
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Link href="/" className="text-slate-400 hover:text-white font-semibold transition">
                Fluenzy AI
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-slate-300 font-medium">{company.name} Careers</span>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/5 text-slate-300 border border-white/10">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> Official Careers Page
            </span>
          </div>

          {/* Company Main Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pt-2">
            {company.logoUrl ? (
              <img
                src={company.logoUrl}
                alt={company.name}
                className="w-20 h-20 rounded-2xl object-cover border border-white/10 shadow-2xl flex-shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 border border-indigo-500/30 flex items-center justify-center text-white font-extrabold text-3xl flex-shrink-0 shadow-2xl">
                {company.name[0]?.toUpperCase()}
              </div>
            )}

            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-extrabold text-white tracking-tight">{company.name}</h1>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified Employer
                </span>
              </div>

              {company.description && (
                <p className="text-slate-300 text-sm max-w-3xl leading-relaxed">{company.description}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                {company.industry && (
                  <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                    <Building2 className="w-3.5 h-3.5 text-indigo-400" /> {company.industry}
                  </span>
                )}
                {company.size && (
                  <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                    <Users className="w-3.5 h-3.5 text-indigo-400" /> {company.size} employees
                  </span>
                )}
                {company.website && (
                  <a
                    href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 transition bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20"
                  >
                    <Globe className="w-3.5 h-3.5" /> Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Search & Department Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Open Positions</h2>
            <p className="text-slate-400 text-xs mt-0.5">
              {filteredJobs.length} active job posting{filteredJobs.length === 1 ? "" : "s"} at {company.name}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search job title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-900/90 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner"
              />
            </div>

            {/* Department Dropdown */}
            {departments.length > 0 && (
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full sm:w-auto px-3.5 py-2 bg-slate-900/90 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="all">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Job Postings List */}
        {filteredJobs.length === 0 ? (
          <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-12 text-center space-y-3 shadow-xl">
            <Briefcase className="w-10 h-10 text-slate-500 mx-auto" />
            <p className="text-slate-300 font-semibold">No open positions found</p>
            <p className="text-slate-500 text-xs">
              {searchQuery || departmentFilter !== "all"
                ? "Try adjusting your search query or department filter."
                : "Check back later for new career opportunities at " + company.name + "."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                onClick={() => setViewingJob(job)}
                className="bg-slate-900/80 hover:bg-slate-900 border border-white/5 hover:border-indigo-500/40 rounded-2xl p-6 transition-all duration-200 shadow-xl group flex flex-col sm:flex-row sm:items-center justify-between gap-6 cursor-pointer"
              >
                <div className="space-y-2.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-white text-lg group-hover:text-indigo-300 transition flex items-center gap-2">
                      {job.title}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {job.department}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      {job.location} {job.city ? `(${job.city})` : ""}
                    </span>
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                      {job.employmentType.replace(/_/g, " ")}
                    </span>
                    <span>Experience: {job.experienceYears}</span>
                    {(job.salaryMin || job.salaryMax) && (
                      <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-mono font-semibold text-[11px]">
                        Salary: {job.salaryMin} - {job.salaryMax}
                      </span>
                    )}
                  </div>

                  {job.skills && job.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {job.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-white/5 text-[11px] text-slate-300 border border-white/5"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 sm:flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewingJob(job);
                    }}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-medium rounded-xl transition border border-white/10 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-400" /> View Details
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedJob(job);
                      setIsApplying(true);
                      setSubmitted(false);
                    }}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Apply Now <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* JOB DETAILS MODAL */}
      {viewingJob && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto my-8 shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-white/5 sticky top-0 bg-slate-900/95 backdrop-blur z-10">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-extrabold text-white text-xl">{viewingJob.title}</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {viewingJob.department}
                  </span>
                </div>
                <p className="text-slate-400 text-xs flex items-center gap-3">
                  <span>{company.name}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {viewingJob.location} {viewingJob.city ? `(${viewingJob.city})` : ""}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {viewingJob.employmentType.replace(/_/g, " ")}</span>
                </p>
              </div>
              <button
                onClick={() => setViewingJob(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 text-sm text-slate-300">
              {/* Key Specs Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-800/60 p-4 rounded-xl border border-white/5">
                <div>
                  <p className="text-[11px] text-slate-400 font-medium">Experience</p>
                  <p className="font-semibold text-white text-xs mt-0.5">{viewingJob.experienceYears}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 font-medium">Job Type</p>
                  <p className="font-semibold text-white text-xs mt-0.5">{viewingJob.employmentType.replace(/_/g, " ")}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 font-medium">Location</p>
                  <p className="font-semibold text-white text-xs mt-0.5">{viewingJob.location}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 font-medium">Salary</p>
                  <p className="font-semibold text-emerald-400 text-xs mt-0.5">
                    {viewingJob.salaryMin || viewingJob.salaryMax
                      ? `${viewingJob.salaryMin || ""} - ${viewingJob.salaryMax || ""}`
                      : "Not Specified"}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h4 className="font-bold text-white text-base">About the Role</h4>
                <p className="text-slate-300 leading-relaxed whitespace-pre-line text-xs sm:text-sm">
                  {viewingJob.description}
                </p>
              </div>

              {/* Responsibilities */}
              {viewingJob.responsibilities && viewingJob.responsibilities.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-white text-base">Key Responsibilities</h4>
                  <ul className="space-y-1.5 pl-1">
                    {viewingJob.responsibilities.map((resp, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0" />
                        <span>{resp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Requirements */}
              {viewingJob.requirements && viewingJob.requirements.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-white text-base">Requirements & Qualifications</h4>
                  <ul className="space-y-1.5 pl-1">
                    {viewingJob.requirements.map((req, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300">
                        <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Skills */}
              {viewingJob.skills && viewingJob.skills.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-white text-base">Required Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {viewingJob.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-lg text-xs font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-white/5 sticky bottom-0 bg-slate-900/95 backdrop-blur z-10 flex items-center justify-between gap-4">
              <button
                onClick={() => setViewingJob(null)}
                className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSelectedJob(viewingJob);
                  setViewingJob(null);
                  setIsApplying(true);
                  setSubmitted(false);
                }}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-indigo-600/25 flex items-center gap-2 cursor-pointer"
              >
                Apply For Position <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Application Modal */}
      {isApplying && selectedJob && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto my-8 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5 sticky top-0 bg-slate-900 z-10">
              <div>
                <h3 className="font-bold text-white text-lg">Apply for {selectedJob.title}</h3>
                <p className="text-slate-400 text-xs">{company.name} · {selectedJob.department}</p>
              </div>
              <button
                onClick={() => setIsApplying(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {submitted ? (
              <div className="p-10 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold text-white">Application Submitted!</h4>
                <p className="text-slate-300 text-sm max-w-md mx-auto">
                  Thank you for applying for the <strong>{selectedJob.title}</strong> role at {company.name}.
                  The hiring team will review your application and contact you directly.
                </p>
                <button
                  onClick={() => setIsApplying(false)}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleApply} className="p-6 space-y-4">
                {/* Form inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 font-medium block mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-medium block mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="rahul@example.com"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 font-medium block mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-medium block mb-1">Total Experience *</label>
                    <select
                      value={form.experience}
                      onChange={(e) => setForm((f) => ({ ...f, experience: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                    >
                      <option value="Fresher">Fresher (0 years)</option>
                      <option value="1-3 years">1-3 years</option>
                      <option value="3-5 years">3-5 years</option>
                      <option value="5-8 years">5-8 years</option>
                      <option value="8+ years">8+ years</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1">
                    Resume URL / Google Drive Link *
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://drive.google.com/file/d/..."
                    value={form.resumeUrl}
                    onChange={(e) => setForm((f) => ({ ...f, resumeUrl: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Provide a public link to your resume PDF (Google Drive, Dropbox, Notion, etc.)
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 font-medium block mb-1">LinkedIn Profile</label>
                    <input
                      type="url"
                      placeholder="https://linkedin.com/in/..."
                      value={form.linkedin}
                      onChange={(e) => setForm((f) => ({ ...f, linkedin: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-medium block mb-1">Portfolio / Website</label>
                    <input
                      type="url"
                      placeholder="https://github.com/..."
                      value={form.portfolio}
                      onChange={(e) => setForm((f) => ({ ...f, portfolio: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1">Cover Letter / Note</label>
                  <textarea
                    rows={3}
                    placeholder="Tell us briefly why you're a great fit for this role..."
                    value={form.coverLetter}
                    onChange={(e) => setForm((f) => ({ ...f, coverLetter: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-indigo-600/25 cursor-pointer mt-2"
                >
                  {submitting ? "Submitting Application..." : "Submit Application"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} {company.name}. Powered by Fluenzy AI Careers Portal.</p>
      </footer>
    </div>
  );
}
