"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Search, MapPin, Briefcase, Clock, Building2, Zap, Filter, X, ChevronRight,
  ChevronLeft, DollarSign, Calendar
} from "lucide-react";
import {
  LOC_LABELS,
  TYPE_LABELS,
  LOC_COLORS,
  POSTED_WITHIN_OPTIONS,
} from "@/lib/job-constants";

interface Job {
  id: string;
  title: string;
  slug: string;
  department: string;
  location: "REMOTE" | "HYBRID" | "ONSITE";
  city?: string;
  employmentType: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP";
  experienceYears: string;
  salaryMin?: string;
  salaryMax?: string;
  skills: string[];
  autoApplyEnabled: boolean;
  createdAt: string;
  company: {
    name: string;
    slug: string;
    logoUrl?: string;
    domain: string;
  };
}

interface FilterState {
  search: string;
  department: string;
  location: string;
  employmentType: string;
  company: string;
  salaryMin: string;
  salaryMax: string;
  postedWithin: string;
}

interface CandidatePrefs {
  autoApplyEnabled: boolean;
  targetRoles: string[];
}

export default function JobsClient() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    department: "",
    location: "",
    employmentType: "",
    company: "",
    salaryMin: "",
    salaryMax: "",
    postedWithin: "",
  });
  const [filterOptions, setFilterOptions] = useState<{
    departments: { name: string; count: number }[];
    companies: { name: string; slug: string }[];
  }>({ departments: [], companies: [] });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [candidatePrefs, setCandidatePrefs] = useState<CandidatePrefs | null>(null);
  const [matchingJobsCount, setMatchingJobsCount] = useState(0);

  // Check if user is logged in and has auto-apply enabled
  useEffect(() => {
    fetch("/api/candidates/preferences", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.preferences?.autoApplyEnabled) {
          setCandidatePrefs({
            autoApplyEnabled: true,
            targetRoles: data.preferences.targetRoles || [],
          });
          // Count matching jobs (simplified - would be more accurate with API)
          setMatchingJobsCount(data.preferences.targetRoles?.length * 3 || 0);
        }
      })
      .catch(() => {});
  }, []);

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.search) params.set("search", filters.search);
      if (filters.department) params.set("department", filters.department);
      if (filters.location) params.set("location", filters.location);
      if (filters.employmentType) params.set("employmentType", filters.employmentType);
      if (filters.company) params.set("company", filters.company);
      if (filters.salaryMin) params.set("salaryMin", filters.salaryMin);
      if (filters.salaryMax) params.set("salaryMax", filters.salaryMax);
      if (filters.postedWithin) params.set("postedWithin", filters.postedWithin);
      params.set("page", page.toString());
      params.set("limit", "20");

      const res = await fetch(`/api/jobs?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      setJobs(data.jobs);
      setTotalPages(data.pagination.totalPages);
      setTotalJobs(data.pagination.total);
      setFilterOptions({
        departments: data.filters.departments,
        companies: data.filters.companies,
      });
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      department: "",
      location: "",
      employmentType: "",
      company: "",
      salaryMin: "",
      salaryMax: "",
      postedWithin: "",
    });
    setPage(1);
  };

  const activeFilters = Object.entries(filters).filter(([k, v]) => v && k !== "search");

  // Pagination
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        pages.push(i);
      }
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }

    return (
      <div className="flex items-center justify-center gap-2 mt-8">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {pages.map((p, i) =>
          typeof p === "number" ? (
            <button
              key={i}
              onClick={() => setPage(p)}
              className={`w-10 h-10 rounded-lg text-sm font-medium transition ${
                page === p
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              {p}
            </button>
          ) : (
            <span key={i} className="text-slate-500 px-2">
              ...
            </span>
          )
        )}

        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#080c14]">
      {/* Auto-Apply Banner */}
      {candidatePrefs?.autoApplyEnabled && (
        <div className="sticky top-0 z-50 bg-gradient-to-r from-purple-600/90 to-indigo-600/90 backdrop-blur-sm border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-yellow-300" />
                <p className="text-white text-sm">
                  <span className="font-semibold">Auto-Apply is active</span>
                  {matchingJobsCount > 0 && (
                    <span className="text-white/80 ml-2">
                      — {matchingJobsCount} matching jobs found for your profile
                    </span>
                  )}
                </p>
              </div>
              <Link
                href="/candidates/dashboard/auto-apply"
                className="text-sm text-white/90 hover:text-white underline underline-offset-2"
              >
                Manage preferences →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-b from-[#0d1220] to-[#080c14] border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Find Your Dream Job
            </h1>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Browse opportunities from top companies. Apply directly or let our AI auto-apply for matching roles.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                placeholder="Search jobs, skills, or companies..."
                className="w-full bg-[#0f1627] border border-slate-700/60 rounded-xl pl-12 pr-4 py-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
              />
            </div>

            {/* Posted Within Pills */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <span className="text-slate-500 text-sm mr-2">Posted:</span>
              {POSTED_WITHIN_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() =>
                    handleFilterChange(
                      "postedWithin",
                      filters.postedWithin === option.value ? "" : option.value
                    )
                  }
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                    filters.postedWithin === option.value
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Filter toggles */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition ${
                  showFilters
                    ? "bg-indigo-600/20 text-indigo-300"
                    : "bg-slate-800/50 hover:bg-slate-700/50 text-slate-300"
                }`}
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>

              {activeFilters.map(([key, value]) => (
                <span
                  key={key}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded-lg text-xs"
                >
                  {key === "location"
                    ? LOC_LABELS[value] || value
                    : key === "employmentType"
                    ? TYPE_LABELS[value] || value
                    : key === "salaryMin"
                    ? `Min ₹${value}`
                    : key === "salaryMax"
                    ? `Max ₹${value}`
                    : key === "postedWithin"
                    ? POSTED_WITHIN_OPTIONS.find((o) => o.value === value)?.label
                    : value}
                  <button onClick={() => handleFilterChange(key as keyof FilterState, "")}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {activeFilters.length > 0 && (
                <button onClick={clearFilters} className="text-xs text-slate-500 hover:text-slate-300">
                  Clear all
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar Filters */}
          {showFilters && (
            <aside className="w-64 flex-shrink-0 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Department</h3>
                <div className="space-y-2">
                  {filterOptions.departments.slice(0, 8).map((dept) => (
                    <button
                      key={dept.name}
                      onClick={() => handleFilterChange("department", dept.name)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                        filters.department === dept.name
                          ? "bg-indigo-600/20 text-indigo-300"
                          : "text-slate-400 hover:bg-white/5"
                      }`}
                    >
                      {dept.name} ({dept.count})
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Location</h3>
                <div className="space-y-2">
                  {["REMOTE", "HYBRID", "ONSITE"].map((loc) => (
                    <button
                      key={loc}
                      onClick={() => handleFilterChange("location", loc)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                        filters.location === loc
                          ? "bg-indigo-600/20 text-indigo-300"
                          : "text-slate-400 hover:bg-white/5"
                      }`}
                    >
                      {LOC_LABELS[loc]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Employment Type</h3>
                <div className="space-y-2">
                  {["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"].map((type) => (
                    <button
                      key={type}
                      onClick={() => handleFilterChange("employmentType", type)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                        filters.employmentType === type
                          ? "bg-indigo-600/20 text-indigo-300"
                          : "text-slate-400 hover:bg-white/5"
                      }`}
                    >
                      {TYPE_LABELS[type]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Salary Range Filter */}
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Salary Range (₹/month)
                </h3>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.salaryMin}
                    onChange={(e) => handleFilterChange("salaryMin", e.target.value)}
                    className="w-1/2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.salaryMax}
                    onChange={(e) => handleFilterChange("salaryMax", e.target.value)}
                    className="w-1/2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Company Filter */}
              {filterOptions.companies.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-300 mb-3">Company</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {filterOptions.companies.slice(0, 10).map((company) => (
                      <button
                        key={company.slug}
                        onClick={() => handleFilterChange("company", company.slug)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                          filters.company === company.slug
                            ? "bg-indigo-600/20 text-indigo-300"
                            : "text-slate-400 hover:bg-white/5"
                        }`}
                      >
                        {company.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          )}

          {/* Job Listings */}
          <div className="flex-1">
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-slate-900/50 rounded-xl p-6 animate-pulse">
                    <div className="h-6 bg-slate-800 rounded w-3/4 mb-4" />
                    <div className="h-4 bg-slate-800 rounded w-1/2 mb-2" />
                    <div className="h-4 bg-slate-800 rounded w-1/4" />
                  </div>
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-16">
                <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-300 mb-2">No jobs found</h3>
                <p className="text-slate-500 mb-4">Try adjusting your filters or search terms</p>
                <button onClick={clearFilters} className="text-indigo-400 hover:text-indigo-300 text-sm">
                  Clear all filters
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-slate-500">
                    Showing {(page - 1) * 20 + 1}-{Math.min(page * 20, totalJobs)} of {totalJobs} jobs
                  </p>
                </div>
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>

                {renderPagination()}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function JobCard({ job }: { job: Job }) {
  const postedDate = new Date(job.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });

  return (
    <Link
      href={`/jobs/${job.company.slug}/${job.slug}`}
      className="block bg-slate-900/50 hover:bg-slate-900 border border-white/5 hover:border-indigo-500/30 rounded-xl p-6 transition-all group"
    >
      <div className="flex items-start gap-4">
        {/* Company Logo */}
        <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {job.company.logoUrl ? (
            <img src={job.company.logoUrl} alt={job.company.name} className="w-full h-full object-cover" />
          ) : (
            <Building2 className="w-6 h-6 text-slate-500" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-white group-hover:text-indigo-300 transition truncate">
                {job.title}
              </h3>
              <p className="text-sm text-slate-400">{job.company.name}</p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {job.autoApplyEnabled && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full text-xs">
                  <Zap className="w-3 h-3" />
                  Auto-Apply
                </span>
              )}
              <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-indigo-400 transition" />
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {LOC_LABELS[job.location]}
              {job.city && `, ${job.city}`}
            </span>
            <span className="flex items-center gap-1">
              <Briefcase className="w-4 h-4" />
              {TYPE_LABELS[job.employmentType]}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {job.experienceYears}
            </span>
            {job.salaryMin && job.salaryMax && (
              <span className="text-green-400">
                {job.salaryMin} - {job.salaryMax}
              </span>
            )}
          </div>

          {/* Skills */}
          <div className="flex flex-wrap gap-2 mt-3">
            {job.skills.slice(0, 5).map((skill) => (
              <span key={skill} className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded text-xs">
                {skill}
              </span>
            ))}
            {job.skills.length > 5 && (
              <span className="text-xs text-slate-500">+{job.skills.length - 5} more</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
        <span className={`px-2 py-1 rounded-full text-xs border ${LOC_COLORS[job.location]}`}>
          {LOC_LABELS[job.location]}
        </span>
        <span className="text-xs text-slate-500">Posted {postedDate}</span>
      </div>
    </Link>
  );
}
