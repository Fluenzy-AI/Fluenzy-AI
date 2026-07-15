"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PortalLayout, DataTable, EmptyState, PortalStatusBadge, ViewToggle } from "@/components/portal";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Search,
  MoreVertical,
  Check,
  X,
  Mail,
  Phone,
  Calendar,
  FileText,
  Users,
  CheckCircle2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Application {
  id: string;
  name: string;
  email: string;
  phone?: string;
  resumeUrl?: string;
  jobTitle: string;
  jobId: string;
  status: string;
  createdAt: string;
  isAutoApplied: boolean;
  skills: string[];
  fluenzyScore?: number | null;
  confidenceScore?: number | null;
  experience?: string;
}

interface Job {
  id: string;
  title: string;
}

const STATUSES = ["all", "PENDING", "SHORTLISTED", "INTERVIEWING", "ACCEPTED", "REJECTED"] as const;

export default function ApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterJob, setFilterJob] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"table" | "card">("table");

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/company/applications");
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
        setJobs(data.jobs || []);
      }
    } catch (error) {
      console.error("Failed to fetch applications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateApplicationStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/company/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) fetchApplications();
    } catch (error) {
      console.error("Failed to update application:", error);
    }
  };

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.jobTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || app.status === filterStatus;
    const matchesJob = filterJob === "all" || app.jobId === filterJob;
    return matchesSearch && matchesStatus && matchesJob;
  });

  const pipelineStats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === "PENDING").length,
    shortlisted: applications.filter((a) => a.status === "SHORTLISTED").length,
    interviewing: applications.filter((a) => a.status === "INTERVIEWING" || a.status === "INTERVIEW_SCHEDULED").length,
    accepted: applications.filter((a) => a.status === "ACCEPTED" || a.status === "HIRED").length,
    rejected: applications.filter((a) => a.status === "REJECTED").length,
  };

  const columns = useMemo<ColumnDef<Application, any>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Candidate",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0"
              style={{ backgroundColor: "var(--portal-primary)" }}
            >
              {row.original.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm truncate" style={{ color: "var(--portal-text-primary)" }}>
                {row.original.name}
              </p>
              <p className="text-xs truncate" style={{ color: "var(--portal-text-muted)" }}>
                {row.original.jobTitle}
              </p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "email",
        header: "Contact",
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <p className="text-xs flex items-center gap-1" style={{ color: "var(--portal-text-secondary)" }}>
              <Mail className="w-3 h-3" /> {row.original.email}
            </p>
            {row.original.phone && (
              <p className="text-xs flex items-center gap-1" style={{ color: "var(--portal-text-muted)" }}>
                <Phone className="w-3 h-3" /> {row.original.phone}
              </p>
            )}
          </div>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Applied",
        cell: ({ row }) => (
          <span className="text-xs" style={{ color: "var(--portal-text-muted)" }}>
            {new Date(row.original.createdAt).toLocaleDateString()}
          </span>
        ),
      },
      {
        accessorKey: "fluenzyScore",
        header: "AI Score",
        cell: ({ row }) => {
          const score = row.original.fluenzyScore;
          if (score === null || score === undefined) return <span style={{ color: "var(--portal-text-muted)" }}>—</span>;
          const rounded = Math.round(score);
          return (
            <span
              className="portal-mono text-sm font-semibold"
              style={{
                color: rounded >= 70 ? "var(--portal-success)" : rounded >= 40 ? "var(--portal-warning)" : "var(--portal-danger)",
              }}
            >
              {rounded}%
            </span>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Stage",
        cell: ({ row }) => <PortalStatusBadge status={row.original.status} />,
      },
      {
        id: "resume",
        header: "",
        enableSorting: false,
        cell: ({ row }) =>
          row.original.resumeUrl ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.open(row.original.resumeUrl, "_blank");
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors"
              style={{
                border: "1px solid var(--portal-border)",
                color: "var(--portal-text-secondary)",
              }}
            >
              <FileText className="w-3 h-3" /> Resume
            </button>
          ) : null,
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const app = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-1.5 rounded-md transition-colors"
                  style={{ color: "var(--portal-text-muted)" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="min-w-[160px]"
                style={{
                  backgroundColor: "var(--portal-bg-elevated)",
                  borderColor: "var(--portal-border)",
                }}
              >
                <DropdownMenuItem onClick={() => updateApplicationStatus(app.id, "SHORTLISTED")}>
                  <Check className="w-4 h-4 mr-2" /> Shortlist
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateApplicationStatus(app.id, "INTERVIEWING")}>
                  <Users className="w-4 h-4 mr-2" /> Move to Interview
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateApplicationStatus(app.id, "ACCEPTED")}>
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Accept
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => updateApplicationStatus(app.id, "REJECTED")}
                  className="text-red-400 focus:text-red-300"
                >
                  <X className="w-4 h-4 mr-2" /> Reject
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [applications, router]
  );

  return (
    <PortalLayout title="Applications">
      <div className="space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--portal-text-primary)" }}>
            Applications
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--portal-text-muted)" }}>
            <span className="portal-mono font-medium" style={{ color: "var(--portal-text-secondary)" }}>
              {pipelineStats.total}
            </span>{" "}
            Total ·{" "}
            <span className="portal-mono font-medium" style={{ color: "var(--portal-warning)" }}>
              {pipelineStats.pending}
            </span>{" "}
            Pending ·{" "}
            <span className="portal-mono font-medium" style={{ color: "var(--portal-info)" }}>
              {pipelineStats.shortlisted}
            </span>{" "}
            Shortlisted ·{" "}
            <span className="portal-mono font-medium" style={{ color: "var(--portal-success)" }}>
              {pipelineStats.accepted}
            </span>{" "}
            Accepted
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: "var(--portal-text-muted)" }}
            />
            <input
              type="text"
              placeholder="Search by name, email, or job title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-md text-sm outline-none"
              style={{
                backgroundColor: "var(--portal-bg-elevated)",
                border: "1px solid var(--portal-border)",
                color: "var(--portal-text-primary)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--portal-primary)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--portal-border)";
              }}
            />
          </div>

          <select
            value={filterJob}
            onChange={(e) => setFilterJob(e.target.value)}
            className="px-3 py-2 rounded-md text-sm outline-none"
            style={{
              backgroundColor: "var(--portal-bg-elevated)",
              border: "1px solid var(--portal-border)",
              color: "var(--portal-text-primary)",
            }}
          >
            <option value="all">All Jobs</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2 overflow-x-auto">
            {STATUSES.map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap"
                style={{
                  backgroundColor:
                    filterStatus === status ? "var(--portal-primary-muted)" : "var(--portal-bg-elevated)",
                  color: filterStatus === status ? "var(--portal-primary)" : "var(--portal-text-secondary)",
                  border: `1px solid ${filterStatus === status ? "var(--portal-primary)" : "var(--portal-border)"}`,
                }}
              >
                {status === "all" ? "All" : status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, " ")}
              </button>
            ))}
            <ViewToggle
              views={["table", "card"]}
              activeView={viewMode}
              onViewChange={(v) => setViewMode(v as "table" | "card")}
            />
          </div>
        </div>

        {/* Content */}
        {viewMode === "table" ? (
          <DataTable
            data={filteredApplications}
            columns={columns}
            loading={isLoading}
            enableRowSelection
            emptyState={
              <EmptyState
                icon={<FileText className="w-6 h-6" />}
                title={searchQuery || filterStatus !== "all" ? "No applications match filters" : "No applications yet"}
                description={
                  searchQuery || filterStatus !== "all"
                    ? "Try adjusting your search or status filter."
                    : "Applications will appear here once candidates start applying to your jobs."
                }
              />
            }
          />
        ) : (
          /* Card View */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-44 rounded-lg border portal-skeleton"
                    style={{ borderColor: "var(--portal-border)" }}
                  />
                ))
              : filteredApplications.map((app) => (
                  <div
                    key={app.id}
                    className="rounded-lg border p-4 transition-shadow hover:shadow-[var(--portal-shadow-hover)]"
                    style={{
                      backgroundColor: "var(--portal-bg-elevated)",
                      borderColor: "var(--portal-border)",
                    }}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                        style={{ backgroundColor: "var(--portal-primary)" }}
                      >
                        {app.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate" style={{ color: "var(--portal-text-primary)" }}>
                          {app.name}
                        </p>
                        <p className="text-xs truncate" style={{ color: "var(--portal-text-muted)" }}>
                          {app.jobTitle}
                        </p>
                      </div>
                      <PortalStatusBadge status={app.status} />
                    </div>

                    <div className="space-y-1 mb-3">
                      <p className="text-xs flex items-center gap-1.5" style={{ color: "var(--portal-text-secondary)" }}>
                        <Mail className="w-3 h-3" /> {app.email}
                      </p>
                      <p className="text-xs flex items-center gap-1.5" style={{ color: "var(--portal-text-muted)" }}>
                        <Calendar className="w-3 h-3" /> Applied {new Date(app.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {app.fluenzyScore !== null && app.fluenzyScore !== undefined && (
                      <div className="mb-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span style={{ color: "var(--portal-text-secondary)" }}>AI Match</span>
                          <span className="portal-mono font-semibold" style={{ color: "var(--portal-success)" }}>
                            {Math.round(app.fluenzyScore)}%
                          </span>
                        </div>
                        <div
                          className="w-full h-1.5 rounded-full overflow-hidden"
                          style={{ backgroundColor: "var(--portal-surface)" }}
                        >
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(app.fluenzyScore, 100)}%`,
                              backgroundColor: "var(--portal-success)",
                            }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      {app.resumeUrl && (
                        <button
                          onClick={() => window.open(app.resumeUrl, "_blank")}
                          className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors"
                          style={{
                            border: "1px solid var(--portal-border)",
                            color: "var(--portal-text-secondary)",
                          }}
                        >
                          <FileText className="w-3 h-3" /> Resume
                        </button>
                      )}
                    </div>
                  </div>
                ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
