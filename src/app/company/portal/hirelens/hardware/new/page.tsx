'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, User, Briefcase, Cpu, ArrowLeft, Play, AlertCircle } from 'lucide-react';
import { DeviceSelectCard } from '@/components/interview/hardware/DeviceSelectCard';
import { useCompanyAuth } from '@/contexts/CompanyAuthContext';
import type { HireLensDevice } from '@/types/hardware';

// ─── Inner component (uses useSearchParams — must be inside Suspense) ─────────

function NewHardwareSessionInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedId = searchParams.get('deviceId');
  const { user } = useCompanyAuth();

  const [candidateName, setCandidateName] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(preselectedId || '');
  const [devices, setDevices] = useState<HireLensDevice[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/interview/devices', { credentials: 'include' })
      .then(r => r.json())
      .then(({ devices: d }) => setDevices(d || []))
      .catch(() => setDevices([]))
      .finally(() => setDevicesLoading(false));
  }, []);

  const handleStart = async () => {
    if (!candidateName.trim() || !jobRole.trim() || !selectedDeviceId) return;
    setIsCreating(true);
    setError(null);

    try {
      // Create session
      const sessionId = `hw_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

      // Store context for dashboard
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(
          `hirelens_candidate_${sessionId}`,
          JSON.stringify({
            sessionId,
            name: candidateName.trim(),
            email: '',
            jobRole: jobRole.trim(),
          })
        );
        sessionStorage.setItem(`hirelens_mode_${sessionId}`, 'HARDWARE');
        sessionStorage.setItem(`hirelens_device_${sessionId}`, selectedDeviceId);
      }

      // Signal the device to start streaming
      await fetch(`/api/interview/devices/${selectedDeviceId}/stream/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sessionId }),
      });

      router.push(`/company/portal/hirelens/session/${sessionId}`);
    } catch {
      setError('Failed to start session. Please try again.');
      setIsCreating(false);
    }
  };

  const canStart = candidateName.trim() && jobRole.trim() && selectedDeviceId && !isCreating;
  const selectedDevice = devices.find(d => d.id === selectedDeviceId) || null;

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      <div className="max-w-xl mx-auto px-6 py-10">

        {/* Header */}
        <button
          onClick={() => router.push('/company/portal/hirelens/hardware')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm mb-7 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to devices
        </button>

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1.5">
            <Cpu className="w-3.5 h-3.5" /> Hardware Mode
          </div>
          <h1 className="text-2xl font-black text-white mb-1">New Hardware Interview</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Enter candidate details and confirm the capture device. The collar will start streaming once you click Start.
          </p>
        </motion.div>

        <div className="mt-8 space-y-6">

          {/* Candidate name */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-slate-500" /> Candidate Full Name *</span>
            </label>
            <input
              type="text"
              value={candidateName}
              onChange={e => setCandidateName(e.target.value)}
              placeholder="e.g. Priya Sharma"
              autoFocus
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
            />
          </motion.div>

          {/* Job role */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              <span className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5 text-slate-500" /> Job Role *</span>
            </label>
            <input
              type="text"
              value={jobRole}
              onChange={e => setJobRole(e.target.value)}
              placeholder="e.g. Senior Backend Engineer"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
            />
          </motion.div>

          {/* Device selection */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.11 }}>
            <label className="block text-sm font-semibold text-slate-300 mb-3">
              Capture Device *
            </label>
            {devicesLoading ? (
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading devices…
              </div>
            ) : devices.length === 0 ? (
              <div className="p-4 rounded-xl bg-amber-500/8 border border-amber-500/20 text-amber-400 text-sm">
                No paired devices found.{' '}
                <button
                  onClick={() => router.push('/company/portal/hirelens/hardware/pair')}
                  className="underline underline-offset-2"
                >
                  Pair a device first →
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {devices.map(device => (
                  <DeviceSelectCard
                    key={device.id}
                    device={device}
                    selected={selectedDeviceId === device.id}
                    onSelect={() => setSelectedDeviceId(device.id)}
                  />
                ))}
              </div>
            )}
          </motion.div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Summary before start */}
          {selectedDevice && candidateName && jobRole && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-indigo-500/8 border border-indigo-500/20 space-y-1.5"
            >
              <p className="text-xs text-indigo-400 font-semibold uppercase tracking-wider mb-2">Session Summary</p>
              <p className="text-sm text-white"><span className="text-slate-400">Candidate:</span> {candidateName}</p>
              <p className="text-sm text-white"><span className="text-slate-400">Role:</span> {jobRole}</p>
              <p className="text-sm text-white"><span className="text-slate-400">Device:</span> {selectedDevice.nickname || selectedDevice.serialNumber}</p>
            </motion.div>
          )}

          {/* Start button */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            onClick={handleStart}
            disabled={!canStart}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-base flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            {isCreating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Starting Session…</>
            ) : (
              <><Play className="w-5 h-5" /> Start Hardware Interview</>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

// ─── Exported page with Suspense ──────────────────────────────────────────────

export default function NewHardwareSessionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    }>
      <NewHardwareSessionInner />
    </Suspense>
  );
}
