"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Bookmark, Trash2, ExternalLink, MapPin, Building2, Briefcase, Loader2 } from "lucide-react";

interface SavedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  description?: string;
  applyLink: string;
  postedAt?: string;
  salary?: string;
  jobType?: string;
  source: string;
  matchScore?: number;
  savedAt: string;
}

export default function SavedJobsPage() {
  const { data: session, status } = useSession();
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      fetchSavedJobs();
    }
  }, [session]);

  const fetchSavedJobs = async () => {
    try {
      const res = await fetch("/api/job-search/save");
      if (!res.ok) throw new Error("Failed to fetch");
      
      const data = await res.json();
      if (data.jobs && Array.isArray(data.jobs)) {
        setSavedJobs(data.jobs);
      }
    } catch (err) {
      console.error("Failed to fetch saved jobs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (jobId: string) => {
    setRemovingId(jobId);
    
    try {
      const res = await fetch("/api/job-search/save", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });

      if (res.ok) {
        setSavedJobs(prev => prev.filter(job => job.id !== jobId));
      }
    } catch (err) {
      console.error("Failed to remove job:", err);
    } finally {
      setRemovingId(null);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black flex items-center justify-center">
        <div className="flex items-center gap-3 text-white">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading saved jobs...</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-xl font-semibold mb-2">Sign in to view saved jobs</h2>
          <p className="text-gray-400">You need to be logged in to access your saved jobs.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Bookmark className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-white">Saved Jobs</h1>
          </div>
          <p className="text-gray-400">
            {savedJobs.length === 0 
              ? "No saved jobs yet. Save jobs from AI Job Search!" 
              : `${savedJobs.length} job${savedJobs.length !== 1 ? 's' : ''} saved`}
          </p>
        </div>

        {/* Jobs List */}
        {savedJobs.length === 0 ? (
          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-12 text-center">
            <Bookmark className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No saved jobs</h3>
            <p className="text-gray-400 mb-6">
              Start searching for jobs and save the ones you're interested in!
            </p>
            <a 
              href="/train/job-search"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-500 hover:to-purple-500 transition-all"
            >
              Go to AI Job Search
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {savedJobs.map((job) => (
              <div 
                key={job.id}
                className="bg-gray-800/60 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-all"
              >
                <div className="flex justify-between items-start gap-4">
                  {/* Job Info */}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {job.title}
                    </h3>
                    <div className="flex items-center gap-2 text-gray-400 mb-3">
                      <Building2 className="w-4 h-4" />
                      <span>{job.company}</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-3 text-sm text-gray-400 mb-4">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {job.location || "Remote"}
                      </div>
                      {job.jobType && (
                        <div className="flex items-center gap-1">
                          <Briefcase className="w-4 h-4" />
                          {job.jobType}
                        </div>
                      )}
                      {job.salary && (
                        <span className="text-green-400">{job.salary}</span>
                      )}
                    </div>

                    {/* Match Score */}
                    {job.matchScore && job.matchScore > 0 && (
                      <div className="inline-flex items-center gap-1 px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm mb-3">
                        {job.matchScore}% match
                      </div>
                    )}

                    {/* Saved Date */}
                    <p className="text-xs text-gray-500">
                      Saved on {new Date(job.savedAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <a
                      href={job.applyLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-sm"
                    >
                      Apply Now
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => handleRemove(job.id)}
                      disabled={removingId === job.id}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg transition-colors text-sm disabled:opacity-50"
                    >
                      {removingId === job.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          Remove
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
