"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Search, MapPin, Briefcase, Clock, Building2, Zap, Filter, X, ChevronRight
} from "lucide-react";

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

const LOC_COLORS: Record<string, string> = {
  REMOTE: "bg-green-500/10 text-green-400 border-green-500/20",
  HYBRID: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  ONSITE: "bg-orange-500/10 text-orange-400 border-orange-500/20",
};

export default function JobsClient() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    department: "",
    location: "",
    employmentType: "",
    company: "",
  });
  const [filterOptions, setFilterOptions] = useState<{
    departments: { name: string; count: number }[];
    companies: { name: string; slug: string }[];
  }>({ departments: [], companies: [] });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchJobs = useCallback(async (resetPage = false) => {
    try {
      const currentPage = resetPage ? 1 : page;
      if (resetPage) setPage(1);

      const params = new URLSearchParams();
      if (filters.search) params.set("search", filters.search);
      if (filters.department) params.set("department", filters.department);
      if (filters.location) params.set("location", filters.location);
      if (filters.employmentType) params.set("employmentType", filters.employmentType);
      if (filters.company) params.set("company", filters.company);
      params.set("page", currentPage.toString());
      params.set("limit", "20");

      const res = await fetch(`/api/jobs?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();

      if (resetPage) {
        setJobs(data.jobs);
      } else {
        setJobs((prev) => [...prev, ...data.jobs]);
      }

      setHasMore(data.pagination.page < data.pagination.totalPages);
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
    setLoading(true);
    fetchJobs(true);
  }, [filters]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      department: "",
      location: "",
      employmentType: "",
      company: "",
    });
  };

  const activeFilters = Object.entries(filters).filter(([k, v]) => v && k !== "search");

  return (
    <div className="min-h-screen bg-[#080c14]">
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

            {/* Filter toggles */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 rounded-lg text-sm transition"
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>

              {activeFilters.map(([key, value]) => (
                <span
                  key={key}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded-lg text-xs"
                >
                  {key === "location" ? LOC_LABELS[value] || value :
                   key === "employmentType" ? TYPE_LABELS[value] || value :
                   value}
                  <button onClick={() => handleFilterChange(key as keyof FilterState, "")}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {activeFilters.length > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-slate-500 hover:text-slate-300"
                >
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
                <button
                  onClick={clearFilters}
                  className="text-indigo-400 hover:text-indigo-300 text-sm"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm text-slate-500 mb-4">{jobs.length} jobs found</p>
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>

                {hasMore && (
                  <div className="mt-8 text-center">
                    <button
                      onClick={() => setPage((p) => p + 1)}
                      className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm transition"
                    >
                      Load more jobs
                    </button>
                  </div>
                )}
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
              <span
                key={skill}
                className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded text-xs"
              >
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
