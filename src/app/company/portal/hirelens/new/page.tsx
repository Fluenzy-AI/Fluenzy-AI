'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCompanyAuth } from '@/contexts/CompanyAuthContext';
import CompanyPortalLayout from '@/components/CompanyPortalLayout';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'react-qr-code';
import {
  LayoutDashboard, Briefcase, Users, UserPlus, Settings, FileText, ScanFace,
  Smartphone, Copy, CheckCircle2, Loader2, ArrowLeft, User, RefreshCw,
  Clock, Wifi, QrCode, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PairingSession } from '@/types/interview';

const COMPANY_NAV = [
  { label: 'Dashboard', href: '/company/portal', icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: 'Job Postings', href: '/company/portal/jobs', icon: <Briefcase className="w-4 h-4" /> },
  { label: 'Applications', href: '/company/portal/applications', icon: <Users className="w-4 h-4" /> },
  { label: 'Assessments', href: '/company/portal/assessments', icon: <FileText className="w-4 h-4" /> },
  { label: 'HireLens AI', href: '/company/portal/hirelens', icon: <ScanFace className="w-4 h-4" /> },
  { label: 'Team', href: '/company/portal/team', icon: <UserPlus className="w-4 h-4" />, adminOnly: true },
  { label: 'Settings', href: '/company/portal/settings', icon: <Settings className="w-4 h-4" />, adminOnly: true },
];

type Step = 'form' | 'pairing';

// ── QR Code — rendered client-side via react-qr-code ────────────────────────
function QRDisplay({ value, size = 180 }: { value: string; size?: number }) {
  return (
    <div className="p-4 bg-white rounded-2xl shadow-inner flex items-center justify-center">
      <QRCode
        value={value}
        size={size}
        style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
        viewBox={`0 0 ${size} ${size}`}
        bgColor="#FFFFFF"
        fgColor="#0A0A0F"
      />
    </div>
  );
}

