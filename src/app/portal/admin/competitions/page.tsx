'use client';

// ═══════════════════════════════════════════════════════════════════════════════
// Admin Portal - Competitions Page
// Manage global and university competitions
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { usePortalAuth } from '@/contexts/PortalAuthContext';
import PortalLayout from '@/components/PortalLayout';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  Globe,
  GraduationCap,
  Eye,
  Edit,
  Activity
} from 'lucide-react';
import { CompetitionStatusTag } from '@/components/competitions/CompetitionStatusTag';

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
}

const scopeIcons = {
  GLOBAL: Globe,
  UNIVERSITY: GraduationCap
};

const typeLabels = {
  GD_BATTLE: 'GD',
  HR_INTERVIEW_BATTLE: 'HR',
  CORPORATE_VOICE_BATTLE: 'Voice'
};

export default function AdminCompetitionsPage() {
  const { user } = usePortalAuth();
  
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [scopeFilter, setScopeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    async function fetchCompetitions() {
      try {
        const params = new URLSearchParams();
        // Admin can only see GLOBAL and UNIVERSITY scopes
        if (scopeFilter !== 'all') {
          params.append('scope', scopeFilter);
        }
        if (statusFilter !== 'all') params.append('status', statusFilter);
        if (searchQuery) params.append('search', searchQuery);

        const res = await fetch(`/api/competitions?${params.toString()}`, { credentials: 'include' });
        const data = await res.json();
        
        if (data.success) {
          // Filter out COLLEGE scope for admin view
          setCompetitions(data.data.competitions.filter(
            (c: Competition) => c.scope !== 'COLLEGE'
          ));
        }
      } catch (error) {
        console.error('Failed to fetch competitions:', error);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchCompetitions();
    }
  }, [user, scopeFilter, statusFilter, searchQuery]);

  const stats = {
    total: competitions.length,
    active: competitions.filter(c => c.status === 'ACTIVE').length,
    upcoming: competitions.filter(c => c.status === 'UPCOMING' || c.status === 'DRAFT').length,
    totalParticipants: competitions.reduce((sum, c) => sum + (c.participantCount || 0), 0)
  };

  if (loading) {
    return (
      <PortalLayout navItems={ADMIN_NAV} title="Competition Management" roleLabel="Admin Portal" roleColor="text-amber-400">
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
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout navItems={ADMIN_NAV} title="Competition Management" roleLabel="Admin Portal" roleColor="text-amber-400">
      <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Trophy className="h-7 w-7 text-violet-400" />
            Competition Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage global and university-level competitions
          </p>
        </div>
        <Link href="/portal/admin/competitions/create">
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
              <Activity className="h-8 w-8 text-emerald-400 opacity-50" />
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
          </div>
        </CardContent>
      </Card>

      {/* Competitions Table */}
      <Card className="bg-slate-800/50">
        <CardHeader>
          <CardTitle>Competitions</CardTitle>
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
                  const ScopeIcon = scopeIcons[competition.scope as keyof typeof scopeIcons] || Globe;
                  return (
                    <TableRow key={competition.id}>
                      <TableCell>
                        <p className="font-medium">{competition.name}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          <ScopeIcon className="h-3 w-3" />
                          {competition.scope}
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
                          <Link href={`/portal/admin/competitions/${competition.id}`}>
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/portal/admin/competitions/${competition.id}?edit=true`}>
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
    </PortalLayout>
  );
}
