'use client';

// ═══════════════════════════════════════════════════════════════════════════════
// Student Competitions Page
// Theme-aware & Responsive for Mobile (<640px) and Desktop (≥640px)
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useMemo } from 'react';
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
  Users,
  RefreshCw,
  Zap,
  Target
} from 'lucide-react';
import HeaderOffset from '@/components/HeaderOffset';
import MobileNavShell from '@/components/MobileNavShell';
import { useTheme, themeConfig } from '@/contexts/ThemeContext';
import { CompetitionCard } from '@/components/competitions/CompetitionCard';
import { CompetitionStatusTag } from '@/components/competitions/CompetitionStatusTag';

/* ── Mobile breakpoint detection (≤ 640 px) ── */
function useMobileBreakpoint() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isMobile;
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

const DEMO_COMPETITIONS: Competition[] = [
  {
    id: "comp_001",
    name: "National AI Group Discussion Championship 2026",
    description: "Compete with 500+ engineering & management students across India in real-time AI-moderated Group Discussions.",
    scope: "GLOBAL",
    type: "GD_BATTLE",
    status: "ACTIVE",
    startDate: new Date(Date.now() - 3600000 * 2).toISOString(),
    endDate: new Date(Date.now() + 86400000 * 3).toISOString(),
    registrationDeadline: new Date(Date.now() + 86400000 * 1).toISOString(),
    participantLimit: 500,
    participantCount: 342,
    prizePool: "₹50,000 + Certificate",
    bannerUrl: null,
  },
  {
    id: "comp_002",
    name: "Corporate HR Interview Masters League",
    description: "Face 3 simulated HR & Behavioral interview rounds with real-time fluency scoring and leaderboard ranking.",
    scope: "UNIVERSITY",
    type: "HR_INTERVIEW_BATTLE",
    status: "UPCOMING",
    startDate: new Date(Date.now() + 86400000 * 2).toISOString(),
    endDate: new Date(Date.now() + 86400000 * 5).toISOString(),
    registrationDeadline: new Date(Date.now() + 86400000 * 2).toISOString(),
    participantLimit: 250,
    participantCount: 189,
    prizePool: "₹25,000 + Internship Referrals",
    bannerUrl: null,
  },
  {
    id: "comp_003",
    name: "Corporate Voice Pitch Challenge",
    description: "Deliver a 90-second executive elevator pitch on emerging tech trends and get evaluated on clarity & vocabulary.",
    scope: "COLLEGE",
    type: "CORPORATE_VOICE_BATTLE",
    status: "UPCOMING",
    startDate: new Date(Date.now() + 86400000 * 4).toISOString(),
    endDate: new Date(Date.now() + 86400000 * 7).toISOString(),
    registrationDeadline: new Date(Date.now() + 86400000 * 3).toISOString(),
    participantLimit: 200,
    participantCount: 145,
    prizePool: "₹15,000 + Badges",
    bannerUrl: null,
  },
  {
    id: "comp_004",
    name: "Winter Mock Placement Marathon 2025",
    description: "Completed GD and HR interview tournament with top university candidates.",
    scope: "GLOBAL",
    type: "GD_BATTLE",
    status: "COMPLETED",
    startDate: new Date(Date.now() - 86400000 * 14).toISOString(),
    endDate: new Date(Date.now() - 86400000 * 10).toISOString(),
    registrationDeadline: new Date(Date.now() - 86400000 * 15).toISOString(),
    participantLimit: 1000,
    participantCount: 1000,
    prizePool: "₹100,000",
    bannerUrl: null,
  }
];

