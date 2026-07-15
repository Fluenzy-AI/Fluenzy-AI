"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PortalLayout, DataTable, EmptyState, PortalStatusBadge, ViewToggle } from "@/components/portal";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Plus,
  Search,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Users,
  MapPin,
  Briefcase,
  DollarSign,
  Calendar,
  Pause,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  employmentType: string;
  salaryMin?: string | number | null;
  salaryMax?: string | number | null;
  experience: string;
  isActive: boolean;
  autoApplyEnabled: boolean;
  applicationsCount: number;
  viewCount: number;
  createdAt: string;
}

export default function JobPostingsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [deleteJobId, setDeleteJobId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "card">("table");

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/company/jobs");
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      }
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleJobStatus = async (jobId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/company/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (res.ok) {
        setJobs(jobs.map((job) => (job.id === jobId ? { ...job, isActive: !currentStatus } : job)));
      }
    } catch (error) {
      console.error("Failed to toggle job status:", error);
    }
  };

  const deleteJob = async (jobId: string) => {
    try {
      const res = await fetch(`/api/company/jobs/${jobId}`, { method: "DELETE" });
      if (res.ok) {
        setJobs(jobs.filter((job) => job.id !== jobId));
        setDeleteJobId(null);
      }
    } catch (error) {
      console.error("Failed to delete job:", error);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "active" && job.isActive) ||
      (filterStatus === "inactive" && !job.isActive);
    return matchesSearch && matchesFilter;
  });

  const stats = {
    active: jobs.filter((j) => j.isActive).length,
    inactive: jobs.filter((j) => !j.isActive).length,
    totalApplications: jobs.reduce((sum, j) => sum + (j.applicationsCount || 0), 0),
  };

  // Table columns
  const columns = useMemo<ColumnDef<Job, any>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "var(--portal-primary-muted)" }}
            >
              <Briefcase className="w-4 h-4" style={{ color: "var(--portal-primary)" }} />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm truncate" style={{ color: "var(--portal-text-primary)" }}>
                {row.original.title}
              </p>
              <p className="text-xs" style={{ color: "var(--portal-text-muted)" }}>
                {row.original.department}
              </p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleJobStatus(row.original.id, row.original.isActive);
            }}
            className="cursor-pointer"
          >
            <PortalStatusBadge status={row.original.isActive ? "ACTIVE" : "INACTIVE"} />
          </button>
        ),
      },
      {
        accessorKey: "location",
        header: "Location",
        cell: ({ row }) => (
          <span className="text-sm flex items-center gap-1" style={{ color: "var(--portal-text-secondary)" }}>
            <MapPin className="w-3 h-3" />
            {row.original.location}
          </span>
        ),
      },
      {
        accessorKey: "applicationsCount",
        header: "Applicants",
        cell: ({ row }) => (
          <span className="portal-mono text-sm font-medium" style={{ color: "var(--portal-text-primary)" }}>
            {row.original.applicationsCount ?? 0}
          </span>
        ),
      },
      {
        accessorKey: "viewCount",
        header: "Views",
        cell: ({ row }) => (
          <span className="portal-mono text-sm" style={{ color: "var(--portal-text-secondary)" }}>
            {row.original.viewCount ?? 0}
          </span>
        ),
      },
      {
        accessorKey: "salary",
        header: "Salary Range",
        enableSorting: false,
        cell: ({ row }) => {
          const { salaryMin, salaryMax } = row.original;
          if (!salaryMin && !salaryMax) return <span style={{ color: "var(--portal-text-muted)" }}>—</span>;
          return (
            <span className="portal-mono text-xs" style={{ color: "var(--portal-text-secondary)" }}>
              ₹{Number(salaryMin).toLocaleString()} – ₹{Number(salaryMax).toLocaleString()}
            </span>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: "Posted",
        cell: ({ row }) => (
          <span className="text-xs" style={{ color: "var(--portal-text-muted)" }}>
            {new Date(row.original.createdAt).toLocaleDateString()}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const job = row.original;
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
                <DropdownMenuItem onClick={() => router.push(`/company/portal/jobs/${job.id}`)}>
                  <Eye className="w-4 h-4 mr-2" /> View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(`/company/portal/jobs/${job.id}/edit`)}>
                  <Edit className="w-4 h-4 mr-2" /> Edit Job
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleJobStatus(job.id, job.isActive)}>
                  {job.isActive ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                  {job.isActive ? "Pause Job" : "Activate Job"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(`/company/portal/applications?jobId=${job.id}`)}>
                  <Users className="w-4 h-4 mr-2" /> View Candidates ({job.applicationsCount ?? 0})
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setDeleteJobId(job.id)}
                  className="text-red-400 focus:text-red-300"
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Delete Job
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [jobs, router]
  );

  return (
    <PortalLayout title="Job Postings">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--portal-text-primary)" }}>
              Job Postings
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--portal-text-muted)" }}>
              <span className="portal-mono font-medium" style={{ color: "var(--portal-text-secondary)" }}>
                {stats.active}
              </span>{" "}
              Active ·{" "}
              <span className="portal-mono font-medium" style={{ color: "var(--portal-text-secondary)" }}>
                {stats.inactive}
              </span>{" "}
              Inactive ·{" "}
              <span className="portal-mono font-medium" style={{ color: "var(--portal-text-secondary)" }}>
                {stats.totalApplications}
              </span>{" "}
              Total Applications
            </p>
          </div>
          <button
            onClick={() => router.push("/company/portal/jobs/new")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors"
            style={{
              backgroundColor: "var(--portal-primary)",
              color: "var(--portal-primary-text)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--portal-primary-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--portal-primary)";
            }}
          >
            <Plus className="w-4 h-4" />
            Post New Job
          </button>
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
              placeholder="Search jobs by title or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-md text-sm outline-none transition-colors"
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
          <div className="flex items-center gap-2">
            {(["all", "active", "inactive"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                style={{
                  backgroundColor:
                    filterStatus === status ? "var(--portal-primary-muted)" : "var(--portal-bg-elevated)",
                  color: filterStatus === status ? "var(--portal-primary)" : "var(--portal-text-secondary)",
                  border: `1px solid ${filterStatus === status ? "var(--portal-primary)" : "var(--portal-border)"}`,
                }}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
            <ViewToggle
              views={["table", "card"]}
              activeView={viewMode}
              onViewChange={(v) => setViewMode(v as "table" | "card")}
            />
          </div>
        </div>

        {/* Data Table */}
        {viewMode === "table" ? (
          <DataTable
            data={filteredJobs}
            columns={columns}
            loading={isLoading}
            enableRowSelection
            emptyState={
              <EmptyState
                icon={<Briefcase className="w-6 h-6" />}
                title={searchQuery || filterStatus !== "all" ? "No jobs match your filters" : "No jobs posted yet"}
                description={
                  searchQuery || filterStatus !== "all"
                    ? "Try adjusting your search or filters."
                    : "Create your first job posting to start receiving applications."
                }
                action={
                  !searchQuery && filterStatus === "all"
                    ? { label: "Post New Job", onClick: () => router.push("/company/portal/jobs/new") }
                    : undefined
                }
              />
            }
          />
        ) : (
          /* Card View */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-48 rounded-lg border portal-skeleton"
                    style={{ borderColor: "var(--portal-border)" }}
                  />
                ))
              : filteredJobs.map((job) => (
                  <div
                    key={job.id}
                    className="rounded-lg border p-5 transition-shadow hover:shadow-[var(--portal-shadow-hover)] cursor-pointer"
                    style={{
                      backgroundColor: "var(--portal-bg-elevated)",
                      borderColor: "var(--portal-border)",
                    }}
                    onClick={() => router.push(`/company/portal/jobs/${job.id}`)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-base" style={{ color: "var(--portal-text-primary)" }}>
                          {job.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <PortalStatusBadge status={job.isActive ? "ACTIVE" : "INACTIVE"} />
                          {job.autoApplyEnabled && <PortalStatusBadge status="INFO" />}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs mb-3" style={{ color: "var(--portal-text-muted)" }}>
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-3 h-3" /> {job.department}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {job.location}
                      </span>
                      {job.salaryMin && job.salaryMax && (
                        <span className="flex items-center gap-1 portal-mono">
                          <DollarSign className="w-3 h-3" /> ₹{Number(job.salaryMin).toLocaleString()} – ₹
                          {Number(job.salaryMax).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs" style={{ color: "var(--portal-text-secondary)" }}>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" style={{ color: "var(--portal-primary)" }} />
                        <span className="portal-mono font-semibold">{job.applicationsCount ?? 0}</span> applications
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        <span className="portal-mono">{job.viewCount ?? 0}</span> views
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(job.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {deleteJobId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
            <div
              className="rounded-xl p-6 w-full max-w-md"
              style={{
                backgroundColor: "var(--portal-bg-elevated)",
                border: "1px solid var(--portal-border)",
                boxShadow: "var(--portal-shadow-modal)",
              }}
            >
              <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--portal-text-primary)" }}>
                Delete Job?
              </h3>
              <p className="text-sm mb-6" style={{ color: "var(--portal-text-muted)" }}>
                This will permanently delete this job posting and all associated applications. This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteJobId(null)}
                  className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  style={{
                    border: "1px solid var(--portal-border)",
                    color: "var(--portal-text-secondary)",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteJob(deleteJobId)}
                  className="px-4 py-2 rounded-md text-sm font-medium text-white transition-colors"
                  style={{ backgroundColor: "var(--portal-danger)" }}
                >
                  <span className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4" /> Delete Job
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
