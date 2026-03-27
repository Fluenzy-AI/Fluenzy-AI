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
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-white/5 rounded-xl w-48" />
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-white/5 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Saved Jobs</h1>
          <p className="text-slate-400 text-sm mt-1">
            {savedJobs.length} job{savedJobs.length !== 1 ? "s" : ""} saved
          </p>
        </div>
        <Link
          href="/careers"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-500 text-white text-sm font-semibold hover:bg-violet-400 transition-colors"
        >
          <Briefcase className="w-4 h-4" />
          Browse Jobs
        </Link>
      </div>

      {/* Saved Jobs List */}
      {savedJobs.length === 0 ? (
        <div className="bg-[#13161E] rounded-xl border border-white/5 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-violet-500/10 flex items-center justify-center">
            <Bookmark className="w-8 h-8 text-violet-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No saved jobs</h3>
          <p className="text-sm text-slate-400 mb-6">
            Save jobs you're interested in to apply later
          </p>
          <Link
            href="/careers"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-violet-500 text-white text-sm font-semibold hover:bg-violet-400 transition-colors"
          >
            Browse Open Positions
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {savedJobs.map((saved, index) => (
            <motion.div
              key={saved.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-[#13161E] rounded-xl border border-white/5 p-5 hover:border-violet-500/20 transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-white truncate group-hover:text-violet-300 transition-colors">
                      {saved.job.title}
                    </h3>
                    {!saved.job.isActive && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                        Closed
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Building className="w-3 h-3" />
                      Fluenzy AI
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {saved.job.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-3 h-3" />
                      {saved.job.employmentType.replace("_", " ")}
                    </span>
                    {saved.job.salaryRange && (
                      <span className="flex items-center gap-1">
                        <IndianRupee className="w-3 h-3" />
                        {saved.job.salaryRange}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Saved {new Date(saved.savedAt).toLocaleDateString("en-IN", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => removeSavedJob(saved.id)}
                    className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {saved.job.isActive && (
                    <Link
                      href={`/careers/${saved.job.slug}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-500 text-white text-sm font-semibold hover:bg-violet-400 transition-colors"
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
