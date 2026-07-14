'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCompanyAuth } from '@/contexts/CompanyAuthContext';
import CompanyPortalLayout from '@/components/CompanyPortalLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Briefcase, Users, UserPlus, Settings, FileText, ScanFace,
  Camera, Mic, CheckCircle2, XCircle, AlertTriangle, Play,
  ArrowLeft, ChevronRight, User, Briefcase as BriefcaseIcon,
} from 'lucide-react';
import { useMediaCapture } from '@/hooks/useMediaCapture';
import { cn } from '@/lib/utils';

const COMPANY_NAV = [
  { label: 'Dashboard', href: '/company/portal', icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: 'Job Postings', href: '/company/portal/jobs', icon: <Briefcase className="w-4 h-4" /> },
  { label: 'Applications', href: '/company/portal/applications', icon: <Users className="w-4 h-4" /> },
  { label: 'Assessments', href: '/company/portal/assessments', icon: <FileText className="w-4 h-4" /> },
  { label: 'HireLens AI', href: '/company/portal/hirelens', icon: <ScanFace className="w-4 h-4" /> },
  { label: 'Team', href: '/company/portal/team', icon: <UserPlus className="w-4 h-4" />, adminOnly: true },
  { label: 'Settings', href: '/company/portal/settings', icon: <Settings className="w-4 h-4" />, adminOnly: true },
];

type SetupStep = 'candidate_info' | 'permissions' | 'preview' | 'consent';

const STEP_ORDER: SetupStep[] = ['candidate_info', 'permissions', 'preview', 'consent'];

const STEP_META: Record<SetupStep, { label: string; description: string; number: number }> = {
  candidate_info: { label: 'Candidate Details', description: 'Enter basic info before starting the interview.', number: 1 },
  permissions: { label: 'Allow Access', description: 'Fluenzy needs camera and microphone access to analyse the interview.', number: 2 },
  preview: { label: 'Camera Preview', description: 'Ensure the candidate is clearly visible before proceeding.', number: 3 },
  consent: { label: 'AI Disclosure & Consent', description: 'Show this to the candidate and have them acknowledge.', number: 4 },
};

interface CandidateForm {
  name: string;
  jobRole: string;
  email: string;
}

