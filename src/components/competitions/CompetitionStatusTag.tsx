'use client';

// ═══════════════════════════════════════════════════════════════════════════════
// Competition Status Tag Component
// Displays competition status as a colored pill/badge
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Play, 
  CheckCircle, 
  XCircle,
  FileEdit 
} from 'lucide-react';
import { cn } from '@/lib/utils';

type CompetitionStatus = 'DRAFT' | 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

interface CompetitionStatusTagProps {
  status: CompetitionStatus;
  size?: 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
}

const statusConfig: Record<CompetitionStatus, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  className: string;
}> = {
  DRAFT: {
    label: 'Draft',
    icon: FileEdit,
    className: 'bg-slate-500/10 text-slate-400 border-slate-500/20'
  },
  UPCOMING: {
    label: 'Upcoming',
    icon: Clock,
    className: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
  },
  ACTIVE: {
    label: 'Live',
    icon: Play,
    className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 animate-pulse'
  },
  COMPLETED: {
    label: 'Completed',
    icon: CheckCircle,
    className: 'bg-violet-500/10 text-violet-400 border-violet-500/20'
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: XCircle,
    className: 'bg-red-500/10 text-red-400 border-red-500/20'
  }
};

export function CompetitionStatusTag({ 
  status, 
  size = 'md',
  showIcon = true,
  className 
}: CompetitionStatusTagProps) {
  const config = statusConfig[status] || statusConfig.DRAFT;
  const Icon = config.icon;

  if (!status || !statusConfig[status]) {
    return (
      <Badge 
        variant="outline"
        className={cn(
          'bg-slate-500/10 text-slate-400 border-slate-500/20',
          size === 'sm' && 'text-[10px] px-1.5 py-0',
          className
        )}
      >
        {showIcon && <FileEdit className={cn('mr-1', size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3')} />}
        Unknown
      </Badge>
    );
  }

  return (
    <Badge 
      variant="outline"
      className={cn(
        config.className,
        size === 'sm' && 'text-[10px] px-1.5 py-0',
        className
      )}
    >
      {showIcon && (
        <Icon className={cn(
          'mr-1',
          size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3'
        )} />
      )}
      {config.label}
    </Badge>
  );
}
