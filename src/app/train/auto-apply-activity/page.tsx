'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Filter,
  Search,
  Calendar,
  Building,
  MapPin,
  DollarSign,
  Target,
  Ban,
  Zap,
  RefreshCw,
  Eye,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTheme, themeConfig } from '@/contexts/ThemeContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AutoApplyActivity {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  companyLogo?: string;
  location: string;
  salary?: string;
  action: 'APPLIED' | 'SKIPPED' | 'FAILED';
  reason?: string;
  timestamp: string;
  matchScore?: number;
  jobUrl?: string;
}

interface ActivityStats {
  totalProcessed: number;
  applied: number;
  skipped: number;
  failed: number;
  todayActivity: number;
}

const actionConfig = {
  APPLIED: {
    label: 'Successfully Applied',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    icon: CheckCircle,
    bgColor: 'bg-green-50 dark:bg-green-900/10',
    borderColor: 'border-green-200 dark:border-green-800',
  },
  SKIPPED: {
    label: 'Skipped',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    icon: Ban,
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/10',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
  },
  FAILED: {
    label: 'Failed',
    color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    icon: XCircle,
    bgColor: 'bg-red-50 dark:bg-red-900/10',
    borderColor: 'border-red-200 dark:border-red-800',
  },
};

// Common skip reasons
const skipReasonLabels: Record<string, string> = {
  'salary_too_low': 'Salary below minimum requirement',
  'location_not_preferred': 'Location not in preferred list',
  'company_in_avoid_list': 'Company in avoid list',
  'already_applied': 'Already applied to this job',
  'role_not_matching': 'Job role doesn\'t match target roles',
  'insufficient_match_score': 'Profile match score too low',
  'experience_mismatch': 'Experience level mismatch',
  'job_type_not_preferred': 'Job type not preferred',
  'application_deadline_passed': 'Application deadline passed',
  'monthly_limit_reached': 'Monthly auto-apply limit reached',
};

