'use client';

// ═══════════════════════════════════════════════════════════════════════════════
// College Admin Competitions Page
// Lists and manages competitions for a college
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from 'react';
import { useCollegeAdmin } from '@/contexts/CollegeAdminContext';
import CollegeProtectedLayout from '../components/CollegeProtectedLayout';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, 
  Plus,
  Search,
  Users,
  Calendar,
  BarChart3,
  Settings,
  Eye,
  ChevronRight
} from 'lucide-react';

// Status badge component
function CompetitionStatusTag({ status, size = 'md' }: { status: string; size?: 'sm' | 'md' }) {
  const STATUS_COLORS: Record<string, string> = {
    DRAFT: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    UPCOMING: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    ACTIVE: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    COMPLETED: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    CANCELLED: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[status] || STATUS_COLORS.DRAFT}`}>
      {status}
    </span>
  );
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
  participantLimit?: number | null;
  participantCount?: number;
  prizePool?: string | null;
  bannerUrl?: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  UPCOMING: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  ACTIVE: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  COMPLETED: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  CANCELLED: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const TYPE_LABELS: Record<string, string> = {
  GD_BATTLE: 'Group Discussion',
  HR_INTERVIEW_BATTLE: 'HR Interview',
  CORPORATE_VOICE_BATTLE: 'Corporate Voice',
};

export default function CollegeCompetitionsPage() {
  const { token, admin } = useCollegeAdmin();
  
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'upcoming' | 'completed'>('all');

  const fetchCompetitions = useCallback(async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const res = await fetch('/api/competitions?scope=COLLEGE', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        setCompetitions(data.data?.competitions || []);
      }
    } catch (error) {
      console.error('Failed to fetch competitions:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCompetitions();
  }, [fetchCompetitions]);

  const filteredCompetitions = competitions.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'active' && c.status === 'ACTIVE') ||
      (activeTab === 'upcoming' && (c.status === 'UPCOMING' || c.status === 'DRAFT')) ||
      (activeTab === 'completed' && c.status === 'COMPLETED');
    return matchesSearch && matchesTab;
  });

  // Stats
  const stats = {
    total: competitions.length,
    active: competitions.filter(c => c.status === 'ACTIVE').length,
    upcoming: competitions.filter(c => c.status === 'UPCOMING' || c.status === 'DRAFT').length,
    totalParticipants: competitions.reduce((sum, c) => sum + (c.participantCount || 0), 0)
  };

  if (loading) {
    return (
      <CollegeProtectedLayout>
        <div className="p-6 space-y-6">
          <div className="flex justify-between">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-40" />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-xl" />
            ))}
          </div>
        </div>
      </CollegeProtectedLayout>
    );
  }

  return (
    <CollegeProtectedLayout>
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Trophy className="h-7 w-7 text-violet-400" />
            College Competitions
          </h1>
          <p className="text-muted-foreground mt-1">
            Create and manage competitions for your students
          </p>
        </div>
        <Link href="/college/competitions/create">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Competition
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Trophy className="h-8 w-8 text-violet-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-emerald-400">{stats.active}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-emerald-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Upcoming</p>
                <p className="text-2xl font-bold text-blue-400">{stats.upcoming}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Participants</p>
                <p className="text-2xl font-bold text-yellow-400">{stats.totalParticipants}</p>
              </div>
              <Users className="h-8 w-8 text-yellow-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1">
          <TabsList className="bg-slate-800/50">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search competitions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Competitions List */}
      {filteredCompetitions.length === 0 ? (
        <Card className="bg-slate-800/50">
          <CardContent className="py-16 text-center">
            <Trophy className="h-16 w-16 mx-auto mb-4 text-slate-600" />
            <h3 className="text-xl font-semibold mb-2">No Competitions Found</h3>
            <p className="text-muted-foreground mb-6">
              {competitions.length === 0 
                ? "Create your first competition to engage students!"
                : "No competitions match your filters."}
            </p>
            {competitions.length === 0 && (
              <Link href="/college/competitions/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Competition
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredCompetitions.map((competition) => (
            <motion.div
              key={competition.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-slate-800/50 hover:bg-slate-800/70 transition-colors">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="p-3 bg-violet-500/10 rounded-lg shrink-0">
                        <Trophy className="h-5 w-5 text-violet-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium truncate">{competition.name}</h3>
                          <CompetitionStatusTag status={competition.status} size="sm" />
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(competition.startDate).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {competition.participantCount || 0} participants
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link href={`/college/competitions/${competition.id}`}>
                        <Button variant="ghost" size="sm" className="gap-1">
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </Link>
                      <Link href={`/college/competitions/${competition.id}/leaderboard`}>
                        <Button variant="ghost" size="sm" className="gap-1">
                          <BarChart3 className="h-4 w-4" />
                          Leaderboard
                        </Button>
                      </Link>
                      <Link href={`/college/competitions/${competition.id}/participants`}>
                        <Button variant="ghost" size="sm" className="gap-1">
                          <Users className="h-4 w-4" />
                          Participants
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
    </CollegeProtectedLayout>
  );
}
