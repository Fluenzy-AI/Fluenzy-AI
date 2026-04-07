'use client';

// ═══════════════════════════════════════════════════════════════════════════════
// Admin Portal - Competition Detail Page
// View and manage global/university competitions
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { usePortalAuth } from '@/contexts/PortalAuthContext';
import PortalLayout from '@/components/PortalLayout';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Trophy, 
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  Play,
  Pause,
  XCircle,
  BarChart3,
  Edit,
  Trash2,
  CheckCircle,
  Target,
  Gift,
  Globe,
  GraduationCap
} from 'lucide-react';
import { toast } from 'sonner';
import { CompetitionStatusTag } from '@/components/competitions/CompetitionStatusTag';
import { CompetitionTimer } from '@/components/competitions/CompetitionTimer';
import { CompetitionLeaderboard } from '@/components/competitions/CompetitionLeaderboard';
import { RankBadge } from '@/components/competitions/RankBadge';

// Admin nav items
const ADMIN_NAV = [
  { label: "Dashboard", href: "/portal/admin" },
  { label: "Competitions", href: "/portal/admin/competitions" },
  { label: "User Management", href: "/portal/admin/users" },
  { label: "Subscriptions", href: "/portal/admin/subscriptions" },
  { label: "Payment Logs", href: "/portal/admin/payments" },
  { label: "Support Tickets", href: "/portal/admin/tickets" },
  { label: "Broadcast Email", href: "/portal/admin/broadcast-email" },
  { label: "Feature Toggles", href: "/portal/admin/feature-toggles" },
  { label: "Email History", href: "/portal/admin/email-logs" },
  { label: "Audit Logs", href: "/portal/admin/audit-logs" },
  { label: "Analytics", href: "/portal/admin/analytics" },
];

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

const scopeConfig = {
  GLOBAL: { icon: Globe, label: 'Global', color: 'text-purple-400' },
  UNIVERSITY: { icon: GraduationCap, label: 'University', color: 'text-blue-400' }
};

const moduleTypeLabels: Record<string, string> = {
  READ_ALOUD: 'Read Aloud',
  LISTEN_AND_REPEAT: 'Listen & Repeat',
  COMPREHENSION: 'Comprehension',
  CONVERSATION: 'Conversation',
  EXTEMPORANEOUS: 'Extemporaneous',
  LISTEN_AND_SUMMARIZE: 'Listen & Summarize'
};

