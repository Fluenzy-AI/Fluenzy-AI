'use client';

import { Battery, Wifi, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DeviceDiagnostics } from '@/types/hardware';

// ── WiFi signal bars (4 bars, fill based on signal dBm) ──────────────────────
function WifiBar({ signal }: { signal?: number }) {
  // dBm: -50 = excellent, -70 = good, -80 = fair, <-85 = poor
  const bars = !signal ? 0 : signal > -55 ? 4 : signal > -67 ? 3 : signal > -78 ? 2 : 1;
  return (
    <div className="flex items-end gap-[2px] h-3.5">
      {[1, 2, 3, 4].map(b => (
        <div
          key={b}
          className={cn(
            'w-[3px] rounded-sm transition-colors',
            b <= bars ? 'bg-emerald-400' : 'bg-slate-700'
          )}
          style={{ height: `${25 * b}%` }}
        />
      ))}
    </div>
  );
}

// ── Battery fill ──────────────────────────────────────────────────────────────
function BatteryBar({ level }: { level?: number }) {
  const pct = level ?? 0;
  const color =
    pct < 15 ? 'bg-red-500' : pct < 30 ? 'bg-amber-400' : 'bg-emerald-400';
  return (
    <div className="flex items-center gap-1.5">
      <div className="relative w-7 h-3.5 rounded-sm border border-slate-600 overflow-hidden">
        <div
          className={cn('h-full transition-all', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={cn(
          'text-[10px] font-mono tabular-nums',
          pct < 15
            ? 'text-red-400'
            : pct < 30
            ? 'text-amber-400'
            : 'text-emerald-400'
        )}
      >
        {pct}%
      </span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  diagnostics: DeviceDiagnostics | null;
  isStreaming: boolean;
  className?: string;
}

export function DeviceDiagnosticsBar({ diagnostics, isStreaming, className }: Props) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/60',
        className
      )}
    >
      {/* Battery */}
      <div className="flex items-center gap-1.5">
        <Battery className="w-3.5 h-3.5 text-slate-500" />
        <BatteryBar level={diagnostics?.batteryLevel} />
      </div>

      <div className="w-px h-3.5 bg-slate-700" />

      {/* WiFi signal */}
      <div className="flex items-center gap-1.5">
        <Wifi className="w-3.5 h-3.5 text-slate-500" />
        <WifiBar signal={diagnostics?.wifiSignal} />
      </div>

      <div className="w-px h-3.5 bg-slate-700" />

      {/* Stream status */}
      <div className="flex items-center gap-1.5">
        <Activity
          className={cn(
            'w-3.5 h-3.5',
            isStreaming ? 'text-indigo-400' : 'text-slate-600'
          )}
        />
        <span
          className={cn(
            'text-[10px] font-semibold',
            isStreaming ? 'text-indigo-400' : 'text-slate-600'
          )}
        >
          {isStreaming ? 'Streaming' : 'Idle'}
        </span>
      </div>
    </div>
  );
}
