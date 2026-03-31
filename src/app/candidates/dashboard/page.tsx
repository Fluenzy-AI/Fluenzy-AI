"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase,
  FileText,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Eye,
  Users,
  Award,
  ArrowRight,
  Bell,
  User,
  MapPin,
  Building,
  IndianRupee,
  ExternalLink,
  PartyPopper,
} from "lucide-react";

// ============ TYPES ============
interface CandidateProfile {
  id: string;
  phone?: string;
  location?: string;
  skills?: string[];
  experience?: string;
  education?: string;
  linkedin?: string;
  portfolio?: string;
  bio?: string;
  resumeUrl?: string;
}

interface Candidate {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  profile: CandidateProfile | null;
}

interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  jobSlug?: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  job?: {
    id: string;
    title: string;
    slug: string;
    department: string;
    location: string;
    employmentType: string;
    salaryRange?: string;
  };
  interviews?: Array<{
    id: string;
    scheduledAt: string;
    status: string;
    type: string;
  }>;
}

interface Interview {
  id: string;
  scheduledAt: string;
  status: string;
  type: string;
  application: {
    job: {
      title: string;
    };
  };
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

interface RecommendedJob {
  id: string;
  title: string;
  slug: string;
  department: string;
  location: string;
  employmentType: string;
  salaryRange?: string;
  matchScore?: number;
}

// ============ STATUS CONFIG ============
const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  PENDING: { label: "Pending Review", color: "text-amber-400", bgColor: "bg-amber-500/10", icon: Clock },
  APPLIED: { label: "Applied", color: "text-blue-400", bgColor: "bg-blue-500/10", icon: FileText },
  UNDER_REVIEW: { label: "Under Review", color: "text-purple-400", bgColor: "bg-purple-500/10", icon: Eye },
  SHORTLISTED: { label: "Shortlisted", color: "text-emerald-400", bgColor: "bg-emerald-500/10", icon: CheckCircle },
  INTERVIEW_SCHEDULED: { label: "Interview Scheduled", color: "text-indigo-400", bgColor: "bg-indigo-500/10", icon: Calendar },
  REJECTED: { label: "Not Selected", color: "text-red-400", bgColor: "bg-red-500/10", icon: XCircle },
  HIRED: { label: "Hired! 🎉", color: "text-green-400", bgColor: "bg-green-500/10", icon: Award },
};

// ============ PIPELINE STAGES ============
const PIPELINE_STAGES = [
  { key: "APPLIED", label: "Applied", icon: FileText },
  { key: "UNDER_REVIEW", label: "Under Review", icon: Eye },
  { key: "SHORTLISTED", label: "Shortlisted", icon: CheckCircle },
  { key: "INTERVIEW_SCHEDULED", label: "Interview", icon: Calendar },
  { key: "HIRED", label: "Hired", icon: Award },
];

