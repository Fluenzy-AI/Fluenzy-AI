"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  History as HistoryIcon,
  Search,
  Filter,
  Calendar,
  Clock,
  Trophy,
  Building2,
  ChevronRight,
  Download,
  X,
  MessageSquare,
  ShieldCheck,
  Zap,
  Award,
  Trash2,
  BarChart2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileText,
  SlidersHorizontal,
  ArrowUpRight,
  Target,
  User,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import HeaderOffset from "@/components/HeaderOffset";
import MobileNavShell from "@/components/MobileNavShell";
import { useTheme, themeConfig } from "@/contexts/ThemeContext";

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

/* ── Fallback Demo Sessions ── */
const DEMO_SESSIONS = [
  {
    sessionId: "S_1711200001",
    id: "S_1711200001",
    module: "Interview AI",
    targetCompany: "Stripe",
    role: "Senior Full Stack Engineer",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    startTime: new Date(Date.now() - 86400000 * 2).toISOString(),
    endTime: new Date(Date.now() - 86400000 * 2 + 1800000).toISOString(),
    durationMinutes: 30,
    aggregateScore: 0.88,
    status: "PASS",
    transcripts: [
      {
        turnNumber: 1,
        aiPrompt: "Welcome! Tell me about a time you had to redesign a core architecture for high availability under heavy load.",
        userAnswer: "At my previous company, our real-time notification service struggled to handle peak traffic bursts of 50k requests/second. I led the migration from a synchronous queue to an asynchronous Kafka + Redis Pub/Sub model with distributed worker pools in Node.js.",
        aiFeedback: "Excellent STAR structure with clear quantitative metrics and strong technical depth.",
        idealAnswer: "Strong technical answer. To make it even better, briefly touch upon failure recovery mechanisms.",
        scores: { clarity: 90, relevance: 92, grammar: 88, confidence: 85, technicalAccuracy: 95 },
        perQuestionScore: 90
      },
      {
        turnNumber: 2,
        aiPrompt: "How do you approach database schema migrations in zero-downtime environments?",
        userAnswer: "I use expanding and contracting schema migrations. First, we add new columns or tables in a backwards-compatible manner, deploy the code that writes to both old and new schemas, backfill legacy data async, and finally deprecate the old columns.",
        aiFeedback: "Clear understanding of blue-green database migration patterns.",
        idealAnswer: "Spot on! Mentioning feature flags for instant rollback capability adds extra polish.",
        scores: { clarity: 88, relevance: 90, grammar: 86, confidence: 88, technicalAccuracy: 92 },
        perQuestionScore: 89
      }
    ]
  },
  {
    sessionId: "S_1711200002",
    id: "S_1711200002",
    module: "GD Agent",
    targetCompany: "Google",
    role: "AI Ethics & Governance Discussion",
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    startTime: new Date(Date.now() - 86400000 * 5).toISOString(),
    endTime: new Date(Date.now() - 86400000 * 5 + 1200000).toISOString(),
    durationMinutes: 20,
    aggregateScore: 0.76,
    status: "PASS",
    transcripts: [
      {
        turnNumber: 1,
        aiPrompt: "Moderator: Let's discuss whether AI models should be regulated at the foundational level or application level.",
        userAnswer: "I believe regulation should target both, but with different mandates. Foundational models require transparency in training data, while application-level rules should govern consumer privacy and bias mitigation.",
        aiFeedback: "Good opening assertion. Balanced perspective on governance frameworks.",
        idealAnswer: "Great point. Strengthen your turn by explicitly inviting other participants to elaborate.",
        scores: { clarity: 80, relevance: 82, grammar: 85, confidence: 78, technicalAccuracy: 80 },
        perQuestionScore: 81
      }
    ]
  },
  {
    sessionId: "S_1711200003",
    id: "S_1711200003",
    module: "ATS Audit",
    targetCompany: "Microsoft",
    role: "Lead Cloud Architect",
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    startTime: new Date(Date.now() - 86400000 * 7).toISOString(),
    endTime: new Date(Date.now() - 86400000 * 7 + 300000).toISOString(),
    durationMinutes: 5,
    aggregateScore: 0.92,
    status: "PASS",
    transcripts: [
      {
        turnNumber: 1,
        aiPrompt: "ATS Resume Analysis Completed. Key matches: Azure, Kubernetes, Terraform, Microservices.",
        userAnswer: "Resume parsed successfully. 92% Keyword match with Senior Cloud Architect specifications.",
        aiFeedback: "High ATS compatibility. Strong alignment with cloud infrastructure keywords.",
        idealAnswer: "Add quantified impact metrics to your experience section bullet points.",
        scores: { clarity: 95, relevance: 94, grammar: 92, confidence: 90, technicalAccuracy: 95 },
        perQuestionScore: 93
      }
    ]
  }
];

