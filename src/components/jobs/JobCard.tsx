"use client";

import { JobMatch } from "@/types/jobs";
import { Bookmark, ExternalLink, MapPin, Briefcase, Clock } from "lucide-react";

interface Props {
  job: JobMatch;
  onSave: (job: JobMatch) => void;
  onApply: (job: JobMatch) => void;
  isSaved?: boolean;
}

export function JobCard({ job, onSave, onApply, isSaved }: Props) {
  const scoreColor = job.matchScore >= 70 
    ? "text-green-500" 
    : job.matchScore >= 40 
    ? "text-yellow-500" 
    : "text-red-400";

  const scoreBg = job.matchScore >= 70 
    ? "bg-green-500/10 border-green-500/30" 
    : job.matchScore >= 40 
    ? "bg-yellow-500/10 border-yellow-500/30" 
    : "bg-red-500/10 border-red-500/30";

  return (
    <div className="rounded-2xl border border-gray-700 bg-gray-800/50 p-5 hover:border-gray-600 transition-all hover:bg-gray-800/80">
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-lg truncate">{job.title}</h3>
          <p className="text-sm text-gray-400 mt-0.5">{job.company}</p>
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
            <MapPin className="h-3.5 w-3.5" />
            <span>{job.location}</span>
          </div>
          {job.salary && (
            <p className="text-sm text-green-400 font-medium mt-1">{job.salary}</p>
          )}
        </div>
        <div className={`flex flex-col items-center px-3 py-2 rounded-xl border ${scoreBg}`}>
          <span className={`text-2xl font-bold ${scoreColor}`}>{job.matchScore}%</span>
          <span className="text-xs text-gray-400">match</span>
        </div>
      </div>

      {/* Matched Skills */}
      {job.matchedSkills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {job.matchedSkills.slice(0, 4).map(s => (
            <span key={s} className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full font-medium">
              {s}
            </span>
          ))}
          {job.missingSkills.slice(0, 2).map(s => (
            <span key={s} className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded-full">
              {s} ✗
            </span>
          ))}
        </div>
      )}

      {/* Badges */}
      <div className="flex gap-2 mt-3">
        {job.remote && (
          <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
            <MapPin className="h-3 w-3" /> Remote
          </span>
        )}
        {job.jobType && (
          <span className="bg-purple-500/20 text-purple-400 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
            <Briefcase className="h-3 w-3" /> {job.jobType}
          </span>
        )}
        {job.postedAt && (
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {new Date(job.postedAt).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4">
        <a 
          href={job.applyLink} 
          target="_blank" 
          rel="noopener noreferrer"
          onClick={() => onApply(job)}
          className="flex-1 bg-blue-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl text-center hover:bg-blue-500 transition-colors flex items-center justify-center gap-2"
        >
          Apply Now <ExternalLink className="h-4 w-4" />
        </a>
        <button 
          onClick={() => onSave(job)}
          className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors flex items-center gap-2 ${
            isSaved 
              ? "bg-gray-700 text-gray-300 border-gray-600" 
              : "bg-transparent text-blue-400 border-blue-500/50 hover:bg-blue-500/10"
          }`}
        >
          <Bookmark className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
          {isSaved ? "Saved" : "Save"}
        </button>
      </div>
    </div>
  );
}
