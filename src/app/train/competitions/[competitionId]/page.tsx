'use client';

// ═══════════════════════════════════════════════════════════════════════════════
// Student Competition Detail Page
// Shows competition details, registration, and results
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Trophy, 
  Calendar,
  Clock,
  Users,
  ArrowLeft,
  Sparkles,
  Play,
  CheckCircle,
  AlertCircle,
  Globe,
  Building2,
  GraduationCap,
  Target,
  Gift,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { CompetitionStatusTag } from '@/components/competitions/CompetitionStatusTag';
import { CompetitionTimer } from '@/components/competitions/CompetitionTimer';
import { CompetitionLeaderboard } from '@/components/competitions/CompetitionLeaderboard';
import { CompetitionRegistrationModal } from '@/components/competitions/CompetitionRegistrationModal';
import { RankBadge } from '@/components/competitions/RankBadge';

interface CompetitionModule {
  id: string;
  moduleType: string;
  weight: number;
  order: number;
}

interface CompetitionReward {
  id: string;
  rankFrom: number;
  rankTo: number;
  rewardType: string;
  rewardTitle: string;
  rewardValue?: string | null;
}

interface Competition {
  id: string;
  name: string;
  description?: string | null;
  scope: 'GLOBAL' | 'UNIVERSITY' | 'COLLEGE';
  type: 'GD_BATTLE' | 'HR_INTERVIEW_BATTLE' | 'CORPORATE_VOICE_BATTLE';
  status: 'DRAFT' | 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  startDate: string;
  endDate: string;
  registrationDeadline?: string | null;
  durationPerModule: number;
  maxAttempts: number;
  participantLimit?: number | null;
  participantCount?: number;
  prizePool?: string | null;
  bannerUrl?: string | null;
  modules?: CompetitionModule[];
  rewards?: CompetitionReward[];
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  userAvatar?: string | null;
  universityName?: string | null;
  collegeName?: string | null;
  totalScore: number;
  completionTime?: number | null;
  badgeType?: 'GOLD' | 'SILVER' | 'BRONZE' | 'PARTICIPATION' | 'TOP_PERFORMER' | null;
  status?: 'REGISTERED' | 'IN_PROGRESS' | 'COMPLETED' | 'DISQUALIFIED';
}

interface ParticipantInfo {
  isRegistered: boolean;
  status?: 'REGISTERED' | 'IN_PROGRESS' | 'COMPLETED' | 'DISQUALIFIED';
  rank?: number | null;
  score?: number | null;
  attemptCount?: number;
  maxAttempts?: number;
  hasAttemptsRemaining?: boolean;
}

const scopeConfig = {
  GLOBAL: { icon: Globe, label: 'Global Competition', color: 'text-purple-400' },
  UNIVERSITY: { icon: GraduationCap, label: 'University Competition', color: 'text-blue-400' },
  COLLEGE: { icon: Building2, label: 'College Competition', color: 'text-emerald-400' }
};

const typeLabels = {
  GD_BATTLE: 'Group Discussion Battle',
  HR_INTERVIEW_BATTLE: 'HR Interview Battle',
  CORPORATE_VOICE_BATTLE: 'Corporate Voice Battle'
};

const moduleTypeLabels: Record<string, string> = {
  READ_ALOUD: 'Read Aloud',
  LISTEN_AND_REPEAT: 'Listen & Repeat',
  COMPREHENSION: 'Comprehension',
  CONVERSATION: 'Conversation',
  EXTEMPORANEOUS: 'Extemporaneous',
  LISTEN_AND_SUMMARIZE: 'Listen & Summarize'
};

