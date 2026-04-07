'use client';

// ═══════════════════════════════════════════════════════════════════════════════
// Competition Leaderboard Component
// Real-time leaderboard table with rankings
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Trophy, 
  Medal, 
  Award,
  Search,
  ChevronUp,
  ChevronDown,
  Minus,
  User,
  Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { RankBadge } from './RankBadge';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  userAvatar?: string | null;
  universityName?: string | null;
  collegeName?: string | null;
  totalScore: number;
  moduleScores?: Record<string, number>;
  completionTime?: number | null;
  badgeType?: 'GOLD' | 'SILVER' | 'BRONZE' | 'PARTICIPATION' | 'TOP_PERFORMER' | null;
  previousRank?: number | null;
  status?: 'REGISTERED' | 'IN_PROGRESS' | 'COMPLETED' | 'DISQUALIFIED';
}

interface CompetitionLeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  isLoading?: boolean;
  showSearch?: boolean;
  showUniversity?: boolean;
  showModuleScores?: boolean;
  moduleNames?: string[];
  title?: string;
  maxVisible?: number;
  className?: string;
}

function getRankChange(current: number, previous?: number | null): 'up' | 'down' | 'same' {
  if (!previous) return 'same';
  if (current < previous) return 'up';
  if (current > previous) return 'down';
  return 'same';
}

function formatTime(seconds?: number | null): string {
  if (!seconds) return '-';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

export function CompetitionLeaderboard({
  entries,
  currentUserId,
  isLoading = false,
  showSearch = true,
  showUniversity = true,
  showModuleScores = false,
  moduleNames = [],
  title = 'Leaderboard',
  maxVisible,
  className
}: CompetitionLeaderboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);

  // Filter entries by search
  const filteredEntries = entries.filter(entry => 
    entry.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.universityName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.collegeName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Limit entries if maxVisible is set
  const displayEntries = maxVisible && !showAll 
    ? filteredEntries.slice(0, maxVisible)
    : filteredEntries;

  const hasMore = maxVisible && filteredEntries.length > maxVisible && !showAll;

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-400" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-400" />
            {title}
          </CardTitle>
          
          {showSearch && (
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search participants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {displayEntries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No participants yet</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>Participant</TableHead>
                    {showUniversity && <TableHead>Institution</TableHead>}
                    <TableHead className="text-center">Status</TableHead>
                    {showModuleScores && moduleNames.map(name => (
                      <TableHead key={name} className="text-center">{name}</TableHead>
                    ))}
                    <TableHead className="text-right">Score</TableHead>
                    <TableHead className="text-right">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayEntries.map((entry) => {
                    const isCurrentUser = entry.userId === currentUserId;
                    const rankChange = getRankChange(entry.rank, entry.previousRank);
                    
                    return (
                      <TableRow 
                        key={entry.userId}
                        className={cn(
                          isCurrentUser && 'bg-violet-500/10 border-violet-500/30'
                        )}
                      >
                        {/* Rank */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <RankBadge rank={entry.rank} size="sm" />
                            {rankChange !== 'same' && (
                              <span className={cn(
                                'text-xs',
                                rankChange === 'up' ? 'text-emerald-400' : 'text-red-400'
                              )}>
                                {rankChange === 'up' ? (
                                  <ChevronUp className="h-3 w-3" />
                                ) : (
                                  <ChevronDown className="h-3 w-3" />
                                )}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        
                        {/* Participant */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={entry.userAvatar || undefined} />
                              <AvatarFallback>
                                <User className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className={cn(
                                'font-medium text-sm',
                                isCurrentUser && 'text-violet-400'
                              )}>
                                {entry.userName}
                                {isCurrentUser && (
                                  <Badge variant="outline" className="ml-2 text-[10px] py-0">
                                    You
                                  </Badge>
                                )}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        
                        {/* Institution */}
                        {showUniversity && (
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Building2 className="h-3 w-3" />
                              <span className="truncate max-w-[150px]">
                                {entry.collegeName || entry.universityName || '-'}
                              </span>
                            </div>
                          </TableCell>
                        )}
                        
                        {/* Status */}
                        <TableCell className="text-center">
                          <Badge 
                            variant="outline" 
                            className={cn(
                              'text-xs',
                              entry.status === 'COMPLETED' && 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
                              entry.status === 'IN_PROGRESS' && 'bg-blue-500/10 text-blue-400 border-blue-500/30',
                              entry.status === 'REGISTERED' && 'bg-slate-500/10 text-slate-400 border-slate-500/30',
                              entry.status === 'DISQUALIFIED' && 'bg-red-500/10 text-red-400 border-red-500/30',
                              !entry.status && 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            )}
                          >
                            {entry.status || 'Completed'}
                          </Badge>
                        </TableCell>
                        
                        {/* Module Scores */}
                        {showModuleScores && moduleNames.map(name => (
                          <TableCell key={name} className="text-center text-sm">
                            {entry.moduleScores?.[name]?.toFixed(1) || '-'}
                          </TableCell>
                        ))}
                        
                        {/* Total Score */}
                        <TableCell className="text-right">
                          <span className={cn(
                            'font-semibold',
                            entry.rank <= 3 && entry.totalScore > 0 && 'text-yellow-400'
                          )}>
                            {entry.totalScore > 0 ? entry.totalScore.toFixed(1) : '-'}
                          </span>
                        </TableCell>
                        
                        {/* Completion Time */}
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {formatTime(entry.completionTime)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            
            {hasMore && (
              <div className="mt-4 text-center">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowAll(true)}
                >
                  Show all {filteredEntries.length} participants
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
