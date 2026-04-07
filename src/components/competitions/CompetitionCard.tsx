'use client';

// ═══════════════════════════════════════════════════════════════════════════════
// Competition Card Component
// Displays competition summary in list view
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Clock, 
  Users, 
  Trophy,
  Globe,
  Building2,
  GraduationCap,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CompetitionStatusTag } from './CompetitionStatusTag';

interface CompetitionCardProps {
  competition: {
    id: string;
    name: string;
    description?: string | null;
    scope: 'GLOBAL' | 'UNIVERSITY' | 'COLLEGE';
    type: 'GD_BATTLE' | 'HR_INTERVIEW_BATTLE' | 'CORPORATE_VOICE_BATTLE';
    status: 'DRAFT' | 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
    startDate: string;
    endDate: string;
    registrationDeadline?: string | null;
    participantLimit?: number | null;
    participantCount?: number;
    prizePool?: string | null;
    bannerUrl?: string | null;
    // GD Battle specific
    minGDParticipants?: number | null;
    maxGDParticipants?: number | null;
    // Registration status
    myStatus?: 'REGISTERED' | 'PARTICIPATED' | null;
    myRank?: number | null;
    myScore?: number | null;
  };
  variant?: 'default' | 'compact';
  linkPrefix?: string;
  showActions?: boolean;
}

const scopeConfig = {
  GLOBAL: { icon: Globe, label: 'Global', color: 'bg-purple-500/10 text-purple-400' },
  UNIVERSITY: { icon: GraduationCap, label: 'University', color: 'bg-blue-500/10 text-blue-400' },
  COLLEGE: { icon: Building2, label: 'College', color: 'bg-emerald-500/10 text-emerald-400' }
};

const typeLabels = {
  GD_BATTLE: 'Group Discussion',
  HR_INTERVIEW_BATTLE: 'HR Interview',
  CORPORATE_VOICE_BATTLE: 'Corporate Voice'
};

export function CompetitionCard({ 
  competition, 
  variant = 'default',
  linkPrefix = '/competitions',
  showActions = true
}: CompetitionCardProps) {
  const ScopeIcon = scopeConfig[competition.scope].icon;
  const startDate = new Date(competition.startDate);
  const endDate = new Date(competition.endDate);
  const registrationDeadline = competition.registrationDeadline 
    ? new Date(competition.registrationDeadline) 
    : null;
  
  const now = new Date();
  // Registration open for UPCOMING competitions
  const isRegistrationOpen = registrationDeadline 
    ? now < registrationDeadline && competition.status === 'UPCOMING'
    : competition.status === 'UPCOMING';
  
  // Can join active competitions
  const canJoin = competition.status === 'ACTIVE';

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: startDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true
    });
  };

  if (variant === 'compact') {
    return (
      <Link href={`${linkPrefix}/${competition.id}`}>
        <Card variant="interactive" className="group">
          <CardContent className="py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className={cn(
                "p-2 rounded-lg shrink-0",
                scopeConfig[competition.scope].color
              )}>
                <ScopeIcon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{competition.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(startDate)} • {typeLabels[competition.type]}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <CompetitionStatusTag status={competition.status} size="sm" />
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Card 
      variant="interactive" 
      className="group overflow-hidden"
    >
      {/* Banner Image */}
      {competition.bannerUrl && (
        <div className="h-32 -mt-6 -mx-px overflow-hidden rounded-t-xl">
          <img 
            src={competition.bannerUrl} 
            alt={competition.name}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        </div>
      )}
      
      <CardHeader className={competition.bannerUrl ? 'pt-4' : ''}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge 
              variant="outline" 
              className={cn(scopeConfig[competition.scope].color, 'border-0')}
            >
              <ScopeIcon className="h-3 w-3 mr-1" />
              {scopeConfig[competition.scope].label}
            </Badge>
            <Badge variant="secondary" className="bg-slate-700/50">
              {typeLabels[competition.type]}
            </Badge>
          </div>
          <CompetitionStatusTag status={competition.status} />
        </div>
        <CardTitle className="text-lg mt-2 group-hover:text-violet-400 transition-colors">
          {competition.name}
        </CardTitle>
        {competition.description && (
          <CardDescription className="line-clamp-2">
            {competition.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Date & Time Info */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4 text-violet-400" />
            <span>{formatDate(startDate)} - {formatDate(endDate)}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 text-violet-400" />
            <span>{formatTime(startDate)}</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-4 text-sm flex-wrap">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>
              {competition.participantCount || 0}
              {competition.participantLimit && ` / ${competition.participantLimit}`}
            </span>
          </div>
          {/* GD Battle specific: Show room size */}
          {competition.type === 'GD_BATTLE' && competition.minGDParticipants && competition.maxGDParticipants && (
            <div className="flex items-center gap-1.5 text-violet-400">
              <Users className="h-4 w-4" />
              <span>
                {competition.minGDParticipants}-{competition.maxGDParticipants} per room
              </span>
            </div>
          )}
          {competition.prizePool && (
            <div className="flex items-center gap-1.5 text-yellow-400">
              <Trophy className="h-4 w-4" />
              <span>{competition.prizePool}</span>
            </div>
          )}
        </div>

        {/* Registration Deadline */}
        {registrationDeadline && competition.status === 'UPCOMING' && (
          <div className="text-xs text-muted-foreground">
            Registration closes: {formatDate(registrationDeadline)} at {formatTime(registrationDeadline)}
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex items-center gap-2 pt-2">
            <Link href={`${linkPrefix}/${competition.id}`} className="flex-1">
              <Button variant="outline" className="w-full">
                View Details
              </Button>
            </Link>
            
            {/* Show appropriate action button based on status and registration */}
            {competition.myStatus === 'REGISTERED' && competition.status === 'ACTIVE' && (
              <Link href={`${linkPrefix}/${competition.id}`}>
                <Button className="gap-2 bg-green-600 hover:bg-green-700">
                  <Sparkles className="h-4 w-4" />
                  Join Battle
                </Button>
              </Link>
            )}
            
            {competition.myStatus === 'REGISTERED' && competition.status === 'UPCOMING' && (
              <Button disabled className="gap-2">
                <Sparkles className="h-4 w-4" />
                Registered ✓
              </Button>
            )}
            
            {!competition.myStatus && isRegistrationOpen && (
              <Link href={`${linkPrefix}/${competition.id}?register=true`}>
                <Button className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Register
                </Button>
              </Link>
            )}
            
            {!competition.myStatus && canJoin && (
              <Link href={`${linkPrefix}/${competition.id}?register=true`}>
                <Button className="gap-2 bg-amber-600 hover:bg-amber-700">
                  <Sparkles className="h-4 w-4" />
                  Join Now
                </Button>
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