export default function AutoApplyActivityPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const currentTheme = themeConfig[resolvedTheme] || themeConfig.dark;

  const [activities, setActivities] = useState<AutoApplyActivity[]>([]);
  const [stats, setStats] = useState<ActivityStats>({
    totalProcessed: 0,
    applied: 0,
    skipped: 0,
    failed: 0,
    todayActivity: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('7days');

  // Fetch auto-apply activities
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams({
          ...(actionFilter !== 'all' && { action: actionFilter }),
          period: dateFilter,
        });

        const response = await fetch(`/api/candidates/auto-apply-activity?${params}`);
        if (response.ok) {
          const data = await response.json();
          setActivities(data.activities || []);
          setStats(data.stats || {
            totalProcessed: 0,
            applied: 0,
            skipped: 0,
            failed: 0,
            todayActivity: 0,
          });
        }
      } catch (error) {
        console.error('Error fetching auto-apply activities:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user) {
      fetchActivities();
    }
  }, [session, actionFilter, dateFilter]);

  // Filter activities by search term
  const filteredActivities = activities.filter(activity => {
    const matchesSearch = !searchTerm ||
      activity.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.companyName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeSince = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen ${currentTheme.background} flex items-center justify-center`}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
          <p className={currentTheme.textMuted}>Loading activity log...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${currentTheme.background}`}>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className={`text-3xl font-bold ${currentTheme.text}`}>
                Auto-Apply Activity Log
              </h1>
              <p className={`${currentTheme.textMuted} mt-1`}>
                See what jobs were processed and applied to automatically
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <Card className={`${currentTheme.cardBg} border ${currentTheme.cardBorder}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalProcessed}</p>
                    <p className="text-sm text-gray-500">Processed</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`${currentTheme.cardBg} border ${currentTheme.cardBorder}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.applied}</p>
                    <p className="text-sm text-gray-500">Applied</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`${currentTheme.cardBg} border ${currentTheme.cardBorder}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                    <Ban className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.skipped}</p>
                    <p className="text-sm text-gray-500">Skipped</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`${currentTheme.cardBg} border ${currentTheme.cardBorder}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.failed}</p>
                    <p className="text-sm text-gray-500">Failed</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`${currentTheme.cardBg} border ${currentTheme.cardBorder}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.todayActivity}</p>
                    <p className="text-sm text-gray-500">Today</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by job title or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="APPLIED">Applied</SelectItem>
                <SelectItem value="SKIPPED">Skipped</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1day">Last 24 hours</SelectItem>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Activity List */}
        {filteredActivities.length === 0 ? (
          <Card className={`${currentTheme.cardBg} border ${currentTheme.cardBorder}`}>
            <CardContent className="p-8">
              <div className="text-center">
                <Activity className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className={`text-xl font-semibold ${currentTheme.text} mb-2`}>
                  {activities.length === 0 ? 'No Auto-Apply Activity Yet' : 'No Matching Activities'}
                </h3>
                <p className={`${currentTheme.textMuted} mb-6`}>
                  {activities.length === 0
                    ? 'Enable auto-apply to see activity here'
                    : 'Try adjusting your search or filter criteria'
                  }
                </p>
                {activities.length === 0 && (
                  <Button
                    onClick={() => router.push('/train/auto-apply-setup')}
                    className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
                  >
                    Setup Auto-Apply
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredActivities.map((activity, index) => {
              const actionInfo = actionConfig[activity.action];
              const ActionIcon = actionInfo.icon;

              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className={`${currentTheme.cardBg} border ${actionInfo.borderColor} ${actionInfo.bgColor}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-start gap-4">
                            {/* Company Logo/Icon */}
                            <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-lg flex items-center justify-center">
                              {activity.companyLogo ? (
                                <img
                                  src={activity.companyLogo}
                                  alt={activity.companyName}
                                  className="w-8 h-8 object-contain"
                                />
                              ) : (
                                <Building className="w-6 h-6 text-gray-500" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              {/* Job Title & Action */}
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h3 className={`font-semibold ${currentTheme.text} mb-1`}>
                                    {activity.jobTitle}
                                  </h3>
                                  <p className={`text-lg font-medium ${currentTheme.textMuted}`}>
                                    {activity.companyName}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <Badge className={actionInfo.color}>
                                    <ActionIcon className="w-3 h-3 mr-1" />
                                    {actionInfo.label}
                                  </Badge>
                                  <span className="text-sm text-gray-500">
                                    {getTimeSince(activity.timestamp)}
                                  </span>
                                </div>
                              </div>

                              {/* Job Details */}
                              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {activity.location}
                                </div>
                                {activity.salary && (
                                  <div className="flex items-center gap-1">
                                    <DollarSign className="w-4 h-4" />
                                    {activity.salary}
                                  </div>
                                )}
                                {activity.matchScore && (
                                  <div className="flex items-center gap-1">
                                    <Target className="w-4 h-4" />
                                    {activity.matchScore}% match
                                  </div>
                                )}
                              </div>

                              {/* Reason (for skipped/failed) */}
                              {activity.reason && (
                                <div className={`text-sm p-3 rounded-lg ${
                                  activity.action === 'SKIPPED' ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300' :
                                  'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                                }`}>
                                  <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span className="font-medium">
                                      {activity.action === 'SKIPPED' ? 'Skipped:' : 'Failed:'}
                                    </span>
                                  </div>
                                  <p className="mt-1">
                                    {skipReasonLabels[activity.reason] || activity.reason}
                                  </p>
                                </div>
                              )}

                              {/* Success message */}
                              {activity.action === 'APPLIED' && (
                                <div className="text-sm p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" />
                                    <span className="font-medium">Successfully Applied</span>
                                  </div>
                                  <p className="mt-1">
                                    Your application has been submitted automatically
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 ml-4">
                          {activity.jobUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(activity.jobUrl, '_blank')}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View Job
                            </Button>
                          )}
                          {activity.action === 'APPLIED' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push('/train/applications')}
                            >
                              <FileText className="w-4 h-4 mr-1" />
                              View Application
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Load More */}
        {filteredActivities.length > 0 && filteredActivities.length % 20 === 0 && (
          <div className="text-center mt-8">
            <Button
              variant="outline"
              onClick={() => {
                // Implement pagination if needed
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Load More
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}