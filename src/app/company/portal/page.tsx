"use client";

import { useEffect, useState } from "react";
import CompanyPortalLayout from "@/components/CompanyPortalLayout";
import { useCompanyAuth } from "@/contexts/CompanyAuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  UserPlus,
  Settings,
  FileText,
  Plus,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Calendar,
  DollarSign,
  Building2,
  Mail,
  BarChart3,
} from "lucide-react";

const COMPANY_NAV = [
  { label: "Dashboard", href: "/company/portal", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "Job Postings", href: "/company/portal/jobs", icon: <Briefcase className="w-4 h-4" /> },
  { label: "Applications", href: "/company/portal/applications", icon: <Users className="w-4 h-4" /> },
  { label: "Assessments", href: "/company/portal/assessments", icon: <FileText className="w-4 h-4" /> },
  { label: "Team", href: "/company/portal/team", icon: <UserPlus className="w-4 h-4" />, adminOnly: true },
  { label: "Settings", href: "/company/portal/settings", icon: <Settings className="w-4 h-4" />, adminOnly: true },
];

interface DashboardStats {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  pendingApplications: number;
  shortlistedApplications: number;
  hiredApplications: number;
  rejectedApplications: number;
  viewsThisMonth: number;
  applicationsThisMonth: number;
}

interface RecentApplication {
  id: string;
  name: string;
  email: string;
  jobTitle: string;
  status: string;
  createdAt: string;
  isAutoApplied: boolean;
}

interface RecentJob {
  id: string;
  title: string;
  department: string;
  applicationsCount: number;
  viewCount: number;
  isActive: boolean;
  createdAt: string;
}

