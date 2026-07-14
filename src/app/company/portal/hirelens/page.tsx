'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useCompanyAuth } from '@/contexts/CompanyAuthContext';
import CompanyPortalLayout from '@/components/CompanyPortalLayout';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  UserPlus,
  Settings,
  FileText,
  Smartphone,
  Cpu,
  ChevronRight,
  Zap,
  Clock,
  Shield,
  Wifi,
  BarChart3,
  Brain,
  ScanFace,
} from 'lucide-react';
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

type Mode = 'MOBILE' | 'HARDWARE';

const mobileFeatures = [
  'No extra hardware required',
  'Works on any smartphone browser',
  'Instant setup in under 2 minutes',
  'Real-time AI analysis on laptop',
  'Full behavioral scoring',
];

const hardwareFeatures = [
  'Wearable collar device (HireLens Pro)',
  'Enterprise-grade audio capture',
  'Hands-free HR operation',
  'Superior noise cancellation',
  'Offline-capable edge processing',
];

export default function HireLensModePage() {
  const { user, loading } = useCompanyAuth();
  const router = useRouter();
  const [selected, setSelected] = useState<Mode | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/company/login');
  }, [user, loading, router]);

  return (
    <CompanyPortalLayout navItems={COMPANY_NAV} title="HireLens AI — Interview Mode">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center pt-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-5">
            <Brain className="w-4 h-4" />
            Fluenzy AI HireLens
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
            AI-Powered Interview Intelligence
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Capture real-time behavioral signals, voice tone, and facial cues.
            Let AI surface insights while you focus on the conversation.
          </p>
        </motion.div>

        {/* Feature Pills */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap justify-center gap-2"
        >
          {[
            { icon: Zap, label: 'Real-time Scoring' },
            { icon: BarChart3, label: 'Live Transcript' },
            { icon: Brain, label: 'AI Questions' },
            { icon: Shield, label: 'GDPR Consent Flow' },
            { icon: Wifi, label: 'WebRTC Streaming' },
          ].map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-medium"
            >
              <Icon className="w-3.5 h-3.5 text-indigo-400" />
              {label}
            </span>
          ))}
        </motion.div>

        {/* Mode Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-5"
        >
          {/* ── Mobile Mode ── */}
          <button
            onClick={() => setSelected('MOBILE')}
            className={cn(
              'relative p-6 rounded-2xl border-2 text-left transition-all duration-200 group focus:outline-none',
              selected === 'MOBILE'
                ? 'border-indigo-500 bg-indigo-600/10 shadow-lg shadow-indigo-500/10'
                : 'border-slate-700/80 bg-slate-800/50 hover:border-indigo-500/50 hover:bg-slate-800'
            )}
          >
            {/* Active badge */}
            <span className="absolute top-4 right-4 text-xs px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Active
            </span>

            {/* Selection ring */}
            {selected === 'MOBILE' && (
              <motion.div
                layoutId="selection-ring"
                className="absolute inset-0 rounded-2xl border-2 border-indigo-500 pointer-events-none"
              />
            )}

            <div className="w-14 h-14 rounded-xl bg-indigo-500/15 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <Smartphone className="w-7 h-7 text-indigo-400" />
            </div>

            <h2 className="text-xl font-bold text-white mb-2">Mobile Mode</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-5">
              Use any smartphone as the capture device. Place it facing the candidate,
              then monitor everything from your laptop's live dashboard.
            </p>

            <div className="space-y-2">
              {mobileFeatures.map(f => (
                <div key={f} className="flex items-center gap-2.5 text-xs text-indigo-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                  {f}
                </div>
              ))}
            </div>
          </button>

          {/* ── Hardware Mode ── */}
          <button
            onClick={() => setSelected('HARDWARE')}
            className={cn(
              'relative p-6 rounded-2xl border-2 text-left transition-all duration-200 group focus:outline-none',
              selected === 'HARDWARE'
                ? 'border-indigo-500 bg-indigo-600/10 shadow-lg shadow-indigo-500/10'
                : 'border-slate-700/80 bg-slate-800/50 hover:border-indigo-500/50 hover:bg-slate-800'
            )}
          >
            {/* Enterprise badge */}
            <span className="absolute top-4 right-4 text-xs px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 font-semibold">
              Enterprise
            </span>

            {/* Selection ring */}
            {selected === 'HARDWARE' && (
              <motion.div
                layoutId="selection-ring"
                className="absolute inset-0 rounded-2xl border-2 border-indigo-500 pointer-events-none"
              />
            )}

            <div className="w-14 h-14 rounded-xl bg-indigo-500/15 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <Cpu className="w-7 h-7 text-indigo-400" />
            </div>

            <h2 className="text-xl font-bold text-white mb-2">Hardware Mode</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-5">
              HireLens Collar Device — clip-on camera worn during the interview.
              Enterprise-grade capture with hands-free operation and offline edge processing.
            </p>

            <div className="space-y-2">
              {hardwareFeatures.map(f => (
                <div key={f} className="flex items-center gap-2.5 text-xs text-indigo-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                  {f}
                </div>
              ))}
            </div>
          </button>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="flex flex-col items-center gap-3"
        >
          <Link
            href={
              selected === 'MOBILE' ? '/company/portal/hirelens/new'
              : selected === 'HARDWARE' ? '/company/portal/hirelens/hardware'
              : '#'
            }
            className={cn(
              'inline-flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 shadow-lg',
              selected
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-500/25 scale-100 hover:scale-[1.02]'
                : 'bg-slate-800 text-slate-600 cursor-not-allowed pointer-events-none'
            )}
          >
            Continue with{' '}
            {selected === 'MOBILE' ? 'Mobile Mode' : selected === 'HARDWARE' ? 'Hardware Mode' : 'Selected Mode'}
            <ChevronRight className="w-5 h-5" />
          </Link>

          {!selected && (
            <p className="text-slate-600 text-sm">
              ← Select a mode above to continue
            </p>
          )}

          <p className="text-slate-600 text-xs text-center max-w-md">
            Both modes use the same AI analysis engine. Hardware mode will offer enhanced
            capture quality for enterprise deployments.
          </p>
        </motion.div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6"
        >
          <h3 className="text-white font-bold text-base mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-400" />
            How it works
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              { step: '01', label: 'Enter candidate info on your laptop — one form, done', icon: Users },
              { step: '02', label: 'Scan QR on your phone — it becomes the capture device', icon: Smartphone },
              { step: '03', label: 'Phone captures; AI analyses voice, face & speech live', icon: Brain },
              { step: '04', label: 'Watch live AI dashboard on your laptop throughout', icon: BarChart3 },
            ].map(({ step, label, icon: Icon }) => (
              <div key={step} className="flex flex-col items-start gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/15 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-indigo-400" />
                </div>
                <span className="text-indigo-400 text-xs font-bold">Step {step}</span>
                <p className="text-slate-400 text-xs leading-relaxed">{label}</p>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </CompanyPortalLayout>
  );
}