export default function StudentCompetitionDetailPage({
  params
}: {
  params: Promise<{ competitionId: string }>
}) {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [competitionId, setCompetitionId] = useState<string>('');
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [participant, setParticipant] = useState<ParticipantInfo>({ isRegistered: false });
  const [eligibility, setEligibility] = useState<{ eligible: boolean; reason?: string }>({ eligible: true });
  const [loading, setLoading] = useState(true);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // Get competitionId from params
  useEffect(() => {
    params.then(p => setCompetitionId(p.competitionId));
  }, [params]);

  // Check if registration modal should open
  useEffect(() => {
    if (searchParams.get('register') === 'true' && competition && !participant.isRegistered) {
      setShowRegistrationModal(true);
    }
  }, [searchParams, competition, participant.isRegistered]);

  // Function to refresh competition data
  const refreshCompetitionData = async () => {
    if (!competitionId) return;
    
    try {
      // Check eligibility and participant status
      const eligRes = await fetch(`/api/competitions/eligibility?competitionId=${competitionId}`);
      const eligData = await eligRes.json();
      if (eligData.success) {
        setEligibility(eligData.data);
        setParticipant({
          isRegistered: eligData.data.isRegistered || false,
          status: eligData.data.participantStatus,
          rank: eligData.data.rank,
          score: eligData.data.score
        });
      }

      // Fetch leaderboard
      const lbRes = await fetch(`/api/competitions/${competitionId}/leaderboard?limit=10&includeAll=true`);
      const lbData = await lbRes.json();
      if (lbData.success) {
        setLeaderboard(lbData.data.entries || []);
      }
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  };

  // Fetch competition data
  useEffect(() => {
    if (!competitionId || authStatus !== 'authenticated') return;

    async function fetchData() {
      try {
        // Fetch competition details
        const compRes = await fetch(`/api/competitions/${competitionId}`);
        const compData = await compRes.json();
        
        if (compData.success) {
          setCompetition(compData.data);
        } else {
          toast.error('Competition not found');
          router.push('/train/competitions');
          return;
        }

        // Check eligibility
        const eligRes = await fetch(`/api/competitions/eligibility?competitionId=${competitionId}`);
        const eligData = await eligRes.json();
        console.log('Eligibility data:', eligData); // Debug log
        if (eligData.success) {
          const data = eligData.data;
          setEligibility(data);
          
          // Check if user is registered (use alreadyRegistered or isRegistered)
          const isRegistered = data.alreadyRegistered || data.isRegistered || false;
          setParticipant({
            isRegistered: isRegistered,
            status: data.participantStatus || (isRegistered ? 'REGISTERED' : undefined),
            rank: data.rank,
            score: data.score,
            attemptCount: data.attemptCount || 0,
            maxAttempts: data.maxAttempts || 1,
            hasAttemptsRemaining: data.hasAttemptsRemaining ?? true
          });
        }

        // Fetch leaderboard
        const lbRes = await fetch(`/api/competitions/${competitionId}/leaderboard?limit=10&includeAll=true`);
        const lbData = await lbRes.json();
        if (lbData.success) {
          setLeaderboard(lbData.data.entries || []);
        }
      } catch (error) {
        console.error('Failed to fetch competition:', error);
        toast.error('Failed to load competition');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [competitionId, authStatus, router]);

  const handleRegister = async () => {
    if (!competition) return;
    
    setIsRegistering(true);
    try {
      const res = await fetch(`/api/competitions/${competition.id}/register`, {
        method: 'POST'
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success('Successfully registered!');
        setShowRegistrationModal(false);
        
        // Update participant state immediately
        setParticipant({ 
          isRegistered: true, 
          status: 'REGISTERED' 
        });
        
        // Also update eligibility to show registered
        setEligibility(prev => ({
          ...prev,
          isRegistered: true
        }));
        
        // Refresh all data to get latest state
        await refreshCompetitionData();
      } else {
        toast.error(data.error || 'Failed to register');
      }
    } catch (error) {
      toast.error('Failed to register');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleStartBattle = () => {
    router.push(`/train/competitions/${competitionId}/battle`);
  };

  if (loading || !competition) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const ScopeIcon = scopeConfig[competition.scope].icon;
  const now = new Date();
  const startDate = new Date(competition.startDate);
  const endDate = new Date(competition.endDate);
  const registrationDeadline = competition.registrationDeadline 
    ? new Date(competition.registrationDeadline) 
    : null;
  
  const canRegister = !participant.isRegistered && 
    eligibility.eligible && 
    competition.status === 'UPCOMING' &&
    (!registrationDeadline || now < registrationDeadline);
  
  // Can start battle if:
  // 1. User is registered
  // 2. Competition is ACTIVE
  // 3. User has remaining attempts (either REGISTERED, IN_PROGRESS, or COMPLETED but hasAttemptsRemaining)
  const canStartBattle = participant.isRegistered && 
    competition.status === 'ACTIVE' &&
    (
      participant.status === 'REGISTERED' || 
      participant.status === 'IN_PROGRESS' ||
      !participant.status ||
      (participant.status === 'COMPLETED' && participant.hasAttemptsRemaining)
    );

  console.log('Participant:', participant); // Debug log
  console.log('Can start battle:', canStartBattle); // Debug log
  console.log('Competition status:', competition?.status); // Debug log
  console.log('Has attempts remaining:', participant.hasAttemptsRemaining); // Debug log

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <Link href="/train/competitions" className="inline-flex items-center gap-2 text-muted-foreground hover:text-white transition-colors text-sm sm:text-base">
            <ArrowLeft className="h-4 w-4" />
            Back to Competitions
          </Link>
        </div>
      </div>

      {/* Banner */}
      {competition.bannerUrl && (
        <div className="h-32 sm:h-48 md:h-64 overflow-hidden">
          <img 
            src={competition.bannerUrl} 
            alt={competition.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-8">
        {/* Title Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                <Badge 
                  variant="outline" 
                  className={`${scopeConfig[competition.scope].color} bg-slate-800/50 text-xs sm:text-sm`}
                >
                  <ScopeIcon className="h-3 w-3 mr-1" />
                  {scopeConfig[competition.scope].label}
                </Badge>
                <CompetitionStatusTag status={competition.status} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">{competition.name}</h1>
              <p className="text-sm sm:text-base text-muted-foreground">{typeLabels[competition.type]}</p>
            </div>

            {/* Registration Status / Actions - Desktop */}
            <div className="hidden sm:flex flex-col items-end gap-2">
              {participant.isRegistered ? (
                <div className="text-right flex flex-col gap-2">
                  <Badge className="bg-emerald-500/20 text-emerald-400">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Registered
                  </Badge>
                  {/* Show attempt count if maxAttempts > 1 */}
                  {(participant.maxAttempts || 1) > 1 && (
                    <p className="text-xs text-muted-foreground">
                      Attempts: {participant.attemptCount || 0}/{participant.maxAttempts}
                    </p>
                  )}
                  {canStartBattle && (
                    <Button onClick={handleStartBattle} className="gap-2" size="lg">
                      <Play className="h-4 w-4" />
                      {(participant.attemptCount || 0) > 0 ? 'Retry Battle' : 'Join Battle'}
                    </Button>
                  )}
                  {participant.status === 'COMPLETED' && !participant.hasAttemptsRemaining && (
                    <p className="text-xs text-amber-400">All attempts used</p>
                  )}
                  {participant.status === 'COMPLETED' && participant.rank && (
                    <div className="mt-2">
                      <RankBadge rank={participant.rank} size="lg" showLabel />
                    </div>
                  )}
                </div>
              ) : canRegister ? (
                <Button onClick={() => setShowRegistrationModal(true)} className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Register Now
                </Button>
              ) : !eligibility.eligible && !participant.isRegistered && (
                <div className="text-right">
                  <Badge variant="outline" className="text-amber-400 border-amber-400/30">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Not Eligible
                  </Badge>
                  {eligibility.reason && (
                    <p className="text-xs text-muted-foreground mt-1">{eligibility.reason}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {competition.description && (
            <p className="text-slate-300 mt-3 sm:mt-4 text-sm sm:text-base">{competition.description}</p>
          )}

          {/* Registration Status / Actions - Mobile */}
          <div className="sm:hidden mt-4 flex flex-col gap-2">
            {participant.isRegistered ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-500/20 text-emerald-400 w-fit">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Registered
                  </Badge>
                  {/* Show attempt count if maxAttempts > 1 */}
                  {(participant.maxAttempts || 1) > 1 && (
                    <span className="text-xs text-muted-foreground">
                      Attempts: {participant.attemptCount || 0}/{participant.maxAttempts}
                    </span>
                  )}
                </div>
                {canStartBattle && (
                  <Button onClick={handleStartBattle} className="gap-2 w-full" size="lg">
                    <Play className="h-4 w-4" />
                    {(participant.attemptCount || 0) > 0 ? 'Retry Battle' : 'Join Battle'}
                  </Button>
                )}
                {participant.status === 'COMPLETED' && !participant.hasAttemptsRemaining && (
                  <p className="text-xs text-amber-400">All attempts used</p>
                )}
                {participant.status === 'COMPLETED' && participant.rank && (
                  <div className="mt-2">
                    <RankBadge rank={participant.rank} size="lg" showLabel />
                  </div>
                )}
              </div>
            ) : canRegister ? (
              <Button onClick={() => setShowRegistrationModal(true)} className="gap-2 w-full">
                <Sparkles className="h-4 w-4" />
                Register Now
              </Button>
            ) : !eligibility.eligible && !participant.isRegistered && (
              <div>
                <Badge variant="outline" className="text-amber-400 border-amber-400/30">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Not Eligible
                </Badge>
                {eligibility.reason && (
                  <p className="text-xs text-muted-foreground mt-1">{eligibility.reason}</p>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Card className="bg-slate-800/50">
            <CardContent className="pt-3 sm:pt-4 pb-3 sm:pb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-violet-400" />
                <div>
                  <p className="text-xs text-muted-foreground">Starts</p>
                  <p className="text-sm sm:text-base font-medium">
                    {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50">
            <CardContent className="pt-3 sm:pt-4 pb-3 sm:pb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-violet-400" />
                <div>
                  <p className="text-xs text-muted-foreground">Duration/Module</p>
                  <p className="text-sm sm:text-base font-medium">{Math.floor(competition.durationPerModule / 60)}m</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50">
            <CardContent className="pt-3 sm:pt-4 pb-3 sm:pb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-violet-400" />
                <div>
                  <p className="text-xs text-muted-foreground">Participants</p>
                  <p className="text-sm sm:text-base font-medium">
                    {competition.participantCount || 0}
                    {competition.participantLimit && ` / ${competition.participantLimit}`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50">
            <CardContent className="pt-3 sm:pt-4 pb-3 sm:pb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
                <div>
                  <p className="text-xs text-muted-foreground">Prize Pool</p>
                  <p className="text-sm sm:text-base font-medium text-yellow-400">
                    {competition.prizePool || 'Certificates'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Countdown Timer */}
        {competition.status === 'UPCOMING' && (
          <Card className="bg-gradient-to-r from-violet-600/20 to-purple-600/20 border-violet-500/30">
            <CardContent className="py-4 sm:py-6">
              <div className="text-center">
                <p className="text-sm sm:text-base text-muted-foreground mb-2 sm:mb-3">Competition starts in</p>
                <CompetitionTimer 
                  targetDate={competition.startDate} 
                  size="lg"
                  showIcon={false}
                />
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Modules */}
          <Card className="bg-slate-800/50">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Target className="h-4 w-4 sm:h-5 sm:w-5 text-violet-400" />
                Assessment Modules
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Complete these modules to get your score
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3">
              {competition.modules?.map((module, idx) => (
                <div 
                  key={module.id}
                  className="flex items-center justify-between p-2 sm:p-3 bg-slate-700/50 rounded-lg"
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-violet-500/20 flex items-center justify-center text-xs font-medium text-violet-400">
                      {idx + 1}
                    </div>
                    <span className="text-sm sm:text-base">{moduleTypeLabels[module.moduleType] || module.moduleType}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">{module.weight}%</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Rewards */}
          <Card className="bg-slate-800/50">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Gift className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
                Rewards
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Prizes for top performers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3">
              {competition.rewards?.map((reward) => (
                <div 
                  key={reward.id}
                  className="flex items-center justify-between p-2 sm:p-3 bg-slate-700/50 rounded-lg"
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <RankBadge rank={reward.rankFrom} size="sm" />
                    <div>
                      <p className="font-medium text-sm sm:text-base">{reward.rewardTitle}</p>
                      {reward.rewardValue && (
                        <p className="text-xs text-muted-foreground">{reward.rewardValue}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {reward.rankFrom === reward.rankTo 
                      ? `Rank ${reward.rankFrom}`
                      : `Rank ${reward.rankFrom}-${reward.rankTo}`
                    }
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Leaderboard Preview */}
        {leaderboard.length > 0 && (
          <CompetitionLeaderboard
            entries={leaderboard}
            currentUserId={session?.user?.email || undefined}
            title="Top 10 Leaderboard"
            showSearch={false}
            maxVisible={10}
          />
        )}
      </div>

      {/* Registration Modal */}
      <CompetitionRegistrationModal
        competition={competition}
        isOpen={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
        onRegister={handleRegister}
        isRegistering={isRegistering}
        eligibility={eligibility}
      />
    </div>
  );
}
