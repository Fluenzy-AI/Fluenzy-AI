'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCompanyAuth } from '@/contexts/CompanyAuthContext';
import CompanyPortalLayout from '@/components/CompanyPortalLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Briefcase, Users, UserPlus, Settings, FileText, ScanFace,
  Square, Pause, Play, Clock, Wifi, WifiOff, AlertTriangle, Zap,
  MessageSquare, Brain, BarChart3, ChevronDown, X, ThumbsUp, ThumbsDown, Minus,
  CheckCircle2, TrendingUp, Volume2, Eye, Activity, Smartphone, Loader2, Cpu,
} from 'lucide-react';
import { useInterviewSession } from '@/hooks/useInterviewSession';
import { DeviceDiagnosticsBar } from '@/components/interview/hardware/DeviceDiagnostics';
import { cn } from '@/lib/utils';
import type { CandidateProfile, BehavioralAlert, AIQuestion } from '@/types/interview';
import type { InterviewMode } from '@/types/interview';

const COMPANY_NAV = [
  { label: 'Dashboard', href: '/company/portal', icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: 'Job Postings', href: '/company/portal/jobs', icon: <Briefcase className="w-4 h-4" /> },
  { label: 'Applications', href: '/company/portal/applications', icon: <Users className="w-4 h-4" /> },
  { label: 'Assessments', href: '/company/portal/assessments', icon: <FileText className="w-4 h-4" /> },
  { label: 'HireLens AI', href: '/company/portal/hirelens', icon: <ScanFace className="w-4 h-4" /> },
  { label: 'Team', href: '/company/portal/team', icon: <UserPlus className="w-4 h-4" />, adminOnly: true },
  { label: 'Settings', href: '/company/portal/settings', icon: <Settings className="w-4 h-4" />, adminOnly: true },
];

// ─── Score Ring Component ─────────────────────────────────────────────────────

function ScoreRing({
  value,
  label,
  color,
  icon: Icon,
  size = 80,
}: {
  value: number;
  label: string;
  color: string;
  icon: React.ElementType;
  size?: number;
}) {
  const r = (size / 2) - 8;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, value));
  const offset = circ - (pct / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={6}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon className="w-3.5 h-3.5 mb-0.5" style={{ color }} />
          <span className="text-lg font-bold text-white leading-none">{Math.round(pct)}</span>
        </div>
      </div>
      <span className="text-xs text-slate-400 font-medium">{label}</span>
    </div>
  );
}

// ─── Composite Score Arc ─────────────────────────────────────────────────────

