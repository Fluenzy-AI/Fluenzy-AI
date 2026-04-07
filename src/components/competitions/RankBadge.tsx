'use client';

// ═══════════════════════════════════════════════════════════════════════════════
// Rank Badge Component
// Displays rank with appropriate medal/trophy icon
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { Trophy, Medal, Award, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RankBadgeProps {
  rank: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const rankConfig = {
  1: {
    icon: Trophy,
    bgColor: 'bg-gradient-to-br from-yellow-400 to-yellow-600',
    textColor: 'text-yellow-900',
    label: '1st'
  },
  2: {
    icon: Medal,
    bgColor: 'bg-gradient-to-br from-slate-300 to-slate-500',
    textColor: 'text-slate-900',
    label: '2nd'
  },
  3: {
    icon: Award,
    bgColor: 'bg-gradient-to-br from-amber-600 to-amber-800',
    textColor: 'text-amber-100',
    label: '3rd'
  }
};

const sizeStyles = {
  sm: {
    container: 'h-6 w-6 text-xs',
    icon: 'h-3 w-3'
  },
  md: {
    container: 'h-8 w-8 text-sm',
    icon: 'h-4 w-4'
  },
  lg: {
    container: 'h-12 w-12 text-lg',
    icon: 'h-6 w-6'
  }
};

export function RankBadge({ rank, size = 'md', showLabel = false, className }: RankBadgeProps) {
  const config = rankConfig[rank as keyof typeof rankConfig];
  const sizeStyle = sizeStyles[size];

  if (config) {
    const Icon = config.icon;
    return (
      <div className={cn('flex items-center gap-1.5', className)}>
        <div className={cn(
          'rounded-full flex items-center justify-center font-bold shadow-md',
          config.bgColor,
          config.textColor,
          sizeStyle.container
        )}>
          <Icon className={sizeStyle.icon} />
        </div>
        {showLabel && (
          <span className={cn(
            'font-semibold',
            rank === 1 && 'text-yellow-400',
            rank === 2 && 'text-slate-400',
            rank === 3 && 'text-amber-400'
          )}>
            {config.label}
          </span>
        )}
      </div>
    );
  }

  // Default rank display for ranks > 3
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className={cn(
        'rounded-full flex items-center justify-center font-medium bg-slate-700 text-slate-300',
        sizeStyle.container
      )}>
        {rank <= 99 ? rank : (
          <Hash className={cn(sizeStyle.icon, 'opacity-50')} />
        )}
      </div>
      {showLabel && (
        <span className="text-muted-foreground text-sm">
          #{rank}
        </span>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Badge Type Display Component
// Shows competition badges (Gold, Silver, Bronze, etc.)
// ═══════════════════════════════════════════════════════════════════════════════

type BadgeType = 'GOLD' | 'SILVER' | 'BRONZE' | 'PARTICIPATION' | 'TOP_PERFORMER';

interface CompetitionBadgeProps {
  type: BadgeType;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const badgeConfig: Record<BadgeType, {
  icon: typeof Trophy;
  bgColor: string;
  textColor: string;
  label: string;
}> = {
  GOLD: {
    icon: Trophy,
    bgColor: 'bg-gradient-to-br from-yellow-400 to-yellow-600',
    textColor: 'text-yellow-900',
    label: 'Gold'
  },
  SILVER: {
    icon: Medal,
    bgColor: 'bg-gradient-to-br from-slate-300 to-slate-500',
    textColor: 'text-slate-900',
    label: 'Silver'
  },
  BRONZE: {
    icon: Award,
    bgColor: 'bg-gradient-to-br from-amber-600 to-amber-800',
    textColor: 'text-amber-100',
    label: 'Bronze'
  },
  PARTICIPATION: {
    icon: Award,
    bgColor: 'bg-gradient-to-br from-slate-600 to-slate-800',
    textColor: 'text-slate-200',
    label: 'Participant'
  },
  TOP_PERFORMER: {
    icon: Trophy,
    bgColor: 'bg-gradient-to-br from-violet-500 to-purple-700',
    textColor: 'text-white',
    label: 'Top Performer'
  }
};

export function CompetitionBadge({ type, size = 'md', showLabel = true, className }: CompetitionBadgeProps) {
  const config = badgeConfig[type];
  const sizeStyle = sizeStyles[size];
  const Icon = config.icon;

  return (
    <div className={cn(
      'inline-flex items-center gap-2 px-3 py-1.5 rounded-full',
      config.bgColor,
      className
    )}>
      <Icon className={cn(sizeStyle.icon, config.textColor)} />
      {showLabel && (
        <span className={cn(
          'font-semibold',
          config.textColor,
          size === 'sm' && 'text-xs',
          size === 'md' && 'text-sm',
          size === 'lg' && 'text-base'
        )}>
          {config.label}
        </span>
      )}
    </div>
  );
}
