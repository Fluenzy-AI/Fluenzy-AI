'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  FileText,
  Clock,
  Users,
  Target,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Play,
  Pause,
  Edit,
  Trash2,
  Download,
  Eye,
  Calendar,
  Award,
  BarChart3,
  Settings,
  UserPlus,
  Mail,
  X,
  Loader2,
  ClipboardList,
  Code,
  Mic,
  Video,
  Search,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Application {
  id: string;
  name: string;
  email: string;
  phone?: string;
  jobTitle: string;
  jobId: string;
  status: string;
  selected?: boolean;
}

interface AssessmentResult {
  id: string;
  candidateName: string;
  candidateEmail: string;
  score: number;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED';
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  sessionToken?: string;
}

interface AssessmentStatistics {
  totalAssigned: number;
  completed: number;
  passed: number;
  failed: number;
  pending: number;
  averageScore: number;
  passRate: number;
}

interface AssessmentDetails {
  id: string;
  type: 'MCQ' | 'CODING' | 'AI_INTERVIEW' | 'VOICE' | 'GD';
  title: string;
  description?: string;
  duration: number;
  passingScore: number;
  isActive: boolean;
  questions: any[];
  questionsCount: number;
  createdAt: string;
  updatedAt: string;
  statistics: AssessmentStatistics;
  results: AssessmentResult[];
}

const assessmentTypeIcons: Record<string, any> = {
  MCQ: ClipboardList,
  CODING: Code,
  AI_INTERVIEW: Mic,
  VOICE: Video,
  GD: Users,
};

const assessmentTypeLabels: Record<string, string> = {
  MCQ: "Multiple Choice",
  CODING: "Coding Challenge",
  AI_INTERVIEW: "AI Interview",
  VOICE: "Voice Interview",
  GD: "Group Discussion",
};

