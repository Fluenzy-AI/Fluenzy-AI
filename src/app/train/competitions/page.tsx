'use client';

// ═══════════════════════════════════════════════════════════════════════════════
// Student Competitions Page
// Lists available competitions for students
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Trophy, 
  Search, 
  Filter,
  Calendar,
  ArrowRight,
  Sparkles,
  Medal,
  Clock,
  ChevronRight,
  Users
} from 'lucide-react';
import { CompetitionCard } from '@/components/competitions/CompetitionCard';
import { CompetitionStatusTag } from '@/components/competitions/CompetitionStatusTag';

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
  participantLimit?: number | null;
  participantCount?: number;
  prizePool?: string | null;
  bannerUrl?: string | null;
}

interface MyCompetition extends Competition {
  myStatus: 'REGISTERED' | 'IN_PROGRESS' | 'COMPLETED' | 'DISQUALIFIED';
  myRank?: number | null;
  myScore?: number | null;
}

export default function StudentCompetitionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'available' | 'registered' | 'history'>('available');
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [myCompetitions, setMyCompetitions] = useState<MyCompetition[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/train/competitions');
    }
  }, [status, router]);

  useEffect(() => {
    async function fetchCompetitions() {
      try {
        const params = new URLSearchParams();
        if (statusFilter !== 'all') params.append('status', statusFilter);
        if (typeFilter !== 'all') params.append('type', typeFilter);
        if (searchQuery) params.append('search', searchQuery);

        const res = await fetch(`/api/competitions?${params.toString()}`);
        const data = await res.json();
        
        if (data.success) {
          // Merge registration status with competitions
          const allCompetitions = data.data.competitions.map((comp: Competition) => {
            const myComp = myCompetitions.find(mc => mc.id === comp.id);
            return {
              ...comp,
              myStatus: myComp?.myStatus || null,
              myRank: myComp?.myRank || null,
              myScore: myComp?.myScore || null
            };
          });
          setCompetitions(allCompetitions);
        }
      } catch (error) {
        console.error('Failed to fetch competitions:', error);
      } finally {
        setLoading(false);
      }
    }

    if (status === 'authenticated') {
      fetchCompetitions();
    }
  }, [status, statusFilter, typeFilter, searchQuery, myCompetitions]);

  // Fetch my competitions separately
  useEffect(() => {
    async function fetchMyCompetitions() {
      try {
        const res = await fetch('/api/competitions?my=true');
        const data = await res.json();
        
        if (data.success) {
          setMyCompetitions(data.data.competitions);
        }
      } catch (error) {
        console.error('Failed to fetch my competitions:', error);
      }
    }

    if (status === 'authenticated') {
      fetchMyCompetitions();
    }
  }, [status]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const upcomingCompetitions = competitions.filter(c => c.status === 'UPCOMING' || c.status === 'ACTIVE');
  const pastCompetitions = competitions.filter(c => c.status === 'COMPLETED');
  const registeredCompetitions = myCompetitions.filter(c => c.status !== 'COMPLETED');
  const historyCompetitions = myCompetitions.filter(c => c.status === 'COMPLETED');

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-violet-600/20 via-purple-600/10 to-violet-600/20 border-b border-violet-500/20">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative max-w-6xl mx-auto px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-6"
          >
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-violet-500/20 rounded-xl">
                  <Trophy className="h-8 w-8 text-violet-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Competitions</h1>
                  <p className="text-slate-400">Compete with students across India</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 text-slate-300">
                  <Users className="h-4 w-4 text-violet-400" />
                  <span>Join live battles</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Medal className="h-4 w-4 text-yellow-400" />
                  <span>Win certificates & prizes</span>
                </div>
              </div>
            </div>
            
            {myCompetitions.length > 0 && (
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <p className="text-sm text-muted-foreground mb-2">Your Stats</p>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-green-400">
                      {registeredCompetitions.length}
                    </p>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-violet-400">
                      {historyCompetitions.length}
                    </p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-400">
                      {myCompetitions.filter(c => c.myRank && c.myRank <= 3).length}
                    </p>
                    <p className="text-xs text-muted-foreground">Top 3</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'available' | 'registered' | 'history')}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <TabsList className="bg-slate-800/50">
              <TabsTrigger value="available" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Available
              </TabsTrigger>
              <TabsTrigger value="registered" className="gap-2">
                <Trophy className="h-4 w-4" />
                My Competitions
                {registeredCompetitions.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {registeredCompetitions.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <Medal className="h-4 w-4" />
                History
                {historyCompetitions.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {historyCompetitions.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Filters */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search competitions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="UPCOMING">Upcoming</SelectItem>
                  <SelectItem value="ACTIVE">Live</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="GD_BATTLE">Group Discussion</SelectItem>
                  <SelectItem value="HR_INTERVIEW_BATTLE">HR Interview</SelectItem>
                  <SelectItem value="CORPORATE_VOICE_BATTLE">Corporate Voice</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Available Competitions Tab */}
          <TabsContent value="available" className="space-y-8">
            {/* Active/Upcoming Section */}
            {upcomingCompetitions.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-violet-400" />
                  <h2 className="text-lg font-semibold">Active & Upcoming</h2>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcomingCompetitions.map((competition) => (
                    <motion.div
                      key={competition.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <CompetitionCard 
                        competition={competition}
                        linkPrefix="/train/competitions"
                      />
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* Past Competitions */}
            {pastCompetitions.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="h-5 w-5 text-slate-400" />
                  <h2 className="text-lg font-semibold">Past Competitions</h2>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pastCompetitions.map((competition) => (
                    <motion.div
                      key={competition.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <CompetitionCard 
                        competition={competition}
                        linkPrefix="/train/competitions"
                        showActions={false}
                      />
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {competitions.length === 0 && (
              <div className="text-center py-16">
                <Trophy className="h-16 w-16 mx-auto mb-4 text-slate-600" />
                <h3 className="text-xl font-semibold mb-2">No Competitions Found</h3>
                <p className="text-muted-foreground mb-6">
                  Check back soon for new competitions!
                </p>
              </div>
            )}
          </TabsContent>

          {/* My Competitions Tab (Registered) */}
          <TabsContent value="registered" className="space-y-6">
            {registeredCompetitions.length === 0 ? (
              <div className="text-center py-16">
                <Trophy className="h-16 w-16 mx-auto mb-4 text-slate-600" />
                <h3 className="text-xl font-semibold mb-2">No Active Registrations</h3>
                <p className="text-muted-foreground mb-6">
                  Register for a competition to start competing!
                </p>
                <Button onClick={() => setActiveTab('available')}>
                  Browse Competitions
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {registeredCompetitions.map((competition) => (
                  <motion.div
                    key={competition.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 hover:border-violet-500/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/train/competitions/${competition.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-violet-500/10 rounded-lg">
                          <Trophy className="h-5 w-5 text-violet-400" />
                        </div>
                        <div>
                          <h3 className="font-medium">{competition.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <CompetitionStatusTag status={competition.status} size="sm" />
                            <Badge variant="outline" className="text-xs">
                              {competition.myStatus}
                            </Badge>
                            {competition.status === 'ACTIVE' && (
                              <Badge className="bg-green-500/20 text-green-400 text-xs animate-pulse">
                                Join Now!
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            {historyCompetitions.length === 0 ? (
              <div className="text-center py-16">
                <Medal className="h-16 w-16 mx-auto mb-4 text-slate-600" />
                <h3 className="text-xl font-semibold mb-2">No Completed Competitions</h3>
                <p className="text-muted-foreground mb-6">
                  Complete competitions to see your history and achievements!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {historyCompetitions.map((competition) => (
                  <motion.div
                    key={competition.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 hover:border-violet-500/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/train/competitions/${competition.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-slate-500/10 rounded-lg">
                          <Medal className="h-5 w-5 text-slate-400" />
                        </div>
                        <div>
                          <h3 className="font-medium">{competition.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <CompetitionStatusTag status={competition.status} size="sm" />
                            {competition.myRank && (
                              <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">
                                Rank #{competition.myRank}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {competition.myScore !== null && competition.myScore !== undefined && (
                          <div className="text-right">
                            <p className="text-2xl font-bold text-violet-400">
                              {competition.myScore.toFixed(1)}
                            </p>
                            <p className="text-xs text-muted-foreground">Score</p>
                          </div>
                        )}
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