// ============ MAIN COMPONENT ============
export default function CandidateDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [recommendedJobs, setRecommendedJobs] = useState<RecommendedJob[]>([]);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [appliedJobSlug, setAppliedJobSlug] = useState<string | null>(null);

  // Check for success state from URL
  useEffect(() => {
    const success = searchParams.get("success");
    const jobSlug = searchParams.get("job");
    if (success === "true" && jobSlug) {
      setShowSuccessBanner(true);
      setAppliedJobSlug(jobSlug);
      // Auto-hide after 10 seconds
      setTimeout(() => setShowSuccessBanner(false), 10000);
    }
  }, [searchParams]);

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch candidate info
        const meRes = await fetch("/api/candidates/me");
        if (!meRes.ok) {
          router.replace("/candidates/login?redirect=/candidates/dashboard");
          return;
        }
        const meData = await meRes.json();
        setCandidate(meData.candidate);

        // Fetch applications (internal only)
        const appsRes = await fetch("/api/candidates/applications?type=internal");
        if (appsRes.ok) {
          const appsData = await appsRes.json();
          setApplications(appsData.applications || []);
        }

        // Fetch upcoming interviews
        const interviewsRes = await fetch("/api/candidates/interviews?upcoming=true");
        if (interviewsRes.ok) {
          const interviewsData = await interviewsRes.json();
          setInterviews(interviewsData.interviews || []);
        }

        // Fetch notifications
        const notifRes = await fetch("/api/candidates/notifications?limit=5");
        if (notifRes.ok) {
          const notifData = await notifRes.json();
          setNotifications(notifData.notifications || []);
        }

        // Fetch recommended jobs
        const jobsRes = await fetch("/api/careers/jobs?limit=4");
        if (jobsRes.ok) {
          const jobsData = await jobsRes.json();
          setRecommendedJobs(jobsData.jobs || []);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = applications.length;
    const active = applications.filter(a => !["REJECTED", "HIRED"].includes(a.status)).length;
    const interviewScheduled = applications.filter(a => a.status === "INTERVIEW_SCHEDULED").length;
    const offers = applications.filter(a => a.status === "HIRED").length;
    const rejected = applications.filter(a => a.status === "REJECTED").length;
    return { total, active, interviewScheduled, offers, rejected };
  }, [applications]);

  // Profile completion percentage
  const profileCompletion = useMemo(() => {
    if (!candidate?.profile) return 15;
    const profile = candidate.profile;
    let score = 15;
    if (candidate.name) score += 10;
    if (profile.phone) score += 10;
    if (profile.location) score += 10;
    if (profile.skills && profile.skills.length > 0) score += 15;
    if (profile.experience) score += 15;
    if (profile.education) score += 10;
    if (profile.resumeUrl) score += 15;
    return Math.min(score, 100);
  }, [candidate]);

  // Get recently applied job details
  const recentApplication = useMemo(() => {
    if (appliedJobSlug) {
      return applications.find(a => a.jobSlug === appliedJobSlug || a.job?.slug === appliedJobSlug);
    }
    return applications[0];
  }, [applications, appliedJobSlug]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!candidate) return null;

  const firstName = candidate.name.split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Success Banner */}
      <AnimatePresence>
        {showSuccessBanner && recentApplication && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-500/20 via-green-500/20 to-teal-500/20 border border-emerald-500/30 p-4 sm:p-6"
          >
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            <div className="relative flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                <PartyPopper className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 flex-wrap">
                  Application Submitted! 🎉
                </h2>
                <p className="text-emerald-200/80 text-sm mt-1 line-clamp-2">
                  You've applied for <strong className="text-white">{recentApplication.jobTitle || recentApplication.job?.title}</strong>. 
                  We'll review within 24-48 hours.
                </p>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-3 sm:mt-4">
                  <Link
                    href={`/candidates/dashboard/applications/${recentApplication.id}`}
                    className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-400 active:bg-emerald-600 transition-colors"
                  >
                    Track Application
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => setShowSuccessBanner(false)}
                    className="px-3 sm:px-4 py-2 rounded-lg text-emerald-300 text-sm font-medium hover:bg-white/5 active:bg-white/10 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
      >
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white truncate">
            {greeting}, {firstName}! 👋
          </h1>
          <p className="text-slate-400 text-sm sm:text-base mt-1">
            {stats.total === 0 
              ? "Start your journey by applying to open positions" 
              : `You have ${stats.active} active application${stats.active !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Link
          href="/candidates/dashboard/careers"
          className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold text-sm hover:from-violet-500 hover:to-purple-500 active:scale-[0.98] transition-all shadow-lg shadow-violet-500/20 flex-shrink-0 w-full sm:w-auto"
        >
          <Briefcase className="w-4 h-4" />
          Browse Jobs
        </Link>
      </motion.div>

      {/* Stats Cards - Responsive Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4"
      >
        <StatCard
          label="Total Applications"
          value={stats.total}
          icon={<FileText className="w-5 h-5" />}
          color="violet"
        />
        <StatCard
          label="Active"
          value={stats.active}
          icon={<Clock className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          label="Interviews"
          value={stats.interviewScheduled}
          icon={<Calendar className="w-5 h-5" />}
          color="indigo"
          href="/candidates/dashboard/interviews"
        />
        <StatCard
          label="Offers"
          value={stats.offers}
          icon={<Award className="w-5 h-5" />}
          color="emerald"
        />
        <StatCard
          label="Not Selected"
          value={stats.rejected}
          icon={<XCircle className="w-5 h-5" />}
          color="red"
        />
      </motion.div>

      {/* Main Grid - Stack on mobile, 3 columns on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column - Applications & Pipeline */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6 order-2 lg:order-1">
          {/* Recent Applications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#0D0F14] rounded-xl sm:rounded-2xl border border-white/5 overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/5">
              <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400 flex-shrink-0" />
                <span className="truncate">Recent Applications</span>
              </h2>
              <Link
                href="/candidates/dashboard/applications"
                className="text-sm text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1 flex-shrink-0"
              >
                <span className="hidden sm:inline">View all</span>
                <span className="sm:hidden">All</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {applications.length === 0 ? (
              <div className="p-6 sm:p-10 text-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-xl sm:rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                  <Briefcase className="w-7 h-7 sm:w-8 sm:h-8 text-violet-400" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-white mb-2">No applications yet</h3>
                <p className="text-sm text-slate-400 mb-4 sm:mb-6 max-w-sm mx-auto">
                  Start your career journey by browsing our open positions.
                </p>
                <Link
                  href="/candidates/dashboard/careers"
                  className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-violet-500 text-white text-sm font-semibold hover:bg-violet-400 active:bg-violet-600 transition-colors"
                >
                  Browse Open Positions
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {applications.slice(0, 4).map((app, index) => (
                  <ApplicationRow key={app.id} application={app} index={index} />
                ))}
              </div>
            )}
          </motion.div>

          {/* Application Pipeline */}
          {applications.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-[#0D0F14] rounded-xl sm:rounded-2xl border border-white/5 p-4 sm:p-5"
            >
              <h2 className="text-base sm:text-lg font-semibold text-white mb-4 sm:mb-6 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400 flex-shrink-0" />
                Application Pipeline
              </h2>
              {/* Desktop Pipeline - Horizontal */}
              <div className="hidden sm:flex items-center justify-between gap-2">
                {PIPELINE_STAGES.map((stage, index) => {
                  const count = applications.filter(a => a.status === stage.key || 
                    (stage.key === "APPLIED" && (a.status === "APPLIED" || a.status === "PENDING"))).length;
                  const Icon = stage.icon;
                  return (
                    <div key={stage.key} className="flex-1 relative">
                      {index > 0 && (
                        <div className="absolute left-0 top-5 w-full h-0.5 bg-white/5 -translate-x-1/2" />
                      )}
                      <div className="relative flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center z-10 ${
                          count > 0 ? "bg-violet-500/20 border border-violet-500/30" : "bg-white/5 border border-white/10"
                        }`}>
                          <Icon className={`w-5 h-5 ${count > 0 ? "text-violet-400" : "text-slate-500"}`} />
                        </div>
                        <p className={`text-xs mt-2 font-medium text-center ${count > 0 ? "text-white" : "text-slate-500"}`}>
                          {stage.label}
                        </p>
                        <p className={`text-lg font-bold ${count > 0 ? "text-violet-400" : "text-slate-600"}`}>
                          {count}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Mobile Pipeline - Grid */}
              <div className="grid grid-cols-3 gap-3 sm:hidden">
                {PIPELINE_STAGES.slice(0, 3).map((stage) => {
                  const count = applications.filter(a => a.status === stage.key || 
                    (stage.key === "APPLIED" && (a.status === "APPLIED" || a.status === "PENDING"))).length;
                  const Icon = stage.icon;
                  return (
                    <div key={stage.key} className="flex flex-col items-center p-3 rounded-xl bg-white/[0.02]">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        count > 0 ? "bg-violet-500/20" : "bg-white/5"
                      }`}>
                        <Icon className={`w-4 h-4 ${count > 0 ? "text-violet-400" : "text-slate-500"}`} />
                      </div>
                      <p className={`text-[10px] mt-1.5 font-medium text-center ${count > 0 ? "text-white" : "text-slate-500"}`}>
                        {stage.label}
                      </p>
                      <p className={`text-base font-bold ${count > 0 ? "text-violet-400" : "text-slate-600"}`}>
                        {count}
                      </p>
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3 sm:hidden">
                {PIPELINE_STAGES.slice(3).map((stage) => {
                  const count = applications.filter(a => a.status === stage.key).length;
                  const Icon = stage.icon;
                  return (
                    <div key={stage.key} className="flex flex-col items-center p-3 rounded-xl bg-white/[0.02]">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        count > 0 ? "bg-violet-500/20" : "bg-white/5"
                      }`}>
                        <Icon className={`w-4 h-4 ${count > 0 ? "text-violet-400" : "text-slate-500"}`} />
                      </div>
                      <p className={`text-[10px] mt-1.5 font-medium text-center ${count > 0 ? "text-white" : "text-slate-500"}`}>
                        {stage.label}
                      </p>
                      <p className={`text-base font-bold ${count > 0 ? "text-violet-400" : "text-slate-600"}`}>
                        {count}
                      </p>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Recommended Jobs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-[#0D0F14] rounded-xl sm:rounded-2xl border border-white/5 overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/5">
              <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400 flex-shrink-0" />
                <span className="truncate">Recommended for You</span>
              </h2>
              <Link
                href="/careers"
                className="text-sm text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1 flex-shrink-0"
              >
                <span className="hidden sm:inline">View all jobs</span>
                <span className="sm:hidden">All</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-4 sm:p-5">
              {recommendedJobs.slice(0, 4).map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Column - Sidebar Widgets */}
        <div className="space-y-4 sm:space-y-6 order-1 lg:order-2">
          {/* Profile Completion */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#0D0F14] rounded-xl sm:rounded-2xl border border-white/5 p-4 sm:p-5"
          >
            <h3 className="text-sm font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-violet-400 flex-shrink-0" />
              Profile Completion
            </h3>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="50%"
                    cy="50%"
                    r="45%"
                    fill="none"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50%"
                    cy="50%"
                    r="45%"
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${profileCompletion * 2.83} 283`}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#8B5CF6" />
                      <stop offset="100%" stopColor="#A855F7" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-base sm:text-lg font-bold text-white">{profileCompletion}%</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-slate-400 mb-2 sm:mb-3 line-clamp-2">
                  {profileCompletion < 50
                    ? "Complete your profile to improve visibility"
                    : profileCompletion < 80
                    ? "Almost there! Add more details"
                    : "Great profile! Keep it updated"}
                </p>
                <Link
                  href="/candidates/dashboard/profile"
                  className="inline-flex items-center gap-1 text-sm font-medium text-violet-400 hover:text-violet-300 active:text-violet-500 transition-colors"
                >
                  {profileCompletion < 100 ? "Complete Profile" : "Edit Profile"}
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Upcoming Interviews */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-[#0D0F14] rounded-xl sm:rounded-2xl border border-white/5 p-4 sm:p-5"
          >
            <h3 className="text-sm font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-violet-400 flex-shrink-0" />
              Upcoming Interviews
            </h3>
            {interviews.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-3 sm:py-4">
                No interviews scheduled
              </p>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {interviews.slice(0, 3).map((interview) => (
                  <div
                    key={interview.id}
                    className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-white/[0.02] border border-white/5"
                  >
                    <p className="text-sm font-medium text-white truncate">
                      {interview.application.job.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 sm:mt-1.5 text-xs text-slate-400">
                      <Calendar className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">
                        {new Date(interview.scheduledAt).toLocaleDateString("en-IN", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Link
              href="/candidates/dashboard/interviews"
              className="flex items-center justify-center gap-1 w-full mt-3 sm:mt-4 py-2 rounded-lg bg-white/5 text-sm text-slate-400 hover:text-white hover:bg-white/10 active:bg-white/15 transition-all"
            >
              View All Interviews
              <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {/* Recent Notifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-[#0D0F14] rounded-xl sm:rounded-2xl border border-white/5 p-4 sm:p-5"
          >
            <h3 className="text-sm font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
              <Bell className="w-4 h-4 text-violet-400 flex-shrink-0" />
              Recent Updates
            </h3>
            {notifications.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-3 sm:py-4">
                No new notifications
              </p>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {notifications.slice(0, 4).map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-2.5 sm:p-3 rounded-lg sm:rounded-xl ${
                      notif.read ? "bg-white/[0.01]" : "bg-violet-500/5 border border-violet-500/10"
                    }`}
                  >
                    <p className="text-sm font-medium text-white line-clamp-1">{notif.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notif.message}</p>
                  </div>
                ))}
              </div>
            )}
            <Link
              href="/candidates/dashboard/notifications"
              className="flex items-center justify-center gap-1 w-full mt-3 sm:mt-4 py-2 rounded-lg bg-white/5 text-sm text-slate-400 hover:text-white hover:bg-white/10 active:bg-white/15 transition-all"
            >
              View All Notifications
              <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {/* Quick Tips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-xl sm:rounded-2xl border border-violet-500/20 p-4 sm:p-5"
          >
            <h3 className="text-sm font-semibold text-white mb-2 sm:mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400 flex-shrink-0" />
              Quick Tip
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {profileCompletion < 80
                ? "Complete your profile to auto-fill applications and increase your chances of getting shortlisted!"
                : stats.interviewScheduled > 0
                ? "You have interviews coming up! Prepare well and be on time."
                : "Keep your profile updated and check back regularly for new opportunities."}
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// ============ SUB-COMPONENTS ============

function StatCard({ label, value, icon, color, href }: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: "violet" | "blue" | "indigo" | "emerald" | "red";
  href?: string;
}) {
  const colorMap = {
    violet: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    red: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  const content = (
    <div className={`bg-[#0D0F14] rounded-xl sm:rounded-2xl border border-white/5 p-3 sm:p-4 hover:border-white/10 active:scale-[0.98] transition-all ${href ? "cursor-pointer" : ""}`}>
      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3 border ${colorMap[color]}`}>
        {icon}
      </div>
      <p className="text-xl sm:text-2xl font-bold text-white">{value}</p>
      <p className="text-slate-500 text-[10px] sm:text-xs mt-0.5 sm:mt-1 truncate">{label}</p>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

function ApplicationRow({ application, index }: { application: Application; index: number }) {
  const status = STATUS_CONFIG[application.status] || STATUS_CONFIG.PENDING;
  const StatusIcon = status.icon;
  const jobTitle = application.jobTitle || application.job?.title || "Unknown Position";
  const location = application.job?.location || "Remote";
  const appliedDate = new Date(application.createdAt).toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        href={`/candidates/dashboard/applications/${application.id}`}
        className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-white/[0.02] active:bg-white/[0.04] transition-colors group"
      >
        {/* Mobile: Icon and Title in row */}
        <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
          <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ${status.bgColor}`}>
            <StatusIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${status.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm sm:text-base text-white truncate group-hover:text-violet-300 transition-colors">
              {jobTitle}
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Building className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">Fluenzy AI</span>
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{location}</span>
              </span>
            </div>
          </div>
        </div>
        
        {/* Status and Date */}
        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pl-12 sm:pl-0">
          <div className="flex flex-col items-start sm:items-end gap-1">
            <span className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${status.bgColor} ${status.color}`}>
              {status.label}
            </span>
            <p className="text-[10px] sm:text-xs text-slate-500">{appliedDate}</p>
          </div>
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 group-hover:text-violet-400 transition-colors flex-shrink-0" />
        </div>
      </Link>
    </motion.div>
  );
}

