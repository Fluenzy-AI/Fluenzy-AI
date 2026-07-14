'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, Smartphone, Play, ShieldCheck, CheckCircle2 } from 'lucide-react';

// ─── Mobile Join Page ─────────────────────────────────────────────────────────
// Reached by scanning QR or typing: fluenzyai.app/pair/[pairingCode]
// The HR representative opens this on their phone, logged in with the same account.
// No candidate interaction — this is a HR-only screen.

interface SessionContext {
  sessionId: string;
  candidateName: string;
  jobRole: string;
  status: string;
}

export default function PairJoinPage() {
  const { pairingCode } = useParams<{ pairingCode: string }>();
  const router = useRouter();

  const [context, setContext] = useState<SessionContext | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Validate the code and fetch session context
  useEffect(() => {
    if (!pairingCode) return;

    fetch(`/api/interview/pair/${pairingCode}`, { credentials: 'include' })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Invalid pairing code.');
        } else {
          setContext(data);
        }
      })
      .catch(() => setError('Could not reach the server. Check your connection.'))
      .finally(() => setIsLoading(false));
  }, [pairingCode]);

  const handleJoinAsCapture = async () => {
    setIsJoining(true);
    try {
      const res = await fetch(`/api/interview/pair/${pairingCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          deviceInfo: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
          },
        }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push(`/pair/${pairingCode}/capture?sessionId=${data.sessionId}`);
      } else {
        setError(data.error || 'Failed to join session.');
        setIsJoining(false);
      }
    } catch {
      setError('Network error. Please try again.');
      setIsJoining(false);
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-slate-400 text-sm">Validating pairing code…</p>
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex flex-col items-center justify-center px-6 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-red-500/15 flex items-center justify-center">
          <AlertCircle className="w-7 h-7 text-red-400" />
        </div>
        <h1 className="text-xl font-bold text-white">Session Not Found</h1>
        <p className="text-red-400 text-sm max-w-xs">{error}</p>
        <p className="text-slate-600 text-xs max-w-xs">
          Ask the HR interviewer to generate a new pairing code from their laptop.
        </p>
      </div>
    );
  }

  if (!context) return null;

  // ── Join screen ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col items-center justify-center px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-6"
      >
        {/* Icon + heading */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-500/15 flex items-center justify-center">
            <Smartphone className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <p className="text-xs text-indigo-400 font-semibold uppercase tracking-wider mb-1">
              Fluenzy AI HireLens
            </p>
            <h1 className="text-2xl font-bold text-white">Join Interview Session</h1>
          </div>
        </div>

        {/* Session info card */}
        <div className="p-5 rounded-2xl border border-indigo-500/25 bg-indigo-500/8 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {context.candidateName[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-white font-bold text-sm">{context.candidateName}</p>
              <p className="text-slate-400 text-xs">{context.jobRole}</p>
            </div>
          </div>
          <div className="text-[10px] font-mono text-slate-600 border-t border-slate-700/60 pt-2">
            Session: {context.sessionId}
          </div>
        </div>

        {/* Instruction points */}
        <div className="space-y-3">
          {[
            { icon: Smartphone, text: 'Your phone will be placed facing the candidate as the capture device.' },
            { icon: ShieldCheck, text: 'You won\'t need to touch the phone again during the interview.' },
            { icon: CheckCircle2, text: 'HR watches the live AI dashboard on their laptop throughout.' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={handleJoinAsCapture}
          disabled={isJoining}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-base flex items-center justify-center gap-3 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-60"
        >
          {isJoining ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Joining…</>
          ) : (
            <><Play className="w-4 h-4" /> Join as Capture Device</>
          )}
        </button>

        <p className="text-center text-slate-700 text-[10px]">
          You must be signed in with the same HR account that created this session.
        </p>
      </motion.div>
    </div>
  );
}
