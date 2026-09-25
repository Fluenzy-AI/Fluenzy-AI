"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Search,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  ClipboardList,
  Code,
  Mic,
  Video,
  Users,
  Calendar,
  Timer,
  Target,
  Building2,
  Briefcase,
  Play,
  Eye,
  Award,
  TrendingUp,
  Loader2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import HeaderOffset from "@/components/HeaderOffset";
import MobileNavShell from "@/components/MobileNavShell";
import { useTheme, themeConfig } from "@/contexts/ThemeContext";

interface Assessment {
  id: string;
  sessionToken: string;
  status: string;
  score: number | null;
  passed: boolean | null;
  assignedAt: string;
  expiresAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  assessment: {
    id: string;
    title: string;
    description: string | null;
    type: string;
    duration: number;
    passingScore: number;
    questionsCount: number;
  };
  company: {
    id: string;
    name: string;
    logo: string | null;
  };
  job: {
    id: string;
    title: string;
  };
}

interface Stats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  expired: number;
}

const assessmentTypeIcons: Record<string, any> = {
  MCQ: ClipboardList,
  CODING: Code,
  AI_INTERVIEW: Mic,
  VOICE: Video,
  GD: Users,
};

const assessmentTypeLabels: Record<string, string> = {
  MCQ: "Multiple Choice",
  CODING: "Coding Challenge",
  AI_INTERVIEW: "AI Interview",
  VOICE: "Voice Interview",
  GD: "Group Discussion",
};

/* ── Mobile breakpoint detection (≤ 640 px) ── */
function useMobileBreakpoint() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isMobile;
}

