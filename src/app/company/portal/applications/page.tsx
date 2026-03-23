"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import CompanyPortalLayout from "@/components/CompanyPortalLayout";
import {
  Search,
  Filter,
  MoreVertical,
  Eye,
  Check,
  X,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  FileText,
  Clock,
  TrendingUp,
  Users,
  CheckCircle2,
  XCircle,
  LayoutDashboard,
  UserPlus,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const COMPANY_NAV = [
  { label: "Dashboard", href: "/company/portal", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "Job Postings", href: "/company/portal/jobs", icon: <Briefcase className="w-4 h-4" /> },
  { label: "Applications", href: "/company/portal/applications", icon: <Users className="w-4 h-4" /> },
  { label: "Assessments", href: "/company/portal/assessments", icon: <FileText className="w-4 h-4" /> },
  { label: "Team", href: "/company/portal/team", icon: <UserPlus className="w-4 h-4" />, adminOnly: true },
  { label: "Settings", href: "/company/portal/settings", icon: <Settings className="w-4 h-4" />, adminOnly: true },
];

interface Application {
  id: string;
  name: string;
  email: string;
  phone?: string;
  resumeUrl?: string;
  jobTitle: string;
  jobId: string;
  status: string;
  appliedAt: string;
  isAutoApplied: boolean;
  skills: string[];
}

const statusColors: Record<string, { bg: string; text: string; icon: any }> = {
  PENDING: { bg: "bg-amber-500/10", text: "text-amber-400", icon: Clock },
  SHORTLISTED: { bg: "bg-blue-500/10", text: "text-blue-400", icon: TrendingUp },
  INTERVIEWING: { bg: "bg-purple-500/10", text: "text-purple-400", icon: Users },
  ACCEPTED: { bg: "bg-emerald-500/10", text: "text-emerald-400", icon: CheckCircle2 },
  REJECTED: { bg: "bg-red-500/10", text: "text-red-400", icon: XCircle },
};

export default function ApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

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

      if (res.ok) {
        fetchApplications();
      }
    } catch (error) {
      console.error("Failed to update application:", error);
    }
  };

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.jobTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === "all" || app.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === "PENDING").length,
    shortlisted: applications.filter((a) => a.status === "SHORTLISTED").length,
    accepted: applications.filter((a) => a.status === "ACCEPTED").length,
  };

  return (
    <CompanyPortalLayout navItems={COMPANY_NAV} title="Applications">
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Applications</h1>
          <p className="text-slate-400 mt-1">Review and manage candidate applications</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 border border-slate-700 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Applications</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/50 border border-slate-700 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Pending Review</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.pending}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/50 border border-slate-700 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Shortlisted</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.shortlisted}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-800/50 border border-slate-700 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Accepted</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.accepted}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or job title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          <Button
            variant={filterStatus === "all" ? "default" : "outline"}
            onClick={() => setFilterStatus("all")}
            className={filterStatus === "all" ? "bg-indigo-600" : ""}
          >
            All
          </Button>
          <Button
            variant={filterStatus === "PENDING" ? "default" : "outline"}
            onClick={() => setFilterStatus("PENDING")}
            className={filterStatus === "PENDING" ? "bg-amber-600" : ""}
          >
            Pending
          </Button>
          <Button
            variant={filterStatus === "SHORTLISTED" ? "default" : "outline"}
            onClick={() => setFilterStatus("SHORTLISTED")}
            className={filterStatus === "SHORTLISTED" ? "bg-blue-600" : ""}
          >
            Shortlisted
          </Button>
          <Button
            variant={filterStatus === "INTERVIEWING" ? "default" : "outline"}
            onClick={() => setFilterStatus("INTERVIEWING")}
            className={filterStatus === "INTERVIEWING" ? "bg-purple-600" : ""}
          >
            Interviewing
          </Button>
          <Button
            variant={filterStatus === "ACCEPTED" ? "default" : "outline"}
            onClick={() => setFilterStatus("ACCEPTED")}
            className={filterStatus === "ACCEPTED" ? "bg-emerald-600" : ""}
          >
            Accepted
          </Button>
          <Button
            variant={filterStatus === "REJECTED" ? "default" : "outline"}
            onClick={() => setFilterStatus("REJECTED")}
            className={filterStatus === "REJECTED" ? "bg-red-600" : ""}
          >
            Rejected
          </Button>
        </div>
      </div>

      {/* Applications List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-12 text-center">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No applications found</h3>
          <p className="text-slate-400">
            {searchQuery || filterStatus !== "all"
              ? "Try adjusting your filters"
              : "Applications will appear here once candidates start applying"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((app, index) => {
            const StatusIcon = statusColors[app.status]?.icon || Clock;

            return (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-indigo-500/50 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold">
                        {app.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">{app.name}</h3>
                        <p className="text-sm text-slate-400">{app.jobTitle}</p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full ${statusColors[app.status]?.bg} ${statusColors[app.status]?.text} text-xs font-medium flex items-center gap-1`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {app.status}
                      </span>
                      {app.isAutoApplied && (
                        <span className="px-2 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-medium">
                          Auto-Applied
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 mb-3">
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {app.email}
                      </div>
                      {app.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {app.phone}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Applied {new Date(app.appliedAt).toLocaleDateString()}
                      </div>
                    </div>

                    {app.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {app.skills.slice(0, 5).map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-1 bg-slate-700/50 rounded-md text-xs text-slate-300"
                          >
                            {skill}
                          </span>
                        ))}
                        {app.skills.length > 5 && (
                          <span className="px-2 py-1 text-xs text-slate-500">
                            +{app.skills.length - 5} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {app.resumeUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(app.resumeUrl, "_blank")}
                        className="border-slate-700 hover:bg-slate-800"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Resume
                      </Button>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4 text-slate-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                        <DropdownMenuItem
                          onClick={() => updateApplicationStatus(app.id, "SHORTLISTED")}
                          className="text-slate-300 hover:text-white"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Shortlist
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => updateApplicationStatus(app.id, "INTERVIEWING")}
                          className="text-slate-300 hover:text-white"
                        >
                          <Users className="w-4 h-4 mr-2" />
                          Move to Interview
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => updateApplicationStatus(app.id, "ACCEPTED")}
                          className="text-emerald-400 hover:text-emerald-300"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Accept
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => updateApplicationStatus(app.id, "REJECTED")}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Reject
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
    </CompanyPortalLayout>
  );
}
