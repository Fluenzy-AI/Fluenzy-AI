"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import HeaderOffset from "@/components/HeaderOffset";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Brush,
  CartesianGrid,
  Legend,
  LabelList,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, Flame } from "lucide-react";

interface AnalyticsResponse {
  filters: {
    range: string;
    sessionId: string | null;
    availableSessions: Array<{ sessionId: string; module: string; date: string }>;
  };
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
  history: {
    sessions: Array<{
      sessionId: string;
      company: string;
      role: string;
      module: string;
      date: string;
      durationMinutes: number;
      score: number;
      status: string;
    }>;
    scoreTrend: Array<{ date: string; score: number; company: string; sessionId: string }>;
    durationTrend: Array<{ date: string; duration: number; company: string; sessionId: string }>;
    statusBreakdown: Array<{ status: string; count: number }>;
  };
  textReport: {
    topKeywords: Array<{ word: string; count: number }>;
    responseLengthBySession: Array<{ sessionId: string; date: string; avgWords: number; answers: number }>;
    textVolumeByCompany: Array<{ company: string; words: number }>;
  };
  advanced: {
    behavioral: {
      hasData: boolean;
      message: string;
      sessions: Array<{ sessionId: string; date: string; sampleCount: number; score: number }>;
      compositeRadar: Array<{ metric: string; score: number }>;
      eyeContactScore: number;
      postureScore: number;
      smileScore: number;
      stressLevel: number;
      engagementScore: number;
      bodyLanguageScore: number;
      timeline: Array<{ date: string; eyeContact: number; posture: number; stress: number; engagement: number }>;
      replayInsights: Array<{ index: number; confidence: number; stress: number; filler: number; dropZone: number; stressSpike: number; fillerPeak: number }>;
      alerts: string[];
      alertFrequency: Array<{ alert: string; count: number; sessions: number; intensity: number }>;
      sessionAlertIntensity: Array<{ sessionId: string; intensity: number }>;
      confidenceBodyLanguageCorrelationHeatmap: Array<{ x: string; y: string; value: number }>;
      stressVsAccuracy: Array<{ stress: number; accuracy: number; sessionId: string }>;
      engagementStabilityIndex: Array<{ sessionId: string; value: number }>;
      confidenceRecoverySpeed: Array<{ sessionId: string; value: number }>;
      microExpressionStabilityTrend: Array<{ date: string; value: number }>;
      sessionQualityIndex: Array<{ date: string; score: number }>;
      stressPerformanceImpact: Array<{ date: string; stress: number; accuracy: number }>;
      emotionalStabilityIndex: number;
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
    confidence: {
      confidenceVsDifficulty: Array<{ difficulty: number; confidence: number }>;
      confidenceAccuracyPoints: Array<{ confidence: number; accuracy: number; turnLabel: string }>;
      quadrantSummary: { ideal: number; overconfidence: number; selfDoubt: number; weakZone: number };
      fatigueRiskPercent: number;
      confidenceVsAccuracyCorrelation: number;
      predictedVsActual: { predicted: number; actual: number };
    };
    grammar: {
      categories: Array<{ label: string; count: number }>;
      errorFrequency: number;
      improvementVelocity: number;
      beforeAfter: { before: number; after: number };
    };
    questions: {
      difficultyDistribution: Array<{ label: string; count: number }>;
      accuracyByType: Array<{ type: string; accuracy: number }>;
      reattemptSuccessRate: number;
    };
    company: {
      readiness: Array<{ name: string; count: number; score: number; missingSkills: string[] }>;
      skillGapCompanyRisk: Array<{ company: string; risk: number; weakestSkill: string }>;
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
    growth: {
      practiceImprovement: Array<{ session: number; cumulativeMinutes: number; score: number }>;
    };
  };
}

const formatDuration = (minutes: number) => {
  if (!minutes) return "0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const ProgressRing = ({ value, label }: { value: number; label: string }) => {
  const safeValue = Math.max(0, Math.min(100, Math.round(value || 0)));
  const radius = 46;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 0.5;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (safeValue / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg height={radius * 2} width={radius * 2} className="-rotate-90">
        <circle
          stroke="#1e293b"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke="#38bdf8"
          fill="transparent"
          strokeLinecap="round"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <div className="text-center -mt-16 mb-8">
        <div className="text-3xl font-bold text-white">{safeValue}</div>
      </div>
      <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">{label}</p>
    </div>
  );
};

const Heatmap = ({ activity }: { activity: Array<{ date: string; count: number }> }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activityMap = useMemo(() => new Map(activity.map((item) => [item.date, item.count])), [activity]);
  const today = new Date();
  const days: Array<{ date: string; count: number; dayOfWeek: number; weekIndex: number; month: string }> = [];

  for (let i = 363; i >= 0; i -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const key = date.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    const dayOfWeek = (date.getDay() + 6) % 7;
    const weekIndex = Math.floor((363 - i) / 7);
    const month = date.toLocaleDateString("en-US", { month: "short" });
    days.push({ date: key, count: activityMap.get(key) || 0, dayOfWeek, weekIndex, month });
  }

  const max = Math.max(1, ...days.map((d) => d.count));
  const weeks = 52;
  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const monthPositions: Array<{ month: string; weekIndex: number }> = [];
  let lastMonth = "";
  days.forEach((d) => {
    if (d.month !== lastMonth && d.dayOfWeek === 0) {
      monthPositions.push({ month: d.month, weekIndex: d.weekIndex });
      lastMonth = d.month;
    }
  });

  const getColor = (intensity: number) => {
    if (intensity === 0) return "bg-slate-800/20";
    if (intensity > 0.75) return "bg-emerald-500";
    if (intensity > 0.5) return "bg-emerald-600";
    if (intensity > 0.25) return "bg-emerald-700/80";
    return "bg-emerald-800/60";
  };

  return (
    <div ref={containerRef} className="h-full w-full flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
          <Flame size={14} className="text-emerald-400" />
          <span>Last year activity</span>
        </div>
      </div>

      <div className="flex pl-12 relative" style={{ height: "12px" }}>
        {monthPositions.map(({ month, weekIndex }) => (
          <div key={`${month}-${weekIndex}`} className="absolute text-[10px] text-slate-500 font-medium" style={{ left: `${48 + weekIndex * 12}px` }}>{month}</div>
        ))}
      </div>

      <div className="flex gap-1">
        <div className="flex flex-col gap-[3px] text-[9px] text-slate-500 font-medium justify-center pr-1 w-10 text-right">
          {dayLabels.map((label, i) => (
            <div key={label} className="h-[10px] flex items-center justify-end" style={{ opacity: i % 2 === 0 ? 1 : 0 }}>{label}</div>
          ))}
        </div>
        <div className="flex gap-[3px] overflow-x-auto">
          {Array.from({ length: weeks }).map((_, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-[3px]">
              {Array.from({ length: 7 }).map((_, dayIndex) => {
                const dayData = days.find((d) => d.weekIndex === weekIndex && d.dayOfWeek === dayIndex);
                if (!dayData) return <div key={dayIndex} className="w-[10px] h-[10px]" />;
                const color = getColor(dayData.count / max);
                return <div key={dayIndex} className={`w-[10px] h-[10px] rounded-sm ${color}`} title={`${dayData.date}: ${dayData.count}`} />;
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Total: <span className="text-white font-semibold">{activity.reduce((sum, d) => sum + d.count, 0)}</span></span>
        <span>Avg/week: <span className="text-white font-semibold">{Math.round(activity.reduce((sum, d) => sum + d.count, 0) / 52)}</span></span>
        <span>Current streak: <span className="text-emerald-400 font-semibold">{activity.slice(-7).filter((d) => d.count > 0).length} days</span></span>
      </div>
    </div>
  );
};

export default function AnalyticsDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("all");
  const [sessionFilter, setSessionFilter] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("range", range);
        if (sessionFilter) {
          params.set("sessionId", sessionFilter);
          params.set("behavioralSessionId", sessionFilter);
        }
        const res = await fetch(`/api/analytics?${params.toString()}`);
        if (res.ok) setData(await res.json());
      } finally {
        setLoading(false);
      }
    };
    if (status === "authenticated") load();
  }, [status, range, sessionFilter]);

  const stressPerformanceSeries = useMemo(() => {
    if (!data) return [];

    const direct = data.advanced.behavioral.stressPerformanceImpact.filter(
      (point) => Number.isFinite(point.stress) && Number.isFinite(point.accuracy)
    );
    if (direct.length > 0) return direct;

    const normalizeDate = (value: string) => value.split("T")[0];
    const accuracyBuckets = new Map<string, { total: number; count: number }>();

    data.history.scoreTrend.forEach((item) => {
      const date = normalizeDate(item.date);
      const bucket = accuracyBuckets.get(date) || { total: 0, count: 0 };
      bucket.total += item.score;
      bucket.count += 1;
      accuracyBuckets.set(date, bucket);
    });

    return data.advanced.behavioral.timeline
      .map((item) => {
        const bucket = accuracyBuckets.get(normalizeDate(item.date));
        if (!bucket) return null;
        return {
          date: normalizeDate(item.date),
          stress: item.stress,
          accuracy: Number((bucket.total / bucket.count).toFixed(1)),
        };
      })
      .filter((point): point is { date: string; stress: number; accuracy: number } => point !== null);
  }, [data]);

  if (loading) return <div className="container mx-auto px-4 py-12">Loading analytics...</div>;
  if (!session?.user || !data) return <div className="container mx-auto px-4 py-12">No analytics data available yet.</div>;

  const { summary, distributions, trends, activity, insights, charts, textReport, advanced, filters, history } = data;
  const wpmLow = advanced.communication.idealWpmRange[0];
  const wpmHigh = advanced.communication.idealWpmRange[1];
  const accuracyVsSpeedSeries = charts.accuracyVsSpeed.map((item, index) => ({
    idx: index + 1,
    speed: item.duration,
    accuracy: item.score,
  }));
  const communicationCompositeRadar = [
    { metric: "Communication", score: Number(summary.communicationScore.toFixed(1)) },
    { metric: "Confidence", score: Number(summary.confidenceScore.toFixed(1)) },
    { metric: "Grammar", score: Number(summary.grammarScore.toFixed(1)) },
    { metric: "Speaking Pace", score: Number(advanced.communication.speakingPaceScore.toFixed(1)) },
  ];
  const selectedBehavioralSession = sessionFilter
    ? advanced.behavioral.sessions.find((s) => s.sessionId === sessionFilter) || null
    : advanced.behavioral.sessions[0] || null;
  const hasGrammarInsights =
    advanced.grammar.categories.length > 0 ||
    advanced.grammar.errorFrequency > 0 ||
    advanced.grammar.beforeAfter.before > 0 ||
    advanced.grammar.beforeAfter.after > 0;
  const confidenceTimelinePreview = advanced.communication.confidenceTimeline.slice(-8);
  const sessionConfidencePreview = advanced.communication.sessionConfidenceTrend.slice(-8);
  const confidenceDifficultyPreview = advanced.confidence.confidenceVsDifficulty.slice(0, 8);
  const stressPerformancePreview = stressPerformanceSeries.slice(-8);
  return (
    <div className="overflow-x-hidden">
      <HeaderOffset />
      <div className="container mx-auto px-4 pb-12 flex flex-col gap-8">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/40 to-slate-900/70 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white">Analytics Dashboard</h1>
              <p className="text-sm text-slate-400">Your communication-first performance report with clear next steps.</p>
            </div>
            <Badge variant="outline" className="border-amber-500/40 text-amber-200">{summary.overallStatus}</Badge>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            className="bg-slate-900 border border-slate-700 rounded px-3 py-1 text-sm text-slate-200"
            value={range}
            onChange={(e) => setRange(e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="last_session">Last Session</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <select
            className="bg-slate-900 border border-slate-700 rounded px-3 py-1 text-sm text-slate-200"
            value={sessionFilter}
            onChange={(e) => setSessionFilter(e.target.value)}
          >
            <option value="">All Interview Sessions</option>
            {filters.availableSessions.map((s) => (
              <option key={s.sessionId} value={s.sessionId}>
                {s.date} - {s.module} - {s.sessionId.slice(0, 16)}
              </option>
            ))}
          </select>
          <Button variant="outline" onClick={() => window.open("/analytics/report?print=1", "_blank", "noopener,noreferrer")}>
            Export PDF
          </Button>
          <Button onClick={() => router.push("/train")} className="bg-emerald-500 text-slate-950 hover:bg-emerald-400">Focus: {advanced.coach.nextSessionFocus}</Button>
        </div>

        {/* 1 OVERALL PERFORMANCE SUMMARY */}
        <section className="order-1">
          <h2 className="text-lg font-bold text-white mb-3">Overall Performance Summary</h2>
          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            {[
              ["Overall Score", Math.round(summary.overallScore)],
              ["Communication", Math.round(summary.communicationScore)],
              ["Confidence", Math.round(summary.confidenceScore)],
              ["Grammar", Math.round(summary.grammarScore)],
              ["Speaking Pace", `${advanced.communication.speakingWpm} WPM`],
              ["Body Language", advanced.behavioral.hasData ? Math.round(advanced.behavioral.bodyLanguageScore) : "--"],
            ].map(([label, value]) => (
              <Card key={String(label)} className="border-white/10 bg-slate-900/60">
                <CardHeader><CardTitle className="text-xs text-slate-400">{label}</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold text-white">{value}</div></CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <Card className="border-white/10 bg-slate-900/60 lg:col-span-2">
              <CardHeader><CardTitle className="text-sm text-slate-300">Confidence vs Accuracy Quadrant</CardTitle></CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis type="number" dataKey="confidence" domain={[0, 100]} stroke="#94a3b8" />
                    <YAxis type="number" dataKey="accuracy" domain={[0, 100]} stroke="#94a3b8" />
                    <ChartTooltip />
                    <ReferenceArea x1={60} x2={100} y1={60} y2={100} fill="#22c55e" fillOpacity={0.08} />
                    <ReferenceArea x1={60} x2={100} y1={0} y2={60} fill="#f59e0b" fillOpacity={0.08} />
                    <ReferenceArea x1={0} x2={60} y1={60} y2={100} fill="#38bdf8" fillOpacity={0.08} />
                    <ReferenceArea x1={0} x2={60} y1={0} y2={60} fill="#ef4444" fillOpacity={0.08} />
                    <ReferenceLine x={60} stroke="#64748b" strokeDasharray="4 4" />
                    <ReferenceLine y={60} stroke="#64748b" strokeDasharray="4 4" />
                    <Scatter data={advanced.confidence.confidenceAccuracyPoints} fill="#f97316" />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <div className="grid gap-6">
              <Card className="border-white/10 bg-slate-900/60">
                <CardHeader><CardTitle className="text-sm text-slate-300">Predicted vs Actual Confidence</CardTitle></CardHeader>
                <CardContent className="h-[140px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[{ key: "Predicted", value: advanced.confidence.predictedVsActual.predicted }, { key: "Actual", value: advanced.confidence.predictedVsActual.actual }]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                      <XAxis dataKey="key" stroke="#94a3b8" fontSize={10} />
                      <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={10} />
                      <ChartTooltip />
                      <Bar dataKey="value" fill="#38bdf8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card className="border-white/10 bg-slate-900/60">
                <CardHeader><CardTitle className="text-sm text-slate-300">Quadrant Summary</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded border border-emerald-500/30 p-2 text-emerald-200">Ideal: {advanced.confidence.quadrantSummary.ideal}</div>
                  <div className="rounded border border-amber-500/30 p-2 text-amber-200">Overconfidence: {advanced.confidence.quadrantSummary.overconfidence}</div>
                  <div className="rounded border border-sky-500/30 p-2 text-sky-200">Self-doubt: {advanced.confidence.quadrantSummary.selfDoubt}</div>
                  <div className="rounded border border-red-500/30 p-2 text-red-200">Weak Zone: {advanced.confidence.quadrantSummary.weakZone}</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="order-2 space-y-6">
  <h2 className="text-lg font-bold text-white">Priority Chart Order</h2>

  <div className="grid gap-6 lg:grid-cols-2">
    <Card className="border-white/10 bg-slate-900/60">
      <CardHeader><CardTitle className="text-sm text-slate-300">Body Language Composite Radar</CardTitle></CardHeader>
      <CardContent className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><RadarChart data={advanced.behavioral.compositeRadar}><PolarGrid /><PolarAngleAxis dataKey="metric" /><PolarRadiusAxis domain={[0, 100]} /><Radar dataKey="score" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.35} /><ChartTooltip /></RadarChart></ResponsiveContainer></CardContent>
    </Card>
    <Card className="border-white/10 bg-slate-900/60">
      <CardHeader><CardTitle className="text-sm text-slate-300">Communication Composite Radar</CardTitle></CardHeader>
      <CardContent className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><RadarChart data={communicationCompositeRadar}><PolarGrid /><PolarAngleAxis dataKey="metric" /><PolarRadiusAxis domain={[0, 100]} /><Radar dataKey="score" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.35} /><ChartTooltip /></RadarChart></ResponsiveContainer></CardContent>
    </Card>
  </div>

  <div className="grid gap-6 lg:grid-cols-2">
    <Card className="border-white/10 bg-slate-900/60"><CardHeader><CardTitle className="text-sm text-slate-300">Filler Word Frequency</CardTitle></CardHeader><CardContent className="h-[240px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={advanced.communication.fillerWords}><CartesianGrid strokeDasharray="3 3" stroke="#1f2937" /><XAxis dataKey="word" stroke="#94a3b8" fontSize={10} /><YAxis stroke="#94a3b8" fontSize={10} /><ChartTooltip /><Bar dataKey="count" fill="#10b981" /></BarChart></ResponsiveContainer></CardContent></Card>
    <Card className="border-white/10 bg-slate-900/60"><CardHeader><CardTitle className="text-sm text-slate-300">Accuracy vs Speed</CardTitle></CardHeader><CardContent className="h-[260px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={accuracyVsSpeedSeries}><CartesianGrid strokeDasharray="3 3" stroke="#1f2937" /><XAxis dataKey="speed" stroke="#94a3b8" fontSize={10} interval={0} /><YAxis dataKey="accuracy" domain={[0, 80]} stroke="#94a3b8" fontSize={10} /><ChartTooltip /><Legend /><Line type="linear" dataKey="accuracy" stroke="#fb923c" strokeWidth={2} dot={{ r: 3, fill: "#ffffff", stroke: "#fb923c", strokeWidth: 2 }} activeDot={{ r: 5, fill: "#ffffff", stroke: "#f97316", strokeWidth: 2 }} /><Brush dataKey="idx" height={18} stroke="#334155" /></LineChart></ResponsiveContainer></CardContent></Card>
  </div>

  <div className="grid gap-6 lg:grid-cols-2">
    <Card className="border-white/10 bg-slate-900/60"><CardHeader><CardTitle className="text-sm text-slate-300">Accuracy by Interview Type</CardTitle></CardHeader><CardContent className="h-[240px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={advanced.questions.accuracyByType}><CartesianGrid strokeDasharray="3 3" stroke="#1f2937" /><XAxis dataKey="type" stroke="#94a3b8" fontSize={10} /><YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={10} /><ChartTooltip /><Bar dataKey="accuracy" fill="#22c55e" /></BarChart></ResponsiveContainer></CardContent></Card>
    <Card className="border-white/10 bg-slate-900/60"><CardHeader><CardTitle className="text-sm text-slate-300">Weakest Skill Impact on Company Risk</CardTitle></CardHeader><CardContent className="h-[240px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={advanced.company.skillGapCompanyRisk}><CartesianGrid strokeDasharray="3 3" stroke="#1f2937" /><XAxis dataKey="company" stroke="#94a3b8" fontSize={10} /><YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={10} /><ChartTooltip /><Bar dataKey="risk" fill="#ef4444" /></BarChart></ResponsiveContainer></CardContent></Card>
  </div>

  <div className="grid gap-6 lg:grid-cols-2">
    <Card className="border-white/10 bg-slate-900/60"><CardHeader><CardTitle className="text-sm text-slate-300">Company-wise Readiness</CardTitle></CardHeader><CardContent className="h-[260px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={advanced.company.readiness}><CartesianGrid strokeDasharray="3 3" stroke="#1f2937" /><XAxis dataKey="name" stroke="#94a3b8" fontSize={10} /><YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={10} /><ChartTooltip /><Bar dataKey="score" fill="#f97316" /></BarChart></ResponsiveContainer></CardContent></Card>
    <Card className="border-white/10 bg-slate-900/60"><CardHeader><CardTitle className="text-sm text-slate-300">Behavioral Metrics Snapshot</CardTitle></CardHeader><CardContent className="h-[260px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={[{ name: "Eye Contact", value: advanced.behavioral.eyeContactScore }, { name: "Posture", value: advanced.behavioral.postureScore }, { name: "Smile", value: advanced.behavioral.smileScore }, { name: "Engagement", value: advanced.behavioral.engagementScore }, { name: "Stress", value: Math.max(0, 100 - advanced.behavioral.stressLevel) }]}><CartesianGrid strokeDasharray="3 3" stroke="#1f2937" /><XAxis dataKey="name" stroke="#94a3b8" fontSize={10} /><YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={10} /><ChartTooltip /><Bar dataKey="value" fill="#38bdf8" /></BarChart></ResponsiveContainer></CardContent></Card>
  </div>

  <Card className="border-white/10 bg-slate-900/60">
    <CardHeader><CardTitle className="text-sm text-slate-300">Average Answer Length by Session</CardTitle></CardHeader>
    <CardContent className="h-[240px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={textReport.responseLengthBySession}><CartesianGrid strokeDasharray="3 3" stroke="#1f2937" /><XAxis dataKey="date" stroke="#94a3b8" fontSize={10} /><YAxis stroke="#94a3b8" fontSize={10} /><ChartTooltip /><Line dataKey="avgWords" stroke="#60a5fa" dot={{ r: 2 }} /></LineChart></ResponsiveContainer></CardContent>
  </Card>

  <Card className="border-white/10 bg-slate-900/60">
    <CardHeader><CardTitle className="text-sm text-slate-300">Practice vs Improvement (Effort vs Result)</CardTitle></CardHeader>
    <CardContent className="h-[250px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={advanced.growth.practiceImprovement}><CartesianGrid strokeDasharray="3 3" stroke="#1f2937" /><XAxis dataKey="session" stroke="#94a3b8" fontSize={10} /><YAxis yAxisId="left" stroke="#94a3b8" fontSize={10} /><YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={10} /><ChartTooltip /><Legend /><Line yAxisId="left" dataKey="score" stroke="#22c55e" dot={false} /><Line yAxisId="right" dataKey="cumulativeMinutes" stroke="#38bdf8" dot={false} /><Brush dataKey="session" height={18} stroke="#334155" /></LineChart></ResponsiveContainer></CardContent>
  </Card>
</section>
        {/* 3 SPEECH & COMMUNICATION INTELLIGENCE */}
        <section className="order-2 space-y-4">
          <h2 className="text-lg font-bold text-white">Speech & Communication Intelligence</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-white/10 bg-slate-900/60"><CardHeader><CardTitle className="text-sm text-slate-300">Speaking Pace vs Ideal</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-3xl font-bold text-white">{advanced.communication.speakingWpm} WPM</p><div className="h-3 bg-slate-800 rounded"><div className="h-3 bg-emerald-500 rounded" style={{ width: `${Math.min(100, (advanced.communication.speakingWpm / 220) * 100)}%` }} /></div><p className="text-xs text-slate-400">Ideal {wpmLow}-{wpmHigh} WPM</p><p className="text-sm text-slate-300">Pace quality: {advanced.communication.speakingPaceScore}</p><p className="text-sm text-slate-300">Sentence: {advanced.communication.sentenceStructureScore}</p></CardContent></Card>
            <Card className="border-white/10 bg-slate-900/60">
              <CardHeader><CardTitle className="text-sm text-slate-300">Structure & Tone Quality</CardTitle></CardHeader>
              <CardContent className="space-y-4 pt-2">
                <div>
                  <div className="mb-1 flex items-center justify-between text-sm"><span className="text-slate-400">Sentence Structure</span><span className="text-white font-semibold">{advanced.communication.sentenceStructureScore}</span></div>
                  <div className="h-2 rounded bg-slate-800"><div className="h-2 rounded bg-purple-400" style={{ width: `${advanced.communication.sentenceStructureScore}%` }} /></div>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-sm"><span className="text-slate-400">Tone Consistency</span><span className="text-white font-semibold">{advanced.communication.toneConsistency}</span></div>
                  <div className="h-2 rounded bg-slate-800"><div className="h-2 rounded bg-sky-400" style={{ width: `${advanced.communication.toneConsistency}%` }} /></div>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-sm"><span className="text-slate-400">Hesitation Index</span><span className="text-white font-semibold">{advanced.communication.hesitationIndex}</span></div>
                  <div className="h-2 rounded bg-slate-800"><div className="h-2 rounded bg-amber-400" style={{ width: `${advanced.communication.hesitationIndex}%` }} /></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="order-5 space-y-4">
          <h2 className="text-lg font-bold text-white">Text-based Report Intelligence</h2>
          <Card className="border-white/10 bg-slate-900/60">
            <CardHeader><CardTitle className="text-sm text-slate-300">Text Volume by Company</CardTitle></CardHeader>
            <CardContent className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={textReport.textVolumeByCompany}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="company" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} />
                  <ChartTooltip />
                  <Bar dataKey="words" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </section>

        {/* 4 CONFIDENCE & SESSION TRACKING */}
        <section className="order-5 space-y-4">
          <h2 className="text-lg font-bold text-white">Confidence & Session Tracking</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-white/10 bg-slate-900/60">
              <CardHeader><CardTitle className="text-sm text-slate-300">Confidence Timeline (Latest Session)</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={advanced.communication.confidenceTimeline}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                      <XAxis dataKey="turn" stroke="#94a3b8" fontSize={10} />
                      <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={10} />
                      <ChartTooltip />
                      <Legend />
                      <Line dataKey="confidence" stroke="#38bdf8" dot={{ r: 2 }}>
                        <LabelList dataKey="confidence" position="top" fill="#93c5fd" fontSize={9} />
                      </Line>
                      <Brush dataKey="turn" height={16} stroke="#334155" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {confidenceTimelinePreview.map((point) => (
                    <span key={`turn-${point.turn}`} className="rounded border border-slate-700 px-2 py-1 text-slate-300">
                      T{point.turn}: <span className="text-white">{point.confidence}</span>
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-slate-900/60">
              <CardHeader><CardTitle className="text-sm text-slate-300">Session Confidence Trend</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={advanced.communication.sessionConfidenceTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                      <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={10} />
                      <ChartTooltip />
                      <Legend />
                      <Area dataKey="confidence" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2}>
                        <LabelList dataKey="confidence" position="top" fill="#86efac" fontSize={9} />
                      </Area>
                      <Brush dataKey="date" height={16} stroke="#334155" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {sessionConfidencePreview.map((point, idx) => (
                    <span key={`session-trend-${point.date}-${idx}`} className="rounded border border-slate-700 px-2 py-1 text-slate-300">
                      {point.date}: <span className="text-white">{point.confidence}</span>
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <Card className="border-white/10 bg-slate-900/60">
            <CardHeader><CardTitle className="text-sm text-slate-300">Confidence & Performance Insights</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div><p className="text-slate-400">Confidence vs Accuracy</p><p className="text-white font-semibold">{advanced.confidence.confidenceVsAccuracyCorrelation}</p></div>
                <div><p className="text-slate-400">Fatigue Risk</p><p className="text-white font-semibold">{advanced.confidence.fatigueRiskPercent}%</p></div>
                <div><p className="text-slate-400">Predicted Confidence</p><p className="text-white font-semibold">{advanced.confidence.predictedVsActual.predicted}</p></div>
                <div><p className="text-slate-400">Actual Confidence</p><p className="text-white font-semibold">{advanced.confidence.predictedVsActual.actual}</p></div>
              </div>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis type="number" dataKey="difficulty" stroke="#94a3b8" />
                    <YAxis type="number" dataKey="confidence" stroke="#94a3b8" domain={[0, 100]} />
                    <ChartTooltip />
                    <Scatter data={advanced.confidence.confidenceVsDifficulty} fill="#38bdf8">
                      <LabelList dataKey="confidence" position="top" fill="#93c5fd" fontSize={9} />
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {confidenceDifficultyPreview.map((point, idx) => (
                  <span key={`cd-${idx}`} className="rounded border border-slate-700 px-2 py-1 text-slate-300">
                    D{point.difficulty}: <span className="text-white">{point.confidence}</span>
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-slate-900/60">
            <CardHeader><CardTitle className="text-sm text-slate-300">Stress vs Performance Impact</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {stressPerformanceSeries.length === 0 ? (
                <div className="h-[200px] flex items-center justify-center text-sm text-slate-400">
                  No overlapping stress and performance data for this filter.
                </div>
              ) : (
                <>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stressPerformanceSeries}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                        <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 100]} />
                        <ChartTooltip />
                        <Legend />
                        <Line dataKey="stress" stroke="#ef4444" dot={{ r: 2 }}>
                          <LabelList dataKey="stress" position="top" fill="#fda4af" fontSize={9} />
                        </Line>
                        <Line dataKey="accuracy" stroke="#22c55e" dot={{ r: 2 }}>
                          <LabelList dataKey="accuracy" position="top" fill="#86efac" fontSize={9} />
                        </Line>
                        <Brush dataKey="date" height={16} stroke="#334155" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {stressPerformancePreview.map((point, idx) => (
                      <span key={`sp-${point.date}-${idx}`} className="rounded border border-slate-700 px-2 py-1 text-slate-300">
                        {point.date}: S <span className="text-red-300">{point.stress}</span> | A <span className="text-emerald-300">{point.accuracy}</span>
                      </span>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </section>

        {/* 5 INTERVIEW ACCURACY INTELLIGENCE */}
        <section className="order-4 space-y-4">
          <h2 className="text-lg font-bold text-white">Interview Accuracy Intelligence</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-white/10 bg-slate-900/60"><CardHeader><CardTitle className="text-sm text-slate-300">Reattempt & Difficulty</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-slate-300 text-sm">Reattempt success rate: <span className="text-white font-semibold">{advanced.questions.reattemptSuccessRate}%</span></p><div className="h-[220px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={advanced.questions.difficultyDistribution}><CartesianGrid strokeDasharray="3 3" stroke="#1f2937" /><XAxis dataKey="label" stroke="#94a3b8" fontSize={10} /><YAxis stroke="#94a3b8" fontSize={10} /><ChartTooltip /><Bar dataKey="count" fill="#38bdf8" /></BarChart></ResponsiveContainer></div></CardContent></Card>
            <Card className="border-white/10 bg-slate-900/60">
              <CardHeader><CardTitle className="text-sm text-slate-300">Top Keywords (Answers)</CardTitle></CardHeader>
              <CardContent className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={textReport.topKeywords}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="word" stroke="#94a3b8" fontSize={10} />
                    <YAxis stroke="#94a3b8" fontSize={10} />
                    <ChartTooltip />
                    <Bar dataKey="count" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 6 COMPANY READINESS INTELLIGENCE */}
        <section className="order-4 space-y-4">
          <h2 className="text-lg font-bold text-white">Company Readiness Intelligence</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-white/10 bg-slate-900/60"><CardHeader><CardTitle className="text-sm text-slate-300">Skill Gap Signals</CardTitle></CardHeader><CardContent className="space-y-3">{advanced.company.readiness.slice(0, 4).map((c) => (<div key={c.name}><p className="text-white font-semibold">{c.name}</p><div className="flex flex-wrap gap-1 mt-1">{c.missingSkills.map((s) => (<Badge key={`${c.name}-${s}`} variant="outline" className="border-amber-500/40 text-amber-200">{s}</Badge>))}</div></div>))}</CardContent></Card>
            <Card className="border-white/10 bg-slate-900/60">
              <CardHeader><CardTitle className="text-sm text-slate-300">Most Practiced vs Least Practiced</CardTitle></CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <p className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-500">Most Practiced</p>
                  <div className="flex flex-wrap gap-2">
                    {insights.mostPracticed.map((item) => (
                      <Badge key={`most-company-${item.name}`} variant="outline" className="border-emerald-500/40 text-emerald-200">
                        {item.name} ({item.count})
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-500">Least Practiced</p>
                  <div className="flex flex-wrap gap-2">
                    {insights.leastPracticed.map((item) => (
                      <Badge key={`least-company-${item.name}`} variant="outline" className="border-amber-500/40 text-amber-200">
                        {item.name} ({item.count})
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 7 PRACTICE DISTRIBUTION */}
        <section className="order-5 space-y-4">
          <h2 className="text-lg font-bold text-white">Practice Distribution</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-white/10 bg-slate-900/60">
              <CardHeader><CardTitle className="text-sm text-slate-300">Practice Statistics</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-300">
                <div className="flex justify-between"><span>Total Questions</span><span className="text-white font-semibold">{summary.totalQuestions}</span></div>
                <div className="flex justify-between"><span>Total Sessions</span><span className="text-white font-semibold">{summary.totalSessions}</span></div>
                <div className="flex justify-between"><span>Completion Consistency</span><span className="text-white font-semibold">{summary.completionRate}%</span></div>
                <div className="flex justify-between"><span>Companies Practiced</span><span className="text-white font-semibold">{summary.totalCompanies}</span></div>
                <div className="flex justify-between"><span>Total Practice Time</span><span className="text-white font-semibold">{formatDuration(summary.totalDurationMinutes)}</span></div>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-slate-900/60"><CardHeader><CardTitle className="text-sm text-slate-300">Module Usage</CardTitle></CardHeader><CardContent className="h-[240px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={distributions.module}><CartesianGrid strokeDasharray="3 3" stroke="#1f2937" /><XAxis dataKey="name" stroke="#94a3b8" fontSize={10} /><YAxis stroke="#94a3b8" fontSize={10} /><ChartTooltip /><Bar dataKey="count" fill="#38bdf8" /></BarChart></ResponsiveContainer></CardContent></Card>
          </div>
        </section>

        {/* 8 AI COACH INSIGHTS */}
        <section className="order-6 space-y-4">
          <h2 className="text-lg font-bold text-white">AI Coach Insights</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-white/10 bg-slate-900/60">
              <CardHeader><CardTitle className="text-sm text-slate-300">AI Coach Insights</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-300">{advanced.coach.readinessSummary}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-500">Top Strengths</p>
                    <div className="flex flex-wrap gap-2">{advanced.coach.strengths.map((item) => (<Badge key={item} variant="outline" className="border-emerald-500/40 text-emerald-200">{item}</Badge>))}</div>
                  </div>
                  <div>
                    <p className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-500">Needs Focus</p>
                    <div className="flex flex-wrap gap-2">{advanced.coach.weaknesses.map((item) => (<Badge key={item} variant="outline" className="border-amber-500/40 text-amber-200">{item}</Badge>))}</div>
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-500">7-Day Improvement Plan</p>
                  <div className="space-y-2">{advanced.coach.plan7Day.map((step) => (<div key={step} className="text-sm text-slate-300 flex gap-2"><span className="mt-2 h-2 w-2 rounded-full bg-emerald-400" />{step}</div>))}</div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-slate-900/60">
              <CardHeader><CardTitle className="text-sm text-slate-300">Next Session Recommendations</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {advanced.company.recommendations.map((tip, idx) => (<p key={`${tip}-${idx}`} className="text-sm text-slate-300">- {tip}</p>))}
                <Button onClick={() => router.push("/train")} className="w-full bg-emerald-500 text-slate-950 hover:bg-emerald-400">
                  Start {advanced.coach.nextSessionFocus}
                </Button>
                <div className="pt-3 border-t border-white/10 space-y-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Current Snapshot</p>
                  {[
                    { label: "Communication", value: Math.round(summary.communicationScore), color: "bg-sky-400" },
                    { label: "Confidence", value: Math.round(summary.confidenceScore), color: "bg-emerald-400" },
                    { label: "Grammar", value: Math.round(summary.grammarScore), color: "bg-violet-400" },
                    { label: "Speaking Pace Quality", value: Math.round(advanced.communication.speakingPaceScore), color: "bg-amber-400" },
                  ].map((item) => (
                    <div key={item.label} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">{item.label}</span>
                        <span className="text-white font-semibold">{item.value}</span>
                      </div>
                      <div className="h-1.5 rounded bg-slate-800">
                        <div className={`h-1.5 rounded ${item.color}`} style={{ width: `${Math.max(0, Math.min(100, item.value))}%` }} />
                      </div>
                    </div>
                  ))}
                  <div className="pt-1">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">Latest Confidence Trend</p>
                    <div className="space-y-1.5">
                      {advanced.communication.sessionConfidenceTrend.slice(-3).map((point, idx) => (
                        <div key={`coach-trend-${point.date}-${idx}`} className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">{point.date}</span>
                          <span className="text-white">{point.confidence}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className={`grid gap-6 ${hasGrammarInsights ? "lg:grid-cols-2" : "lg:grid-cols-1"}`}>
            {hasGrammarInsights && (
              <Card className="border-white/10 bg-slate-900/60">
                <CardHeader><CardTitle className="text-sm text-slate-300">Grammar & Language Intelligence</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><p className="text-slate-400">Grammar error frequency</p><p className="font-semibold text-white">{advanced.grammar.errorFrequency}%</p></div>
                    <div><p className="text-slate-400">Improvement velocity</p><p className="font-semibold text-white">{advanced.grammar.improvementVelocity} pts/day</p></div>
                  </div>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[{ stage: "Before", value: advanced.grammar.beforeAfter.before }, { stage: "After", value: advanced.grammar.beforeAfter.after }]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis dataKey="stage" stroke="#94a3b8" fontSize={10} />
                        <YAxis stroke="#94a3b8" fontSize={10} />
                        <ChartTooltip />
                        <Bar dataKey="value" fill="#a855f7" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
            <Card className="border-white/10 bg-slate-900/60">
              <CardHeader><CardTitle className="text-sm text-slate-300">AI Insights</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {insights.commonGrammarIssues.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Common Grammar Patterns</p>
                    <p className="mt-1 text-sm text-slate-300">{insights.commonGrammarIssues.join(", ")}</p>
                  </div>
                )}
                <div className="text-sm text-slate-300">Confidence drop points: <span className="font-semibold text-white">{insights.confidenceDropPercent}%</span></div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Personalized Tips</p>
                  {insights.tips.map((tip, idx) => (<p key={`${tip}-${idx}`} className="text-sm text-slate-300">- {tip}</p>))}
                </div>
              </CardContent>
            </Card>
          </div>
          <Card className="border-white/10 bg-slate-900/60">
            <CardHeader><CardTitle className="text-sm text-slate-300">Strengths & Focus Areas</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Most Practiced</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {insights.mostPracticed.map((item) => (<Badge key={`most-${item.name}`} variant="outline" className="border-emerald-500/40 text-emerald-200">{item.name} ({item.count})</Badge>))}
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Least Practiced</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {insights.leastPracticed.map((item) => (<Badge key={`least-${item.name}`} variant="outline" className="border-amber-500/40 text-amber-200">{item.name} ({item.count})</Badge>))}
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Focus Areas</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {insights.focusAreas.map((item) => (<Badge key={`focus-${item}`} variant="outline" className="border-sky-500/40 text-sky-200">{item}</Badge>))}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 9 ACTIVITY HEATMAP */}
        <section className="order-7">
          <h2 className="text-lg font-bold text-white mb-3">Activity Heatmap</h2>
          <Card className="border-white/10 bg-slate-900/60"><CardContent className="h-[200px] p-6"><Heatmap activity={activity} /></CardContent></Card>
        </section>

        <div className="flex justify-end text-sm text-slate-400">Total practice: {formatDuration(summary.totalDurationMinutes)} | Sessions: {summary.totalSessions}</div>
      </div>
    </div>
  );
}
