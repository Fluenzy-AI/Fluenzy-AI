'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
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
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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

interface AssessmentResult {
  id: string;
  candidateName: string;
  candidateEmail: string;
  score: number;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED';
  startedAt?: string;
  completedAt?: string;
  duration?: number;
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
  type: 'MCQ' | 'CODING' | 'AI_INTERVIEW';
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

export default function AssessmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [assessment, setAssessment] = useState<AssessmentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assessmentId = params.id as string;

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
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
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
                <Button className="w-full justify-start" variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export Results
                </Button>

                <Button className="w-full justify-start" variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  Preview Assessment
                </Button>

                <Button className="w-full justify-start" variant="outline">
                  <Users className="w-4 h-4 mr-2" />
                  Assign to Candidates
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}