function CompositeArc({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  const angle = (pct / 100) * 180 - 90;

  const getColor = (v: number) =>
    v >= 75 ? '#22c55e' : v >= 55 ? '#eab308' : '#ef4444';

  const getLabel = (v: number) =>
    v >= 75 ? 'Strong' : v >= 55 ? 'Moderate' : 'Weak';

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-36 h-20">
        <svg viewBox="0 0 144 80" className="w-full h-full" fill="none">
          {/* Background arc */}
          <path d="M 12 72 A 60 60 0 0 1 132 72" stroke="rgba(255,255,255,0.06)" strokeWidth="10" strokeLinecap="round" />
          {/* Value arc */}
          <path
            d="M 12 72 A 60 60 0 0 1 132 72"
            stroke={getColor(pct)}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${(pct / 100) * 188} 188`}
            style={{ transition: 'stroke-dasharray 1s ease, stroke 0.5s ease' }}
          />
          {/* Needle */}
          <line
            x1="72" y1="72"
            x2={72 + 44 * Math.cos((angle * Math.PI) / 180)}
            y2={72 + 44 * Math.sin((angle * Math.PI) / 180)}
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            style={{ transition: 'all 1s ease' }}
          />
          <circle cx="72" cy="72" r="4" fill="white" />
        </svg>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
          <span className="text-2xl font-black text-white">{Math.round(pct)}</span>
          <span className="text-xs text-slate-400 ml-1">/ 100</span>
        </div>
      </div>
      <span className="text-xs font-semibold" style={{ color: getColor(pct) }}>
        {getLabel(pct)} Candidate
      </span>
    </div>
  );
}

// ─── Alert Card ───────────────────────────────────────────────────────────────

function AlertCard({ alert, onDismiss }: { alert: BehavioralAlert; onDismiss: () => void }) {
  const config = {
    INFO: { border: 'border-blue-500/30', bg: 'bg-blue-500/8', icon: 'text-blue-400', dot: 'bg-blue-400' },
    WARNING: { border: 'border-amber-500/30', bg: 'bg-amber-500/8', icon: 'text-amber-400', dot: 'bg-amber-400' },
    CRITICAL: { border: 'border-red-500/30', bg: 'bg-red-500/8', icon: 'text-red-400', dot: 'bg-red-400' },
  }[alert.severity];

  const typeLabels: Record<string, string> = {
    STRESS_SPIKE: '😰 Stress Spike',
    CONTRADICTION: '⚡ Contradiction',
    EVASION: '🔍 Evasion Detected',
    LOW_ENGAGEMENT: '😐 Low Engagement',
    FILLER_OVERUSE: '🗣 Filler Overuse',
    LONG_PAUSE: '⏸ Long Pause',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`p-3 rounded-xl border ${config.border} ${config.bg} relative group`}
    >
      <button
        onClick={onDismiss}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-slate-600 hover:text-slate-300 transition-all"
      >
        <X className="w-3 h-3" />
      </button>
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-1.5 h-1.5 rounded-full ${config.dot} flex-shrink-0`} />
        <span className={`text-xs font-bold ${config.icon}`}>{typeLabels[alert.alertType] || alert.alertType}</span>
        <span className="text-[10px] text-slate-600 ml-auto">
          {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      </div>
      <p className="text-xs text-slate-300 leading-relaxed">{alert.message}</p>
    </motion.div>
  );
}

// ─── AI Question Card ─────────────────────────────────────────────────────────

