'use client';

// ═══════════════════════════════════════════════════════════════════════════════
// Competition Timer Component
// Countdown timer for competition start/end
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Clock, Timer } from 'lucide-react';

interface CompetitionTimerProps {
  targetDate: string | Date;
  label?: string;
  variant?: 'countdown' | 'elapsed' | 'duration';
  durationSeconds?: number; // For duration variant
  onComplete?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

function calculateTimeRemaining(targetDate: Date): TimeRemaining {
  const now = new Date().getTime();
  const target = targetDate.getTime();
  const total = target - now;

  if (total <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }

  return {
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((total % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((total % (1000 * 60)) / 1000),
    total
  };
}

function calculateElapsedTime(startDate: Date): TimeRemaining {
  const now = new Date().getTime();
  const start = startDate.getTime();
  const total = now - start;

  if (total <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }

  return {
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((total % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((total % (1000 * 60)) / 1000),
    total
  };
}

function calculateDurationRemaining(durationSeconds: number, startDate: Date): TimeRemaining {
  const now = new Date().getTime();
  const start = startDate.getTime();
  const elapsed = now - start;
  const remaining = (durationSeconds * 1000) - elapsed;

  if (remaining <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }

  return {
    days: 0,
    hours: Math.floor(remaining / (1000 * 60 * 60)),
    minutes: Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((remaining % (1000 * 60)) / 1000),
    total: remaining
  };
}

export function CompetitionTimer({
  targetDate,
  label,
  variant = 'countdown',
  durationSeconds,
  onComplete,
  size = 'md',
  showIcon = true,
  className
}: CompetitionTimerProps) {
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;

  const getTime = useCallback(() => {
    switch (variant) {
      case 'elapsed':
        return calculateElapsedTime(target);
      case 'duration':
        return calculateDurationRemaining(durationSeconds || 0, target);
      default:
        return calculateTimeRemaining(target);
    }
  }, [variant, target, durationSeconds]);

  const [time, setTime] = useState<TimeRemaining>(getTime);
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const newTime = getTime();
      setTime(newTime);

      if (newTime.total <= 0 && !hasCompleted && variant !== 'elapsed') {
        setHasCompleted(true);
        onComplete?.();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [getTime, hasCompleted, onComplete, variant]);

  const padNumber = (num: number) => num.toString().padStart(2, '0');

  // Size-based styles
  const sizeStyles = {
    sm: 'text-xs gap-1',
    md: 'text-sm gap-2',
    lg: 'text-lg gap-3'
  };

  const unitStyles = {
    sm: 'px-1.5 py-0.5 min-w-[28px]',
    md: 'px-2 py-1 min-w-[36px]',
    lg: 'px-3 py-2 min-w-[48px]'
  };

  // Check if timer is critical (less than 5 minutes for countdown/duration)
  const isCritical = variant !== 'elapsed' && time.total > 0 && time.total < 5 * 60 * 1000;

  // Format based on variant
  const showDays = time.days > 0;
  const showHours = showDays || time.hours > 0;

  if (time.total <= 0 && variant !== 'elapsed') {
    return (
      <div className={cn('flex items-center gap-2', sizeStyles[size], className)}>
        {showIcon && <Timer className={cn(
          size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
        )} />}
        <span className="text-muted-foreground">
          {variant === 'countdown' ? 'Started' : 'Time up!'}
        </span>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {label && (
        <span className={cn(
          'text-muted-foreground',
          size === 'sm' ? 'text-[10px]' : 'text-xs'
        )}>
          {label}
        </span>
      )}
      
      <div className={cn(
        'flex items-center font-mono',
        sizeStyles[size],
        isCritical && 'text-red-400'
      )}>
        {showIcon && (
          <Clock className={cn(
            size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4',
            isCritical && 'animate-pulse'
          )} />
        )}
        
        <div className="flex items-center gap-1">
          {showDays && (
            <>
              <span className={cn(
                'bg-slate-800 rounded text-center',
                unitStyles[size]
              )}>
                {padNumber(time.days)}
              </span>
              <span className="text-muted-foreground">d</span>
            </>
          )}
          
          {showHours && (
            <>
              <span className={cn(
                'bg-slate-800 rounded text-center',
                unitStyles[size]
              )}>
                {padNumber(time.hours)}
              </span>
              <span className="text-muted-foreground">:</span>
            </>
          )}
          
          <span className={cn(
            'bg-slate-800 rounded text-center',
            unitStyles[size]
          )}>
            {padNumber(time.minutes)}
          </span>
          <span className="text-muted-foreground">:</span>
          
          <span className={cn(
            'bg-slate-800 rounded text-center',
            unitStyles[size],
            isCritical && 'bg-red-500/20'
          )}>
            {padNumber(time.seconds)}
          </span>
        </div>
      </div>
    </div>
  );
}
