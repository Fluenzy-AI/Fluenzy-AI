"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import MobileAnalyticsPage from "@/components/MobileAnalyticsPage";
import { useTheme } from "@/contexts/ThemeContext";
import Link from "next/link";
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

  const monthBlocks = useMemo(() => {
    const blocks: Array<{ month: string; cells: Array<{ key: string; count: number }> }> = [];
    for (let offset = 11; offset >= 0; offset -= 1) {
      const date = new Date(today.getFullYear(), today.getMonth() - offset, 1);
      const year = date.getFullYear();
      const month = date.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const bucket = Array.from({ length: 35 }, (_, index) => ({ key: `${year}-${month}-${index}`, count: 0 }));

      for (let day = 1; day <= daysInMonth; day += 1) {
        const current = new Date(year, month, day);
        const dateKey = current.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
        const weekday = (current.getDay() + 6) % 7;
        const weekChunk = Math.floor((day - 1) / 7);
        const index = weekChunk * 7 + weekday;
        bucket[index].count += activityMap.get(dateKey) || 0;
      }

      blocks.push({
        month: date.toLocaleDateString("en-US", { month: "short" }),
        cells: bucket,
      });
    }
    return blocks;
  }, [activityMap, today]);

  const max = Math.max(1, ...monthBlocks.flatMap((block) => block.cells.map((cell) => cell.count)));

  const getColor = (count: number) => {
    if (count <= 0) return "bg-slate-800/50";
    const intensity = count / max;
    if (intensity > 0.75) return "bg-emerald-400";
    if (intensity > 0.5) return "bg-emerald-500/90";
    if (intensity > 0.25) return "bg-emerald-600/80";
    return "bg-emerald-700/70";
  };

  return (
    <div ref={containerRef} className="h-full w-full space-y-4">
      <div className="text-2xl sm:text-3xl font-bold text-white">Practice Consistency</div>
      <div className="w-full overflow-x-hidden pb-1">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
        {monthBlocks.map((block) => (
          <div key={block.month} className="flex flex-col items-center gap-1.5">
            <span className="text-[11px] sm:text-xs text-sky-200">{block.month}</span>
            <div className="grid grid-cols-5 grid-rows-7 gap-1">
              {block.cells.map((cell) => (
                <div key={cell.key} className={`h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-none ${getColor(cell.count)}`} title={`${block.month}: ${cell.count}`} />
              ))}
            </div>
          </div>
        ))}
        </div>
      </div>
      <p className="text-base sm:text-xl text-slate-300">Activity for the last 12 months.</p>
    </div>
  );
};

// Custom tick for PolarAngleAxis — wraps multi-word labels onto two lines so they never clip
function RadarCustomTick({ x, y, payload, textAnchor }: { x?: number; y?: number; payload?: { value: string }; textAnchor?: string }) {
  const words = (payload?.value ?? "").split(" ");
  return (
    <text x={x} y={y} textAnchor={textAnchor ?? "middle"} fill="#e2e8f0" fontSize={13} fontWeight={600}>
      {words.length === 1 ? (
        <tspan x={x} dy="0">{words[0]}</tspan>
      ) : (
        <>
          <tspan x={x} dy="-6">{words[0]}</tspan>
          <tspan x={x} dy="16">{words[1]}</tspan>
        </>
      )}
    </text>
  );
}

function AnalyticsDashboardPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEmbeddedView = searchParams.get("embed") === "1";
  const isPublicView = searchParams.get("public") === "1";
  const publicUsername = searchParams.get("username") || "";
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(() => searchParams.get("range") || "all");

  useEffect(() => {
    if (!isPublicView && status === "unauthenticated") router.push("/");
  }, [isPublicView, status, router]);

  useEffect(() => {
    const fetchData = async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("range", range);
        if (isPublicView && publicUsername) {
          params.set("public", "1");
          params.set("username", publicUsername);
        }
        const res = await fetch(`/api/analytics?${params.toString()}`);
        if (res.ok) { setData(await res.json()); setLastUpdated(new Date()); }
      } finally {
        if (!silent) setLoading(false);
      }
    };
    if ((isPublicView && publicUsername) || status === "authenticated") {
      fetchData(false);
      // Auto-refresh every 30 seconds so radar charts always show latest data
      const interval = setInterval(() => fetchData(true), 30000);
      return () => clearInterval(interval);
    }
  }, [status, range, isPublicView, publicUsername]);

  useEffect(() => {
    if (!data) return;
    if (searchParams.get("print") === "1") {
      const timeout = window.setTimeout(() => window.print(), 900);
      return () => window.clearTimeout(timeout);
    }
    return undefined;
  }, [data, searchParams]);

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

  const accuracyVsSpeedSeries = useMemo(() => {
    if (!data) return [];
    const buckets = new Map<number, { total: number; count: number }>();
    data.charts.accuracyVsSpeed.forEach((item) => {
      if (!Number.isFinite(item.duration) || item.duration <= 0) return;
      if (!Number.isFinite(item.score)) return;
      const key = Math.round(item.duration);
      const current = buckets.get(key) || { total: 0, count: 0 };
      current.total += item.score;
      current.count += 1;
      buckets.set(key, current);
    });

    return Array.from(buckets.entries())
      .map(([speed, value]) => ({
        speed,
        accuracy: Number((value.total / value.count).toFixed(1)),
        samples: value.count,
      }))
      .sort((a, b) => a.speed - b.speed);
  }, [data]);

  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === 'light';

  // ── Real-time refresh tracking ────────────────────────────────
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // ── Mobile detection ──────────────────────────────────────────
  const [isMobile, setIsMobile] = useState(false);
  const [forceFullView, setForceFullView] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  // Allow "View Full Report" link to bypass mobile layout
  const searchParamsObj = searchParams;
  useEffect(() => {
    if (searchParamsObj.get("view") === "full") setForceFullView(true);
  }, [searchParamsObj]);

  if (loading) return <div className="max-w-screen-2xl mx-auto px-4 py-12 text-white">Loading analytics...</div>;
  if ((!session?.user && !isPublicView) || !data) return <div className="max-w-screen-2xl mx-auto px-4 py-12 text-white">No analytics data available yet.</div>;

  // ── Render mobile page on small screens ──────────────────────
  if (isMobile && !forceFullView) {
    return (
      <MobileAnalyticsPage
        summary={data.summary}
        insights={data.insights}
        trends={data.trends}
        history={data.history}
        advanced={data.advanced}
        range={range}
        onRangeChange={setRange}
      />
    );
  }

  const { summary, distributions, trends, activity, insights, charts, textReport, advanced, history } = data;
  const handleOpenPrintableReport = () => {
    const params = new URLSearchParams();
    params.set("print", "1");
    params.set("range", range);
    if (isPublicView && publicUsername) {
      params.set("public", "1");
      params.set("username", publicUsername);
    }
    const reportUrl = `/analytics/report?${params.toString()}`;
    window.open(reportUrl, "_blank", "noopener,noreferrer");
  };

  const wpmLow = advanced.communication.idealWpmRange[0];
  const wpmHigh = advanced.communication.idealWpmRange[1];
  const communicationCompositeRadar = [
    { metric: "Communication", score: Number(summary.communicationScore.toFixed(1)) },
    { metric: "Confidence", score: Number(summary.confidenceScore.toFixed(1)) },
    { metric: "Grammar", score: Number(summary.grammarScore.toFixed(1)) },
    { metric: "Speaking Pace", score: Number(advanced.communication.speakingWpm.toFixed(1)) },
    { metric: "Sentence", score: Number(advanced.communication.sentenceStructureScore.toFixed(1)) },
    { metric: "Tone", score: Number(advanced.communication.toneConsistency.toFixed(1)) },
  ];
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
    <div className={`overflow-x-hidden w-full max-w-full${isLight ? ' analytics-light' : ''}`}>
      {!isEmbeddedView && <HeaderOffset />}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 flex flex-col gap-6 md:gap-8">
        <div className={`rounded-2xl border p-4 sm:p-6 ${isLight ? 'bg-gradient-to-br from-slate-50 to-white border-gray-200' : 'bg-gradient-to-br from-slate-900/40 to-slate-900/70 border-white/10'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className={`text-2xl sm:text-3xl md:text-4xl font-black ${isLight ? 'text-gray-900' : 'text-white'}`}>Analytics Dashboard</h1>
              <p className={`text-xs sm:text-sm mt-1 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>Your communication-first performance report with clear next steps.</p>
            </div>
            <Badge variant="outline" className={isLight ? 'border-amber-500/60 text-amber-700 w-fit' : 'border-amber-500/40 text-amber-200 w-fit'}>{summary.overallStatus}</Badge>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <select
            className={`border rounded px-3 py-1.5 text-sm ${isLight ? 'bg-white border-gray-300 text-gray-800' : 'bg-slate-900 border-slate-700 text-slate-200'}`}
            value={range}
            onChange={(e) => setRange(e.target.value)}
          >
            <option value="all" style={{ color: "#0f172a", backgroundColor: "#ffffff" }}>All Time</option>
            <option value="last_session" style={{ color: "#0f172a", backgroundColor: "#ffffff" }}>Last Session</option>
            <option value="7d" style={{ color: "#0f172a", backgroundColor: "#ffffff" }}>Last 7 Days</option>
            <option value="30d" style={{ color: "#0f172a", backgroundColor: "#ffffff" }}>Last 30 Days</option>
            <option value="3m" style={{ color: "#0f172a", backgroundColor: "#ffffff" }}>Last 3 Months</option>
            <option value="5m" style={{ color: "#0f172a", backgroundColor: "#ffffff" }}>Last 5 Months</option>
            <option value="1y" style={{ color: "#0f172a", backgroundColor: "#ffffff" }}>Last 1 Year</option>
          </select>
          <Button variant="outline" onClick={handleOpenPrintableReport}>
            Export Report PDF
          </Button>
          {isPublicView && publicUsername && (
            <Button asChild variant="outline" className="border-slate-600 text-slate-200 hover:bg-slate-800">
              <Link href={`/u/${encodeURIComponent(publicUsername)}`}>Back to Public Profile</Link>
            </Button>
          )}
          {!isPublicView && (
            <Button onClick={() => router.push("/train")} className="bg-emerald-500 text-slate-950 hover:bg-emerald-400">
              Focus: {advanced.coach.nextSessionFocus}
            </Button>
          )}
        </div>

        {/* 1 OVERALL PERFORMANCE SUMMARY */}
        <section className="order-1">
          <h2 className={`text-lg font-bold mb-3 ${isLight ? 'text-gray-900' : 'text-white'}`}>Overall Performance Summary</h2>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 xl:grid-cols-6">
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
  <h2 className={`text-lg font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>Priority Chart Order</h2>

  {/* Radar charts — desktop/laptop only (hidden on mobile < 640px) */}
  <div className="hidden sm:block">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(34,211,238,0.15)', border: '1px solid rgba(34,211,238,0.4)', borderRadius: '999px', padding: '2px 10px', fontSize: '12px', fontWeight: 600, color: '#22d3ee' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22d3ee', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
          LIVE
        </span>
        {lastUpdated && (
          <span style={{ fontSize: '11px', color: '#64748b' }}>Updated {lastUpdated.toLocaleTimeString()}</span>
        )}
      </div>
      <button
        onClick={() => {
          const params = new URLSearchParams();
          params.set("range", range);
          fetch(`/api/analytics?${params.toString()}`).then(r => r.ok ? r.json() : null).then(d => { if (d) { setData(d); setLastUpdated(new Date()); } });
        }}
        style={{ fontSize: '12px', color: '#94a3b8', background: 'transparent', border: '1px solid rgba(148,163,184,0.3)', borderRadius: '6px', padding: '3px 10px', cursor: 'pointer' }}
      >
        ↻ Refresh
      </button>
    </div>
    <div className="grid grid-cols-2 gap-4">
    {/* Body Language Composite Radar */}
    <div style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', background: 'rgba(15,23,42,0.6)', height: '520px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '18px 20px 10px 20px', flexShrink: 0 }}>
        <span style={{ fontSize: '15px', fontWeight: 600, color: '#e2e8f0' }}>Body Language Composite Radar</span>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={advanced.behavioral.compositeRadar} outerRadius="78%" margin={{ top: 40, right: 60, bottom: 40, left: 70 }}>
            <PolarGrid stroke="#334155" />
            <PolarAngleAxis dataKey="metric" tick={<RadarCustomTick />} />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} tickCount={5} />
            <Radar dataKey="score" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.45} strokeWidth={2.5} />
            <ChartTooltip />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
    {/* Communication Composite Radar */}
    <div style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', background: 'rgba(15,23,42,0.6)', height: '520px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '18px 20px 10px 20px', flexShrink: 0 }}>
        <span style={{ fontSize: '15px', fontWeight: 600, color: '#e2e8f0' }}>Communication Composite Radar</span>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={communicationCompositeRadar} outerRadius="78%" margin={{ top: 40, right: 60, bottom: 40, left: 70 }}>
            <PolarGrid stroke="#334155" />
            <PolarAngleAxis dataKey="metric" tick={<RadarCustomTick />} />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} tickCount={5} />
            <Radar dataKey="score" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.45} strokeWidth={2.5} />
            <ChartTooltip />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
  </div>

  <div className="grid gap-6 lg:grid-cols-2">
    <Card className="border-white/10 bg-slate-900/60"><CardHeader><CardTitle className="text-sm text-slate-300">Filler Word Frequency</CardTitle></CardHeader><CardContent className="h-[240px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={advanced.communication.fillerWords}><CartesianGrid strokeDasharray="3 3" stroke="#1f2937" /><XAxis dataKey="word" stroke="#94a3b8" fontSize={10} /><YAxis stroke="#94a3b8" fontSize={10} /><ChartTooltip /><Bar dataKey="count" fill="#10b981" /></BarChart></ResponsiveContainer></CardContent></Card>
    <Card className="border-white/10 bg-slate-900/60"><CardHeader><CardTitle className="text-sm text-slate-300">Accuracy vs Speed</CardTitle></CardHeader><CardContent className="h-[260px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={accuracyVsSpeedSeries}><CartesianGrid strokeDasharray="3 3" stroke="#1f2937" /><XAxis type="number" dataKey="speed" stroke="#94a3b8" fontSize={10} domain={["dataMin", "dataMax"]} tickCount={8} tickFormatter={(value) => `${value}m`} /><YAxis dataKey="accuracy" domain={[0, 100]} stroke="#94a3b8" fontSize={10} /><ChartTooltip formatter={(value, name) => [value, name === "accuracy" ? "Avg Accuracy" : "Samples"]} labelFormatter={(label) => `${label} min`} /><Legend /><Line type="monotone" dataKey="accuracy" stroke="#fb923c" strokeWidth={2} dot={{ r: 3, fill: "#ffffff", stroke: "#fb923c", strokeWidth: 2 }} activeDot={{ r: 5, fill: "#ffffff", stroke: "#f97316", strokeWidth: 2 }} /></LineChart></ResponsiveContainer></CardContent></Card>
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
          <h2 className={`text-lg font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>Speech & Communication Intelligence</h2>
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
          <h2 className={`text-lg font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>Text-based Report Intelligence</h2>
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
          <h2 className={`text-lg font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>Confidence & Session Tracking</h2>
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
          <h2 className={`text-lg font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>Interview Accuracy Intelligence</h2>
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
          <h2 className={`text-lg font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>Company Readiness Intelligence</h2>
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
          <h2 className={`text-lg font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>Practice Distribution</h2>
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
          <h2 className={`text-lg font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>AI Coach Insights</h2>
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
          <Card className="border-white/10 bg-slate-900/60"><CardContent className="p-6"><Heatmap activity={activity} /></CardContent></Card>
        </section>

        <div className={`flex justify-end text-xs sm:text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>Total practice: {formatDuration(summary.totalDurationMinutes)} | Sessions: {summary.totalSessions}</div>
      </div>
    </div>
  );
}

export default function AnalyticsDashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <AnalyticsDashboardPageContent />
    </Suspense>
  );
}
