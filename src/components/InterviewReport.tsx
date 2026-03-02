'use client';

import React, { useRef } from 'react';
import {
  Star,
  TrendingUp,
  AlertCircle,
  Sparkles,
  Clock,
  Mic,
  Brain,
  Handshake,
  MessageSquare,
  Download,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';

type Role = 'HR' | 'Candidate' | 'EngineeringManager' | 'Host';
type InterviewType = 'PI' | 'Technical';

interface ReportPayload {
  scores: Record<string, number>;
  strengths: string[];
  improvements: string[];
  aiSuggestions: string;
  summary: string;
  duration: number;
  role: Role;
  interviewType: InterviewType;
}

interface InterviewReportProps {
  report: ReportPayload;
  onClose: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const METRIC_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  communication: { label: 'Communication', icon: MessageSquare, color: 'indigo' },
  confidence: { label: 'Confidence', icon: Mic, color: 'purple' },
  grammar: { label: 'Grammar & Fluency', icon: Brain, color: 'blue' },
  fluency: { label: 'Fluency', icon: Mic, color: 'sky' },
  technicalKnowledge: { label: 'Technical Knowledge', icon: Brain, color: 'cyan' },
  problemSolving: { label: 'Problem Solving', icon: Brain, color: 'teal' },
  behavioralClarity: { label: 'Behavioral Clarity', icon: MessageSquare, color: 'violet' },
  selfAwareness: { label: 'Self-Awareness', icon: Sparkles, color: 'fuchsia' },
  participation: { label: 'Participation', icon: Handshake, color: 'green' },
  questionQuality: { label: 'Question Quality', icon: Brain, color: 'indigo' },
  professionalism: { label: 'Professionalism', icon: Handshake, color: 'blue' },
  engagement: { label: 'Engagement', icon: MessageSquare, color: 'purple' },
  followUpDepth: { label: 'Follow-up Depth', icon: ChevronRight, color: 'cyan' },
  fairness: { label: 'Fairness', icon: Star, color: 'yellow' },
  listeningSkill: { label: 'Listening Skill', icon: Mic, color: 'green' },
  overallRating: { label: 'Overall Rating', icon: Star, color: 'amber' },
};

const COLOR_MAP: Record<string, { bar: string; text: string; bg: string }> = {
  indigo: { bar: 'bg-indigo-500', text: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  purple: { bar: 'bg-purple-500', text: 'text-purple-400', bg: 'bg-purple-500/10' },
  blue: { bar: 'bg-blue-500', text: 'text-blue-400', bg: 'bg-blue-500/10' },
  sky: { bar: 'bg-sky-500', text: 'text-sky-400', bg: 'bg-sky-500/10' },
  cyan: { bar: 'bg-cyan-500', text: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  teal: { bar: 'bg-teal-500', text: 'text-teal-400', bg: 'bg-teal-500/10' },
  violet: { bar: 'bg-violet-500', text: 'text-violet-400', bg: 'bg-violet-500/10' },
  fuchsia: { bar: 'bg-fuchsia-500', text: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10' },
  green: { bar: 'bg-green-500', text: 'text-green-400', bg: 'bg-green-500/10' },
  amber: { bar: 'bg-amber-500', text: 'text-amber-400', bg: 'bg-amber-500/10' },
  yellow: { bar: 'bg-yellow-500', text: 'text-yellow-400', bg: 'bg-yellow-500/10' },
};

function scoreColor(score: number): string {
  if (score >= 8) return 'text-green-400';
  if (score >= 6) return 'text-yellow-400';
  return 'text-red-400';
}

function avgScore(scores: Record<string, number>): number {
  const vals = Object.values(scores).filter((v) => typeof v === 'number');
  if (!vals.length) return 0;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
}

function ScoreBar({ label, score, meta }: { label: string; score: number; meta: typeof METRIC_META[string] | undefined }) {
  const c = COLOR_MAP[meta?.color ?? 'indigo'];
  const Icon = meta?.icon ?? Star;
  return (
    <div className="flex items-center gap-3">
      <div className={`w-7 h-7 rounded-lg ${c.bg} flex items-center justify-center shrink-0`}>
        <Icon size={13} className={c.text} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-300 truncate">{meta?.label ?? label}</span>
          <span className={`text-xs font-bold ml-2 ${scoreColor(score)}`}>{score}/10</span>
        </div>
        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div className={`h-full ${c.bar} rounded-full transition-all`} style={{ width: `${score * 10}%` }} />
        </div>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function InterviewReport({ report, onClose }: InterviewReportProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const { scores, strengths, improvements, aiSuggestions, summary, duration, role, interviewType } = report;
  const safeScores = scores ?? {};
  const overall = safeScores.overallRating ?? avgScore(safeScores);
  const mins = Math.floor(duration / 60);
  const secs = duration % 60;
  const durationStr = `${mins}m ${secs}s`;
  const mainScores = Object.entries(safeScores).filter(([k]) => k !== 'overallRating');

  const handlePrint = () => { if (printRef.current) window.print(); };

  const roleLabel = role === 'EngineeringManager' ? 'Engineering Manager' : role;
  const typeLabel = interviewType === 'PI' ? 'Personal Interview' : 'Technical Interview';

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Print-friendly container */}
      <div ref={printRef} className="max-w-3xl mx-auto px-4 py-10">
        {/* Back */}
        <button onClick={onClose} className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors print:hidden">
          <ArrowLeft size={14} /> Back
        </button>

        {/* Hero card */}
        <div className="relative bg-gradient-to-br from-indigo-900/50 to-purple-900/30 border border-indigo-500/20 rounded-2xl p-6 mb-6 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(99,102,241,0.15),transparent_60%)]" />
          <div className="relative">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/20">{typeLabel}</span>
                  <span className="text-xs bg-slate-700/60 text-slate-300 px-2 py-0.5 rounded-full">{roleLabel}</span>
                </div>
                <h1 className="text-2xl font-extrabold mb-1">Interview Report</h1>
                <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                  <Clock size={13} />
                  <span>Duration: {durationStr}</span>
                </div>
              </div>

              <div className="text-right">
                <div className={`text-5xl font-extrabold ${scoreColor(overall)}`}>{overall}</div>
                <div className="text-slate-400 text-xs mt-0.5">out of 10</div>
                <div className="flex items-center justify-end gap-0.5 mt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={12} className={i < Math.round(overall / 2) ? 'text-amber-400 fill-amber-400' : 'text-slate-600'} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        {summary && (
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 mb-5">
            <h2 className="text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">Session Summary</h2>
            <p className="text-slate-300 text-sm leading-relaxed">{summary}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          {/* Score breakdown */}
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
            <h2 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-wide">Score Breakdown</h2>
            <div className="space-y-3">
              {mainScores.map(([key, val]) => (
                <ScoreBar key={key} label={key} score={val} meta={METRIC_META[key]} />
              ))}
            </div>
          </div>

          {/* Strengths & Improvements */}
          <div className="flex flex-col gap-4">
            <div className="bg-slate-800/60 border border-green-500/20 rounded-2xl p-4 flex-1">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={14} className="text-green-400" />
                <h2 className="text-sm font-bold text-green-400 uppercase tracking-wide">Strengths</h2>
              </div>
              {strengths.length === 0 && <p className="text-slate-500 text-xs italic">No strengths detected.</p>}
              <ul className="space-y-1.5">
                {strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                    <span className="text-green-400 mt-0.5 shrink-0">✓</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-800/60 border border-orange-500/20 rounded-2xl p-4 flex-1">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle size={14} className="text-orange-400" />
                <h2 className="text-sm font-bold text-orange-400 uppercase tracking-wide">Areas to Improve</h2>
              </div>
              {improvements.length === 0 && <p className="text-slate-500 text-xs italic">Nothing to improve!</p>}
              <ul className="space-y-1.5">
                {improvements.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                    <span className="text-orange-400 mt-0.5 shrink-0">→</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* AI Suggestions */}
        {aiSuggestions && (
          <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/20 border border-indigo-500/20 rounded-2xl p-5 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-indigo-400" />
              <h2 className="text-sm font-bold text-indigo-300 uppercase tracking-wide">AI Coach Suggestions</h2>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">{aiSuggestions}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 print:hidden">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-300 text-sm font-medium transition-colors"
          >
            <Download size={14} /> Save / Print
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