export default function AdminCompetitionDetailPage({
  params
}: {
  params: Promise<{ competitionId: string }>
}) {
  const { user } = usePortalAuth();
  const router = useRouter();
  
  const [competitionId, setCompetitionId] = useState<string>('');
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    params.then(p => setCompetitionId(p.competitionId));
  }, [params]);

  useEffect(() => {
    if (!competitionId || !user) return;

    async function fetchData() {
      try {
        const compRes = await fetch(`/api/competitions/${competitionId}`, { credentials: 'include' });
        const compData = await compRes.json();
        
        if (compData.success) {
          setCompetition(compData.data);
        } else {
          toast.error('Competition not found');
          router.push('/portal/admin/competitions');
          return;
        }

        const lbRes = await fetch(`/api/competitions/${competitionId}/leaderboard?limit=30&includeAll=true`, { credentials: 'include' });
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
  }, [competitionId, user, router]);

  const updateStatus = async (newStatus: string) => {
    if (!competition) return;
    
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/competitions/${competition.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      
      if (data.success) {
        setCompetition(data.data);
        toast.success(`Competition ${newStatus.toLowerCase()}`);
      } else {
        toast.error(data.error || 'Failed to update status');
      }
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteCompetition = async () => {
    if (!competition) return;
    
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/competitions/${competition.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success('Competition deleted');
        setDeleteDialogOpen(false);
        router.push('/portal/admin/competitions');
      } else {
        toast.error(data.error || 'Failed to delete');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete competition');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading || !competition) {
    return (
      <PortalLayout navItems={ADMIN_NAV} title="Competition Detail" roleLabel="Admin Portal" roleColor="text-amber-400">
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-8 w-64" />
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Skeleton className="h-96 rounded-xl" />
            </div>
            <Skeleton className="h-96 rounded-xl" />
          </div>
        </div>
      </PortalLayout>
    );
  }

  const ScopeIcon = scopeConfig[competition.scope as keyof typeof scopeConfig]?.icon || Globe;

  return (
    <PortalLayout navItems={ADMIN_NAV} title="Competition Detail" roleLabel="Admin Portal" roleColor="text-amber-400">
      <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Link href="/portal/admin/competitions">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold">{competition.name}</h1>
              <CompetitionStatusTag status={competition.status} />
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <ScopeIcon className="h-4 w-4" />
                {scopeConfig[competition.scope as keyof typeof scopeConfig]?.label || competition.scope}
              </span>
              <span>{competition.participantCount || 0} participants</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {competition.status === 'DRAFT' && (
            <Button onClick={() => updateStatus('UPCOMING')} disabled={isUpdating}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Publish
            </Button>
          )}
          {competition.status === 'UPCOMING' && (
            <Button onClick={() => updateStatus('ACTIVE')} disabled={isUpdating}>
              <Play className="h-4 w-4 mr-2" />
              Start Now
            </Button>
          )}
          {competition.status === 'ACTIVE' && (
            <Button variant="outline" onClick={() => updateStatus('COMPLETED')} disabled={isUpdating}>
              <Pause className="h-4 w-4 mr-2" />
              End Competition
            </Button>
          )}
          
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="icon" title="Delete Competition">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-slate-900 border-slate-700">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Competition?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete "{competition.name}" and all associated data. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                <Button 
                  variant="destructive" 
                  onClick={deleteCompetition}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/50">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-slate-800/50">
                  <CardContent className="pt-4">
                    <Users className="h-5 w-5 text-violet-400 mb-2" />
                    <p className="text-2xl font-bold">{competition.participantCount || 0}</p>
                    <p className="text-xs text-muted-foreground">
                      {competition.participantLimit ? `of ${competition.participantLimit}` : 'Participants'}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50">
                  <CardContent className="pt-4">
                    <Calendar className="h-5 w-5 text-violet-400 mb-2" />
                    <p className="text-lg font-bold">
                      {new Date(competition.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-xs text-muted-foreground">Start Date</p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50">
                  <CardContent className="pt-4">
                    <Clock className="h-5 w-5 text-violet-400 mb-2" />
                    <p className="text-lg font-bold">{Math.floor(competition.durationPerModule / 60)}m</p>
                    <p className="text-xs text-muted-foreground">Per Module</p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50">
                  <CardContent className="pt-4">
                    <Target className="h-5 w-5 text-violet-400 mb-2" />
                    <p className="text-lg font-bold">{competition.modules?.length || 0}</p>
                    <p className="text-xs text-muted-foreground">Modules</p>
                  </CardContent>
                </Card>
              </div>

              {/* Timer */}
              {competition.status === 'UPCOMING' && (
                <Card className="bg-gradient-to-r from-violet-600/20 to-purple-600/20 border-violet-500/30">
                  <CardContent className="py-6 text-center">
                    <p className="text-muted-foreground mb-3">Competition starts in</p>
                    <CompetitionTimer 
                      targetDate={competition.startDate} 
                      size="lg"
                      showIcon={false}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Modules */}
              <Card className="bg-slate-800/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-violet-400" />
                    Assessment Modules
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {competition.modules?.map((module, idx) => (
                    <div 
                      key={module.id}
                      className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center text-xs font-medium text-violet-400">
                          {idx + 1}
                        </div>
                        <span>{moduleTypeLabels[module.moduleType] || module.moduleType}</span>
                      </div>
                      <Badge variant="secondary">{module.weight}%</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Rewards */}
              <Card className="bg-slate-800/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="h-5 w-5 text-yellow-400" />
                    Rewards
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {competition.rewards?.map((reward) => (
                    <div 
                      key={reward.id}
                      className="flex items-center gap-3 p-2 bg-slate-700/50 rounded-lg"
                    >
                      <RankBadge rank={reward.rankFrom} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{reward.rewardTitle}</p>
                        {reward.rewardValue && (
                          <p className="text-xs text-muted-foreground">{reward.rewardValue}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Quick Links */}
              <Card className="bg-slate-800/50">
                <CardHeader>
                  <CardTitle className="text-sm">Quick Links</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link href={`/portal/admin/competitions/${competition.id}/participants`}>
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Users className="h-4 w-4" />
                      View Participants
                    </Button>
                  </Link>
                  <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setActiveTab('leaderboard')}>
                    <BarChart3 className="h-4 w-4" />
                    Full Leaderboard
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="leaderboard" className="mt-6">
          <CompetitionLeaderboard
            entries={leaderboard}
            title="Competition Leaderboard"
            showUniversity={true}
          />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <Card className="bg-slate-800/50">
            <CardHeader>
              <CardTitle>Competition Settings</CardTitle>
              <CardDescription>
                Manage competition configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-medium">{competition.status}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Scope</p>
                  <p className="font-medium">{competition.scope}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Max Attempts</p>
                  <p className="font-medium">{competition.maxAttempts}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Prize Pool</p>
                  <p className="font-medium">{competition.prizePool || 'None'}</p>
                </div>
              </div>
              
              {competition.status === 'DRAFT' && (
                <Button variant="outline" className="gap-2">
                  <Edit className="h-4 w-4" />
                  Edit Competition
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </PortalLayout>
  );
}
