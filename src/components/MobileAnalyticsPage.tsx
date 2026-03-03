"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
} from "recharts";
import {
  TrendingUp,
  Brain,
  Mic,
  BookOpen,
  Target,
  Zap,
  ChevronDown,
  ChevronRight,
  Star,
  Activity,
  BarChart2,
  Clock,
  Award,
  MessageSquare,
  AlertCircle,
} from "lucide-react";

/* ─── Types (minimal subset of AnalyticsResponse) ─── */
interface MobileAnalyticsProps {
  summary: {
    communicationScore: number;
    confidenceScore: number;
    grammarScore: number;
    vocabularyScore: number;
    technicalScore: number;
    overallScore: number;
    overallStatus: string;
    totalSessions: number;
    totalDurationMinutes: number;
    totalQuestions: number;
    completionRate: number;
  };
  insights: {
    focusAreas: string[];
    tips: string[];
    mostPracticed: Array<{ name: string; count: number }>;
    commonGrammarIssues: string[];
  };
  trends: Array<{ date: string; communication: number; confidence: number; grammar: number; technical: number }>;
  history: {
    sessions: Array<{ sessionId: string; company: string; module: string; date: string; score: number; status: string }>;
  };
  advanced: {
    communication: { speakingWpm: number; fillerRate: number; sentenceStructureScore: number; toneConsistency: number };
    grammar: { beforeAfter: { before: number; after: number }; errorFrequency: number };
    coach: { strengths: string[]; weaknesses: string[]; plan7Day: string[]; nextSessionFocus: string; readinessSummary: string };
    behavioral?: { compositeRadar: Array<{ metric: string; score: number }>; hasData: boolean };
  };
  onRangeChange?: (range: string) => void;
  range?: string;
}

/* ─── Orb ─── */
const Orb = ({ className }: { className: string }) => (
  <div className={`pointer-events-none absolute rounded-full opacity-15 ${className}`} />
);

/* ─── Score Ring ─── */
const MiniRing = ({ score, color, label }: { score: number; color: string; label: string }) => {
  const r = 28;
  const stroke = 5;
  const nr = r - stroke / 2;
  const circ = nr * 2 * Math.PI;
  const offset = circ - (Math.max(0, Math.min(100, score)) / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg height={r * 2} width={r * 2} className="-rotate-90">
        <circle stroke="#1e293b" fill="transparent" strokeWidth={stroke} r={nr} cx={r} cy={r} />
        <circle stroke={color} fill="transparent" strokeLinecap="round" strokeWidth={stroke}
          strokeDasharray={`${circ} ${circ}`} style={{ strokeDashoffset: offset }} r={nr} cx={r} cy={r} />
      </svg>
      <span className="text-[10px] font-bold text-white -mt-8 mb-6">{Math.round(score)}</span>
      <span className="text-[9px] text-slate-400 text-center leading-tight">{label}</span>
    </div>
  );
};

/* ─── Accordion ─── */
const Accordion = ({ title, icon: Icon, children, defaultOpen = false }: { title: string; icon: React.ElementType; children: React.ReactNode; defaultOpen?: boolean }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-4 text-left"
      >
        <span className="flex items-center gap-2.5 text-sm font-bold text-white">
          <Icon className="h-4 w-4 text-purple-400" />
          {title}
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
};