function QuestionCard({ q, onDismiss }: { q: AIQuestion; onDismiss: () => void }) {
  const typeConfig = {
    DEPTH_PROBE: { label: 'Depth Probe', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    STRESS_TEST: { label: 'Stress Test', color: 'text-red-400', bg: 'bg-red-500/10' },
    CONTRADICTION: { label: 'Contradiction', color: 'text-amber-400', bg: 'bg-amber-500/10' },
    TECHNICAL: { label: 'Technical', color: 'text-purple-400', bg: 'bg-purple-500/10' },
    CULTURE_FIT: { label: 'Culture Fit', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  }[q.type] || { label: q.type, color: 'text-slate-400', bg: 'bg-slate-700/50' };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 group relative"
    >
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-slate-600 hover:text-slate-300 transition-all"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      <div className="flex items-center gap-2 mb-2">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${typeConfig.bg} ${typeConfig.color}`}>
          {typeConfig.label}
        </span>
      </div>

      <p className="text-sm text-white font-medium leading-relaxed mb-2">
        &ldquo;{q.text}&rdquo;
      </p>

      <p className="text-[10px] text-slate-500 flex items-center gap-1">
        <Zap className="w-2.5 h-2.5 text-indigo-400" />
        {q.triggerReason}
      </p>
    </motion.div>
  );
}

// ─── Verdict Panel ────────────────────────────────────────────────────────────

function VerdictPanel({ scores, onClose }: { scores: { composite: number; communication: number; technical: number; confidence: number; behavioral: number }; onClose: () => void }) {
  const verdict = scores.composite >= 72 ? 'HIRE' : scores.composite >= 52 ? 'REVIEW' : 'REJECT';

  const verdictConfig = {
    HIRE: { label: 'Recommended to Hire', icon: ThumbsUp, color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', emoji: '🎉' },
    REVIEW: { label: 'Further Review Recommended', icon: Minus, color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30', emoji: '🔍' },
    REJECT: { label: 'Not Recommended', icon: ThumbsDown, color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/30', emoji: '❌' },
  }[verdict];

  const VerdictIcon = verdictConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md w-full shadow-2xl"
      >
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">{verdictConfig.emoji}</div>
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${verdictConfig.bg} border ${verdictConfig.border} mb-3`}>
            <VerdictIcon className={`w-4 h-4 ${verdictConfig.color}`} />
            <span className={`font-bold text-sm ${verdictConfig.color}`}>{verdictConfig.label}</span>
          </div>
          <h2 className="text-2xl font-black text-white">
            Composite Score: {Math.round(scores.composite)}
          </h2>
        </div>

        {/* Sub scores */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { label: 'Communication', value: scores.communication, icon: Volume2 },
            { label: 'Technical', value: scores.technical, icon: Brain },
            { label: 'Confidence', value: scores.confidence, icon: TrendingUp },
            { label: 'Behavioral', value: scores.behavioral, icon: Activity },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-slate-800/60 rounded-xl p-3 flex items-center gap-3">
              <Icon className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-400">{label}</p>
                <p className="text-lg font-bold text-white">{Math.round(value)}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold transition-all"
          >
            View Full Report
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-all text-sm"
          >
            Start New Interview
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function HireLensLiveDashboard() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user, loading } = useCompanyAuth();
  const router = useRouter();

  const [candidate, setCandidate] = useState<CandidateProfile | null>(null);
  const [showVerdict, setShowVerdict] = useState(false);
  const [activeTab, setActiveTab] = useState<'transcript' | 'alerts' | 'questions'>('transcript');
  const [sessionMode, setSessionMode] = useState<InterviewMode>('MOBILE');
  const [hardwareDeviceId, setHardwareDeviceId] = useState<string | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const {
    status, scores, transcript, alerts, aiQuestions, elapsedSeconds,
    mobileConnected, confirmMobileConnected,
    deviceStreaming, confirmDeviceStreaming,
    activateSession, endSession, pauseSession, resumeSession,
    dismissQuestion, dismissAlert,
  } = useInterviewSession(sessionId, candidate);

  useEffect(() => {
    if (!loading && !user) router.push('/company/login');
  }, [user, loading, router]);

  // Poll for mobile device joining (for sessions arriving directly at dashboard URL)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (mobileConnected) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    // Check sessionStorage for the pairing code first
    const pairingCode = typeof window !== 'undefined'
      ? sessionStorage.getItem(`hirelens_pairing_${sessionId}`)
      : null;

    if (!pairingCode) {
      // No pairing code stored — likely a direct link; auto-connect for demo
      const t = setTimeout(() => confirmMobileConnected(), 3000);
      return () => clearTimeout(t);
    }

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/interview/sessions/create?pairingCode=${pairingCode}`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.mobileConnected) {
            clearInterval(pollRef.current!);
            confirmMobileConnected();
          }
        }
      } catch { /* continue polling */ }
    }, 2000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [mobileConnected, sessionId, confirmMobileConnected]);

  // Load candidate + session mode from sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && sessionId) {
      // Mode
      const mode = sessionStorage.getItem(`hirelens_mode_${sessionId}`) as InterviewMode | null;
      if (mode) setSessionMode(mode);

      // Device (hardware mode)
      const deviceId = sessionStorage.getItem(`hirelens_device_${sessionId}`);
      if (deviceId) setHardwareDeviceId(deviceId);

      // Candidate
      const stored = sessionStorage.getItem(`hirelens_candidate_${sessionId}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setCandidate({ id: parsed.sessionId, name: parsed.name, email: parsed.email, jobRole: parsed.jobRole });
        } catch { /* ignore */ }
      } else {
        setCandidate({ id: sessionId, name: 'Demo Candidate', email: 'demo@example.com', jobRole: 'Software Engineer' });
      }
    }
  }, [sessionId]);

  // Auto-start: mobile sessions wait for mobileConnected; hardware sessions wait for deviceStreaming
  useEffect(() => {
    if (sessionMode === 'HARDWARE') {
      if (candidate && deviceStreaming && status === 'PENDING') {
        const t = setTimeout(() => activateSession(), 800);
        return () => clearTimeout(t);
      }
    } else {
      if (candidate && mobileConnected && status === 'PENDING') {
        const t = setTimeout(() => activateSession(), 800);
        return () => clearTimeout(t);
      }
    }
  }, [candidate, mobileConnected, deviceStreaming, sessionMode, status, activateSession]);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
      : `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const handleEndSession = () => {
    endSession();
    if (scores) setShowVerdict(true);
  };

  const isActive = status === 'ACTIVE';
  const isPaused = status === 'PAUSED';
  const isEnded = status === 'ENDED';

  return (
    <CompanyPortalLayout navItems={COMPANY_NAV} title={`HireLens Live — ${candidate?.name ?? 'Loading…'}`}>

      {/* Verdict Modal */}
      {showVerdict && scores && (
        <VerdictPanel scores={scores} onClose={() => { setShowVerdict(false); router.push('/company/portal/hirelens'); }} />
      )}

      {/* ── Waiting overlay — mode-aware ─────────────────────────────────── */}
      <AnimatePresence>
        {((sessionMode === 'MOBILE' && !mobileConnected) ||
          (sessionMode === 'HARDWARE' && !deviceStreaming)) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-slate-950/95 backdrop-blur-sm flex flex-col items-center justify-center gap-6 px-6 text-center"
          >
            {sessionMode === 'HARDWARE' ? (
              /* ── Hardware: waiting for collar ── */
              <>
                <motion.div
                  animate={{ scale: [1, 1.06, 1] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                  className="w-20 h-20 rounded-2xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center"
                >
                  <Cpu className="w-9 h-9 text-indigo-400" />
                </motion.div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-white">Waiting for collar to stream…</h2>
                  <p className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed">
                    The HireLens collar device is connecting to the AI cloud via WiFi.
                    Make sure it is powered on and within range.
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300 text-xs font-semibold">💻 Laptop ready</span>
                  </div>
                  <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700">
                    <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                    <span className="text-slate-400 text-xs font-semibold">🎙️ Collar connecting…</span>
                  </div>
                </div>

                <button
                  onClick={confirmDeviceStreaming}
                  className="text-xs text-indigo-400/60 underline underline-offset-2"
                >
                  Device already streaming — skip wait
                </button>
              </>
            ) : (
              /* ── Mobile: waiting for phone ── */
              <>
                <motion.div
                  animate={{ scale: [1, 1.06, 1] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                  className="w-20 h-20 rounded-2xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center"
                >
                  <Smartphone className="w-9 h-9 text-indigo-400" />
                </motion.div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-white">Waiting for phone to connect…</h2>
                  <p className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed">
                    Open Fluenzy AI on your phone, sign in with the same account, and scan the QR code
                    (or enter the pairing code) shown on the previous screen.
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300 text-xs font-semibold">💻 Laptop ready</span>
                  </div>
                  <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700">
                    <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                    <span className="text-slate-400 text-xs font-semibold">📱 Phone pairing…</span>
                  </div>
                </div>

                <p className="text-slate-600 text-xs">
                  Once the phone connects, this dashboard will activate automatically.
                </p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4 h-full">

        {/* ── Top Bar ────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            {/* Status pulse */}
            <div className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border',
              isActive ? 'bg-red-500/10 border-red-500/30 text-red-400' :
              isPaused ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
              isEnded ? 'bg-slate-700 border-slate-600 text-slate-400' :
              'bg-slate-800 border-slate-700 text-slate-400'
            )}>
              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />}
              {isPaused && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
              {isActive ? 'LIVE' : isPaused ? 'PAUSED' : isEnded ? 'ENDED' : 'STARTING…'}
            </div>

            {/* Timer */}
            <div className="flex items-center gap-1.5 text-sm text-slate-300 font-mono">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              {formatTime(elapsedSeconds)}
            </div>

            {/* Mode chip */}
            <div className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border',
              sessionMode === 'HARDWARE'
                ? 'bg-blue-500/10 border-blue-500/25 text-blue-300'
                : 'bg-indigo-500/10 border-indigo-500/25 text-indigo-300'
            )}>
              {sessionMode === 'HARDWARE'
                ? <><Cpu className="w-3 h-3" /> HireLens Collar</>
                : <><Smartphone className="w-3 h-3" /> Mobile Capture</>}
            </div>

            {/* Connection */}
            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
              <Wifi className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Connected</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {isActive && (
              <button
                onClick={pauseSession}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-lg text-sm font-medium transition-all"
              >
                <Pause className="w-3.5 h-3.5" /> Pause
              </button>
            )}
            {isPaused && (
              <button
                onClick={resumeSession}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-sm font-medium transition-all"
              >
                <Play className="w-3.5 h-3.5" /> Resume
              </button>
            )}
            {!isEnded && (
              <button
                onClick={handleEndSession}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 rounded-lg text-sm font-semibold transition-all"
              >
                <Square className="w-3.5 h-3.5" /> End Session
              </button>
            )}
          </div>
        </div>

        {/* ── Candidate Info Strip ───────────────────────────────────────── */}
        {candidate && (
          <div className="flex items-center gap-3 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {candidate.name[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-sm">{candidate.name}</p>
              <p className="text-xs text-slate-400">{candidate.jobRole} · {candidate.email}</p>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
              <span className="px-2 py-1 bg-slate-700/60 rounded-lg">📱 Mobile Mode</span>
              <span className="px-2 py-1 bg-slate-700/60 rounded-lg font-mono">{sessionId?.slice(0, 16)}…</span>
            </div>
          </div>
        )}

        {/* ── Main Dashboard Grid ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* ── Left: Scores ─────────────────────────────────────────────── */}
          <div className="lg:col-span-1 space-y-4">

            {/* Composite Score */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 flex flex-col items-center">
              <div className="flex items-center gap-2 mb-4 self-start">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-semibold text-white">Composite Score</span>
              </div>
              {scores ? (
                <CompositeArc value={scores.composite} />
              ) : (
                <div className="w-36 h-20 flex items-center justify-center text-slate-600 text-sm">
                  Starting analysis…
                </div>
              )}
            </div>

            {/* Sub-scores */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-semibold text-white">Live Metrics</span>
                {isActive && <span className="ml-auto flex items-center gap-1 text-[10px] text-red-400 font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />LIVE</span>}
              </div>
              {scores ? (
                <div className="grid grid-cols-2 gap-4">
                  <ScoreRing value={scores.communication} label="Comm" color="#818cf8" icon={Volume2} />
                  <ScoreRing value={scores.technical} label="Technical" color="#a78bfa" icon={Brain} />
                  <ScoreRing value={scores.confidence} label="Confidence" color="#34d399" icon={TrendingUp} />
                  <ScoreRing value={scores.behavioral} label="Behavioral" color="#fb923c" icon={Eye} />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {['Comm', 'Technical', 'Confidence', 'Behavioral'].map(l => (
                    <div key={l} className="flex flex-col items-center gap-1.5">
                      <div className="w-20 h-20 rounded-full border-4 border-slate-700 animate-pulse" />
                      <span className="text-xs text-slate-600">{l}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Alert count summary */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Behavioral Flags
                </span>
                <span className="text-slate-400 text-sm">{alerts.length} total</span>
              </div>
              <div className="flex gap-2 mt-3">
                {(['INFO', 'WARNING', 'CRITICAL'] as const).map(s => {
                  const count = alerts.filter(a => a.severity === s).length;
                  const colors = { INFO: 'bg-blue-500/10 text-blue-400', WARNING: 'bg-amber-500/10 text-amber-400', CRITICAL: 'bg-red-500/10 text-red-400' };
                  return (
                    <div key={s} className={`flex-1 text-center py-2 rounded-lg ${colors[s]}`}>
                      <div className="text-lg font-bold">{count}</div>
                      <div className="text-[10px] font-semibold opacity-80">{s}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Right: Tabbed Panel ───────────────────────────────────────── */}
          <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700 rounded-2xl flex flex-col overflow-hidden" style={{ minHeight: '480px' }}>

            {/* Tabs */}
            <div className="flex border-b border-slate-700 flex-shrink-0">
              {([
                { id: 'transcript', label: 'Live Transcript', icon: MessageSquare, count: transcript.length },
                { id: 'alerts', label: 'Alerts', icon: AlertTriangle, count: alerts.length },
                { id: 'questions', label: 'AI Questions', icon: Brain, count: aiQuestions.length },
              ] as const).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 flex-1 justify-center',
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-300'
                      : 'border-transparent text-slate-500 hover:text-slate-300'
                  )}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.count > 0 && (
                    <span className={cn(
                      'text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center',
                      activeTab === tab.id ? 'bg-indigo-500/30 text-indigo-300' : 'bg-slate-700 text-slate-400'
                    )}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <AnimatePresence mode="wait">

                {/* Transcript */}
                {activeTab === 'transcript' && (
                  <motion.div key="transcript" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                    {transcript.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-slate-600">
                        <MessageSquare className="w-10 h-10 mb-3 opacity-40" />
                        <p className="text-sm">Transcript will appear here as the interview progresses…</p>
                      </div>
                    ) : (
                      transcript.map((entry) => (
                        <motion.div
                          key={entry.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            'flex gap-3',
                            entry.speakerRole === 'interviewer' ? 'flex-row-reverse' : ''
                          )}
                        >
                          <div className={cn(
                            'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                            entry.speakerRole === 'candidate'
                              ? 'bg-indigo-600/30 text-indigo-300'
                              : 'bg-slate-700 text-slate-300'
                          )}>
                            {entry.speakerRole === 'candidate' ? 'C' : 'I'}
                          </div>
                          <div className={cn(
                            'max-w-[80%] space-y-1',
                            entry.speakerRole === 'interviewer' ? 'items-end' : ''
                          )}>
                            <div className={cn(
                              'px-3 py-2 rounded-xl text-sm leading-relaxed',
                              entry.speakerRole === 'candidate'
                                ? 'bg-slate-900/70 border border-slate-700 text-slate-200'
                                : 'bg-indigo-600/15 border border-indigo-500/20 text-slate-200'
                            )}>
                              {entry.text}
                            </div>
                            {entry.speakerRole === 'candidate' && (
                              <div className="flex items-center gap-2 pl-1">
                                {entry.relevanceScore && (
                                  <span className="text-[10px] text-slate-500">
                                    Relevance: <span className="text-indigo-400 font-medium">{Math.round(entry.relevanceScore * 100)}%</span>
                                  </span>
                                )}
                                {entry.starCompliance && (
                                  <span className="text-[10px] text-slate-500">
                                    STAR: <span className={cn('font-medium', entry.starCompliance > 0.8 ? 'text-emerald-400' : entry.starCompliance > 0.6 ? 'text-amber-400' : 'text-red-400')}>{Math.round(entry.starCompliance * 100)}%</span>
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))
                    )}
                    <div ref={transcriptEndRef} />
                  </motion.div>
                )}

                {/* Alerts */}
                {activeTab === 'alerts' && (
                  <motion.div key="alerts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                    {alerts.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-slate-600">
                        <CheckCircle2 className="w-10 h-10 mb-3 opacity-40 text-emerald-600" />
                        <p className="text-sm">No behavioral alerts yet — session looks clean.</p>
                      </div>
                    ) : (
                      <AnimatePresence>
                        {alerts.map(alert => (
                          <AlertCard key={alert.id} alert={alert} onDismiss={() => dismissAlert(alert.id)} />
                        ))}
                      </AnimatePresence>
                    )}
                  </motion.div>
                )}

                {/* AI Questions */}
                {activeTab === 'questions' && (
                  <motion.div key="questions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                    {aiQuestions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-slate-600">
                        <Brain className="w-10 h-10 mb-3 opacity-40" />
                        <p className="text-sm text-center max-w-xs">AI question suggestions will appear as the interview progresses and patterns are detected.</p>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs text-slate-500 pb-1">
                          These questions are AI-generated based on detected behavioral patterns. Use your judgment.
                        </p>
                        <AnimatePresence>
                          {aiQuestions.map(q => (
                            <QuestionCard key={q.id} q={q} onDismiss={() => dismissQuestion(q.id)} />
                          ))}
                        </AnimatePresence>
                      </>
                    )}
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ── Alert notification for new alerts (tab not active) ───────────── */}
        {alerts.length > 0 && activeTab !== 'alerts' && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setActiveTab('alerts')}
            className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-white rounded-full text-sm font-semibold shadow-lg shadow-amber-500/30 transition-all z-40"
          >
            <AlertTriangle className="w-4 h-4" />
            {alerts.length} alert{alerts.length > 1 ? 's' : ''} — View
          </motion.button>
        )}

      </div>
    </CompanyPortalLayout>
  );
}
