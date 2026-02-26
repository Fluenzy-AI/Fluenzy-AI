"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import HeaderOffset from "@/components/HeaderOffset";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  LineChart,
  Line,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  ReferenceLine,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  ClipboardList,
  Flame,
  Gauge,
  MessageSquare,
  Mic2,
  Sparkles,
  ShieldCheck,
  Target,
  Timer,
  TrendingUp,
} from "lucide-react";

interface AnalyticsResponse {
  summary: {
    communicationScore: number;
    confidenceScore: number;
    grammarScore: number;
    vocabularyScore: number;
    technicalScore: number;
    overallScore: number;
    overallStatus: string;
    totalQuestions: number;
    totalSessions: number;
    totalDurationMinutes: number;
    avgTimePerQuestion: number;
    totalCompanies: number;
    completionRate: number;
  };
  distributions: {
    company: Array<{ name: string; count: number }>;
    role: Array<{ name: string; count: number }>;
    module: Array<{ name: string; count: number }>;
  };
  trends: Array<{ date: string; communication: number; confidence: number; grammar: number; technical: number }>;
  activity: Array<{ date: string; count: number }>;
  insights: {
    mostPracticed: Array<{ name: string; count: number }>;
    leastPracticed: Array<{ name: string; count: number }>;
    commonGrammarIssues: string[];
    confidenceDropPercent: number;
    focusAreas: string[];
    tips: string[];
  };
  charts: {
    accuracyVsSpeed: Array<{ duration: number; score: number }>;
  };
  advanced: {
    behavioral: {
      eyeContactScore: number;
      postureScore: number;
      smileScore: number;
      stressLevel: number;
      engagementScore: number;
      bodyLanguageScore: number;
      timeline: Array<{ date: string; eyeContact: number; posture: number; stress: number; engagement: number }>;
      alerts: string[];
    };
    communication: {
      fillerRate: number;
      fillerWords: Array<{ word: string; count: number }>;
      speakingWpm: number;
      idealWpmRange: [number, number];
      speakingPaceScore: number;
      sentenceStructureScore: number;
      toneConsistency: number;
      hesitationIndex: number;
      confidenceTimeline: Array<{ turn: number; confidence: number }>;
      sessionConfidenceTrend: Array<{ date: string; confidence: number }>;
    };
    grammar: {
      categories: Array<{ label: string; count: number }>;
      errorFrequency: number;
      improvementVelocity: number;
      beforeAfter: { before: number; after: number };
    };
    confidence: {
      confidenceVsDifficulty: Array<{ difficulty: number; confidence: number }>;
      fatigueRiskPercent: number;
      confidenceVsAccuracyCorrelation: number;
      sessionTrend: Array<{ date: string; confidence: number }>;
      predictedVsActual: { predicted: number; actual: number };
    };
    questions: {
      difficultyDistribution: Array<{ label: string; count: number }>;
      accuracyByType: Array<{ type: string; accuracy: number }>;
      reattemptSuccessRate: number;
    };
    company: {
      readiness: Array<{ name: string; count: number; score: number; missingSkills: string[] }>;
      recommendations: string[];
      readinessTimelineWeeks: number | null;
    };
    coach: {
      readinessSummary: string;
      strengths: string[];
      weaknesses: string[];
      plan7Day: string[];
      nextSessionFocus: string;
    };
  };
}

const formatDuration = (minutes: number) => {
  if (!minutes) return "0m";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

const getStatusColor = (status: string) => {
  if (status === "Excellent") return "bg-emerald-500/20 text-emerald-200 border-emerald-500/40";
  if (status === "Good") return "bg-sky-500/20 text-sky-200 border-sky-500/40";
  return "bg-amber-500/20 text-amber-200 border-amber-500/40";
};

const ProgressRing = ({ value, label }: { value: number; label: string }) => {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(100, Math.max(0, value));
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="120" height="120" className="text-slate-700">
        <circle cx="60" cy="60" r={radius} stroke="currentColor" strokeWidth="10" fill="transparent" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          stroke="url(#ringGradient)"
          strokeWidth="10"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
        <text x="60" y="64" textAnchor="middle" className="fill-white text-xl font-semibold">
          {Math.round(progress)}
        </text>
      </svg>
      <span className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</span>
    </div>
  );
};

