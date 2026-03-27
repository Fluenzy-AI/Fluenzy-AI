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
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-white/5 rounded-xl w-48" />
        <div className="h-64 bg-white/5 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Interviews</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your upcoming interviews</p>
      </div>

      {/* Upcoming Interviews */}
      <div className="bg-[#13161E] rounded-xl border border-white/5 overflow-hidden">
        <div className="p-5 border-b border-white/5">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-violet-400" />
            Upcoming Interviews
          </h2>
        </div>

        {upcomingInterviews.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-violet-500/10 flex items-center justify-center">
              <Calendar className="w-8 h-8 text-violet-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No upcoming interviews</h3>
            <p className="text-sm text-slate-400 mb-6">
              When you're scheduled for interviews, they'll appear here
            </p>
            <Link
              href="/candidates/dashboard/applications"
              className="inline-flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition-colors"
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
                  className="p-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-xs text-indigo-400 font-medium">
                        {interviewDate.toLocaleDateString("en-US", { month: "short" })}
                      </span>
                      <span className="text-lg font-bold text-white">
                        {interviewDate.getDate()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-white">
                            {interview.type} Interview
                          </p>
                          <p className="text-sm text-slate-400 mt-0.5">
                            {interview.application.job.title}
                          </p>
                        </div>
                        {(isToday || isTomorrow) && (
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              isToday
                                ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            }`}
                          >
                            {isToday ? "Today" : "Tomorrow"}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {interviewDate.toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Building className="w-3 h-3" />
                          {interview.application.job.department}
                        </span>
                        <span className="flex items-center gap-1">
                          <Video className="w-3 h-3" />
                          Video Call
                        </span>
                      </div>
                      {interview.meetingLink && (
                        <a
                          href={interview.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-lg bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-400 transition-colors"
                        >
                          Join Meeting
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                  {interview.notes && (
                    <div className="mt-3 ml-[4.5rem] p-3 rounded-lg bg-white/[0.02] border border-white/5">
                      <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
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
          <div className="p-5 border-b border-white/5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-400" />
              Past Interviews
            </h2>
          </div>
          <div className="divide-y divide-white/5">
            {pastInterviews.map((interview) => {
              const interviewDate = new Date(interview.scheduledAt);
              return (
                <div key={interview.id} className="p-4 opacity-60">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-[10px] text-slate-500">
                        {interviewDate.toLocaleDateString("en-US", { month: "short" })}
                      </span>
                      <span className="text-sm font-bold text-slate-400">
                        {interviewDate.getDate()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-300">
                        {interview.type} Interview
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {interview.application.job.title}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
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
