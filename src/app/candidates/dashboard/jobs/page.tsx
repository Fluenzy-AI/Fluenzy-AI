"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";
import { JobCard } from "@/components/careers/JobCard";
import { FilterBar } from "@/components/careers/FilterBar";
import { JobCardSkeleton } from "@/components/shared/SkeletonLoader";
import { SimpleCounter } from "@/components/shared/AnimatedCounter";
import { Search, Filter, Sparkles } from "lucide-react";

type LocationType = "REMOTE" | "HYBRID" | "ONSITE";
type EmploymentType = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP";

interface Job {
  id: string;
  title: string;
  slug: string;
  department: string;
  location: LocationType;
  employmentType: EmploymentType;
  experienceYears: string;
  salaryRange?: string;
  skills: string[];
  isActive: boolean;
  createdAt: string;
  _count: { applications: number };
}

interface CandidateSession {
  id: string;
  name: string;
  email: string;
  skills?: string[];
}

interface FilterState {
  search: string;
  department: string;
  location: string;
  employmentType: string;
}

// FadeIn wrapper
function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] as const }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Empty State
function EmptyState({ onClearFilters }: { onClearFilters: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-[20px] border border-dashed border-white/[0.1] bg-[#13161E]/50 py-16 text-center"
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="mb-6"
      >
        <div className="w-20 h-20 rounded-full bg-[#7C5CFC]/10 flex items-center justify-center mx-auto">
          <Search className="w-8 h-8 text-[#7C5CFC]" />
        </div>
      </motion.div>

      <h3 className="text-lg font-semibold text-[#F1F0F5] mb-2">
        No roles match your filters
      </h3>
      <p className="text-sm text-[#8B8A99] max-w-sm mx-auto mb-6">
        Try adjusting your search criteria or clearing some filters to see more results.
      </p>
      <button
        onClick={onClearFilters}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7C5CFC]/10 text-[#9F7FFF] hover:bg-[#7C5CFC]/20 text-sm font-medium transition-colors"
      >
        <Filter className="w-4 h-4" />
        Clear all filters
      </button>
    </motion.div>
  );
}

export default function BrowseJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filtered, setFiltered] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<string[]>([]);
  const [candidate, setCandidate] = useState<CandidateSession | null>(null);
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const [displayCount, setDisplayCount] = useState(8);

  const [filters, setFilters] = useState<FilterState>({
    search: "",
    department: "All",
    location: "All",
    employmentType: "All",
  });

  // Fetch candidate session
  useEffect(() => {
    fetch("/api/candidates/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setCandidate(d?.candidate || null))
      .catch(() => setCandidate(null));
  }, []);

  // Fetch jobs
  useEffect(() => {
    fetch("/api/careers/jobs")
      .then((r) => r.json())
      .then((d) => {
        setJobs(d.jobs || []);
        setFiltered(d.jobs || []);
        setDepartments(d.meta?.departments || []);
      })
      .finally(() => setLoading(false));
  }, [candidate]);

  // Apply filters
  useEffect(() => {
    let list = [...jobs];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      list = list.filter(
        (j) =>
          j.title.toLowerCase().includes(searchLower) ||
          j.department.toLowerCase().includes(searchLower) ||
          j.skills.some((s) => s.toLowerCase().includes(searchLower))
      );
    }

    if (filters.department !== "All") {
      list = list.filter((j) => j.department === filters.department);
    }

    if (filters.location !== "All") {
      list = list.filter((j) => j.location === filters.location);
    }

    if (filters.employmentType !== "All") {
      list = list.filter((j) => j.employmentType === filters.employmentType);
    }

    setFiltered(list);
    setDisplayCount(8);
  }, [filters, jobs, candidate]);

  const handleSaveJob = (jobId: string) => {
    setSavedJobs((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) {
        next.delete(jobId);
      } else {
        next.add(jobId);
      }
      return next;
    });
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      department: "All",
      location: "All",
      employmentType: "All",
    });
  };

  const displayedJobs = filtered.slice(0, displayCount);
  const hasMore = displayCount < filtered.length;

  return (
    <div className="max-w-6xl space-y-6">
      {/* Header */}
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#F1F0F5]">Browse Jobs</h1>
            {candidate?.skills && candidate.skills.length > 0 ? (
              <p className="text-sm text-[#8B8A99] mt-1">
                Showing roles matching your {candidate.skills.slice(0, 3).join(", ")} skills
              </p>
            ) : (
              <p className="text-sm text-[#8B8A99] mt-1">
                Find your next opportunity and make an impact
              </p>
            )}
          </div>

          {/* Job count */}
          {!loading && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7C5CFC]/10 border border-[#7C5CFC]/20">
              <Sparkles className="w-4 h-4 text-[#9F7FFF]" />
              <span className="text-sm font-medium text-[#9F7FFF]">
                <SimpleCounter value={filtered.length} duration={300} /> open positions
              </span>
            </div>
          )}
        </div>
      </FadeIn>

      {/* Filter Bar */}
      <FadeIn delay={0.05}>
        <FilterBar
          departments={departments}
          resultsCount={filtered.length}
          filters={filters}
          onFilterChange={setFilters}
          loading={loading}
        />
      </FadeIn>

      {/* Jobs Grid */}
      {loading ? (
        <div className="grid gap-5 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <JobCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState onClearFilters={clearFilters} />
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-2">
            {displayedJobs.map((job, i) => (
              <JobCard
                key={job.id}
                job={job}
                index={i}
                isSaved={savedJobs.has(job.id)}
                onSave={handleSaveJob}
                basePath="/candidates/dashboard/jobs"
              />
            ))}
          </div>

          {/* Load more button */}
          {hasMore && (
            <div className="text-center mt-8">
              <button
                onClick={() => setDisplayCount((prev) => prev + 8)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm font-medium hover:bg-white/[0.08] transition-colors"
              >
                Load more ({filtered.length - displayCount} remaining)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