function JobCard({ job }: { job: RecommendedJob }) {
  return (
    <Link
      href={`/careers/${job.slug}`}
      className="block p-3 sm:p-4 rounded-lg sm:rounded-xl bg-white/[0.02] border border-white/5 hover:border-violet-500/30 hover:bg-white/[0.03] active:bg-white/[0.05] transition-all group"
    >
      <h4 className="font-medium text-sm sm:text-base text-white truncate group-hover:text-violet-300 transition-colors">
        {job.title}
      </h4>
      <p className="text-xs text-slate-500 mt-1 truncate">{job.department}</p>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 sm:mt-3 text-[10px] sm:text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{job.location}</span>
        </span>
        {job.salaryRange && (
          <span className="flex items-center gap-1">
            <IndianRupee className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{job.salaryRange}</span>
          </span>
        )}
      </div>
      <div className="flex items-center justify-between mt-3 sm:mt-4 gap-2">
        <span className="text-[10px] sm:text-xs px-2 py-0.5 sm:py-1 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 truncate">
          {job.employmentType?.replace("_", " ")}
        </span>
        <span className="text-xs text-violet-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          Apply
          <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="w-full sm:w-auto">
          <div className="h-7 sm:h-8 bg-white/5 rounded-xl w-48 sm:w-64 mb-2" />
          <div className="h-4 bg-white/5 rounded-lg w-36 sm:w-48" />
        </div>
        <div className="h-10 sm:h-12 bg-white/5 rounded-xl w-full sm:w-32" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 sm:h-28 bg-white/5 rounded-xl sm:rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6 order-2 lg:order-1">
          <div className="h-64 sm:h-80 bg-white/5 rounded-xl sm:rounded-2xl" />
          <div className="h-32 sm:h-40 bg-white/5 rounded-xl sm:rounded-2xl" />
        </div>
        <div className="space-y-4 sm:space-y-6 order-1 lg:order-2">
          <div className="h-32 sm:h-40 bg-white/5 rounded-xl sm:rounded-2xl" />
          <div className="h-40 sm:h-48 bg-white/5 rounded-xl sm:rounded-2xl" />
          <div className="h-40 sm:h-48 bg-white/5 rounded-xl sm:rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