/* ── Assessments Content Component (Theme Aware) ── */
function AssessmentsContent({ isMobile }: { isMobile: boolean }) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const currentTheme = themeConfig[resolvedTheme] || themeConfig.dark;

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    expired: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  const fetchAssessments = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/candidates/assessments");
      if (res.ok) {
        const data = await res.json();
        if (data.assessments?.length) {
          setAssessments(data.assessments);
          setStats(data.stats);
          return;
        }
      }

      // Default mock data if no company assigned assessment yet
      const defaultAssessments: Assessment[] = [
        {
          id: "ass1",
          sessionToken: "st-mcq-101",
          status: "PENDING",
          score: null,
          passed: null,
          assignedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          startedAt: null,
          completedAt: null,
          assessment: {
            id: "a1",
            title: "Frontend & React System Assessment",
            description: "Core React hooks, state management, and web performance MCQ evaluation.",
            type: "MCQ",
            duration: 30,
            passingScore: 75,
            questionsCount: 20,
          },
          company: {
            id: "c1",
            name: "Tech Corp",
            logo: null,
          },
          job: {
            id: "j1",
            title: "Senior Frontend Engineer",
          },
        },
        {
          id: "ass2",
          sessionToken: "st-coding-102",
          status: "IN_PROGRESS",
          score: null,
          passed: null,
          assignedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          expiresAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          startedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          completedAt: null,
          assessment: {
            id: "a2",
            title: "Data Structures & Algorithms Challenge",
            description: "2 algorithmic problem-solving challenges in Python / C++ / Java.",
            type: "CODING",
            duration: 60,
            passingScore: 80,
            questionsCount: 2,
          },
          company: {
            id: "c2",
            name: "FinTech Global",
            logo: null,
          },
          job: {
            id: "j2",
            title: "Full Stack Engineer",
          },
        },
        {
          id: "ass3",
          sessionToken: "st-completed-103",
          status: "COMPLETED",
          score: 92,
          passed: true,
          assignedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          expiresAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          startedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          assessment: {
            id: "a3",
            title: "AI Behavioral & Technical Interview",
            description: "AI-conducted 1-on-1 interview for problem solving and communication.",
            type: "AI_INTERVIEW",
            duration: 45,
            passingScore: 70,
            questionsCount: 5,
          },
          company: {
            id: "c3",
            name: "Innovate Labs",
            logo: null,
          },
          job: {
            id: "j3",
            title: "Software Engineer",
          },
        },
      ];

      setAssessments(defaultAssessments);
      setStats({
        total: 3,
        pending: 1,
        inProgress: 1,
        completed: 1,
        expired: 0,
      });
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  const filteredAssessments = assessments.filter((item) => {
    const matchesSearch =
      item.assessment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.job.title.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === "all" ||
      item.status === filterStatus ||
      (filterStatus === "PENDING" && (item.status === "PENDING" || item.status === "INVITED"));

    const matchesType = filterType === "all" || item.assessment.type === filterType;

    return matchesSearch && matchesStatus && matchesType;
  });

  const handleStartAssessment = (sessionToken: string) => {
    router.push(`/candidate/assessment/${sessionToken}`);
  };

  const handleViewResult = (sessionToken: string) => {
    router.push(`/candidate/assessment/${sessionToken}/result`);
  };

  const isExpiringSoon = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    const expiry = new Date(expiresAt);
    const now = new Date();
    const diffHours = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffHours > 0 && diffHours < 48;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const formatTimeRemaining = (expiresAt: string) => {
    const expiry = new Date(expiresAt);
    const now = new Date();
    const diffMs = expiry.getTime() - now.getTime();

    if (diffMs <= 0) return "Expired";

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d left`;
    if (diffHours > 0) return `${diffHours}h left`;
    return "< 1h left";
  };

  return (
    <div className={`space-y-6 ${isMobile ? "pb-12" : ""}`}>
      {/* Header */}
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shrink-0">
          <Award className="w-6 h-6" />
        </div>
        <div>
          <h1 className={`text-2xl font-black tracking-tight ${currentTheme.text}`}>
            My Assessments
          </h1>
          <p className={`text-xs ${currentTheme.textMuted} mt-0.5`}>
            Company-assigned evaluations, coding challenges & AI skill interviews
          </p>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Total", value: stats.total, icon: FileText, color: "text-blue-400", bg: "bg-blue-500/10" },
          { label: "Pending", value: stats.pending, icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10" },
          { label: "In Progress", value: stats.inProgress, icon: Play, color: "text-purple-400", bg: "bg-purple-500/10" },
          { label: "Completed", value: stats.completed, icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Expired", value: stats.expired, icon: XCircle, color: "text-red-400", bg: "bg-red-500/10" },
        ].map((st, i) => (
          <div
            key={st.label}
            className={`p-3.5 rounded-2xl border ${currentTheme.cardBg} ${currentTheme.cardBorder} flex items-center gap-3 shadow-md`}
          >
            <div className={`w-9 h-9 rounded-xl ${st.bg} flex items-center justify-center shrink-0`}>
              <st.icon className={`w-4 h-4 ${st.color}`} />
            </div>
            <div>
              <p className={`text-xl font-black ${currentTheme.text}`}>{st.value}</p>
              <p className={`text-[10px] font-bold ${currentTheme.textMuted}`}>{st.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
          <Input
            placeholder="Search by assessment, job or company…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`pl-9 text-xs rounded-xl ${currentTheme.cardBg} border ${currentTheme.cardBorder} ${currentTheme.text} placeholder:opacity-50`}
          />
        </div>

        <div className="flex gap-2.5">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={`flex-1 sm:flex-none rounded-xl ${currentTheme.cardBg} border ${currentTheme.cardBorder} ${currentTheme.text} text-xs font-bold px-3 py-2.5 cursor-pointer`}
          >
            <option value="all">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="EXPIRED">Expired</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className={`flex-1 sm:flex-none rounded-xl ${currentTheme.cardBg} border ${currentTheme.cardBorder} ${currentTheme.text} text-xs font-bold px-3 py-2.5 cursor-pointer`}
          >
            <option value="all">All Types</option>
            <option value="MCQ">Multiple Choice</option>
            <option value="CODING">Coding Challenge</option>
            <option value="AI_INTERVIEW">AI Interview</option>
            <option value="VOICE">Voice Interview</option>
            <option value="GD">Group Discussion</option>
          </select>
        </div>
      </div>

      {/* Assessments List */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      ) : filteredAssessments.length === 0 ? (
        <div className={`text-center py-16 px-4 rounded-2xl border ${currentTheme.cardBg} ${currentTheme.cardBorder}`}>
          <Award className="w-12 h-12 mx-auto opacity-40 mb-3" />
          <h3 className={`text-sm font-bold ${currentTheme.text}`}>No Assessments Found</h3>
          <p className={`text-xs ${currentTheme.textMuted} mt-1 max-w-sm mx-auto`}>
            No company assessments match your criteria right now. Apply to jobs to receive assessment invitations.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAssessments.map((item, index) => {
            const TypeIcon = assessmentTypeIcons[item.assessment.type] || FileText;
            const expiringSoon = isExpiringSoon(item.expiresAt);
            const canStart = item.status === "PENDING" || item.status === "INVITED" || item.status === "IN_PROGRESS";
            const isCompleted = item.status === "COMPLETED";

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-5 rounded-2xl border ${currentTheme.cardBg} ${
                  expiringSoon && canStart
                    ? "border-amber-500/40"
                    : currentTheme.cardBorder
                } hover:border-purple-500/30 transition-all shadow-lg space-y-4`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    {/* Company Logo or Icon */}
                    <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-purple-400" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`text-sm font-black ${currentTheme.text}`}>
                          {item.assessment.title}
                        </h3>
                        <Badge
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 ${
                            item.status === "COMPLETED"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : item.status === "IN_PROGRESS"
                              ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          }`}
                        >
                          {item.status.replace("_", " ")}
                        </Badge>
                        {expiringSoon && canStart && (
                          <Badge className="bg-amber-500/20 text-amber-400 text-[10px] font-bold">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Expiring Soon
                          </Badge>
                        )}
                      </div>

                      <p className={`text-xs ${currentTheme.textMuted} mt-0.5`}>
                        {item.company.name} • {item.job.title}
                      </p>

                      {/* Details row */}
                      <div className="flex flex-wrap gap-3 mt-2.5 text-[11px] font-semibold text-slate-400">
                        <div className="flex items-center gap-1">
                          <TypeIcon className="w-3.5 h-3.5 text-purple-400" />
                          <span>{assessmentTypeLabels[item.assessment.type]}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Timer className="w-3.5 h-3.5 opacity-60" />
                          <span>{item.assessment.duration} min</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Target className="w-3.5 h-3.5 opacity-60" />
                          <span>Pass {item.assessment.passingScore}%</span>
                        </div>
                        {item.expiresAt && canStart && (
                          <div className={`flex items-center gap-1 ${expiringSoon ? "text-amber-400" : ""}`}>
                            <Clock className="w-3.5 h-3.5" />
                            <span>{formatTimeRemaining(item.expiresAt)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                    {canStart && (
                      <Button
                        onClick={() => handleStartAssessment(item.sessionToken)}
                        className="h-10 px-5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold gap-2 border-none shadow-md"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{item.status === "IN_PROGRESS" ? "Continue" : "Start Assessment"}</span>
                      </Button>
                    )}
                    {isCompleted && (
                      <Button
                        variant="outline"
                        onClick={() => handleViewResult(item.sessionToken)}
                        className="h-10 px-5 rounded-full border-white/10 text-xs font-bold gap-2"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Result</span>
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Main MyAssessmentsPage Component ── */
export default function MyAssessmentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const currentTheme = themeConfig[resolvedTheme] || themeConfig.dark;
  const isMobile = useMobileBreakpoint();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (isMobile === null) return null;

  // Mobile View (< 640px): wrapped in MobileNavShell with fixed bottom nav & header
  if (isMobile) {
    return (
      <MobileNavShell activeHref="/train">
        <div className="p-4 pt-3">
          <AssessmentsContent isMobile={true} />
        </div>
      </MobileNavShell>
    );
  }

  // Desktop View (≥ 640px): wider grid layout with HeaderOffset
  return (
    <div className={`min-h-screen ${currentTheme.background} transition-colors duration-300`}>
      <HeaderOffset />
      <div className="max-w-5xl mx-auto px-6 py-8">
        <AssessmentsContent isMobile={false} />
      </div>
    </div>
  );
}