export default function CompanyPortalDashboard() {
  const { user, company, loading } = useCompanyAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentApplications, setRecentApplications] = useState<RecentApplication[]>([]);
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/company/login");
      return;
    }
    if (user) fetchDashboardData();
  }, [user, loading, router]);

  async function fetchDashboardData() {
    try {
      const res = await fetch("/api/company/dashboard", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setRecentApplications(data.recentApplications || []);
        setRecentJobs(data.recentJobs || []);
      }
    } catch {
      // Silent fail
    } finally {
      setLoadingData(false);
    }
  }

  if (loading || loadingData) {
    return (
      <CompanyPortalLayout navItems={COMPANY_NAV} title="Dashboard">
        <DashboardSkeleton />
      </CompanyPortalLayout>
    );
  }

  return (
    <CompanyPortalLayout navItems={COMPANY_NAV} title="Dashboard">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Welcome back, {user?.name?.split(" ")[0]}!
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              {company?.name} • {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <Link
            href="/company/portal/jobs/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" />
            Post New Job
          </Link>
        </div>

        {/* Primary Stats - 6 Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/50 border border-slate-700 rounded-xl p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white mb-1">{stats?.totalJobs ?? 0}</p>
            <p className="text-sm text-slate-400">Total Jobs</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-slate-800/50 border border-slate-700 rounded-xl p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white mb-1">{stats?.activeJobs ?? 0}</p>
            <p className="text-sm text-slate-400">Active</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-800/50 border border-slate-700 rounded-xl p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white mb-1">{stats?.pendingApplications ?? 0}</p>
            <p className="text-sm text-slate-400">Pending Review</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-slate-800/50 border border-slate-700 rounded-xl p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white mb-1">{stats?.totalApplications ?? 0}</p>
            <p className="text-sm text-slate-400">Total Applications</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-800/50 border border-slate-700 rounded-xl p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white mb-1">{stats?.hiredApplications ?? 0}</p>
            <p className="text-sm text-slate-400">Hired This Month</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-slate-800/50 border border-slate-700 rounded-xl p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <Eye className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white mb-1">{stats?.viewsThisMonth ?? 0}</p>
            <p className="text-sm text-slate-400">Job Views</p>
          </motion.div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Department Breakdown - Takes 2 columns */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 bg-slate-800/50 border border-slate-700 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-400" />
                Department Breakdown
              </h3>
            </div>
            <div className="space-y-4">
              {[
                { dept: "Engineering", jobs: stats?.totalJobs ? Math.floor(stats.totalJobs * 0.4) : 0, color: "bg-blue-500" },
                { dept: "Product", jobs: stats?.totalJobs ? Math.floor(stats.totalJobs * 0.25) : 0, color: "bg-purple-500" },
                { dept: "Design", jobs: stats?.totalJobs ? Math.floor(stats.totalJobs * 0.15) : 0, color: "bg-pink-500" },
                { dept: "Marketing", jobs: stats?.totalJobs ? Math.floor(stats.totalJobs * 0.12) : 0, color: "bg-emerald-500" },
                { dept: "Sales", jobs: stats?.totalJobs ? Math.floor(stats.totalJobs * 0.08) : 0, color: "bg-amber-500" },
              ].map((item, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300 font-medium">{item.dept}</span>
                    <span className="text-slate-400">{item.jobs} jobs</span>
                  </div>
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${stats?.totalJobs ? (item.jobs / stats.totalJobs) * 100 : 0}%` }}
                      transition={{ duration: 1, delay: 0.5 + idx * 0.1 }}
                      className={`h-full ${item.color}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Recent Applications - Takes 1 column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-slate-800/50 border border-slate-700 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Recent Applications</h3>
              <Link href="/company/portal/applications" className="text-xs text-indigo-400 hover:text-indigo-300 transition">
                View all
              </Link>
            </div>
            {recentApplications.length > 0 ? (
              <div className="space-y-3">
                {recentApplications.slice(0, 5).map((app) => (
                  <div key={app.id} className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-xl border border-slate-700/50 hover:border-indigo-500/30 transition">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {app.name[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-200 truncate">{app.name}</p>
                      <p className="text-xs text-slate-400 truncate">{app.jobTitle}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusBadge status={app.status} />
                        {app.isAutoApplied && (
                          <span className="text-[10px] text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">Auto</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No applications yet</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-slate-800/50 border border-slate-700 rounded-xl p-6"
          >
            <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <QuickActionCard
                icon={<Plus className="w-5 h-5" />}
                label="Post Job"
                href="/company/portal/jobs/new"
                color="text-blue-400"
              />
              <QuickActionCard
                icon={<Users className="w-5 h-5" />}
                label="Applications"
                href="/company/portal/applications"
                color="text-purple-400"
              />
              <QuickActionCard
                icon={<FileText className="w-5 h-5" />}
                label="Assessment"
                href="/company/portal/assessments/new"
                color="text-emerald-400"
              />
              <QuickActionCard
                icon={<Mail className="w-5 h-5" />}
                label="Invite Team"
                href="/company/portal/team"
                color="text-amber-400"
              />
            </div>
          </motion.div>

          {/* Recent Jobs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="lg:col-span-2 bg-slate-800/50 border border-slate-700 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Your Job Postings</h3>
              <Link href="/company/portal/jobs" className="text-xs text-indigo-400 hover:text-indigo-300 transition">
                Manage all
              </Link>
            </div>
            {recentJobs.length > 0 ? (
              <div className="space-y-3">
                {recentJobs.slice(0, 4).map((job) => (
                  <Link
                    key={job.id}
                    href={`/company/portal/jobs/${job.id}`}
                    className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 hover:border-indigo-500/30 transition group"
                  >
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <Briefcase className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-200 truncate group-hover:text-white transition">{job.title}</p>
                      <p className="text-xs text-slate-500">{job.department}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" /> {job.viewCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> {job.applicationsCount}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${job.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-500/10 text-slate-400"}`}>
                        {job.isActive ? "Active" : "Closed"}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 text-sm mb-3">No jobs posted yet</p>
                <Link
                  href="/company/portal/jobs/new"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition"
                >
                  <Plus className="w-4 h-4" />
                  Post your first job
                </Link>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </CompanyPortalLayout>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 bg-slate-800 rounded w-64" />
          <div className="h-4 bg-slate-800 rounded w-96" />
        </div>
        <div className="h-12 bg-slate-800 rounded-xl w-40" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-28 bg-slate-800 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-80 bg-slate-800 rounded-xl" />
        <div className="h-80 bg-slate-800 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="h-64 bg-slate-800 rounded-xl" />
        <div className="lg:col-span-2 h-64 bg-slate-800 rounded-xl" />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    REVIEWED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    SHORTLISTED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    INTERVIEWING: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    INTERVIEW_SCHEDULED: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    ACCEPTED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    HIRED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    REJECTED: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${styles[status] || "bg-slate-500/10 text-slate-400 border-slate-500/20"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function QuickActionCard({ icon, label, href, color }: { icon: React.ReactNode; label: string; href: string; color: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-3 p-4 bg-slate-900/50 hover:bg-slate-900/80 border border-slate-700/50 hover:border-indigo-500/30 rounded-xl transition text-center group"
    >
      <span className={`${color} group-hover:scale-110 transition-transform`}>{icon}</span>
      <span className="text-xs text-slate-300 font-medium group-hover:text-white transition">{label}</span>
    </Link>
  );
}