export default function HireLensSetupPage() {
  const { user, loading } = useCompanyAuth();
  const router = useRouter();
  const { stream, permissionStatus, isCameraReady, isMicReady, error, requestPermissions, deviceInfo } = useMediaCapture();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [step, setStep] = useState<SetupStep>('candidate_info');
  const [candidateForm, setCandidateForm] = useState<CandidateForm>({ name: '', jobRole: '', email: '' });
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/company/login');
  }, [user, loading, router]);

  // Attach stream to video element
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const stepIndex = STEP_ORDER.indexOf(step);
  const progressPct = ((stepIndex + 1) / STEP_ORDER.length) * 100;

  const goBack = () => {
    if (stepIndex > 0) setStep(STEP_ORDER[stepIndex - 1]);
    else router.push('/company/portal/hirelens');
  };

  // ── Step handlers ────────────────────────────────────────────────────────

  const handleCandidateSubmit = () => {
    if (!candidateForm.name || !candidateForm.jobRole) return;
    setStep('permissions');
  };

  const handleRequestPermissions = async () => {
    const mediaStream = await requestPermissions();
    if (mediaStream) setStep('preview');
  };

  const handleCreateSession = async () => {
    setIsCreatingSession(true);
    try {
      const res = await fetch('/api/company/hirelens/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          candidateName: candidateForm.name,
          jobRole: candidateForm.jobRole,
          mode: 'MOBILE',
          deviceInfo: {
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
            resolution: deviceInfo?.resolution,
            frameRate: deviceInfo?.frameRate,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSessionId(data.session.id);
        setStep('consent');
      } else {
        // Fallback: generate a local session ID for demo
        setSessionId(`demo_${Date.now()}`);
        setStep('consent');
      }
    } catch {
      // Fallback for demo
      setSessionId(`demo_${Date.now()}`);
      setStep('consent');
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleStartInterview = async () => {
    if (!consentChecked || !sessionId) return;
    setIsStarting(true);
    // Store candidate info in sessionStorage for the dashboard
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(
        `hirelens_candidate_${sessionId}`,
        JSON.stringify({ ...candidateForm, sessionId })
      );
    }
    router.push(`/company/portal/hirelens/session/${sessionId}`);
  };

  // ── Render ───────────────────────────────────────────────────────────────

  const currentMeta = STEP_META[step];

  return (
    <CompanyPortalLayout navItems={COMPANY_NAV} title={`HireLens Setup — ${currentMeta.label}`}>
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Progress Header */}
        <div className="space-y-3">
          {/* Back + step indicator */}
          <div className="flex items-center justify-between">
            <button
              onClick={goBack}
              className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {stepIndex === 0 ? 'Back to modes' : 'Previous step'}
            </button>
            <span className="text-slate-500 text-sm">
              Step {currentMeta.number} of {STEP_ORDER.length}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>

          {/* Step dots */}
          <div className="flex items-center justify-between">
            {STEP_ORDER.map((s, i) => (
              <div key={s} className="flex items-center gap-1">
                <div
                  className={cn(
                    'w-2.5 h-2.5 rounded-full transition-all duration-300',
                    i < stepIndex ? 'bg-indigo-500' : i === stepIndex ? 'bg-indigo-400 ring-2 ring-indigo-400/30 scale-125' : 'bg-slate-700'
                  )}
                />
                {i < STEP_ORDER.length - 1 && (
                  <div className={cn('flex-1 h-px w-16 transition-colors duration-300', i < stepIndex ? 'bg-indigo-500/50' : 'bg-slate-700')} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 space-y-6"
          >
            {/* Step heading */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">{currentMeta.label}</h2>
              <p className="text-slate-400 text-sm">{currentMeta.description}</p>
            </div>

            {/* ─── STEP 1: Candidate Info ─────────────────────────────────── */}
            {step === 'candidate_info' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5 font-medium">
                    <User className="w-3.5 h-3.5 inline mr-1.5 text-indigo-400" />
                    Candidate Full Name *
                  </label>
                  <input
                    type="text"
                    value={candidateForm.name}
                    onChange={e => setCandidateForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Priya Sharma"
                    className="w-full bg-slate-900/70 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5 font-medium">
                    <BriefcaseIcon className="w-3.5 h-3.5 inline mr-1.5 text-indigo-400" />
                    Job Role *
                  </label>
                  <input
                    type="text"
                    value={candidateForm.jobRole}
                    onChange={e => setCandidateForm(prev => ({ ...prev, jobRole: e.target.value }))}
                    placeholder="e.g. Backend Engineer, Product Manager"
                    className="w-full bg-slate-900/70 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5 font-medium">
                    Email (optional)
                  </label>
                  <input
                    type="email"
                    value={candidateForm.email}
                    onChange={e => setCandidateForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="candidate@email.com"
                    className="w-full bg-slate-900/70 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                  />
                </div>

                <button
                  disabled={!candidateForm.name || !candidateForm.jobRole}
                  onClick={handleCandidateSubmit}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* ─── STEP 2: Permissions ─────────────────────────────────────── */}
            {step === 'permissions' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  {[
                    {
                      icon: Camera,
                      label: 'Camera',
                      desc: 'Facial expression & body language analysis',
                      ready: isCameraReady,
                      color: 'text-blue-400',
                      bg: 'bg-blue-500/10',
                    },
                    {
                      icon: Mic,
                      label: 'Microphone',
                      desc: 'Voice tone, pace & speech pattern analysis',
                      ready: isMicReady,
                      color: 'text-purple-400',
                      bg: 'bg-purple-500/10',
                    },
                  ].map(({ icon: Icon, label, desc, ready, color, bg }) => (
                    <div
                      key={label}
                      className={cn(
                        'flex items-center gap-4 p-4 rounded-xl border transition-all',
                        ready
                          ? 'border-emerald-500/30 bg-emerald-500/5'
                          : 'border-slate-700 bg-slate-900/50'
                      )}
                    >
                      <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-5 h-5 ${color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm">{label}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                      </div>
                      {ready ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-600 flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>

                {error && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                {permissionStatus === 'requesting' && (
                  <div className="flex items-center justify-center gap-3 py-4 text-slate-400 text-sm">
                    <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    Requesting permissions…
                  </div>
                )}

                {permissionStatus !== 'granted' ? (
                  <button
                    onClick={handleRequestPermissions}
                    disabled={permissionStatus === 'requesting'}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:from-indigo-500 hover:to-purple-500 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    Allow Camera & Microphone
                  </button>
                ) : (
                  <button
                    onClick={() => setStep('preview')}
                    className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Permissions Granted — Continue
                  </button>
                )}
              </div>
            )}

            {/* ─── STEP 3: Camera Preview ──────────────────────────────────── */}
            {step === 'preview' && (
              <div className="space-y-4">
                {/* Video */}
                <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-700 aspect-video">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* Overlay face guide */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-28 h-36 border-2 border-indigo-400/70 rounded-2xl relative">
                      <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-indigo-300/80 text-[10px] bg-black/60 px-2 py-0.5 rounded-full whitespace-nowrap">
                        Face here
                      </span>
                    </div>
                  </div>

                  {/* Corner brackets */}
                  {['top-2 left-2', 'top-2 right-2', 'bottom-2 left-2', 'bottom-2 right-2'].map(pos => (
                    <div key={pos} className={`absolute ${pos} w-5 h-5 border-indigo-400/60`} style={{
                      borderTopWidth: pos.includes('top') ? '2px' : '0',
                      borderBottomWidth: pos.includes('bottom') ? '2px' : '0',
                      borderLeftWidth: pos.includes('left') ? '2px' : '0',
                      borderRightWidth: pos.includes('right') ? '2px' : '0',
                    }} />
                  ))}

                  {/* Device info */}
                  {deviceInfo && (
                    <div className="absolute bottom-3 left-3 text-xs text-white/60 bg-black/50 px-2 py-1 rounded-lg backdrop-blur-sm">
                      {deviceInfo.resolution} · {deviceInfo.frameRate}fps
                    </div>
                  )}

                  {/* Live indicator */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-red-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    PREVIEW
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/8 border border-amber-500/20">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-amber-300/90 text-xs leading-relaxed">
                    Place your device on a stable surface facing the candidate at eye level.
                    Ensure good lighting and that their face is clearly visible in the frame.
                  </p>
                </div>

                <button
                  onClick={handleCreateSession}
                  disabled={isCreatingSession}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:from-indigo-500 hover:to-purple-500 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
                >
                  {isCreatingSession ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating session…
                    </>
                  ) : (
                    <>
                      Looks Good — Continue
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}

            {/* ─── STEP 4: Consent ─────────────────────────────────────────── */}
            {step === 'consent' && (
              <div className="space-y-5">
                {/* Consent card */}
                <div className="p-5 rounded-xl border-2 border-indigo-500/30 bg-indigo-500/5 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                      <ScanFace className="w-4 h-4 text-indigo-400" />
                    </div>
                    <h3 className="text-white font-bold text-base">AI Analysis Disclosure</h3>
                  </div>

                  <p className="text-slate-300 text-sm leading-relaxed">
                    This interview session uses <strong className="text-white">Fluenzy AI HireLens</strong> — an AI-powered interview intelligence system. During this session, the following data will be collected:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { emoji: '🎤', text: 'Voice recording & tone analysis' },
                      { emoji: '📷', text: 'Facial expression & body language' },
                      { emoji: '📝', text: 'Speech transcript & answer scoring' },
                      { emoji: '📊', text: 'Behavioral pattern assessment' },
                    ].map(({ emoji, text }) => (
                      <div key={text} className="flex items-center gap-2.5 text-sm text-slate-300 bg-slate-900/50 rounded-lg px-3 py-2">
                        <span className="text-base">{emoji}</span>
                        <span className="text-xs">{text}</span>
                      </div>
                    ))}
                  </div>

                  <p className="text-slate-400 text-xs leading-relaxed">
                    This data is used solely for evaluating your suitability for the role. All data is encrypted and processed in accordance with our Privacy Policy and applicable data protection laws.
                  </p>

                  {sessionId && (
                    <p className="text-slate-600 text-[10px] font-mono">Session ID: {sessionId}</p>
                  )}
                </div>

                {/* Consent checkbox */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative mt-0.5 flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={consentChecked}
                      onChange={e => setConsentChecked(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className={cn(
                        'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all',
                        consentChecked
                          ? 'bg-indigo-600 border-indigo-600'
                          : 'border-slate-600 group-hover:border-indigo-500/60'
                      )}
                    >
                      {consentChecked && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-slate-300 leading-relaxed">
                    I, <strong className="text-white">{candidateForm.name || 'the candidate'}</strong>, understand the above disclosure and consent to AI-powered behavioral analysis during this interview session.
                  </span>
                </label>

                <button
                  disabled={!consentChecked || isStarting}
                  onClick={handleStartInterview}
                  className={cn(
                    'w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-3 transition-all duration-200',
                    consentChecked
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                  )}
                >
                  {isStarting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Starting session…
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Start Interview
                    </>
                  )}
                </button>
              </div>
            )}

          </motion.div>
        </AnimatePresence>

      </div>
    </CompanyPortalLayout>
  );
}
