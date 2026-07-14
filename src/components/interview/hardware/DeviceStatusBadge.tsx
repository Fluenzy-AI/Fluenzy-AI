'use client';

import { cn } from '@/lib/utils';
import type { DeviceStatus } from '@/types/hardware';

const STATUS_CONFIG: Record<
  DeviceStatus,
  { label: string; dot: string; bg: string; text: string }
> = {
  UNREGISTERED: { label: 'Unregistered', dot: 'bg-slate-500',   bg: 'bg-slate-700/40',    text: 'text-slate-400' },
  REGISTERED:   { label: 'Registered',   dot: 'bg-blue-400',    bg: 'bg-blue-500/10',     text: 'text-blue-400'  },
  PAIRED:       { label: 'Paired',       dot: 'bg-indigo-400',  bg: 'bg-indigo-500/10',   text: 'text-indigo-400'},
  ONLINE:       { label: 'Online',       dot: 'bg-emerald-400 animate-pulse', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  STREAMING:    { label: 'Streaming',    dot: 'bg-indigo-400 animate-pulse',  bg: 'bg-indigo-500/15',  text: 'text-indigo-300'  },
  IDLE:         { label: 'Idle',         dot: 'bg-slate-400',   bg: 'bg-slate-700/40',    text: 'text-slate-400' },
  LOW_BATTERY:  { label: 'Low Battery',  dot: 'bg-amber-400 animate-pulse',   bg: 'bg-amber-500/10',   text: 'text-amber-400'   },
  ERROR:        { label: 'Error',        dot: 'bg-red-400 animate-pulse',     bg: 'bg-red-500/10',     text: 'text-red-400'     },
  OFFLINE:      { label: 'Offline',      dot: 'bg-slate-600',   bg: 'bg-slate-800/40',    text: 'text-slate-500' },
};

interface Props {
  status: DeviceStatus;
  className?: string;
}

export function DeviceStatusBadge({ status, className }: Props) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG['OFFLINE'];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold',
        cfg.bg,
        cfg.text,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', cfg.dot)} />
      {cfg.label}
    </span>
  );
}