export default function AssessmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [assessment, setAssessment] = useState<AssessmentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quick Actions State
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  
  // Assign Modal State
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApplications, setSelectedApplications] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null);

  const assessmentId = params.id as string;

  // Fetch applications for assignment
  const fetchApplications = useCallback(async () => {
    try {
      setLoadingApplications(true);
      const res = await fetch('/api/company/applications');
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setLoadingApplications(false);
    }
  }, []);

  // Export Results
  const handleExportResults = async () => {
    try {
      setIsExporting(true);
      const response = await fetch(`/api/company/assessments/${assessmentId}/export`);
      
      if (!response.ok) {
        throw new Error('Failed to export results');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${assessment?.title || 'assessment'}_results.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export results. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Assign to Candidates
  const handleAssignCandidates = async () => {
    if (selectedApplications.size === 0) {
      alert('Please select at least one candidate');
      return;
    }

    try {
      setIsAssigning(true);
      const response = await fetch(`/api/company/assessments/${assessmentId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationIds: Array.from(selectedApplications),
          sendInviteEmail: true,
          expiryDays: 7,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to assign assessment');
      }

      setAssignSuccess(`Assessment assigned to ${data.assigned} candidate(s). ${data.emailsSent} invite email(s) sent.`);
      setSelectedApplications(new Set());
      
      // Refresh assessment data
      setTimeout(() => {
        setShowAssignModal(false);
        setAssignSuccess(null);
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      console.error('Assignment failed:', error);
      alert(error.message || 'Failed to assign assessment. Please try again.');
    } finally {
      setIsAssigning(false);
    }
  };

  // Toggle application selection
  const toggleApplicationSelection = (appId: string) => {
    setSelectedApplications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(appId)) {
        newSet.delete(appId);
      } else {
        newSet.add(appId);
      }
      return newSet;
    });
  };

  // Select all filtered applications
  const selectAllFiltered = () => {
    const filtered = applications.filter(app =>
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setSelectedApplications(new Set(filtered.map(app => app.id)));
  };

  // Deselect all
  const deselectAll = () => {
    setSelectedApplications(new Set());
  };

  // Fetch assessment details
  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log('Fetching assessment:', assessmentId);
        const response = await fetch(`/api/company/assessments/${assessmentId}`);
        console.log('Response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('Assessment data:', data);
          setAssessment(data.assessment);
        } else if (response.status === 404) {
          setError("Assessment not found");
          router.push('/company/portal/assessments');
          console.log("Assessment not found");
        } else if (response.status === 401) {
          setError("Unauthorized access");
          console.log("You don't have permission to view this assessment");
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('API Error:', response.status, errorData);
          setError(errorData.error || 'Failed to load assessment');
          console.log(errorData.error || "Failed to load assessment details");
        }
      } catch (error) {
        console.error('Network error fetching assessment:', error);
        setError('Network error occurred');
        console.log("Failed to load assessment details. Please check your connection.");
      } finally {
        setIsLoading(false);
      }
    };

    if (assessmentId) {
      fetchAssessment();
    }
  }, [assessmentId, router]);

  // Toggle assessment active status
  const toggleAssessmentStatus = async () => {
    if (!assessment) return;

    try {
      setIsUpdating(true);
      const response = await fetch(`/api/company/assessments/${assessmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !assessment.isActive }),
      });

      if (response.ok) {
        setAssessment(prev => prev ? { ...prev, isActive: !prev.isActive } : null);
        console.log(`Assessment ${assessment.isActive ? 'deactivated' : 'activated'} successfully.`);
      } else {
        throw new Error('Failed to update assessment status');
      }
    } catch (error) {
      console.log("Failed to update assessment status.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete assessment
  const deleteAssessment = async () => {
    try {
      const response = await fetch(`/api/company/assessments/${assessmentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        console.log("Assessment deleted successfully.");
        router.push('/company/portal/assessments');
      } else {
        throw new Error('Failed to delete assessment');
      }
    } catch (error) {
      console.log("Failed to delete assessment.");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Completed</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">In Progress</Badge>;
      case 'NOT_STARTED':
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">Not Started</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'MCQ':
        return <FileText className="w-5 h-5" />;
      case 'CODING':
        return <Settings className="w-5 h-5" />;
      case 'AI_INTERVIEW':
        return <Users className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-gray-500">Loading assessment details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Error Loading Assessment
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error}
          </p>
          <button
            onClick={() => router.push('/company/portal/assessments')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Assessments
          </button>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Assessment Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The assessment you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => router.push('/company/portal/assessments')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Assessments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/company/portal/assessments')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Assessments
            </Button>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white">
                {getTypeIcon(assessment.type)}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {assessment.title}
                </h1>
                {assessment.description && (
                  <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
                    {assessment.description}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-4">
                  <Badge className={assessment.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {assessment.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    Created {formatDate(assessment.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={toggleAssessmentStatus}
                disabled={isUpdating}
                className="flex items-center gap-2"
              >
                {assessment.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {assessment.isActive ? 'Deactivate' : 'Activate'}
              </Button>

              <Button
                variant="outline"
                onClick={() => router.push(`/company/portal/assessments/${assessmentId}/edit`)}
                className="flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the assessment and all associated results. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={deleteAssessment} className="bg-red-600 hover:bg-red-700">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{assessment.statistics.totalAssigned}</p>
                      <p className="text-sm text-gray-500">Total Assigned</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{assessment.statistics.completed}</p>
                      <p className="text-sm text-gray-500">Completed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                      <Award className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{assessment.statistics.passRate}%</p>
                      <p className="text-sm text-gray-500">Pass Rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <BarChart3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{assessment.statistics.averageScore}</p>
                      <p className="text-sm text-gray-500">Avg Score</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Assessment Results */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Assessment Results
                </CardTitle>
                <CardDescription>
                  View all candidate results and performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                {assessment.results.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      No Results Yet
                    </h3>
                    <p className="text-gray-500 mb-4">
                      No candidates have taken this assessment yet.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Candidate</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Completed</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assessment.results.map((result) => (
                        <TableRow key={result.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{result.candidateName}</p>
                              <p className="text-sm text-gray-500">{result.candidateEmail}</p>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(result.status)}</TableCell>
                          <TableCell>
                            {result.status === 'COMPLETED' ? (
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{result.score}%</span>
                                {result.score >= assessment.passingScore ? (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-500" />
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {result.duration ? `${result.duration}m` : '-'}
                          </TableCell>
                          <TableCell>
                            {result.completedAt ? formatDate(result.completedAt) : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  console.log('[DEBUG] Eye button clicked', { 
                                    sessionToken: result.sessionToken,
                                    status: result.status 
                                  });
                                  if (result.sessionToken) {
                                    router.push(`/candidate/assessment/${result.sessionToken}/result`);
                                  } else {
                                    alert('Session token not available');
                                  }
                                }}
                                title="View Result"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {result.status === 'COMPLETED' && result.sessionToken && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    console.log('[DEBUG] Analytics button clicked', {
                                      assessmentId: assessment?.id,
                                      sessionToken: result.sessionToken
                                    });
                                    if (assessment?.id && result.sessionToken) {
                                      router.push(`/company/portal/assessments/${assessment.id}/analytics/${result.sessionToken}`);
                                    } else {
                                      alert('Data not available for analytics');
                                    }
                                  }}
                                  title="View Analytics"
                                >
                                  <BarChart3 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Assessment Info */}
            <Card>
              <CardHeader>
                <CardTitle>Assessment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Type</span>
                  <Badge variant="outline">{assessment.type}</Badge>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Duration</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span>{assessment.duration} minutes</span>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Passing Score</span>
                  <div className="flex items-center gap-1">
                    <Target className="w-4 h-4 text-gray-500" />
                    <span>{assessment.passingScore}%</span>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Questions</span>
                  <span>{assessment.questionsCount} questions</span>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Last Updated</span>
                  <span className="text-sm text-gray-500">
                    {formatDate(assessment.updatedAt)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => {
                    console.log('[DEBUG] Export Results clicked');
                    handleExportResults();
                  }}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  {isExporting ? 'Exporting...' : 'Export Results'}
                </Button>

                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => {
                    console.log('[DEBUG] Preview Assessment clicked');
                    setShowPreviewModal(true);
                  }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview Assessment
                </Button>

                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => {
                    console.log('[DEBUG] Assign to Candidates clicked');
                    setShowAssignModal(true);
                    fetchApplications();
                  }}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Assign to Candidates
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Preview Assessment Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Preview Assessment
            </DialogTitle>
            <DialogDescription>
              Preview how this assessment will appear to candidates
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Assessment Header */}
            <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                {(() => {
                  const Icon = assessmentTypeIcons[assessment.type] || FileText;
                  return <Icon className="w-8 h-8 text-indigo-500" />;
                })()}
                <div>
                  <h2 className="text-xl font-bold">{assessment.title}</h2>
                  <p className="text-sm text-gray-500">
                    {assessmentTypeLabels[assessment.type] || assessment.type}
                  </p>
                </div>
              </div>
              {assessment.description && (
                <p className="text-gray-600 dark:text-gray-400">{assessment.description}</p>
              )}
              <div className="flex gap-6 mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span>{assessment.duration} minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-gray-500" />
                  <span>Passing: {assessment.passingScore}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span>{assessment.questionsCount} questions</span>
                </div>
              </div>
            </div>

            {/* Questions Preview for MCQ */}
            {assessment.type === 'MCQ' && assessment.questions && assessment.questions.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold">Questions Preview</h3>
                {(assessment.questions as any[]).slice(0, 5).map((q, idx) => (
                  <Card key={idx}>
                    <CardContent className="pt-4">
                      <p className="font-medium mb-3">
                        Q{idx + 1}. {q.text}
                      </p>
                      <div className="space-y-2">
                        {(q.options || []).map((opt: string, optIdx: number) => (
                          <div
                            key={optIdx}
                            className={`p-2 rounded border ${
                              (q.correctAnswers || []).includes(optIdx)
                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                : 'border-gray-200 dark:border-gray-700'
                            }`}
                          >
                            <span className="mr-2">
                              {String.fromCharCode(65 + optIdx)}.
                            </span>
                            {opt}
                            {(q.correctAnswers || []).includes(optIdx) && (
                              <Check className="w-4 h-4 inline ml-2 text-green-500" />
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {assessment.questions.length > 5 && (
                  <p className="text-center text-gray-500 text-sm">
                    + {assessment.questions.length - 5} more questions
                  </p>
                )}
              </div>
            )}

            {/* Non-MCQ Assessment Types */}
            {(assessment.type === 'AI_INTERVIEW' || assessment.type === 'VOICE' || assessment.type === 'GD') && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 text-center">
                {(() => {
                  const Icon = assessmentTypeIcons[assessment.type] || FileText;
                  return <Icon className="w-12 h-12 mx-auto text-blue-500 mb-4" />;
                })()}
                <h3 className="font-semibold mb-2">
                  {assessmentTypeLabels[assessment.type]}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {assessment.type === 'AI_INTERVIEW' && 'Candidates will participate in an AI-powered interview session. The AI will ask questions and evaluate responses.'}
                  {assessment.type === 'VOICE' && 'Candidates will join a live voice/video interview session using Agora.'}
                  {assessment.type === 'GD' && 'Candidates will participate in a group discussion with other candidates and AI moderator.'}
                </p>
              </div>
            )}

            {assessment.type === 'CODING' && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                <Code className="w-12 h-12 mx-auto text-emerald-500 mb-4" />
                <h3 className="font-semibold text-center mb-2">Coding Challenge</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm text-center">
                  Candidates will solve programming problems in an integrated code editor.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreviewModal(false)}>
              Close Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign to Candidates Modal */}
      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Assign Assessment to Candidates
            </DialogTitle>
            <DialogDescription>
              Select candidates from job applications to assign this assessment
            </DialogDescription>
          </DialogHeader>

          {assignSuccess ? (
            <div className="py-8 text-center">
              <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-semibold text-green-600 mb-2">Success!</h3>
              <p className="text-gray-600">{assignSuccess}</p>
            </div>
          ) : (
            <>
              <div className="py-4 space-y-4">
                {/* Search and Select All */}
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search candidates by name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={selectAllFiltered}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={deselectAll}>
                    Clear
                  </Button>
                </div>

                {/* Selected Count */}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Users className="w-4 h-4" />
                  <span>{selectedApplications.size} candidate(s) selected</span>
                </div>

                {/* Candidates List */}
                <div className="max-h-[400px] overflow-y-auto space-y-2 border rounded-lg p-2">
                  {loadingApplications ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    </div>
                  ) : applications.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No applications found</p>
                    </div>
                  ) : (
                    applications
                      .filter(app =>
                        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        app.email.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((app) => (
                        <div
                          key={app.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedApplications.has(app.id)
                              ? 'bg-indigo-50 border-indigo-300 dark:bg-indigo-900/20 dark:border-indigo-600'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                          onClick={() => toggleApplicationSelection(app.id)}
                        >
                          <Checkbox
                            checked={selectedApplications.has(app.id)}
                            onCheckedChange={() => toggleApplicationSelection(app.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{app.name}</p>
                            <p className="text-sm text-gray-500 truncate">{app.email}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="text-xs">
                              {app.jobTitle}
                            </Badge>
                            <p className="text-xs text-gray-400 mt-1">{app.status}</p>
                          </div>
                        </div>
                      ))
                  )}
                </div>

                {/* Email Notice */}
                <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
                  <Mail className="w-4 h-4 text-blue-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-700 dark:text-blue-300">
                      Email Invitations
                    </p>
                    <p className="text-blue-600 dark:text-blue-400">
                      Selected candidates will receive an email invitation with a unique link to complete the assessment.
                    </p>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAssignModal(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAssignCandidates}
                  disabled={selectedApplications.size === 0 || isAssigning}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {isAssigning ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Assign to {selectedApplications.size} Candidate(s)
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}