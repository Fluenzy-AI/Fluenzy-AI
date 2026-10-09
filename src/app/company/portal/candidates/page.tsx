"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { DataTable, EmptyState, PortalStatusBadge, ViewToggle } from "@/components/portal";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Search,
  Users,
  FileText,
  Calendar,
  ExternalLink,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Phone,
  Mail,
  Briefcase,
  SlidersHorizontal,
  ChevronRight,
  Send,
} from "lucide-react";

interface CandidateRecord {
  id: string;
  candidateId: string;
  name: string;
  email: string;
  phone: string;
  resumeUrl: string;
  resumeName?: string;
  status: string;
  experience: string;
  notes: string;
  fluenzyScore?: number | null;
  confidenceScore?: number | null;
  skills: string[];
  jobTitle: string;
  jobId: string;
  department: string;
  interviewDate?: string | null;
  createdAt: string;
}

export default function CompanyCandidatesPage() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<CandidateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"table" | "card" | "kanban">("table");
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateRecord | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [noteText, setNoteText] = useState("");

  useEffect(() => {
    fetchCandidates();
  }, []);

  async function fetchCandidates() {
    try {
      setLoading(true);
      const res = await fetch("/api/company/candidates");
      if (res.ok) {
        const data = await res.json();
        setCandidates(data.candidates || []);
      }
    } catch (err) {
      console.error("Failed to fetch candidates:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleUpdateStatus = async (candidateId: string, newStatus: string) => {
    try {
      setUpdatingStatus(true);
      const res = await fetch(`/api/company/applications/${candidateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setCandidates((prev) =>
          prev.map((c) => (c.id === candidateId ? { ...c, status: newStatus } : c))
        );
        if (selectedCandidate && selectedCandidate.id === candidateId) {
          setSelectedCandidate({ ...selectedCandidate, status: newStatus });
        }
      }
    } catch (err) {
      console.error("Failed to update candidate status:", err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.jobTitle.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [candidates, searchQuery, statusFilter]);

  const metrics = useMemo(() => {
    return {
      total: candidates.length,
      shortlisted: candidates.filter((c) => c.status === "SHORTLISTED").length,
      interviewing: candidates.filter(
        (c) => c.status === "INTERVIEW_SCHEDULED" || c.status === "INTERVIEWING"
      ).length,
      hired: candidates.filter((c) => c.status === "HIRED" || c.status === "ACCEPTED").length,
    };
  }, [candidates]);

  const columns = useMemo<ColumnDef<CandidateRecord, any>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Candidate",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold text-xs flex-shrink-0">
              {row.original.name?.[0]?.toUpperCase() || "C"}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-white text-xs truncate">{row.original.name}</div>
              <div className="text-[11px] text-slate-400 truncate">{row.original.email}</div>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "jobTitle",
        header: "Applied Job",
        cell: ({ row }) => (
          <div>
            <div className="text-xs font-medium text-slate-200">{row.original.jobTitle}</div>
            <div className="text-[11px] text-slate-500">{row.original.department}</div>
          </div>
        ),
      },
      {
        accessorKey: "experience",
        header: "Experience",
        cell: ({ row }) => (
          <span className="text-xs text-slate-300">{row.original.experience}</span>
        ),
      },
      {
        accessorKey: "fluenzyScore",
        header: "AI Rating",
        cell: ({ row }) => {
          const score = row.original.fluenzyScore;
          return score ? (
            <div className="flex items-center gap-1 text-xs font-semibold text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20 w-fit">
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>{Math.round(score)}%</span>
            </div>
          ) : (
            <span className="text-xs text-slate-500">—</span>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <PortalStatusBadge status={row.original.status} />,
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedCandidate(row.original);
                setNoteText(row.original.notes || "");
              }}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 transition-colors"
            >
              View Profile
            </button>
            {row.original.resumeUrl && (
              <a
                href={row.original.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                title="View Resume"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Candidates</h1>
          <p className="text-xs text-slate-400 mt-1">
            Centralized company candidate directory and evaluation history
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ViewToggle views={["table", "card"]} activeView={viewMode} onViewChange={setViewMode} />
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 rounded-xl border border-white/10 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Total Pool</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-white mt-2">{metrics.total}</div>
        </div>
        <div className="bg-slate-900/60 rounded-xl border border-white/10 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Shortlisted</span>
            <Award className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-bold text-blue-400 mt-2">{metrics.shortlisted}</div>
        </div>
        <div className="bg-slate-900/60 rounded-xl border border-white/10 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Interview Scheduled</span>
            <Calendar className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-purple-300 mt-2">{metrics.interviewing}</div>
        </div>
        <div className="bg-slate-900/60 rounded-xl border border-white/10 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Hired</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400 mt-2">{metrics.hired}</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/40 p-3 rounded-xl border border-white/5">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search candidate name, email, job..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {["ALL", "PENDING", "SHORTLISTED", "INTERVIEW_SCHEDULED", "HIRED", "REJECTED"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === s
                  ? "bg-purple-600 text-white font-semibold"
                  : "bg-slate-900/80 text-slate-400 hover:text-white border border-white/5"
              }`}
            >
              {s === "ALL" ? "All Statuses" : s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Table / Cards View */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">Loading candidates...</div>
      ) : filteredCandidates.length === 0 ? (
        <EmptyState
          title="No candidates found"
          description="Candidates who apply to your job postings will appear here."
          icon={<Users className="w-8 h-8 text-slate-500" />}
        />
      ) : viewMode === "table" ? (
        <DataTable data={filteredCandidates} columns={columns} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCandidates.map((c) => (
            <div
              key={c.id}
              className="bg-slate-900/60 rounded-xl border border-white/10 p-5 space-y-4 hover:border-purple-500/30 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold text-sm">
                    {c.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{c.name}</h3>
                    <p className="text-xs text-slate-400">{c.email}</p>
                  </div>
                </div>
                <PortalStatusBadge status={c.status} />
              </div>

              <div className="space-y-1.5 text-xs text-slate-300 border-t border-white/5 pt-3">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                  <span>{c.jobTitle}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Exp: {c.experience}</span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/5 pt-3">
                <button
                  onClick={() => {
                    setSelectedCandidate(c);
                    setNoteText(c.notes || "");
                  }}
                  className="text-xs font-semibold text-purple-300 hover:text-purple-200 flex items-center gap-1"
                >
                  <span>View Details</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
                {c.resumeUrl && (
                  <a
                    href={c.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    <span>Resume</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Candidate Detail Drawer / Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-slate-900 border-l border-white/10 h-full overflow-y-auto p-6 space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-start justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-base">
                    {selectedCandidate.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">{selectedCandidate.name}</h2>
                    <p className="text-xs text-slate-400">{selectedCandidate.email}</p>
                    <p className="text-xs text-slate-500">{selectedCandidate.phone}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Status Update Actions */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Recruitment Stage</span>
                  <PortalStatusBadge status={selectedCandidate.status} />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    disabled={updatingStatus}
                    onClick={() => handleUpdateStatus(selectedCandidate.id, "SHORTLISTED")}
                    className="py-1.5 px-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/20 rounded-lg text-xs font-medium transition-colors"
                  >
                    Shortlist
                  </button>
                  <button
                    disabled={updatingStatus}
                    onClick={() => handleUpdateStatus(selectedCandidate.id, "INTERVIEW_SCHEDULED")}
                    className="py-1.5 px-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 rounded-lg text-xs font-medium transition-colors"
                  >
                    Schedule Int.
                  </button>
                  <button
                    disabled={updatingStatus}
                    onClick={() => handleUpdateStatus(selectedCandidate.id, "REJECTED")}
                    className="py-1.5 px-2 bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 rounded-lg text-xs font-medium transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>

              {/* Candidate Info Grid */}
              <div className="space-y-3 text-xs">
                <h3 className="font-semibold text-slate-300 uppercase tracking-wider text-[10px]">
                  Application Info
                </h3>
                <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Target Position:</span>
                    <span className="font-medium text-white">{selectedCandidate.jobTitle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Department:</span>
                    <span className="text-slate-200">{selectedCandidate.department}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Experience:</span>
                    <span className="text-slate-200">{selectedCandidate.experience}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Applied On:</span>
                    <span className="text-slate-200">
                      {new Date(selectedCandidate.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Resume Access */}
              {selectedCandidate.resumeUrl && (
                <div className="bg-purple-500/10 p-4 rounded-xl border border-purple-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-purple-400" />
                    <div>
                      <div className="text-xs font-semibold text-purple-200">
                        Candidate Resume
                      </div>
                      <div className="text-[11px] text-purple-400/80 truncate">
                        {selectedCandidate.resumeName || "Resume Document"}
                      </div>
                    </div>
                  </div>
                  <a
                    href={selectedCandidate.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <span>View Resume</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Quick Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    router.push(
                      `/company/portal/send-email?to=${encodeURIComponent(selectedCandidate.email)}`
                    )
                  }
                  className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-medium flex items-center justify-center gap-2 border border-white/10 transition-colors"
                >
                  <Send className="w-3.5 h-3.5 text-purple-400" />
                  <span>Send Email</span>
                </button>
                <button
                  onClick={() =>
                    router.push(
                      `/company/portal/interviews?candidate=${encodeURIComponent(
                        selectedCandidate.id
                      )}`
                    )
                  }
                  className="flex-1 py-2 px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Manage Interview</span>
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
              <button
                onClick={() => setSelectedCandidate(null)}
                className="w-full py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-medium hover:bg-slate-700"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
