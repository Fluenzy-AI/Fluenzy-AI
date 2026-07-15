'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCompanyAuth } from '@/contexts/CompanyAuthContext';
import { PortalLayout, LiveIndicator } from '@/components/portal';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Smartphone,
  Cpu,
  ChevronRight,
  Zap,
  Shield,
  Wifi,
  BarChart3,
  Brain,
  Users,
  Clock,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
    <PortalLayout title="HireLens AI — Interview Intelligence">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* ── Console Header ── */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold" style={{ color: 'var(--portal-text-primary)' }}>
                HireLens AI
              </h1>
              <LiveIndicator label="Live" size="md" />
            </div>
            <p className="text-sm" style={{ color: 'var(--portal-text-muted)' }}>
              AI-powered interview intelligence. Real-time behavioral scoring, transcripts & insights.
            </p>
          </div>
        </div>

        {/* ── Quick Stats (console feel) ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Sessions Today', value: '0', icon: Activity, color: 'var(--portal-live)' },
            { label: 'Total Interviews', value: '0', icon: Brain, color: 'var(--portal-primary)' },
            { label: 'Avg. Confidence', value: '—', icon: BarChart3, color: 'var(--portal-info)' },
            { label: 'Avg. Duration', value: '—', icon: Clock, color: 'var(--portal-warning)' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="rounded-lg border p-4"
                style={{
                  backgroundColor: 'var(--portal-bg-elevated)',
                  borderColor: 'var(--portal-border)',
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4" style={{ color: stat.color }} />
                  <span className="text-xs font-medium" style={{ color: 'var(--portal-text-muted)' }}>
                    {stat.label}
                  </span>
                </div>
                <p className="portal-mono text-xl font-bold" style={{ color: 'var(--portal-text-primary)' }}>
                  {stat.value}
                </p>
              </div>
            );
          })}
        </div>

        {/* ── Capability Pills ── */}
        <div className="flex flex-wrap gap-2">
          {[
            { icon: Zap, label: 'Real-time Scoring' },
            { icon: BarChart3, label: 'Live Transcript' },
            { icon: Brain, label: 'AI Follow-up Questions' },
            { icon: Shield, label: 'GDPR Consent Flow' },
            { icon: Wifi, label: 'WebRTC Streaming' },
          ].map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium"
              style={{
                backgroundColor: 'var(--portal-bg-elevated)',
                border: '1px solid var(--portal-border)',
                color: 'var(--portal-text-secondary)',
              }}
            >
              <Icon className="w-3.5 h-3.5" style={{ color: 'var(--portal-live)' }} />
              {label}
            </span>
          ))}
        </div>

        {/* ── Mode Selection Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Mobile Mode */}
          <button
            onClick={() => setSelected('MOBILE')}
            className="relative text-left rounded-lg border-2 p-5 transition-all duration-200 group focus:outline-none"
            style={{
              borderColor: selected === 'MOBILE' ? 'var(--portal-primary)' : 'var(--portal-border)',
              backgroundColor: selected === 'MOBILE' ? 'var(--portal-primary-muted)' : 'var(--portal-bg-elevated)',
            }}
          >
            {/* Ready badge */}
            <span
              className="absolute top-4 right-4 text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"
              style={{
                backgroundColor: 'var(--portal-success-muted)',
                color: 'var(--portal-success)',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full portal-live-pulse"
                style={{ backgroundColor: 'var(--portal-success)' }}
              />
              Ready to use
            </span>

            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-105 transition-transform"
              style={{
                backgroundColor: 'var(--portal-primary-muted)',
              }}
            >
              <Smartphone className="w-6 h-6" style={{ color: 'var(--portal-primary)' }} />
            </div>

            <h2 className="text-lg font-bold mb-1.5" style={{ color: 'var(--portal-text-primary)' }}>
              Mobile Mode
            </h2>
            <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--portal-text-muted)' }}>
              Use any smartphone as the capture device. Place it facing the candidate,
              then monitor everything from your laptop's live dashboard.
            </p>

            <div className="space-y-1.5">
              {mobileFeatures.map((f) => (
                <div key={f} className="flex items-center gap-2 text-xs" style={{ color: 'var(--portal-text-secondary)' }}>
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: 'var(--portal-primary)' }}
                  />
                  {f}
                </div>
              ))}
            </div>
          </button>

          {/* Hardware Mode */}
          <button
            onClick={() => setSelected('HARDWARE')}
            className="relative text-left rounded-lg border-2 p-5 transition-all duration-200 group focus:outline-none"
            style={{
              borderColor: selected === 'HARDWARE' ? 'var(--portal-primary)' : 'var(--portal-border)',
              backgroundColor: selected === 'HARDWARE' ? 'var(--portal-primary-muted)' : 'var(--portal-bg-elevated)',
            }}
          >
            {/* Enterprise badge */}
            <span
              className="absolute top-4 right-4 text-[10px] px-2 py-0.5 rounded-full font-semibold"
              style={{
                backgroundColor: 'var(--portal-info-muted)',
                color: 'var(--portal-info)',
              }}
            >
              Enterprise
            </span>

            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-105 transition-transform"
              style={{
                backgroundColor: 'var(--portal-info-muted)',
              }}
            >
              <Cpu className="w-6 h-6" style={{ color: 'var(--portal-info)' }} />
            </div>

            <h2 className="text-lg font-bold mb-1.5" style={{ color: 'var(--portal-text-primary)' }}>
              Hardware Mode
            </h2>
            <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--portal-text-muted)' }}>
              HireLens Collar Device — clip-on camera for enterprise-grade capture
              with hands-free operation and offline edge processing.
            </p>

            <div className="space-y-1.5">
              {hardwareFeatures.map((f) => (
                <div key={f} className="flex items-center gap-2 text-xs" style={{ color: 'var(--portal-text-secondary)' }}>
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: 'var(--portal-info)' }}
                  />
                  {f}
                </div>
              ))}
            </div>
          </button>
        </div>

        {/* ── CTA ── */}
        <div className="flex flex-col items-center gap-3">
          <Link
            href={
              selected === 'MOBILE' ? '/company/portal/hirelens/new'
              : selected === 'HARDWARE' ? '/company/portal/hirelens/hardware'
              : '#'
            }
            className={cn(
              'inline-flex items-center gap-3 px-6 py-3 rounded-md font-semibold text-sm transition-all duration-200',
              selected
                ? ''
                : 'pointer-events-none'
            )}
            style={{
              backgroundColor: selected ? 'var(--portal-primary)' : 'var(--portal-disabled-bg)',
              color: selected ? 'var(--portal-primary-text)' : 'var(--portal-text-disabled)',
            }}
          >
            Continue with{' '}
            {selected === 'MOBILE' ? 'Mobile Mode' : selected === 'HARDWARE' ? 'Hardware Mode' : 'Selected Mode'}
            <ChevronRight className="w-4 h-4" />
          </Link>

          {!selected && (
            <p className="text-xs" style={{ color: 'var(--portal-text-muted)' }}>
              ← Select a mode above to continue
            </p>
          )}
        </div>

        {/* ── How it works ── */}
        <div
          className="rounded-lg border p-5"
          style={{
            backgroundColor: 'var(--portal-bg-elevated)',
            borderColor: 'var(--portal-border)',
          }}
        >
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--portal-text-primary)' }}>
            <Zap className="w-4 h-4" style={{ color: 'var(--portal-live)' }} />
            How it works
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              { step: '01', label: 'Enter candidate info — one form, done', icon: Users },
              { step: '02', label: 'Scan QR on your phone — it becomes the capture device', icon: Smartphone },
              { step: '03', label: 'Phone captures; AI analyses voice, face & speech live', icon: Brain },
              { step: '04', label: 'Watch live AI dashboard on your laptop throughout', icon: BarChart3 },
            ].map(({ step, label, icon: Icon }) => (
              <div key={step} className="flex flex-col items-start gap-2">
                <div
                  className="w-8 h-8 rounded-md flex items-center justify-center"
                  style={{ backgroundColor: 'var(--portal-live-muted)' }}
                >
                  <Icon className="w-4 h-4" style={{ color: 'var(--portal-live)' }} />
                </div>
                <span className="text-[10px] font-bold portal-mono" style={{ color: 'var(--portal-live)' }}>
                  Step {step}
                </span>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--portal-text-muted)' }}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