const Heatmap = ({ activity }: { activity: Array<{ date: string; count: number }> }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activityMap = useMemo(() => new Map(activity.map((item) => [item.date, item.count])), [activity]);
  const today = new Date();
  const days: Array<{ date: string; count: number; dayOfWeek: number; weekIndex: number; month: string }> = [];
  
  // Generate full year of data (52 weeks = 364 days)
  for (let i = 363; i >= 0; i -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const key = date.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    const dayOfWeek = (date.getDay() + 6) % 7; // Monday = 0, Sunday = 6
    const weekIndex = Math.floor((363 - i) / 7);
    const month = date.toLocaleDateString("en-US", { month: "short" });
    days.push({ date: key, count: activityMap.get(key) || 0, dayOfWeek, weekIndex, month });
  }
  
  const max = Math.max(1, ...days.map((d) => d.count));
  const weeks = 52;
  
  // GitHub-style emerald/green gradient
  const getColor = (intensity: number) => {
    if (intensity === 0) return "bg-slate-800/20";
    if (intensity > 0.75) return "bg-emerald-500";
    if (intensity > 0.5) return "bg-emerald-600";
    if (intensity > 0.25) return "bg-emerald-700/80";
    return "bg-emerald-800/60";
  };
  
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  // Get month positions for labels
  const monthPositions: Array<{ month: string; weekIndex: number }> = [];
  let lastMonth = '';
  days.forEach((day) => {
    if (day.month !== lastMonth && day.dayOfWeek === 0) {
      monthPositions.push({ month: day.month, weekIndex: day.weekIndex });
      lastMonth = day.month;
    }
  });
  
  return (
    <div ref={containerRef} className="h-full w-full flex flex-col gap-3">
      {/* Header with legend */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
          <Flame size={14} className="text-emerald-400" />
          <span>Last year activity</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Less</span>
          <div className="flex gap-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-slate-800/20"></div>
            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-800/60"></div>
            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-700/80"></div>
            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-600"></div>
            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></div>
          </div>
          <span className="text-xs text-slate-500">More</span>
        </div>
      </div>
      
      {/* Month labels */}
      <div className="flex pl-12 relative" style={{ height: '12px' }}>
        {monthPositions.map(({ month, weekIndex }) => (
          <div 
            key={`${month}-${weekIndex}`}
            className="absolute text-[10px] text-slate-500 font-medium"
            style={{ left: `${48 + weekIndex * 12}px` }}
          >
            {month}
          </div>
        ))}
      </div>
      
      {/* Heatmap grid - horizontal */}
      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-[3px] text-[9px] text-slate-500 font-medium justify-center pr-1 w-10 text-right">
          {dayLabels.map((label, i) => (
            <div key={i} className="h-[10px] flex items-center justify-end" style={{ opacity: i % 2 === 0 ? 1 : 0 }}>
              {label}
            </div>
          ))}
        </div>
        
        {/* Activity grid - weeks horizontally, days vertically */}
        <div className="flex gap-[3px] overflow-x-auto">
          {Array.from({ length: weeks }).map((_, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-[3px]">
              {Array.from({ length: 7 }).map((_, dayIndex) => {
                const dayData = days.find(d => d.weekIndex === weekIndex && d.dayOfWeek === dayIndex);
                if (!dayData) return <div key={dayIndex} className="w-[10px] h-[10px]" />;
                
                const intensity = dayData.count / max;
                const color = getColor(intensity);
                
                return (
                  <div
                    key={dayIndex}
                    className={`w-[10px] h-[10px] rounded-sm ${color} transition-all duration-200 hover:scale-125 hover:ring-2 hover:ring-emerald-400 cursor-pointer`}
                    title={`${dayData.date}: ${dayData.count} activities`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      
      {/* Stats summary */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
            <span className="text-slate-400">Total: <span className="text-white font-semibold">{activity.reduce((sum, d) => sum + d.count, 0)}</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
            <span className="text-slate-400">Avg/week: <span className="text-white font-semibold">{Math.round(activity.reduce((sum, d) => sum + d.count, 0) / 52)}</span></span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          <span className="text-orange-400">🔥</span>
          <span>Current streak: <span className="text-emerald-400 font-semibold">{activity.slice(-7).filter(d => d.count > 0).length} days</span></span>
        </div>
      </div>
    </div>
  );
};

export default function AnalyticsDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/analytics");
        if (res.ok) {
          setData(await res.json());
        }
      } finally {
        setLoading(false);
      }
    };
    if (status === "authenticated") {
      load();
    }
  }, [status]);

  if (loading) {
    return <div className="container mx-auto px-4 py-12">Loading analytics...</div>;
  }

  if (!session?.user || !data) {
    return <div className="container mx-auto px-4 py-12">No analytics data available yet.</div>;
  }

  const { summary, distributions, trends, activity, insights, charts, advanced } = data;
  const handleExport = () => {
    window.open("/analytics/report?print=1", "_blank", "noopener,noreferrer");
  };
  const focusLabel = advanced.coach.nextSessionFocus || "Focused Practice";
  const wpmLow = advanced.communication.idealWpmRange[0];
  const wpmHigh = advanced.communication.idealWpmRange[1];

  return (
    <div className="overflow-x-hidden">
      <HeaderOffset />
      <div className="container mx-auto px-4 pb-12 space-y-10">
      {/* Header Section - Premium Oceanic Design */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-cyan-600/10 rounded-3xl blur-xl"></div>
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 p-8 rounded-3xl bg-gradient-to-br from-slate-900/40 to-slate-900/60 backdrop-blur-xl border border-white/10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <BarChart3 className="text-white" size={20} />
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Analytics Dashboard</h1>
            </div>
            <p className="text-sm text-slate-400 font-medium leading-relaxed ml-13">Your communication-first performance report with clear next steps.</p>
          </div>
          <Badge variant="outline" className={`border px-4 py-2 text-sm font-bold shadow-lg ${getStatusColor(summary.overallStatus)}`}>
            <Sparkles size={14} className="mr-2" />
            {summary.overallStatus}
          </Badge>
        </div>
      </div>

      {/* Sticky Summary Bar - Premium Glassmorphism */}
      <div className="sticky top-20 z-40 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/90 to-slate-950/90 backdrop-blur-2xl p-6 shadow-2xl shadow-blue-500/5 hover:shadow-blue-500/10 transition-all duration-300">
        <div className="grid gap-4 md:grid-cols-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              Overall Score
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help text-slate-500">ⓘ</span>
                </TooltipTrigger>
                <TooltipContent>Composite performance across communication, confidence, grammar, vocabulary, and technical accuracy.</TooltipContent>
              </Tooltip>
            </div>
            <p className="text-xl font-semibold text-white">{Math.round(summary.overallScore)}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              Communication
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help text-slate-500">ⓘ</span>
                </TooltipTrigger>
                <TooltipContent>Fluency, clarity, and structure combined.</TooltipContent>
              </Tooltip>
            </div>
            <p className="text-xl font-semibold text-white">{Math.round(summary.communicationScore)}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              Confidence
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help text-slate-500">ⓘ</span>
                </TooltipTrigger>
                <TooltipContent>Consistency and control across responses.</TooltipContent>
              </Tooltip>
            </div>
            <p className="text-xl font-semibold text-white">{Math.round(summary.confidenceScore)}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              Grammar
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help text-slate-500">ⓘ</span>
                </TooltipTrigger>
                <TooltipContent>Accuracy and correction frequency.</TooltipContent>
              </Tooltip>
            </div>
            <p className="text-xl font-semibold text-white">{Math.round(summary.grammarScore)}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              Speaking Pace
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help text-slate-500">ⓘ</span>
                </TooltipTrigger>
                <TooltipContent>Words per minute versus ideal range.</TooltipContent>
              </Tooltip>
            </div>
            <p className="text-xl font-semibold text-white">{advanced.communication.speakingWpm} WPM</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-400">Ideal speaking pace: {wpmLow}-{wpmHigh} WPM</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleExport}>Export PDF</Button>
            <Button className="bg-emerald-500/90 text-slate-950 hover:bg-emerald-500" onClick={() => router.push("/train")}>Focus: {focusLabel}</Button>
          </div>
        </div>
      </div>

      {/* AI Video Analysis Section */}
      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="border-white/10 bg-gradient-to-br from-slate-900/60 to-slate-900/40 backdrop-blur-xl lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                <Activity className="h-4 w-4 text-white" />
              </div>
              AI Video Analysis: Body Language Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={advanced.behavioral.timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                <ChartTooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b" }} />
                <Line type="monotone" dataKey="eyeContact" stroke="#22d3ee" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="posture" stroke="#60a5fa" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="engagement" stroke="#34d399" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="stress" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-gradient-to-br from-slate-900/60 to-slate-900/40 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-300">Body Language Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between"><span className="text-slate-400">Overall Body Language</span><span className="text-white font-semibold">{advanced.behavioral.bodyLanguageScore}%</span></div>
            <div className="flex items-center justify-between"><span className="text-slate-400">Eye Contact</span><span className="text-white font-semibold">{advanced.behavioral.eyeContactScore}%</span></div>
            <div className="flex items-center justify-between"><span className="text-slate-400">Posture</span><span className="text-white font-semibold">{advanced.behavioral.postureScore}%</span></div>
            <div className="flex items-center justify-between"><span className="text-slate-400">Smile/Expression</span><span className="text-white font-semibold">{advanced.behavioral.smileScore}%</span></div>
            <div className="flex items-center justify-between"><span className="text-slate-400">Stress Level</span><span className="text-white font-semibold">{advanced.behavioral.stressLevel}%</span></div>
            <Separator className="bg-slate-800" />
            <div className="space-y-2">
              {advanced.behavioral.alerts.slice(0, 2).map((alert) => (
                <Badge key={alert} variant="outline" className="border-amber-500/40 text-amber-200">
                  {alert}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Communication Skills & Progress Section */}
      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="border-white/10 bg-gradient-to-br from-slate-900/60 to-slate-900/40 backdrop-blur-xl lg:col-span-1 hover:shadow-xl hover:shadow-cyan-500/5 transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-300">Communication Skills</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <ProgressRing value={summary.communicationScore} label="Communication" />
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Confidence</span>
                  <span>{Math.round(summary.confidenceScore)}</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full mt-1">
                  <div className="h-2 rounded-full bg-sky-400" style={{ width: `${summary.confidenceScore}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Grammar Accuracy</span>
                  <span>{Math.round(summary.grammarScore)}</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full mt-1">
                  <div className="h-2 rounded-full bg-emerald-400" style={{ width: `${summary.grammarScore}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Vocabulary Usage</span>
                  <span>{Math.round(summary.vocabularyScore)}</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full mt-1">
                  <div className="h-2 rounded-full bg-purple-400" style={{ width: `${summary.vocabularyScore}%` }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-gradient-to-br from-slate-900/60 to-slate-900/40 backdrop-blur-xl lg:col-span-2 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              Skill Progress Over Time
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <ChartTooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b" }} />
                <Line type="monotone" dataKey="communication" stroke="#38bdf8" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="confidence" stroke="#a855f7" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="grammar" stroke="#22c55e" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="technical" stroke="#f97316" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      {/* Chart Section - Communication & Accuracy */}
      <section className="grid gap-6 lg:grid-cols-2 animate-in fade-in slide-in-from-bottom-2">
        <Card className="border-white/10 bg-gradient-to-br from-slate-900/60 to-slate-900/40 backdrop-blur-xl hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              Behavioral Metrics Snapshot
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: "Eye Contact", value: Math.round(advanced.behavioral.eyeContactScore) },
                  { name: "Posture", value: Math.round(advanced.behavioral.postureScore) },
                  { name: "Smile", value: Math.round(advanced.behavioral.smileScore) },
                  { name: "Engagement", value: Math.round(advanced.behavioral.engagementScore) },
                  { name: "Stress", value: Math.max(0, Math.round(100 - advanced.behavioral.stressLevel)) },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                <ChartTooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b" }} />
                <Bar dataKey="value" fill="#38bdf8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-gradient-to-br from-slate-900/60 to-slate-900/40 backdrop-blur-xl hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <ArrowUpRight className="h-4 w-4 text-white" />
              </div>
              Accuracy vs Speed
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.accuracyVsSpeed}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="duration" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <ChartTooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b" }} />
                <Line type="monotone" dataKey="score" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      {/* Advanced Communication Insights */}
      <section className="grid gap-6 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-2">
        <Card className="border-white/10 bg-gradient-to-br from-slate-900/60 to-slate-900/40 backdrop-blur-xl hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <Mic2 className="h-4 w-4 text-white" />
              </div>
              Filler Word Detector
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Filler rate</span>
              <span className="text-white font-semibold">{advanced.communication.fillerRate}%</span>
            </div>
            {advanced.communication.fillerWords.length ? (
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={advanced.communication.fillerWords.slice(0, 6)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="word" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                    <ChartTooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b" }} />
                    <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-xs text-slate-500">Not enough responses to detect fillers yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-gradient-to-br from-slate-900/60 to-slate-900/40 backdrop-blur-xl hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Gauge className="h-4 w-4 text-white" />
              </div>
              Speaking Speed vs Ideal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Current pace</span>
              <span className="text-white font-semibold">{advanced.communication.speakingWpm} WPM</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full relative">
              <div
                className="absolute h-2 bg-emerald-500/40 rounded-full"
                style={{ left: `${(wpmLow / 220) * 100}%`, width: `${((wpmHigh - wpmLow) / 220) * 100}%` }}
              />
              <div
                className="absolute -top-1 h-4 w-1 rounded-full bg-sky-400"
                style={{ left: `${(advanced.communication.speakingWpm / 220) * 100}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Slow</span>
              <span>Ideal {wpmLow}-{wpmHigh} WPM</span>
              <span>Fast</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Pace quality</span>
              <span className="text-white font-semibold">{advanced.communication.speakingPaceScore}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-gradient-to-br from-slate-900/60 to-slate-900/40 backdrop-blur-xl hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              Structure & Tone Quality
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Sentence Structure</span>
                <span>{Math.round(advanced.communication.sentenceStructureScore)}</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full mt-1">
                <div className="h-2 rounded-full bg-purple-400" style={{ width: `${advanced.communication.sentenceStructureScore}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Tone Consistency</span>
                <span>{Math.round(advanced.communication.toneConsistency)}</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full mt-1">
                <div className="h-2 rounded-full bg-sky-400" style={{ width: `${advanced.communication.toneConsistency}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Hesitation Index</span>
                <span>{Math.round(advanced.communication.hesitationIndex)}</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full mt-1">
                <div className="h-2 rounded-full bg-amber-400" style={{ width: `${advanced.communication.hesitationIndex}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Confidence Insights Section */}
      <section className="grid gap-6 lg:grid-cols-2 animate-in fade-in slide-in-from-bottom-2">
        <Card className="border-white/10 bg-gradient-to-br from-slate-900/60 to-slate-900/40 backdrop-blur-xl hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              Confidence Timeline (Latest Session)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[240px]">
            {advanced.communication.confidenceTimeline.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={advanced.communication.confidenceTimeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="turn" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <ChartTooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b" }} />
                  <Line type="monotone" dataKey="confidence" stroke="#38bdf8" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-500">No session timeline yet.</p>
            )}
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-gradient-to-br from-slate-900/60 to-slate-900/40 backdrop-blur-xl hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <Activity className="h-4 w-4 text-white" />
              </div>
              Session Confidence Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={advanced.communication.sessionConfidenceTrend}>
                <defs>
                  <linearGradient id="confGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                <ChartTooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b" }} />
                <Area type="monotone" dataKey="confidence" stroke="#22c55e" fill="url(#confGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      {/* Statistics & Distribution Section */}
      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="border-white/10 bg-gradient-to-br from-slate-900/60 to-slate-900/40 backdrop-blur-xl hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <Activity className="h-4 w-4 text-white" />
              </div>
              Practice Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-300">
            <div className="flex items-center justify-between"><span>Total Questions</span><span className="text-white font-semibold">{summary.totalQuestions}</span></div>
            <div className="flex items-center justify-between"><span>Total Sessions</span><span className="text-white font-semibold">{summary.totalSessions}</span></div>
            <div className="flex items-center justify-between"><span>Completion Consistency</span><span className="text-white font-semibold">{summary.completionRate}%</span></div>
            <div className="flex items-center justify-between"><span>Companies Practiced</span><span className="text-white font-semibold">{summary.totalCompanies}</span></div>
            <div className="flex items-center justify-between"><span>Total Practice Time</span><span className="text-white font-semibold">{formatDuration(summary.totalDurationMinutes)}</span></div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-gradient-to-br from-slate-900/60 to-slate-900/40 backdrop-blur-xl lg:col-span-2 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                <Target className="h-4 w-4 text-white" />
              </div>
              Practice Distribution by Module
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributions.module}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <ChartTooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b" }} />
                <Bar dataKey="count" fill="#38bdf8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      {/* Question Analytics Section */}
      <section className="grid gap-6 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-2">
        <Card className="border-white/10 bg-gradient-to-br from-slate-900/60 to-slate-900/40 backdrop-blur-xl hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <ClipboardList className="h-4 w-4 text-white" />
              </div>
              Question Difficulty
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={advanced.questions.difficultyDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <ChartTooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b" }} />
                <Bar dataKey="count" fill="#38bdf8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-gradient-to-br from-slate-900/60 to-slate-900/40 backdrop-blur-xl lg:col-span-2 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <Target className="h-4 w-4 text-white" />
              </div>
              Accuracy by Question Type
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Reattempt success rate</span>
              <span className="text-white font-semibold">{advanced.questions.reattemptSuccessRate}%</span>
            </div>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={advanced.questions.accuracyByType}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="type" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <ChartTooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b" }} />
                  <Bar dataKey="accuracy" fill="#22c55e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Company & Coach Insights */}
      <section className="grid gap-6 lg:grid-cols-3 animate-in fade-in-slide-in-from-bottom-2">
        <Card className="border-white/10 bg-gradient-to-br from-slate-900/60 to-slate-900/40 backdrop-blur-xl lg:col-span-2 hover:shadow-xl hover:shadow-cyan-500/5 transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                <ShieldCheck className="h-4 w-4 text-white" />
              </div>
              Company-wise Readiness
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={advanced.company.readiness}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                <ChartTooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b" }} />
                <Bar dataKey="score" fill="#f97316" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-gradient-to-br from-slate-900/60 to-slate-900/40 backdrop-blur-xl hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              Company Gap Signals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {advanced.company.readiness.length ? (
              advanced.company.readiness.slice(0, 3).map((company) => (
                <div key={company.name}>
                  <p className="text-white font-semibold">{company.name}</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {company.missingSkills.map((skill) => (
                      <Badge key={skill} variant="outline" className="border-amber-500/40 text-amber-200">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-500">Add company sessions to unlock readiness insights.</p>
            )}
            {advanced.company.readinessTimelineWeeks != null && (
              <p className="text-xs text-slate-400">Estimated readiness timeline: {advanced.company.readinessTimelineWeeks} weeks</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2 animate-in fade-in slide-in-from-bottom-2">
        <Card className="border-slate-800/70 bg-slate-900/60">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-400" /> AI Coach Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-300">{advanced.coach.readinessSummary}</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Top Strengths</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {advanced.coach.strengths.map((item) => (
                    <Badge key={item} variant="outline" className="border-emerald-500/40 text-emerald-200">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Needs Focus</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {advanced.coach.weaknesses.map((item) => (
                    <Badge key={item} variant="outline" className="border-amber-500/40 text-amber-200">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <Separator className="bg-slate-800" />
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">7-Day Improvement Plan</p>
              <ul className="mt-2 space-y-2 text-sm text-slate-300">
                {advanced.coach.plan7Day.map((step) => (
                  <li key={step} className="flex gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-sky-400" />
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-gradient-to-br from-slate-900/60 to-slate-900/40 backdrop-blur-xl hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <ArrowUpRight className="h-4 w-4 text-white" />
              </div>
              Next Session Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm text-slate-300">
              {advanced.company.recommendations.map((rec) => (
                <div key={rec} className="flex gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
                  {rec}
                </div>
              ))}
            </div>
            <Button className="w-full bg-emerald-500/90 text-slate-950 hover:bg-emerald-500" onClick={() => router.push("/train")}
            >
              Start {advanced.coach.nextSessionFocus}
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2 animate-in fade-in slide-in-from-bottom-2">
        <Card className="border-slate-800/70 bg-slate-900/60">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-purple-400" /> Grammar & Language Intelligence
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Grammar error frequency</span>
              <span className="text-white font-semibold">{advanced.grammar.errorFrequency}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Improvement velocity</span>
              <span className="text-white font-semibold">{advanced.grammar.improvementVelocity} pts/day</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(advanced.grammar.categories.length ? advanced.grammar.categories : [{ label: "Not enough data", count: 0 }]).map((item) => (
                <Badge key={item.label} variant="outline" className="border-purple-500/40 text-purple-200">
                  {item.label} ({item.count})
                </Badge>
              ))}
            </div>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: "Before", value: advanced.grammar.beforeAfter.before },
                  { name: "After", value: advanced.grammar.beforeAfter.after },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <ChartTooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b" }} />
                  <Bar dataKey="value" fill="#a855f7" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-gradient-to-br from-slate-900/60 to-slate-900/40 backdrop-blur-xl hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              Confidence & Performance Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-400">Confidence vs accuracy</p>
                <p className="text-white font-semibold">{advanced.confidence.confidenceVsAccuracyCorrelation}</p>
              </div>
              <div>
                <p className="text-slate-400">Fatigue risk</p>
                <p className="text-white font-semibold">{advanced.confidence.fatigueRiskPercent}%</p>
              </div>
              <div>
                <p className="text-slate-400">Predicted confidence</p>
                <p className="text-white font-semibold">{advanced.confidence.predictedVsActual.predicted}</p>
              </div>
              <div>
                <p className="text-slate-400">Actual confidence</p>
                <p className="text-white font-semibold">{advanced.confidence.predictedVsActual.actual}</p>
              </div>
            </div>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="difficulty" type="number" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} name="Difficulty" />
                  <YAxis dataKey="confidence" type="number" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} name="Confidence" />
                  <ZAxis range={[40, 200]} />
                  <ChartTooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b" }} />
                  <Scatter data={advanced.confidence.confidenceVsDifficulty} fill="#38bdf8" />
                  <ReferenceLine y={70} stroke="#22c55e" strokeDasharray="3 3" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Final Insights Section */}
      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="border-white/10 bg-gradient-to-br from-slate-900/60 to-slate-900/40 backdrop-blur-xl hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-white" />
              </div>
              Strengths & Focus Areas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Most Practiced</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {insights.mostPracticed.map((item) => (
                  <Badge key={item.name} variant="outline" className="border-emerald-500/40 text-emerald-200">
                    {item.name} ({item.count})
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Least Practiced</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {insights.leastPracticed.map((item) => (
                  <Badge key={item.name} variant="outline" className="border-amber-500/40 text-amber-200">
                    {item.name} ({item.count})
                  </Badge>
                ))}
              </div>
            </div>
            <Separator className="bg-slate-800" />
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Focus Areas</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {insights.focusAreas.map((area) => (
                  <Badge key={area} variant="outline" className="border-sky-500/40 text-sky-200">
                    {area}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-gradient-to-br from-slate-900/60 to-slate-900/40 backdrop-blur-xl hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Common Grammar Patterns</p>
              <div className="flex flex-wrap gap-2">
                {(insights.commonGrammarIssues.length ? insights.commonGrammarIssues : ["Not enough data yet"]).map((issue) => (
                  <Badge key={issue} variant="outline" className="border-purple-500/40 text-purple-200">
                    {issue}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Confidence Drop Points</p>
              <p className="text-sm text-slate-300">{insights.confidenceDropPercent}% of long sessions show confidence dips.</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Personalized Tips</p>
              <ul className="space-y-2 text-sm text-slate-300">
                {insights.tips.map((tip) => (
                  <li key={tip} className="flex gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Activity Heatmap - Premium Design */}
      <Card className="border-white/10 bg-gradient-to-br from-slate-900/60 to-slate-900/40 backdrop-blur-xl hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-slate-300 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Flame className="h-4 w-4 text-white" />
            </div>
            Activity Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[200px] p-6">
          <Heatmap activity={activity} />
        </CardContent>
      </Card>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => router.push("/train")}>Start Next Practice</Button>
        </div>
      </div>
    </div>
  );
}