// ── Countdown timer component ─────────────────────────────────────────────────
function PairingCountdown({ expiresAt }: { expiresAt: number }) {
  const [remaining, setRemaining] = useState(Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)));

  useEffect(() => {
    const t = setInterval(() => {
      setRemaining(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  const isUrgent = remaining < 60;

  return (
    <span className={cn('font-mono font-bold tabular-nums', isUrgent ? 'text-red-400' : 'text-slate-400')}>
      {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function NewMobileSessionPage() {
  const { user, loading } = useCompanyAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>('form');
  const [candidateName, setCandidateName] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [pairing, setPairing] = useState<PairingSession | null>(null);
  const [mobileJoined, setMobileJoined] = useState(false);
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/company/login');
  }, [user, loading, router]);

  // Poll for mobile device joining (every 2 seconds)
  const startPolling = useCallback((pairingCode: string, sessionId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/interview/sessions/create?pairingCode=${pairingCode}`,
          { credentials: 'include' }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.mobileConnected) {
            clearInterval(pollRef.current!);
            setMobileJoined(true);
            // Advance to live dashboard after short confirmation delay
            setTimeout(() => {
              router.push(`/company/portal/hirelens/session/${sessionId}`);
            }, 1500);
          }
        }
      } catch {
        // Silent — continue polling
      }
    }, 2000);
  }, [router]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleCreateSession = async () => {
    if (!candidateName.trim() || !jobRole.trim()) return;
    setIsCreating(true);
    setApiError(null);

    try {
      const res = await fetch('/api/interview/sessions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ candidateName: candidateName.trim(), jobRole: jobRole.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        setPairing(data.pairing);
        setStep('pairing');
        // Store for dashboard polling
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(
            `hirelens_pairing_${data.pairing.sessionId}`,
            data.pairing.pairingCode
          );
          sessionStorage.setItem(
            `hirelens_candidate_${data.pairing.sessionId}`,
            JSON.stringify({ sessionId: data.pairing.sessionId, name: candidateName, email: '', jobRole })
          );
        }
        startPolling(data.pairing.pairingCode, data.pairing.sessionId);
      } else {
        setApiError(data.error || `Server error (${res.status}). Please try again.`);
      }
    } catch (err) {
      console.error('Failed to create session:', err);
      setApiError('Could not reach the server. Check your connection and try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const copyCode = () => {
    if (pairing) {
      navigator.clipboard.writeText(pairing.pairingCode).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyLink = () => {
    if (pairing) {
      navigator.clipboard.writeText(pairing.qrPayload).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Format pairing code as XXX-XXX
  const formatCode = (code: string) =>
    code.length === 6 ? `${code.slice(0, 3)}-${code.slice(3)}` : code;

  return (
    <CompanyPortalLayout
      navItems={COMPANY_NAV}
      title={step === 'form' ? 'New Interview — Candidate Details' : 'Connect Phone to Session'}
    >
      <div className="max-w-xl mx-auto space-y-6">

        {/* Back link */}
        <button
          onClick={() => step === 'pairing' ? setStep('form') : router.push('/company/portal/hirelens')}
          className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {step === 'pairing' ? 'Back to candidate info' : 'Back to mode selection'}
        </button>

        <AnimatePresence mode="wait">

          {/* ── STEP 1: Candidate + Role Form (LAPTOP only) ─────────────── */}
          {step === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Header */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-indigo-500/15 flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-white">New Mobile Interview</h1>
                    <p className="text-xs text-slate-500">Fill this in on your laptop — you won't need to type on your phone</p>
                  </div>
                </div>

                {/* Dual-device explainer */}
                <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-500/8 border border-indigo-500/20 mb-6">
                  <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-indigo-400 text-xs font-bold">i</span>
                  </div>
                  <p className="text-xs text-indigo-200/80 leading-relaxed">
                    After entering details, you&apos;ll get a <strong className="text-white">6-digit pairing code</strong> to scan on your phone.
                    Your phone becomes the capture device (placed facing the candidate).
                    You watch the live AI dashboard here on your laptop throughout the interview.
                  </p>
                </div>
              </div>

              {/* Form */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-400" />
                    Candidate Full Name *
                  </label>
                  <input
                    type="text"
                    value={candidateName}
                    onChange={e => setCandidateName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && jobRole && handleCreateSession()}
                    placeholder="e.g. Priya Sharma"
                    autoFocus
                    className="w-full bg-slate-900/70 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Job Role *
                  </label>
                  <input
                    type="text"
                    value={jobRole}
                    onChange={e => setJobRole(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && candidateName && handleCreateSession()}
                    placeholder="e.g. Backend Engineer, Product Manager"
                    className="w-full bg-slate-900/70 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                  />
                </div>

                <button
                  disabled={!candidateName.trim() || !jobRole.trim() || isCreating}
                  onClick={handleCreateSession}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                >
                  {isCreating ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Generating pairing code…</>
                  ) : (
                    <><QrCode className="w-4 h-4" /> Generate Pairing Code <ChevronRight className="w-4 h-4" /></>
                  )}
                </button>

                {/* Error banner */}
                {apiError && (
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm">
                    <span className="text-base leading-none mt-0.5">⚠️</span>
                    <span>{apiError}</span>
                  </div>
                )}
              </div>

              {/* How it'll work */}
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { icon: '💻', label: 'You filled candidate info here', sub: 'Laptop' },
                  { icon: '📱', label: 'Phone scans QR, becomes camera', sub: 'Mobile' },
                  { icon: '🤖', label: 'You watch AI dashboard here', sub: 'Laptop' },
                ].map(({ icon, label, sub }) => (
                  <div key={sub + label} className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-1">
                    <div className="text-xl">{icon}</div>
                    <p className="text-[10px] text-slate-300 leading-tight">{label}</p>
                    <p className="text-[10px] text-indigo-400 font-semibold">{sub}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: Pairing Code + QR (LAPTOP waiting screen) ──────── */}
          {step === 'pairing' && pairing && (
            <motion.div
              key="pairing"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-indigo-500/15 flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Connect Your Phone</h1>
                  <p className="text-xs text-slate-400">
                    Interviewing <strong className="text-slate-200">{candidateName}</strong> for{' '}
                    <strong className="text-slate-200">{jobRole}</strong>
                  </p>
                </div>
              </div>

              {/* Joined state */}
              <AnimatePresence>
                {mobileJoined && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <div>
                      <p className="text-emerald-300 font-semibold text-sm">Phone connected!</p>
                      <p className="text-emerald-400/70 text-xs">Opening live dashboard…</p>
                    </div>
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-400 ml-auto" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Main pairing card */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-700">

                  {/* QR side */}
                  <div className="p-6 flex flex-col items-center gap-4">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Scan QR Code</p>
                    <QRDisplay value={pairing.qrPayload} size={160} />
                    <button
                      onClick={copyLink}
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                      {copied ? 'Copied!' : 'Copy link instead'}
                    </button>
                  </div>

                  {/* Code side */}
                  <div className="p-6 flex flex-col items-center justify-center gap-5">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Or enter code manually</p>

                    {/* Big code display */}
                    <div className="flex items-center gap-3">
                      <div className="text-4xl font-black font-mono tracking-[0.2em] text-white select-all">
                        {formatCode(pairing.pairingCode)}
                      </div>
                      <button
                        onClick={copyCode}
                        className="w-9 h-9 rounded-lg bg-slate-700 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-400 flex items-center justify-center transition-all"
                        title="Copy code"
                      >
                        {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Steps */}
                    <div className="space-y-2 w-full">
                      {[
                        { n: '1', text: 'Open Fluenzy AI on your phone' },
                        { n: '2', text: 'Sign in with the same account' },
                        { n: '3', text: `Go to fluenzyai.app/pair/${pairing.pairingCode}` },
                      ].map(({ n, text }) => (
                        <div key={n} className="flex items-center gap-2.5 text-xs text-slate-400">
                          <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                            {n}
                          </span>
                          {text}
                        </div>
                      ))}
                    </div>

                    {/* Expiry timer */}
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      Code expires in{' '}
                      <PairingCountdown expiresAt={pairing.expiresAt} />
                    </div>
                  </div>
                </div>

                {/* Status bar */}
                <div className="border-t border-slate-700 px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {mobileJoined ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-xs text-emerald-400 font-medium">Phone connected</span>
                      </>
                    ) : (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                        <span className="text-xs text-slate-400">Waiting for phone to connect…</span>
                      </>
                    )}
                  </div>

                  {/* Laptop connected badge */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Wifi className="w-3 h-3 text-emerald-400" />
                      <span>Laptop connected</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Device status grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3.5 rounded-xl border border-emerald-500/25 bg-emerald-500/8">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">💻 Laptop</p>
                    <p className="text-[10px] text-emerald-400">Dashboard ready</p>
                  </div>
                </div>
                <div className={cn(
                  'flex items-center gap-3 p-3.5 rounded-xl border transition-all',
                  mobileJoined
                    ? 'border-emerald-500/25 bg-emerald-500/8'
                    : 'border-slate-700/60 bg-slate-800/30'
                )}>
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center',
                    mobileJoined ? 'bg-emerald-500/15' : 'bg-slate-700/50'
                  )}>
                    {mobileJoined
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      : <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />
                    }
                  </div>
                  <div>
                    <p className={cn('text-xs font-semibold', mobileJoined ? 'text-white' : 'text-slate-500')}>📱 Mobile</p>
                    <p className={cn('text-[10px]', mobileJoined ? 'text-emerald-400' : 'text-slate-600')}>
                      {mobileJoined ? 'Connected & capturing' : 'Waiting to connect…'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Regenerate option */}
              <div className="text-center">
                <button
                  onClick={() => { setStep('form'); setPairing(null); setMobileJoined(false); if (pollRef.current) clearInterval(pollRef.current); }}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-400 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  Start over / regenerate code
                </button>
              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </CompanyPortalLayout>
  );
}
