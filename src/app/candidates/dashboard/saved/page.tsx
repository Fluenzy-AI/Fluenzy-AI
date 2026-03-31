"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Bookmark,
  Briefcase,
  MapPin,
  Building,
  Clock,
  Trash2,
  ExternalLink,
  ChevronRight,
  IndianRupee,
} from "lucide-react";

interface SavedJob {
  id: string;
  savedAt: string;
  job: {
    id: string;
    title: string;
    slug: string;
    department: string;
    location: string;
    employmentType: string;
    salaryRange?: string;
    isActive: boolean;
  };
}

export default function SavedJobsPage() {
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  const fetchSavedJobs = async () => {
    try {
      const res = await fetch("/api/candidates/saved-jobs");
      if (res.ok) {
        const data = await res.json();
        setSavedJobs(data.savedJobs || []);
      }
    } catch (error) {
      console.error("Failed to fetch saved jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const removeSavedJob = async (id: string) => {
    try {
      await fetch(`/api/candidates/saved-jobs/${id}`, { method: "DELETE" });
      setSavedJobs((prev) => prev.filter((j) => j.id !== id));
    } catch (error) {
      console.error("Failed to remove saved job:", error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 animate-pulse">
        <div className="h-8 sm:h-10 bg-white/5 rounded-xl w-36 sm:w-48" />
        <div className="grid gap-3 sm:gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 sm:h-32 bg-white/5 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-white">Saved Jobs</h1>
          <p className="text-slate-400 text-sm mt-1">
            {savedJobs.length} job{savedJobs.length !== 1 ? "s" : ""} saved
          </p>
        </div>
        <Link
          href="/candidates/dashboard/careers"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-500 text-white text-sm font-semibold hover:bg-violet-400 active:bg-violet-600 transition-colors w-full sm:w-auto flex-shrink-0"
        >
          <Briefcase className="w-4 h-4" />
          Browse Jobs
        </Link>
      </div>

      {/* Saved Jobs List */}
      {savedJobs.length === 0 ? (
        <div className="bg-[#13161E] rounded-xl border border-white/5 p-8 sm:p-12 text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full bg-violet-500/10 flex items-center justify-center">
            <Bookmark className="w-7 h-7 sm:w-8 sm:h-8 text-violet-400" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-white mb-2">No saved jobs</h3>
          <p className="text-sm text-slate-400 mb-4 sm:mb-6 max-w-sm mx-auto">
            Save jobs you're interested in to apply later
          </p>
          <Link
            href="/candidates/dashboard/careers"
            className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-full bg-violet-500 text-white text-sm font-semibold hover:bg-violet-400 active:bg-violet-600 transition-colors"
          >
            Browse Open Positions
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4">
          {savedJobs.map((saved, index) => (
            <motion.div
              key={saved.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-[#13161E] rounded-xl border border-white/5 p-4 sm:p-5 hover:border-violet-500/20 active:bg-white/[0.02] transition-all group"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start sm:items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-sm sm:text-base text-white truncate group-hover:text-violet-300 transition-colors">
                      {saved.job.title}
                    </h3>
                    {!saved.job.isActive && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/10 text-red-400 border border-red-500/20 flex-shrink-0">
                        Closed
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Building className="w-3 h-3 flex-shrink-0" />
                      Fluenzy AI
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{saved.job.location}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-3 h-3 flex-shrink-0" />
                      {saved.job.employmentType.replace("_", " ")}
                    </span>
                    {saved.job.salaryRange && (
                      <span className="flex items-center gap-1">
                        <IndianRupee className="w-3 h-3 flex-shrink-0" />
                        {saved.job.salaryRange}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-600 mt-2 flex items-center gap-1">
                    <Clock className="w-3 h-3 flex-shrink-0" />
                    Saved {new Date(saved.savedAt).toLocaleDateString("en-IN", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-start">
                  <button
                    onClick={() => removeSavedJob(saved.id)}
                    className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 active:bg-red-500/20 transition-colors"
                    title="Remove"
                    aria-label="Remove saved job"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {saved.job.isActive && (
                    <Link
                      href={`/careers/${saved.job.slug}`}
                      className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg bg-violet-500 text-white text-sm font-semibold hover:bg-violet-400 active:bg-violet-600 transition-colors"
                    >
                      Apply
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
