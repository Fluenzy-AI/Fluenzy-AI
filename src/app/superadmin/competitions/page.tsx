'use client';

// ═══════════════════════════════════════════════════════════════════════════════
// Super Admin Competitions Page
// Platform-wide competition management with analytics
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Trophy, 
  Plus,
  Search,
  Users,
  Calendar,
  BarChart3,
  Globe,
  Building2,
  GraduationCap,
  Eye,
  Edit,
  TrendingUp,
  Activity,
  Target
} from 'lucide-react';
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
  participantLimit?: number | null;
  participantCount?: number;
  prizePool?: string | null;
  collegeName?: string;
  createdByName?: string;
}

interface Stats {
  total: number;
  active: number;
  upcoming: number;
  completed: number;
  totalParticipants: number;
  globalCompetitions: number;
  universityCompetitions: number;
  collegeCompetitions: number;
}

const scopeIcons = {
  GLOBAL: Globe,
  UNIVERSITY: GraduationCap,
  COLLEGE: Building2
};

const scopeLabels = {
  GLOBAL: 'Global',
  UNIVERSITY: 'University',
  COLLEGE: 'College'
};

const typeLabels = {
  GD_BATTLE: 'GD',
  HR_INTERVIEW_BATTLE: 'HR',
  CORPORATE_VOICE_BATTLE: 'Voice'
};

export default function SuperAdminCompetitionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    active: 0,
    upcoming: 0,
    completed: 0,
    totalParticipants: 0,
    globalCompetitions: 0,
    universityCompetitions: 0,
    collegeCompetitions: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [scopeFilter, setScopeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/superadminlogin');
    }
  }, [status, router]);

  useEffect(() => {
    async function fetchCompetitions() {
      try {
        const params = new URLSearchParams();
        if (scopeFilter !== 'all') params.append('scope', scopeFilter);
        if (statusFilter !== 'all') params.append('status', statusFilter);
        if (typeFilter !== 'all') params.append('type', typeFilter);
        if (searchQuery) params.append('search', searchQuery);

        const res = await fetch(`/api/competitions?${params.toString()}`);
        const data = await res.json();
        
        if (data.success) {
          setCompetitions(data.data.competitions);
          
          // Calculate stats
          const allComps = data.data.competitions;
          setStats({
            total: allComps.length,
            active: allComps.filter((c: Competition) => c.status === 'ACTIVE').length,
            upcoming: allComps.filter((c: Competition) => c.status === 'UPCOMING' || c.status === 'DRAFT').length,
            completed: allComps.filter((c: Competition) => c.status === 'COMPLETED').length,
            totalParticipants: allComps.reduce((sum: number, c: Competition) => sum + (c.participantCount || 0), 0),
            globalCompetitions: allComps.filter((c: Competition) => c.scope === 'GLOBAL').length,
            universityCompetitions: allComps.filter((c: Competition) => c.scope === 'UNIVERSITY').length,
            collegeCompetitions: allComps.filter((c: Competition) => c.scope === 'COLLEGE').length
          });
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
  }, [status, scopeFilter, statusFilter, typeFilter, searchQuery]);

  if (status === 'loading' || loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Trophy className="h-7 w-7 text-violet-400" />
            Competition Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Platform-wide competition overview and management
          </p>
        </div>
        <Link href="/superadmin/competitions/create">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Competition
          </Button>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card className="bg-slate-800/50">
          <CardContent className="pt-4">
            <div className="text-center">
              <Trophy className="h-5 w-5 text-violet-400 mx-auto mb-1" />
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50">
          <CardContent className="pt-4">
            <div className="text-center">
              <Activity className="h-5 w-5 text-emerald-400 mx-auto mb-1" />
              <p className="text-2xl font-bold text-emerald-400">{stats.active}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50">
          <CardContent className="pt-4">
            <div className="text-center">
              <Calendar className="h-5 w-5 text-blue-400 mx-auto mb-1" />
              <p className="text-2xl font-bold text-blue-400">{stats.upcoming}</p>
              <p className="text-xs text-muted-foreground">Upcoming</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50">
          <CardContent className="pt-4">
            <div className="text-center">
              <Users className="h-5 w-5 text-yellow-400 mx-auto mb-1" />
              <p className="text-2xl font-bold text-yellow-400">{stats.totalParticipants}</p>
              <p className="text-xs text-muted-foreground">Participants</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50">
          <CardContent className="pt-4">
            <div className="text-center">
              <Globe className="h-5 w-5 text-purple-400 mx-auto mb-1" />
              <p className="text-2xl font-bold">{stats.globalCompetitions}</p>
              <p className="text-xs text-muted-foreground">Global</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50">
          <CardContent className="pt-4">
            <div className="text-center">
              <GraduationCap className="h-5 w-5 text-blue-400 mx-auto mb-1" />
              <p className="text-2xl font-bold">{stats.universityCompetitions}</p>
              <p className="text-xs text-muted-foreground">University</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50">
          <CardContent className="pt-4">
            <div className="text-center">
              <Building2 className="h-5 w-5 text-emerald-400 mx-auto mb-1" />
              <p className="text-2xl font-bold">{stats.collegeCompetitions}</p>
              <p className="text-xs text-muted-foreground">College</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50">
          <CardContent className="pt-4">
            <div className="text-center">
              <Target className="h-5 w-5 text-slate-400 mx-auto mb-1" />
              <p className="text-2xl font-bold">{stats.completed}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-slate-800/50">
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search competitions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={scopeFilter} onValueChange={setScopeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Scope" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Scopes</SelectItem>
                <SelectItem value="GLOBAL">Global</SelectItem>
                <SelectItem value="UNIVERSITY">University</SelectItem>
                <SelectItem value="COLLEGE">College</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="UPCOMING">Upcoming</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
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
        </CardContent>
      </Card>

      {/* Competitions Table */}
      <Card className="bg-slate-800/50">
        <CardHeader>
          <CardTitle>All Competitions</CardTitle>
          <CardDescription>
            {competitions.length} competitions found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Competition</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Participants</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {competitions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No competitions found
                  </TableCell>
                </TableRow>
              ) : (
                competitions.map((competition) => {
                  const ScopeIcon = scopeIcons[competition.scope];
                  return (
                    <TableRow key={competition.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{competition.name}</p>
                          {competition.collegeName && (
                            <p className="text-xs text-muted-foreground">{competition.collegeName}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          <ScopeIcon className="h-3 w-3" />
                          {scopeLabels[competition.scope]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {typeLabels[competition.type]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <CompetitionStatusTag status={competition.status} size="sm" />
                      </TableCell>
                      <TableCell>
                        {new Date(competition.startDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {competition.participantCount || 0}
                        {competition.participantLimit && ` / ${competition.participantLimit}`}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/superadmin/competitions/${competition.id}`}>
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/superadmin/competitions/${competition.id}?edit=true`}>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
