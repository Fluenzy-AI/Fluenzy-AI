"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  ExternalLink,
  ChevronRight,
  Building,
  AlertCircle,
} from "lucide-react";

interface Interview {
  id: string;
  scheduledAt: string;
  status: string;
  type: string;
  meetingLink?: string;
  notes?: string;
  application: {
    id: string;
    job: {
      title: string;
      slug: string;
      department: string;
    };
  };
}

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        const res = await fetch("/api/candidates/interviews");
        if (res.ok) {
          const data = await res.json();
          setInterviews(data.interviews || []);
        }
      } catch (error) {
        console.error("Failed to fetch interviews:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInterviews();
  }, []);

  const upcomingInterviews = interviews.filter(
    (i) => new Date(i.scheduledAt) > new Date() && i.status !== "CANCELLED"
  );
  const pastInterviews = interviews.filter(
    (i) => new Date(i.scheduledAt) <= new Date() || i.status === "CANCELLED"
  );

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 animate-pulse">
        <div className="h-8 sm:h-10 bg-white/5 rounded-xl w-36 sm:w-48" />
        <div className="h-48 sm:h-64 bg-white/5 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">Interviews</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your upcoming interviews</p>
      </div>

      {/* Upcoming Interviews */}
      <div className="bg-[#13161E] rounded-xl border border-white/5 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-white/5">
          <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400 flex-shrink-0" />
            Upcoming Interviews
          </h2>
        </div>

        {upcomingInterviews.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full bg-violet-500/10 flex items-center justify-center">
              <Calendar className="w-7 h-7 sm:w-8 sm:h-8 text-violet-400" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-white mb-2">No upcoming interviews</h3>
            <p className="text-sm text-slate-400 mb-4 sm:mb-6 max-w-sm mx-auto">
              When you're scheduled for interviews, they'll appear here
            </p>
            <Link
              href="/candidates/dashboard/applications"
              className="inline-flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 active:text-violet-500 transition-colors"
            >
              View your applications
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {upcomingInterviews.map((interview, index) => {
              const interviewDate = new Date(interview.scheduledAt);
              const isToday = new Date().toDateString() === interviewDate.toDateString();
              const isTomorrow =
                new Date(Date.now() + 86400000).toDateString() === interviewDate.toDateString();

              return (
                <motion.div
                  key={interview.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-3 sm:p-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                    {/* Date Box */}
                    <div className="flex sm:flex-col items-center sm:justify-center gap-2 sm:gap-0 w-full sm:w-12 lg:w-14 h-auto sm:h-12 lg:h-14 rounded-lg sm:rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex-shrink-0 p-2 sm:p-0">
                      <span className="text-xs text-indigo-400 font-medium">
                        {interviewDate.toLocaleDateString("en-US", { weekday: "short", month: "short" })}
                      </span>
                      <span className="text-base sm:text-lg font-bold text-white">
                        {interviewDate.getDate()}
                      </span>
                      {(isToday || isTomorrow) && (
                        <span
                          className={`sm:hidden px-2 py-0.5 rounded-full text-[10px] font-medium ml-auto ${
                            isToday
                              ? "bg-red-500/10 text-red-400 border border-red-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {isToday ? "Today" : "Tomorrow"}
                        </span>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm sm:text-base text-white truncate">
                            {interview.type} Interview
                          </p>
                          <p className="text-sm text-slate-400 mt-0.5 truncate">
                            {interview.application.job.title}
                          </p>
                        </div>
                        {(isToday || isTomorrow) && (
                          <span
                            className={`hidden sm:inline-flex px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                              isToday
                                ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            }`}
                          >
                            {isToday ? "Today" : "Tomorrow"}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 sm:mt-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 flex-shrink-0" />
                          {interviewDate.toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Building className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{interview.application.job.department}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Video className="w-3 h-3 flex-shrink-0" />
                          Video Call
                        </span>
                      </div>
                      {interview.meetingLink && (
                        <a
                          href={interview.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 mt-3 px-3 sm:px-4 py-2 rounded-lg bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-400 active:bg-indigo-600 transition-colors"
                        >
                          Join Meeting
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                  {interview.notes && (
                    <div className="mt-3 sm:ml-16 lg:ml-[4.5rem] p-2.5 sm:p-3 rounded-lg bg-white/[0.02] border border-white/5">
                      <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        Notes from HR
                      </p>
                      <p className="text-sm text-slate-300">{interview.notes}</p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Past Interviews */}
      {pastInterviews.length > 0 && (
        <div className="bg-[#13161E] rounded-xl border border-white/5 overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-white/5">
            <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 flex-shrink-0" />
              Past Interviews
            </h2>
          </div>
          <div className="divide-y divide-white/5">
            {pastInterviews.map((interview) => {
              const interviewDate = new Date(interview.scheduledAt);
              return (
                <div key={interview.id} className="p-3 sm:p-4 opacity-60">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-white/5 flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-[9px] sm:text-[10px] text-slate-500">
                        {interviewDate.toLocaleDateString("en-US", { month: "short" })}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-slate-400">
                        {interviewDate.getDate()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-300 truncate">
                        {interview.type} Interview
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {interview.application.job.title}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium flex-shrink-0 ${
                        interview.status === "COMPLETED"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : interview.status === "CANCELLED"
                          ? "bg-red-500/10 text-red-400"
                          : "bg-slate-500/10 text-slate-400"
                      }`}
                    >
                      {interview.status === "COMPLETED"
                        ? "Completed"
                        : interview.status === "CANCELLED"
                        ? "Cancelled"
                        : "Done"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
