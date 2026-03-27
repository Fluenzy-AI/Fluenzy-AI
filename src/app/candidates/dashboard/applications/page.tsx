"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText,
  Search,
  Filter,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Building,
  MapPin,
  Briefcase,
  Eye,
} from "lucide-react";

interface Application {
  id: string;
  status: string;
  createdAt: string;
  jobTitle?: string;
  jobSlug?: string;
  job?: {
    id: string;
    title: string;
    slug: string;
    department: string;
    location: string;
    employmentType: string;
  };
  interviews?: Array<{
    id: string;
    scheduledAt: string;
    status: string;
  }>;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
  PENDING: { label: "Pending", color: "text-amber-400", bgColor: "bg-amber-500/10", icon: Clock },
  APPLIED: { label: "Applied", color: "text-blue-400", bgColor: "bg-blue-500/10", icon: FileText },
  UNDER_REVIEW: { label: "Under Review", color: "text-violet-400", bgColor: "bg-violet-500/10", icon: Eye },
  SHORTLISTED: { label: "Shortlisted", color: "text-emerald-400", bgColor: "bg-emerald-500/10", icon: CheckCircle },
  INTERVIEW_SCHEDULED: { label: "Interview", color: "text-indigo-400", bgColor: "bg-indigo-500/10", icon: Calendar },
  REJECTED: { label: "Not Selected", color: "text-red-400", bgColor: "bg-red-500/10", icon: XCircle },
  HIRED: { label: "Hired", color: "text-green-400", bgColor: "bg-green-500/10", icon: CheckCircle },
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await fetch("/api/candidates/applications?type=internal");
        if (res.ok) {
          const data = await res.json();
          setApplications(data.applications || []);
        }
      } catch (error) {
        console.error("Failed to fetch applications:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, []);

  const filteredApplications = applications.filter((app) => {
    const title = app.jobTitle || app.job?.title || "";
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: applications.length,
    active: applications.filter((a) => !["REJECTED", "HIRED"].includes(a.status)).length,
    interviews: applications.filter((a) => a.status === "INTERVIEW_SCHEDULED").length,
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-white/5 rounded-xl w-64" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-white/5 rounded-xl" />
          ))}
        </div>
        <div className="h-96 bg-white/5 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">My Applications</h1>
          <p className="text-slate-400 text-sm mt-1">Track all your job applications</p>
        </div>
        <Link
          href="/careers"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-500 text-white text-sm font-semibold hover:bg-violet-400 transition-colors"
        >
          <Briefcase className="w-4 h-4" />
          Browse Jobs
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#13161E] rounded-xl border border-white/5 p-4">
          <p className="text-2xl font-bold text-white">{stats.total}</p>
          <p className="text-xs text-slate-500 mt-1">Total Applications</p>
        </div>
        <div className="bg-[#13161E] rounded-xl border border-white/5 p-4">
          <p className="text-2xl font-bold text-blue-400">{stats.active}</p>
          <p className="text-xs text-slate-500 mt-1">Active</p>
        </div>
        <div className="bg-[#13161E] rounded-xl border border-white/5 p-4">
          <p className="text-2xl font-bold text-indigo-400">{stats.interviews}</p>
          <p className="text-xs text-slate-500 mt-1">Interviews</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search applications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#13161E] border border-white/5 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-violet-500/50"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-10 pr-8 py-2.5 rounded-xl bg-[#13161E] border border-white/5 text-white text-sm focus:outline-none focus:border-violet-500/50 appearance-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="SHORTLISTED">Shortlisted</option>
            <option value="INTERVIEW_SCHEDULED">Interview</option>
            <option value="REJECTED">Not Selected</option>
            <option value="HIRED">Hired</option>
          </select>
        </div>
      </div>

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <div className="bg-[#13161E] rounded-xl border border-white/5 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-violet-500/10 flex items-center justify-center">
            <FileText className="w-8 h-8 text-violet-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            {applications.length === 0 ? "No applications yet" : "No matching applications"}
          </h3>
          <p className="text-sm text-slate-400 mb-6">
            {applications.length === 0
              ? "Start your career journey by applying to open positions"
              : "Try adjusting your search or filters"}
          </p>
          {applications.length === 0 && (
            <Link
              href="/careers"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-violet-500 text-white text-sm font-semibold hover:bg-violet-400 transition-colors"
            >
              Browse Open Positions
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-[#13161E] rounded-xl border border-white/5 divide-y divide-white/5">
          {filteredApplications.map((app, index) => {
            const status = STATUS_CONFIG[app.status] || STATUS_CONFIG.PENDING;
            const StatusIcon = status.icon;
            const jobTitle = app.jobTitle || app.job?.title || "Unknown Position";
            const jobSlug = app.jobSlug || app.job?.slug;

            return (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  href={jobSlug ? `/candidates/dashboard/applications/${app.id}` : "#"}
                  className="flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-colors group"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${status.bgColor}`}>
                    <StatusIcon className={`w-5 h-5 ${status.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate group-hover:text-violet-300 transition-colors">
                      {jobTitle}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Building className="w-3 h-3" />
                        Fluenzy AI
                      </span>
                      {app.job?.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {app.job.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
                      {status.label}
                    </span>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(app.createdAt).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-violet-400 transition-colors flex-shrink-0" />
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
