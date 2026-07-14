'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bluetooth, CheckCircle2, XCircle, Loader2, Radio,
  ShieldCheck, ChevronRight, AlertTriangle, Wifi, ArrowLeft,
} from 'lucide-react';
import { useDevicePairing } from '@/hooks/useDevicePairing';
import { cn } from '@/lib/utils';

// ─── BLE Pairing Wizard ───────────────────────────────────────────────────────
// Steps: search → found → connecting → authenticating → configuring_wifi → testing_stream → paired

export default function DevicePairingPage() {
  const router = useRouter();
  const {
    step, progress, error, pairingCode, discoveredDevice,
    bleSupport, startScan, connect, confirmCode, configureWifi,
    registerAndFinish, reset,
  } = useDevicePairing();

  const [userCode, setUserCode] = useState('');
  const [ssid, setSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');

  const STEP_LABELS: Record<string, string> = {
    search: 'Power On Device',
    found: 'Device Found',
    connecting: 'Connecting…',
    authenticating: 'Verify Code',
    configuring_wifi: 'WiFi Setup',
    testing_stream: 'Testing Connection',
    paired: 'Paired!',
    error: 'Error',
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white flex flex-col">

      {/* Progress bar */}
      <div className="h-1 bg-slate-800/80 flex-shrink-0">
        <motion.div
          className="h-full bg-gradient-to-r from-indigo-600 to-purple-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        />
      </div>

      <div className="max-w-lg mx-auto w-full px-6 py-10 flex-1">

        {/* Header */}
        <button
          onClick={() => router.push('/company/portal/hirelens/hardware')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm mb-7 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to devices
        </button>

        <div className="mb-7">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1.5">
            <Bluetooth className="w-3.5 h-3.5" /> Device Pairing
          </div>
          <h1 className="text-2xl font-black text-white">Pair HireLens Collar</h1>
          <p className="text-slate-400 text-sm mt-1">
            {STEP_LABELS[step] || 'Follow the steps below.'}
          </p>
        </div>

        {/* Browser unsupported banner */}
        {!bleSupport.supported && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-6">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-300 font-semibold text-sm">Browser Not Supported</p>
              <p className="text-amber-400/70 text-xs mt-0.5">{bleSupport.reason}</p>
            </div>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 mb-6">
            <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 text-sm">{error}</p>
              <button onClick={reset} className="text-xs text-red-400/60 underline mt-1">
                Start over
              </button>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">

          {/* ── Step: search ── */}
          {step === 'search' && (
            <motion.div key="search" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-5">
              <div className="p-7 rounded-2xl bg-slate-900 border border-slate-700/60 text-center space-y-4">
                <motion.div
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                  className="w-16 h-16 rounded-full bg-indigo-500/15 flex items-center justify-center mx-auto"
                >
                  <Radio className="w-8 h-8 text-indigo-400" />
                </motion.div>
                <div>
                  <h2 className="font-bold text-lg text-white mb-1">Power On Device</h2>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Turn on your HireLens collar. The top LED bar should pulse <span className="text-blue-400">blue</span> to indicate pairing mode.
                  </p>
                </div>
              </div>
              <button
                onClick={startScan}
                disabled={!bleSupport.supported}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <Bluetooth className="w-5 h-5" />
                Scan for HireLens Devices
              </button>
            </motion.div>
          )}

          {/* ── Step: found ── */}
          {step === 'found' && discoveredDevice && (
            <motion.div key="found" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-5">
              <div className="p-5 rounded-2xl bg-slate-900 border border-emerald-500/30 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                  <Bluetooth className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-white">{discoveredDevice.name}</p>
                  <p className="text-xs text-slate-400">Serial: {discoveredDevice.serialNumber}</p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <button
                onClick={connect}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold flex items-center justify-center gap-3 transition-all"
              >
                Connect via Bluetooth <ChevronRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {/* ── Step: connecting ── */}
          {step === 'connecting' && (
            <motion.div key="connecting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-14 space-y-4">
              <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mx-auto" />
              <p className="font-bold text-white">Establishing GATT connection…</p>
              <p className="text-slate-500 text-sm">Keep device within 1 meter of this laptop.</p>
            </motion.div>
          )}

          {/* ── Step: authenticating ── */}
          {step === 'authenticating' && pairingCode && (
            <motion.div key="auth" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-5">
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-700/60 text-center space-y-4">
                <ShieldCheck className="w-10 h-10 text-indigo-400 mx-auto" />
                <div>
                  <h2 className="font-bold text-lg text-white mb-1">Verify Pairing Code</h2>
                  <p className="text-slate-400 text-sm">
                    Your collar&apos;s LED bar is displaying a 6-digit code. Confirm it matches.
                  </p>
                </div>
                {/* Code display */}
                <div className="inline-flex gap-2 justify-center">
                  {pairingCode.split('').map((d, i) => (
                    <div
                      key={i}
                      className="w-10 h-12 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-2xl font-black text-indigo-300"
                    >
                      {d}
                    </div>
                  ))}
                </div>
              </div>

              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={userCode}
                onChange={e => setUserCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit code"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3.5 text-white text-center text-2xl tracking-[0.3em] font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
              />
              <button
                disabled={userCode.length !== 6}
                onClick={() => confirmCode(userCode)}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Confirm Code
              </button>
            </motion.div>
          )}

          {/* ── Step: configuring_wifi ── */}
          {step === 'configuring_wifi' && (
            <motion.div key="wifi" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-900 border border-slate-700/60">
                <Wifi className="w-6 h-6 text-indigo-400 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm text-white">WiFi Configuration</p>
                  <p className="text-xs text-slate-400">The collar needs WiFi to stream to the AI cloud.</p>
                </div>
              </div>

              <input
                value={ssid}
                onChange={e => setSsid(e.target.value)}
                placeholder="WiFi Network Name (SSID)"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
              />
              <input
                type="password"
                value={wifiPassword}
                onChange={e => setWifiPassword(e.target.value)}
                placeholder="WiFi Password"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
              />

              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-500/8 border border-amber-500/20">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-300/80 leading-relaxed">
                  Credentials are sent directly to the device over encrypted BLE — never stored on Fluenzy servers.
                </p>
              </div>

              <button
                disabled={!ssid.trim() || !wifiPassword}
                onClick={() => configureWifi(ssid.trim(), wifiPassword)}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Configure Device WiFi
              </button>
            </motion.div>
          )}

          {/* ── Step: testing_stream ── */}
          {step === 'testing_stream' && (
            <motion.div key="testing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-14 space-y-5">
              <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mx-auto" />
              <div>
                <p className="font-bold text-white">Testing cloud connection…</p>
                <p className="text-slate-500 text-sm mt-1">Verifying the device can reach the AI pipeline.</p>
              </div>
              <button
                onClick={registerAndFinish}
                className="text-xs text-indigo-400 underline underline-offset-2"
              >
                Skip test &amp; continue
              </button>
            </motion.div>
          )}

          {/* ── Step: paired ── */}
          {step === 'paired' && (
            <motion.div
              key="paired"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6 py-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
                className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mx-auto"
              >
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </motion.div>

              <div>
                <h2 className="text-2xl font-black text-white mb-2">Device Paired!</h2>
                <p className="text-slate-400 text-sm">
                  Your HireLens collar is registered and ready for interviews.
                </p>
              </div>

              <button
                onClick={() => router.push('/company/portal/hirelens/hardware')}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold transition-all shadow-lg shadow-indigo-500/20"
              >
                Go to Device List
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
