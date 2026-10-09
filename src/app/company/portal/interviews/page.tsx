"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { EmptyState, PortalStatusBadge } from "@/components/portal";
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  Plus,
  Users,
  CheckCircle2,
  XCircle,
  ScanFace,
  ExternalLink,
  ChevronRight,
  Filter,
  Search,
} from "lucide-react";

interface InterviewItem {
  id: string;
  applicationId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  jobTitle: string;
  department: string;
  scheduledAt: string | null;
  status: string;
  notes: string;
}

interface ApplicationOption {
  id: string;
  name: string;
  jobTitle: string;
}

export default function CompanyInterviewsPage() {
  const router = useRouter();
  const [interviews, setInterviews] = useState<InterviewItem[]>([]);
  const [applications, setApplications] = useState<ApplicationOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"UPCOMING" | "PAST" | "ALL">("UPCOMING");
  const [searchQuery, setSearchQuery] = useState("");
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  // Form state
  const [selectedAppId, setSelectedAppId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [interviewerName, setInterviewerName] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchInterviews();
    fetchApplications();
  }, []);

  async function fetchInterviews() {
    try {
      setLoading(true);
      const res = await fetch("/api/company/interviews");
      if (res.ok) {
        const data = await res.json();
        setInterviews(data.interviews || []);
      }
    } catch (err) {
      console.error("Failed to fetch interviews:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchApplications() {
    try {
      const res = await fetch("/api/company/applications");
      if (res.ok) {
        const data = await res.json();
        setApplications(
          (data.applications || []).map((app: any) => ({
            id: app.id,
            name: app.name,
            jobTitle: app.jobTitle,
          }))
        );
      }
    } catch (err) {
      console.error("Failed to fetch applications for scheduling:", err);
    }
  }

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppId || !scheduledAt) return alert("Please select a candidate application and date/time.");

    try {
      setSubmitting(true);
      const res = await fetch("/api/company/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: selectedAppId,
          scheduledAt,
          interviewerName,
          meetingLink,
          notes,
        }),
      });

      if (res.ok) {
        setIsScheduleOpen(false);
        setSelectedAppId("");
        setScheduledAt("");
        setInterviewerName("");
        setMeetingLink("");
        setNotes("");
        fetchInterviews();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to schedule interview.");
      }
    } catch (err) {
      alert("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredInterviews = interviews.filter((item) => {
    const matchesSearch =
      item.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.jobTitle.toLowerCase().includes(searchQuery.toLowerCase());

    const itemDate = item.scheduledAt ? new Date(item.scheduledAt) : null;
    const now = new Date();

    if (tab === "UPCOMING") {
      return matchesSearch && itemDate && itemDate >= now && item.status === "INTERVIEW_SCHEDULED";
    }
    if (tab === "PAST") {
      return matchesSearch && (item.status === "ACCEPTED" || item.status === "HIRED" || item.status === "REJECTED" || (itemDate && itemDate < now));
    }

    return matchesSearch;
  });

  const now = new Date();
  const upcomingCount = interviews.filter(
    (i) => i.scheduledAt && new Date(i.scheduledAt) >= now && i.status === "INTERVIEW_SCHEDULED"
  ).length;

  return (
    <div className="space-y-6">
      {/* Header Title & CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Interviews</h1>
          <p className="text-xs text-slate-400 mt-1">
            Schedule, manage, and conduct candidate interview sessions
          </p>
        </div>
        <button
          onClick={() => setIsScheduleOpen(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors shadow-md shadow-purple-950/40 w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule New Interview</span>
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 rounded-xl border border-white/10 p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Upcoming Interviews</span>
            <div className="text-xl font-bold text-purple-300 mt-1">{upcomingCount}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <CalendarIcon className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-slate-900/60 rounded-xl border border-white/10 p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Total Scheduled</span>
            <div className="text-xl font-bold text-white mt-1">{interviews.length}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-slate-900/60 rounded-xl border border-white/10 p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">HireLens AI Engine</span>
            <div className="text-xs font-semibold text-emerald-400 mt-1">Ready for Live Mode</div>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ScanFace className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/40 p-3 rounded-xl border border-white/5">
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-white/5 w-full sm:w-auto">
          {(["UPCOMING", "PAST", "ALL"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors flex-1 sm:flex-none ${
                tab === t
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {t === "UPCOMING" ? "Upcoming" : t === "PAST" ? "Past / Completed" : "All Interviews"}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search candidate or job..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* List / Table */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">Loading interviews...</div>
      ) : filteredInterviews.length === 0 ? (
        <EmptyState
          title="No interviews found"
          description="Schedule interviews with qualified applicants to conduct live evaluations."
          icon={<CalendarIcon className="w-8 h-8 text-slate-500" />}
        />
      ) : (
        <div className="space-y-3">
          {filteredInterviews.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900/60 rounded-xl border border-white/10 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-purple-500/30 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex-shrink-0">
                  <Video className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">{item.candidateName}</h3>
                    <PortalStatusBadge status={item.status} />
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{item.candidateEmail}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-300 mt-2">
                    <span className="font-medium text-purple-300">{item.jobTitle}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {item.scheduledAt
                        ? new Date(item.scheduledAt).toLocaleString([], {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "Unscheduled"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 border-white/5 pt-3 md:pt-0">
                <button
                  onClick={() => router.push("/company/portal/hirelens/setup")}
                  className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <ScanFace className="w-3.5 h-3.5" />
                  <span>Launch HireLens AI</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schedule Interview Modal */}
      {isScheduleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-purple-400" />
                Schedule Interview
              </h2>
              <button
                onClick={() => setIsScheduleOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Select Applicant Candidate *
                </label>
                <select
                  required
                  value={selectedAppId}
                  onChange={(e) => setSelectedAppId(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="">-- Choose Candidate --</option>
                  {applications.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.name} — {app.jobTitle}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Interviewer Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sarah Jenkins (Senior Engineering Manager)"
                  value={interviewerName}
                  onChange={(e) => setInterviewerName(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Meeting Link / Location
                </label>
                <input
                  type="text"
                  placeholder="https://meet.google.com/xyz or Room 4B"
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Internal Preparation Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Key competencies to evaluate, tech stack focus..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsScheduleOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 transition-colors shadow-sm"
                >
                  {submitting ? "Scheduling..." : "Confirm Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