/* ── Session Detail Modal Component ── */
function SessionDetailModal({
  session,
  onClose,
}: {
  session: any;
  onClose: () => void;
}) {
  const { resolvedTheme } = useTheme();
  const currentTheme = themeConfig[resolvedTheme] || themeConfig.dark;

  const scorePct = Math.round(
    typeof session.aggregateScore === "number"
      ? session.aggregateScore * 100
      : typeof session.score === "number"
      ? session.score
      : 80
  );

  const isPassed = scorePct >= 70;

  const handleDownloadPDF = () => {
    window.open(`/api/generate-pdf?sessionId=${session.sessionId || session.id}&format=pdf`, "_blank");
  };

  const transcripts = session.transcripts || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className={`w-full max-w-4xl rounded-2xl md:rounded-3xl ${currentTheme.cardBg} border ${currentTheme.cardBorder} shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col`}>
        {/* Modal Header */}
        <div className="px-5 md:px-6 py-4 border-b border-white/10 flex items-center justify-between gap-4 shrink-0 bg-slate-900/50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white flex-shrink-0 shadow-md">
              <Building2 size={20} />
            </div>
            <div className="min-w-0">
              <h2 className={`text-base md:text-lg font-bold ${currentTheme.text} truncate`}>
                {session.targetCompany || session.company || "General Practice"}{" "}
                <span className="text-slate-500 font-normal">—</span>{" "}
                <span className="text-blue-400">{session.role || session.module || "Session Audit"}</span>
              </h2>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {new Date(session.createdAt || session.startTime || Date.now()).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {session.durationMinutes ? `${session.durationMinutes} mins` : "15 mins"}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 md:p-6 space-y-6 overflow-y-auto flex-1">
          {/* Summary Stat Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3.5 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Score</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-white">{scorePct}%</span>
                <span className="text-xs text-slate-500">/ 100</span>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3.5 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Status</span>
              <div className="mt-1">
                <Badge className={isPassed ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-rose-500/15 text-rose-400 border-rose-500/30"}>
                  {isPassed ? "Passed" : "Needs Practice"}
                </Badge>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3.5 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Module</span>
              <span className="text-sm font-bold text-white mt-1 truncate">{session.module || "Interview AI"}</span>
            </div>

            <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3.5 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Turn Prompts</span>
              <span className="text-2xl font-black text-white mt-1">{transcripts.length || 2}</span>
            </div>
          </div>

          {/* Conversation Log */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquare size={16} className="text-blue-400" />
              <h3 className={`text-sm md:text-base font-bold ${currentTheme.text}`}>Session Conversation Transcript</h3>
            </div>

            {transcripts.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No turn transcripts recorded for this session.</p>
            ) : (
              <div className="space-y-4">
                {transcripts.map((turn: any, index: number) => (
                  <div key={index} className="rounded-xl border border-white/10 bg-slate-950/40 p-4 space-y-3">
                    {/* AI Question */}
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400">AI Prompt #{turn.turnNumber || index + 1}</span>
                      <p className="text-xs md:text-sm text-slate-200 leading-relaxed font-medium">
                        {turn.aiPrompt || turn.text || "Interview prompt"}
                      </p>
                    </div>

                    {/* Candidate Answer */}
                    {(turn.userAnswer || turn.speaker?.includes("You")) && (
                      <div className="pl-3 border-l-2 border-cyan-500 space-y-1 bg-cyan-500/5 p-2.5 rounded-r-lg">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-300">Your Response</span>
                        <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                          {turn.userAnswer || turn.text}
                        </p>
                      </div>
                    )}

                    {/* Feedback & Improvement */}
                    {turn.aiFeedback && (
                      <div className="flex items-start gap-2 text-xs text-emerald-300 bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20">
                        <CheckCircle2 size={14} className="shrink-0 mt-0.5 text-emerald-400" />
                        <div>
                          <span className="font-semibold uppercase tracking-wider text-[10px] block text-emerald-400">Feedback</span>
                          <p>{turn.aiFeedback}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 md:px-6 py-3.5 border-t border-white/10 bg-slate-900/60 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Encrypted Audit History</span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose} className="h-9 text-xs rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10">
              Close
            </Button>
            <Button onClick={handleDownloadPDF} className="h-9 text-xs rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold">
              <Download size={13} className="mr-1.5" />
              Download Audit PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main History Content ── */
function HistoryContent({ isMobile }: { isMobile: boolean }) {
  const { data: session } = useSession();
  const { resolvedTheme } = useTheme();
  const currentTheme = themeConfig[resolvedTheme] || themeConfig.dark;

  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [selectedModule, setSelectedModule] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const fetchSessions = useCallback(async () => {
    try {
      const response = await fetch("/api/sessions");
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setSessions(data);
        } else {
          setSessions(DEMO_SESSIONS);
        }
      } else {
        setSessions(DEMO_SESSIONS);
      }
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
      setSessions(DEMO_SESSIONS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const company = (s.targetCompany || s.company || "").toLowerCase();
      const role = (s.role || "").toLowerCase();
      const mod = (s.module || "").toLowerCase();
      const q = searchQuery.toLowerCase();

      const matchesSearch = !q || company.includes(q) || role.includes(q) || mod.includes(q);

      const matchesModule =
        selectedModule === "All" ||
        (s.module || "").toLowerCase().includes(selectedModule.toLowerCase());

      const scorePct = Math.round(
        typeof s.aggregateScore === "number"
          ? s.aggregateScore * 100
          : typeof s.score === "number"
          ? s.score
          : 80
      );

      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Passed" && scorePct >= 70) ||
        (statusFilter === "Needs Practice" && scorePct < 70);

      return matchesSearch && matchesModule && matchesStatus;
    });
  }, [sessions, searchQuery, selectedModule, statusFilter]);

  const totalSessions = sessions.length;
  const passedCount = sessions.filter((s) => {
    const sc = typeof s.aggregateScore === "number" ? s.aggregateScore * 100 : s.score || 80;
    return sc >= 70;
  }).length;

  const avgScore = totalSessions
    ? Math.round(
        sessions.reduce((acc, s) => {
          const sc = typeof s.aggregateScore === "number" ? s.aggregateScore * 100 : s.score || 80;
          return acc + sc;
        }, 0) / totalSessions
      )
    : 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Loading Practice History...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl md:text-3xl font-black tracking-tight ${currentTheme.text} flex items-center gap-2.5`}>
            <HistoryIcon className="text-blue-500 h-7 w-7" />
            Session Archives & History
          </h1>
          <p className={`text-xs md:text-sm ${currentTheme.textMuted} mt-1`}>
            Revisit transcript audits, feedback metrics, and interview practice logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={fetchSessions}
            className="h-9 text-xs rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300"
          >
            <RefreshCw size={13} className="mr-1.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <Card className={`overflow-hidden border ${currentTheme.cardBorder} ${currentTheme.cardBg}`}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <BarChart2 size={20} />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">Total Sessions</span>
              <span className={`text-xl font-bold ${currentTheme.text}`}>{totalSessions} Completed</span>
            </div>
          </CardContent>
        </Card>

        <Card className={`overflow-hidden border ${currentTheme.cardBorder} ${currentTheme.cardBg}`}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Trophy size={20} />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">Pass Rate</span>
              <span className={`text-xl font-bold ${currentTheme.text}`}>
                {passedCount} / {totalSessions} ({totalSessions ? Math.round((passedCount / totalSessions) * 100) : 0}%)
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className={`overflow-hidden border ${currentTheme.cardBorder} ${currentTheme.cardBg}`}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
              <Zap size={20} />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">Average Score</span>
              <span className={`text-xl font-bold ${currentTheme.text}`}>{avgScore}% Aggregate</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className={`border ${currentTheme.cardBorder} ${currentTheme.cardBg}`}>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by role, company, or module..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 rounded-xl bg-slate-900/60 border-white/10 text-xs text-white placeholder:text-slate-500 focus-visible:ring-blue-500/40"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {["All", "Passed", "Needs Practice"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                    statusFilter === st
                      ? "bg-blue-600 text-white border-blue-500"
                      : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Module Tabs */}
          <div className="flex items-center gap-2 pt-2 border-t border-white/10 overflow-x-auto">
            {["All", "Interview AI", "GD Agent", "ATS Audit", "HR Prep"].map((mod) => (
              <button
                key={mod}
                onClick={() => setSelectedModule(mod)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                  selectedModule === mod
                    ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white border-transparent shadow"
                    : "bg-slate-900/40 border-white/10 text-slate-400 hover:text-white"
                }`}
              >
                {mod}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sessions Grid */}
      {filteredSessions.length === 0 ? (
        <Card className={`border ${currentTheme.cardBorder} ${currentTheme.cardBg} text-center py-12 p-6`}>
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 mx-auto flex items-center justify-center text-slate-400 mb-3">
            <HistoryIcon size={24} />
          </div>
          <p className={`text-base font-bold ${currentTheme.text}`}>No Matching Sessions Found</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search keywords or active filters to view past practice sessions.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSessions.map((rec) => {
            const scorePct = Math.round(
              typeof rec.aggregateScore === "number"
                ? rec.aggregateScore * 100
                : typeof rec.score === "number"
                ? rec.score
                : 80
            );

            const isPassed = scorePct >= 70;
            const formattedDate = new Date(rec.createdAt || rec.startTime || Date.now()).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });

            return (
              <div
                key={rec.sessionId || rec.id}
                onClick={() => setSelectedSession(rec)}
                className={`group rounded-2xl border ${currentTheme.cardBorder} ${currentTheme.cardBg} p-4 md:p-5 transition-all hover:border-blue-500/40 hover:shadow-xl cursor-pointer flex flex-col justify-between space-y-4`}
              >
                {/* Header */}
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md ${isPassed ? "bg-gradient-to-br from-emerald-600 to-teal-600" : "bg-gradient-to-br from-amber-600 to-rose-600"}`}>
                    <Building2 size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className={`font-bold text-sm ${currentTheme.text} truncate group-hover:text-blue-400 transition-colors`}>
                      {rec.targetCompany || rec.company || "General Session"}
                    </h3>
                    <p className="text-xs text-slate-400 truncate">{rec.role || rec.module || "Practice Round"}</p>
                  </div>
                </div>

                {/* Metrics */}
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Calendar size={12} />
                      <span>{formattedDate}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Clock size={12} />
                      <span>{rec.durationMinutes ? `${rec.durationMinutes} mins` : "15 mins"}</span>
                    </div>
                  </div>

                  {/* Circular Score Badge */}
                  <div className="relative w-12 h-12 flex items-center justify-center">
                    <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        className="text-slate-800"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeDasharray={`${scorePct}, 100`}
                        className={isPassed ? "text-emerald-400" : "text-amber-400"}
                      />
                    </svg>
                    <span className="absolute text-[11px] font-black text-white">{scorePct}%</span>
                  </div>
                </div>

                {/* Footer Tag & CTA */}
                <div className="flex items-center justify-between pt-2">
                  <Badge className={isPassed ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]" : "bg-amber-500/15 text-amber-400 border-amber-500/30 text-[10px]"}>
                    {isPassed ? "Passed" : "Needs Practice"}
                  </Badge>

                  <div className="w-7 h-7 rounded-lg border border-white/10 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <ChevronRight size={14} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Modal */}
      {selectedSession && (
        <SessionDetailModal session={selectedSession} onClose={() => setSelectedSession(null)} />
      )}
    </div>
  );
}

/* ── History Page Wrapper ── */
export default function HistoryPage() {
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

  if (status === "loading" || isMobile === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!session?.user) return null;

  // Mobile View (< 640px): wrapped in MobileNavShell
  if (isMobile) {
    return (
      <MobileNavShell activeHref="/history">
        <div className="p-4 pt-3 pb-24">
          <HistoryContent isMobile={true} />
        </div>
      </MobileNavShell>
    );
  }

  // Desktop View (≥ 640px): wider grid container with HeaderOffset
  return (
    <div className={`min-h-screen ${currentTheme.background} transition-colors duration-300`}>
      <HeaderOffset />
      <div className="max-w-6xl mx-auto px-6 py-8">
        <HistoryContent isMobile={false} />
      </div>
    </div>
  );
}