function CompetitionsContent({ isMobile }: { isMobile: boolean }) {
  const { data: session } = useSession();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const currentTheme = themeConfig[resolvedTheme] || themeConfig.dark;
  
  const [activeTab, setActiveTab] = useState<'available' | 'registered' | 'history'>('available');
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [myCompetitions, setMyCompetitions] = useState<MyCompetition[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    async function fetchCompetitions() {
      try {
        const params = new URLSearchParams();
        if (statusFilter !== 'all') params.append('status', statusFilter);
        if (typeFilter !== 'all') params.append('type', typeFilter);
        if (searchQuery) params.append('search', searchQuery);

        const res = await fetch(`/api/competitions?${params.toString()}`);
        const data = await res.json();
        
        if (data.success && Array.isArray(data.data.competitions) && data.data.competitions.length > 0) {
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
        } else {
          setCompetitions(DEMO_COMPETITIONS);
        }
      } catch (error) {
        console.error('Failed to fetch competitions:', error);
        setCompetitions(DEMO_COMPETITIONS);
      } finally {
        setLoading(false);
      }
    }

    fetchCompetitions();
  }, [statusFilter, typeFilter, searchQuery, myCompetitions]);

  useEffect(() => {
    async function fetchMyCompetitions() {
      try {
        const res = await fetch('/api/competitions?my=true');
        const data = await res.json();
        
        if (data.success && Array.isArray(data.data.competitions)) {
          setMyCompetitions(data.data.competitions);
        }
      } catch (error) {
        console.error('Failed to fetch my competitions:', error);
      }
    }

    fetchMyCompetitions();
  }, []);

  const upcomingCompetitions = useMemo(() => {
    return competitions.filter(c => c.status === 'UPCOMING' || c.status === 'ACTIVE');
  }, [competitions]);

  const pastCompetitions = useMemo(() => {
    return competitions.filter(c => c.status === 'COMPLETED');
  }, [competitions]);

  const registeredCompetitions = useMemo(() => {
    return myCompetitions.filter(c => c.status !== 'COMPLETED');
  }, [myCompetitions]);

  const historyCompetitions = useMemo(() => {
    return myCompetitions.filter(c => c.status === 'COMPLETED');
  }, [myCompetitions]);

  return (
    <div className="space-y-6">
      {/* Hero Banner Section */}
      <div className={`relative overflow-hidden rounded-2xl md:rounded-3xl border ${currentTheme.cardBorder} ${currentTheme.cardBg} p-5 md:p-8 shadow-xl`}>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-cyan-500/10 to-blue-600/10 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/20">
              <Trophy size={14} />
              National Student Leagues
            </div>
            <h1 className={`text-2xl md:text-3xl font-black tracking-tight ${currentTheme.text}`}>
              Live Battles & Competitions
            </h1>
            <p className={`text-xs md:text-sm ${currentTheme.textMuted} leading-relaxed`}>
              Compete with students across India in AI-driven Group Discussions, HR Battles, and Executive Voice Pitches.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="grid grid-cols-3 gap-3 bg-slate-950/40 p-3 rounded-2xl border border-white/10 text-center shrink-0">
            <div>
              <p className="text-lg md:text-xl font-black text-emerald-400">{registeredCompetitions.length}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Active</p>
            </div>
            <div>
              <p className="text-lg md:text-xl font-black text-cyan-400">{upcomingCompetitions.length}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Open</p>
            </div>
            <div>
              <p className="text-lg md:text-xl font-black text-amber-400">
                {myCompetitions.filter(c => c.myRank && c.myRank <= 3).length}
              </p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Top 3</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Container */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'available' | 'registered' | 'history')} className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <TabsList className="bg-slate-900/60 p-1 border border-white/10 rounded-xl">
            <TabsTrigger value="available" className="gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              <span>Open Competitions</span>
            </TabsTrigger>
            <TabsTrigger value="registered" className="gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg">
              <Trophy className="h-3.5 w-3.5 text-emerald-400" />
              <span>My Battles</span>
              {registeredCompetitions.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 bg-emerald-500/20 text-emerald-300">
                  {registeredCompetitions.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg">
              <Medal className="h-3.5 w-3.5 text-amber-400" />
              <span>Completed</span>
              {historyCompetitions.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 bg-amber-500/20 text-amber-300">
                  {historyCompetitions.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:w-48 lg:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Search tournament..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl bg-slate-900/60 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-blue-500/40"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-28 text-xs rounded-xl bg-slate-900/60 border-white/10 text-slate-200">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10 text-white">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="UPCOMING">Upcoming</SelectItem>
                <SelectItem value="ACTIVE">Live</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-9 w-32 text-xs rounded-xl bg-slate-900/60 border-white/10 text-slate-200">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10 text-white">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="GD_BATTLE">GD Battle</SelectItem>
                <SelectItem value="HR_INTERVIEW_BATTLE">HR Interview</SelectItem>
                <SelectItem value="CORPORATE_VOICE_BATTLE">Corporate Voice</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Available Competitions Tab */}
        <TabsContent value="available" className="space-y-8">
          {upcomingCompetitions.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                <h2 className={`text-base font-bold ${currentTheme.text}`}>Active & Upcoming Leagues</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {upcomingCompetitions.map((competition) => (
                  <motion.div
                    key={competition.id}
                    initial={{ opacity: 0, y: 15 }}
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

          {pastCompetitions.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400" />
                <h2 className={`text-base font-bold ${currentTheme.text}`}>Past Tournaments</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {pastCompetitions.map((competition) => (
                  <motion.div
                    key={competition.id}
                    initial={{ opacity: 0, y: 15 }}
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
            <div className="text-center py-12 rounded-2xl border border-white/10 bg-slate-900/40 p-6">
              <Trophy className="h-12 w-12 mx-auto mb-3 text-slate-600" />
              <h3 className={`text-base font-bold ${currentTheme.text} mb-1`}>No Competitions Found</h3>
              <p className="text-xs text-slate-400">Check back soon for upcoming GD battles and HR placement leagues.</p>
            </div>
          )}
        </TabsContent>

        {/* My Competitions Tab */}
        <TabsContent value="registered" className="space-y-4">
          {registeredCompetitions.length === 0 ? (
            <div className="text-center py-12 rounded-2xl border border-white/10 bg-slate-900/40 p-6">
              <Trophy className="h-12 w-12 mx-auto mb-3 text-slate-600" />
              <h3 className={`text-base font-bold ${currentTheme.text} mb-1`}>No Active Registrations</h3>
              <p className="text-xs text-slate-400 mb-4">Register for an open competition to start competing and ranking on the leaderboard!</p>
              <Button onClick={() => setActiveTab('available')} size="sm" className="bg-blue-600 text-white rounded-xl text-xs">
                Browse Tournaments
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {registeredCompetitions.map((competition) => (
                <motion.div
                  key={competition.id}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`rounded-2xl p-4 border ${currentTheme.cardBorder} ${currentTheme.cardBg} hover:border-blue-500/40 transition-all cursor-pointer`}
                  onClick={() => router.push(`/train/competitions/${competition.id}`)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl shrink-0">
                        <Trophy className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className={`font-bold text-sm ${currentTheme.text} truncate`}>{competition.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <CompetitionStatusTag status={competition.status} size="sm" />
                          <Badge variant="outline" className="text-[10px]">
                            {competition.myStatus}
                          </Badge>
                          {competition.status === 'ACTIVE' && (
                            <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px] animate-pulse">
                              Join Now!
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-400 shrink-0" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          {historyCompetitions.length === 0 ? (
            <div className="text-center py-12 rounded-2xl border border-white/10 bg-slate-900/40 p-6">
              <Medal className="h-12 w-12 mx-auto mb-3 text-slate-600" />
              <h3 className={`text-base font-bold ${currentTheme.text} mb-1`}>No Completed Competitions</h3>
              <p className="text-xs text-slate-400">Complete tournaments to view your scores, certificates, and final leaderboard rank!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {historyCompetitions.map((competition) => (
                <motion.div
                  key={competition.id}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`rounded-2xl p-4 border ${currentTheme.cardBorder} ${currentTheme.cardBg} hover:border-blue-500/40 transition-all cursor-pointer`}
                  onClick={() => router.push(`/train/competitions/${competition.id}`)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl shrink-0">
                        <Medal className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className={`font-bold text-sm ${currentTheme.text} truncate`}>{competition.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <CompetitionStatusTag status={competition.status} size="sm" />
                          {competition.myRank && (
                            <Badge className="bg-amber-500/20 text-amber-400 text-[10px]">
                              Rank #{competition.myRank}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {competition.myScore !== null && competition.myScore !== undefined && (
                        <div className="text-right">
                          <p className="text-lg font-black text-cyan-400">{competition.myScore.toFixed(1)}</p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider">Score</p>
                        </div>
                      )}
                      <ChevronRight className="h-5 w-5 text-slate-400" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function StudentCompetitionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const currentTheme = themeConfig[resolvedTheme] || themeConfig.dark;
  const isMobile = useMobileBreakpoint();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/train/competitions');
    }
  }, [status, router]);

  if (status === 'loading' || isMobile === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!session?.user) return null;

  // Mobile View (< 640px): wrapped in MobileNavShell
  if (isMobile) {
    return (
      <MobileNavShell activeHref="/train/competitions">
        <div className="p-4 pt-3 pb-24">
          <CompetitionsContent isMobile={true} />
        </div>
      </MobileNavShell>
    );
  }

  // Desktop View (≥ 640px): wider grid container with HeaderOffset
  return (
    <div className={`min-h-screen ${currentTheme.background} transition-colors duration-300`}>
      <HeaderOffset />
      <div className="max-w-6xl mx-auto px-6 py-8">
        <CompetitionsContent isMobile={false} />
      </div>
    </div>
  );
}