/* ─── Status badge ─── */
const StatusBadge = ({ status }: { status: string }) => {
  const color =
    status === "Passed" || status === "Excellent" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" :
    status === "Good" ? "bg-blue-500/20 text-blue-300 border-blue-500/30" :
    "bg-amber-500/20 text-amber-300 border-amber-500/30";
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${color}`}>{status}</span>
  );
};

const formatDur = (min: number) => {
  if (!min) return "0m";
  const h = Math.floor(min / 60), m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

/* ─── Radar custom tick wraps two-word labels to two lines ─── */
function RadarTick({ x, y, payload, textAnchor }: { x?: number; y?: number; payload?: { value: string }; textAnchor?: string }) {
  const words = (payload?.value ?? "").split(" ");
  return (
    <text x={x} y={y} textAnchor={(textAnchor ?? "middle") as "middle" | "start" | "end"} fill="#cbd5e1" fontSize={11} fontWeight={600}>
      {words.length === 1 ? (
        <tspan x={x} dy="0">{words[0]}</tspan>
      ) : (
        <>
          <tspan x={x} dy="-5">{words[0]}</tspan>
          <tspan x={x} dy="13">{words[1]}</tspan>
        </>
      )}
    </text>
  );
}

/* ═══════════════════════════════════════════════════════════ */
const MobileAnalyticsPage = ({ summary, insights, trends, history, advanced, onRangeChange, range = "all" }: MobileAnalyticsProps) => {
  const recentSessions = history.sessions.slice(0, 5);
  const latestTrend = trends.slice(-5);

  const communicationRadar = [
    { metric: "Communication", score: Number(summary.communicationScore.toFixed(1)) },
    { metric: "Confidence", score: Number(summary.confidenceScore.toFixed(1)) },
    { metric: "Grammar", score: Number(summary.grammarScore.toFixed(1)) },
    { metric: "Speaking Pace", score: Number(advanced.communication.speakingWpm.toFixed(1)) },
    { metric: "Sentence", score: Number(advanced.communication.sentenceStructureScore.toFixed(1)) },
    { metric: "Tone", score: Number(advanced.communication.toneConsistency.toFixed(1)) },
  ];

  const overallColor =
    summary.overallScore >= 80 ? "#22c55e" :
    summary.overallScore >= 60 ? "#38bdf8" : "#f97316";

  return (
    <div className="relative overflow-x-hidden bg-slate-950 text-white min-h-screen pb-16">
      {/* ── HEADER ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-purple-950/60 to-slate-950 px-5 pb-8 pt-6">
        <Orb className="left-[-50px] top-[-30px] h-44 w-44 bg-purple-500" />
        <Orb className="right-[-30px] bottom-[-20px] h-36 w-36 bg-blue-500" />

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-900/40 px-3 py-1.5 text-[10px] font-bold text-purple-200"
        >
          <BarChart2 className="h-3 w-3 text-purple-400" />
          Performance Analytics
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-2xl font-extrabold leading-tight tracking-tight mb-1"
        >
          Analytics{" "}
          <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Dashboard
          </span>
        </motion.h1>
        <p className="text-xs text-slate-400 mb-4">Your communication-first performance report</p>

        {/* Full Desktop View button — always visible at top */}
        <Link
          href="/analytics?view=full"
          className="flex items-center justify-center gap-2 w-full rounded-2xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-3 text-sm font-bold text-cyan-300 mb-5 active:scale-[0.97] transition-transform"
        >
          <BarChart2 className="h-4 w-4" />
          View Full Analytics Dashboard
          <ChevronRight className="h-4 w-4 ml-auto" />
        </Link>

        {/* Range selector */}
        {onRangeChange && (
          <select
            value={range}
            onChange={(e) => onRangeChange(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white mb-5 focus:outline-none"
          >
            {[
              ["all", "All Time"],
              ["last_session", "Last Session"],
              ["7d", "Last 7 Days"],
              ["30d", "Last 30 Days"],
              ["3m", "Last 3 Months"],
              ["1y", "Last 1 Year"],
            ].map(([v, l]) => (
              <option key={v} value={v} style={{ backgroundColor: "#0f172a" }}>{l}</option>
            ))}
          </select>
        )}

        {/* Overall score big ring */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-5 bg-white/5 border border-white/10 rounded-2xl p-4"
        >
          <div className="relative flex flex-col items-center">
            {(() => {
              const r = 44, stroke = 7, nr = r - stroke / 2;
              const circ = nr * 2 * Math.PI;
              const offset = circ - (Math.max(0, Math.min(100, summary.overallScore)) / 100) * circ;
              return (
                <>
                  <svg height={r * 2} width={r * 2} className="-rotate-90">
                    <circle stroke="#1e293b" fill="transparent" strokeWidth={stroke} r={nr} cx={r} cy={r} />
                    <circle stroke={overallColor} fill="transparent" strokeLinecap="round" strokeWidth={stroke}
                      strokeDasharray={`${circ} ${circ}`} style={{ strokeDashoffset: offset }} r={nr} cx={r} cy={r} />
                  </svg>
                  <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xl font-black text-white">
                    {Math.round(summary.overallScore)}
                  </span>
                </>
              );
            })()}
          </div>
          <div>
            <StatusBadge status={summary.overallStatus} />
            <p className="text-lg font-black text-white mt-1">Overall Score</p>
            <p className="text-xs text-slate-400">{summary.totalSessions} sessions · {formatDur(summary.totalDurationMinutes)} practice</p>
          </div>
        </motion.div>
      </div>

      {/* ── KEY METRICS GRID ───────────────────────────────── */}
      <section className="px-5 pt-6 pb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400 mb-3">Core Skills</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Communication", score: summary.communicationScore, color: "#a78bfa" },
            { label: "Confidence",    score: summary.confidenceScore,    color: "#38bdf8" },
            { label: "Grammar",       score: summary.grammarScore,       color: "#34d399" },
          ].map(({ label, score, color }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-3 flex flex-col items-center"
            >
              <MiniRing score={score} color={color} label={label} />
            </motion.div>
          ))}
        </div>

        {/* Secondary metrics */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          {[
            { icon: Mic,         label: "Speaking Pace",   value: `${advanced.communication.speakingWpm.toFixed(1)} WPM`, color: "from-orange-500 to-amber-500"  },
            { icon: BookOpen,    label: "Vocabulary",      value: `${Math.round(summary.vocabularyScore ?? 0)}`,          color: "from-purple-500 to-pink-500"   },
            { icon: MessageSquare, label: "Tone Consistency", value: `${Math.round(advanced.communication.toneConsistency)}%`, color: "from-cyan-500 to-blue-500"  },
            { icon: Target,      label: "Completion Rate", value: `${summary.completionRate}%`,                            color: "from-emerald-500 to-teal-500"  },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 flex items-center gap-2.5">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${color}`}>
                <Icon className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 leading-none">{label}</p>
                <p className="text-sm font-bold text-white mt-0.5">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── QUICK STATS ─────────────────────────────────────── */}
      <section className="px-5 py-2">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Sessions",  value: summary.totalSessions                   },
            { label: "Questions", value: summary.totalQuestions                  },
            { label: "Practice",  value: formatDur(summary.totalDurationMinutes) },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
              <p className="text-lg font-extrabold text-white">{value}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── TREND (last 5 sessions) ─────────────────────────── */}
      {latestTrend.length > 0 && (
        <section className="px-5 py-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-400 mb-3">Recent Trend</p>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500 text-[10px]">
                  <th className="text-left pb-2">Date</th>
                  <th className="text-right pb-2 text-violet-300">Comm.</th>
                  <th className="text-right pb-2 text-sky-300">Conf.</th>
                  <th className="text-right pb-2 text-emerald-300">Gram.</th>
                </tr>
              </thead>
              <tbody>
                {latestTrend.map((t) => (
                  <tr key={t.date} className="border-t border-white/5">
                    <td className="py-1.5 text-slate-400">{t.date.slice(5)}</td>
                    <td className="text-right text-violet-300 font-semibold">{t.communication}</td>
                    <td className="text-right text-sky-300 font-semibold">{t.confidence}</td>
                    <td className="text-right text-emerald-300 font-semibold">{t.grammar}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── ACCORDIONS ──────────────────────────────────────── */}
      <section className="px-5 space-y-3 pb-4">

        {/* AI Coach Tips */}
        <Accordion title="AI Coach Tips" icon={Brain} defaultOpen>
          <div className="space-y-2">
            {insights.tips.length > 0 ? insights.tips.map((tip, i) => (
              <div key={i} className="flex gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                <Zap className="h-3.5 w-3.5 text-yellow-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300 leading-relaxed">{tip}</p>
              </div>
            )) : <p className="text-xs text-slate-400">Complete more sessions to get personalized tips.</p>}
          </div>
        </Accordion>

        {/* Focus Areas */}
        <Accordion title="Focus Areas" icon={Target}>
          <div className="space-y-2">
            {insights.focusAreas.length > 0 ? insights.focusAreas.map((area) => (
              <div key={area} className="flex items-center justify-between rounded-xl border border-purple-500/20 bg-purple-500/10 px-3 py-2.5">
                <span className="text-xs font-semibold text-purple-200">{area}</span>
                <AlertCircle className="h-3.5 w-3.5 text-purple-400" />
              </div>
            )) : <p className="text-xs text-slate-400">No focus areas identified yet.</p>}
          </div>
        </Accordion>

        {/* 7-Day Plan */}
        {advanced.coach.plan7Day.length > 0 && (
          <Accordion title="7-Day Improvement Plan" icon={Activity}>
            <ol className="space-y-2">
              {advanced.coach.plan7Day.map((step, i) => (
                <li key={i} className="flex gap-2.5 items-start">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-blue-600 text-[10px] font-black text-white">
                    {i + 1}
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">{step}</p>
                </li>
              ))}
            </ol>
          </Accordion>
        )}

        {/* Strengths & Weaknesses */}
        {(advanced.coach.strengths.length > 0 || advanced.coach.weaknesses.length > 0) && (
          <Accordion title="Strengths & Weaknesses" icon={Award}>
            {advanced.coach.strengths.length > 0 && (
              <div className="mb-3">
                <p className="text-[10px] font-bold uppercase text-emerald-400 mb-2">Strengths</p>
                <div className="space-y-1.5">
                  {advanced.coach.strengths.map((s, i) => (
                    <div key={i} className="flex gap-2 items-start rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2">
                      <Star className="h-3 w-3 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-xs text-emerald-200">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {advanced.coach.weaknesses.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase text-amber-400 mb-2">Needs Work</p>
                <div className="space-y-1.5">
                  {advanced.coach.weaknesses.map((w, i) => (
                    <div key={i} className="flex gap-2 items-start rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2">
                      <AlertCircle className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />
                      <span className="text-xs text-amber-200">{w}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Accordion>
        )}

        {/* Grammar Progress */}
        {(advanced.grammar.beforeAfter.before > 0 || advanced.grammar.beforeAfter.after > 0) && (
          <Accordion title="Grammar Progress" icon={BookOpen}>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                <p className="text-xs text-slate-400 mb-1">Before</p>
                <p className="text-2xl font-extrabold text-amber-300">{Math.round(advanced.grammar.beforeAfter.before)}</p>
              </div>
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-center">
                <p className="text-xs text-slate-400 mb-1">After</p>
                <p className="text-2xl font-extrabold text-emerald-300">{Math.round(advanced.grammar.beforeAfter.after)}</p>
              </div>
            </div>
            {advanced.grammar.errorFrequency > 0 && (
              <p className="text-xs text-slate-400 mt-3">Grammar issues in {advanced.grammar.errorFrequency.toFixed(1)}% of responses.</p>
            )}
          </Accordion>
        )}

        {/* Recent Sessions */}
        {recentSessions.length > 0 && (
          <Accordion title="Recent Sessions" icon={Clock}>
            <div className="space-y-2">
              {recentSessions.map((s) => (
                <div key={s.sessionId} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                  <div>
                    <p className="text-xs font-semibold text-white">{s.company || s.module}</p>
                    <p className="text-[10px] text-slate-500">{s.date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{Math.round(s.score)}</span>
                    <StatusBadge status={s.status} />
                  </div>
                </div>
              ))}
            </div>
          </Accordion>
        )}
      </section>

      {/* ── RADAR CHARTS ──────────────────────────────────── */}
      <section className="px-4 pb-4 space-y-4">
        {/* Body Language Composite Radar */}
        {advanced.behavioral?.hasData && advanced.behavioral.compositeRadar.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-bold text-white mb-2">Body Language Composite Radar</p>
            <div style={{ width: '100%', height: '260px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={advanced.behavioral.compositeRadar} outerRadius="65%" margin={{ top: 25, right: 40, bottom: 25, left: 40 }}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="metric" tick={<RadarTick />} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar dataKey="score" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.4} strokeWidth={2} />
                  <ChartTooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        {/* Communication Composite Radar */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-bold text-white mb-2">Communication Composite Radar</p>
          <div style={{ width: '100%', height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={communicationRadar} outerRadius="65%" margin={{ top: 25, right: 40, bottom: 25, left: 40 }}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="metric" tick={<RadarTick />} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar dataKey="score" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.4} strokeWidth={2} />
                <ChartTooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* ── CTA FOOTER ──────────────────────────────────────── */}
      <section className="px-5 pt-2 pb-6">
        <div className="rounded-3xl border border-purple-500/30 bg-gradient-to-br from-purple-900/30 to-blue-900/30 p-5 text-center">
          <p className="text-xs text-slate-400 mb-1">Next Focus Area</p>
          <h3 className="text-base font-extrabold text-white mb-3">{advanced.coach.nextSessionFocus || "Keep practicing!"}</h3>
          <Link
            href="/train"
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-purple-500/25 active:scale-[0.97]"
          >
            <TrendingUp className="h-4 w-4" />
            Start Training Session
          </Link>
          <Link
            href="/analytics?view=full"
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-300 mt-2 active:scale-[0.97]"
          >
            View Full Report
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default MobileAnalyticsPage;
