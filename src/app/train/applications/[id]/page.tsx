'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  Building,
  MapPin,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  Eye,
  FileText,
  Phone,
  Mail,
  ExternalLink,
  Download,
  Briefcase,
  Star,
  MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useTheme, themeConfig } from '@/contexts/ThemeContext';

interface ApplicationDetails {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  companyLogo?: string;
  location: string;
  salary?: string;
  jobDescription: string;
  requirements: string[];
  appliedAt: string;
  status: 'APPLIED' | 'VIEWED' | 'SHORTLISTED' | 'INTERVIEW_SCHEDULED' | 'REJECTED' | 'HIRED';
  source: 'MANUAL' | 'AUTO_APPLY';
  jobType: string;
  experienceLevel?: string;
  lastUpdated: string;
  timeline: TimelineEvent[];
  jobUrl?: string;
  resume?: {
    name: string;
    url: string;
  };
  coverLetter?: string;
  matchScore?: number;
}

interface TimelineEvent {
  id: string;
  type: 'APPLICATION_SUBMITTED' | 'APPLICATION_VIEWED' | 'SHORTLISTED' | 'INTERVIEW_SCHEDULED' | 'INTERVIEW_COMPLETED' | 'REJECTED' | 'HIRED';
  title: string;
  description?: string;
  timestamp: string;
  data?: any;
}

const statusConfig: Record<string, { label: string; color: string; icon: any; step: number }> = {
  APPLIED: {
    label: 'Applied',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    icon: Clock,
    step: 1,
  },
  VIEWED: {
    label: 'Viewed by HR',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    icon: Eye,
    step: 2,
  },
  REVIEWED: {
    label: 'Reviewed',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    icon: Eye,
    step: 2,
  },
  PENDING: {
    label: 'Pending',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    icon: Clock,
    step: 1,
  },
  SHORTLISTED: {
    label: 'Shortlisted',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    icon: Star,
    step: 3,
  },
  INTERVIEW_SCHEDULED: {
    label: 'Interview Scheduled',
    color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
    icon: Users,
    step: 4,
  },
  REJECTED: {
    label: 'Rejected',
    color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    icon: XCircle,
    step: -1,
  },
  HIRED: {
    label: 'Hired',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    icon: CheckCircle,
    step: 5,
  },
};

const progressSteps = [
  { key: 'APPLIED', label: 'Applied', icon: FileText },
  { key: 'VIEWED', label: 'Reviewed', icon: Eye },
  { key: 'SHORTLISTED', label: 'Shortlisted', icon: Star },
  { key: 'INTERVIEW_SCHEDULED', label: 'Interview', icon: Users },
  { key: 'HIRED', label: 'Hired', icon: CheckCircle },
];

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { resolvedTheme } = useTheme();
  const currentTheme = themeConfig[resolvedTheme] || themeConfig.dark;

  const [application, setApplication] = useState<ApplicationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const applicationId = params.id as string;

  // Fetch application details
  useEffect(() => {
    const fetchApplication = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/candidates/applications/${applicationId}`);
        if (response.ok) {
          const data = await response.json();
          setApplication(data.application);
        } else if (response.status === 404) {
          router.push('/train/applications');
        }
      } catch (error) {
        console.error('Error fetching application:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user && applicationId) {
      fetchApplication();
    }
  }, [session, applicationId, router]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCurrentStep = () => {
    if (!application) return 0;
    return statusConfig[application.status]?.step || 0;
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen ${currentTheme.background} flex items-center justify-center`}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
          <p className={currentTheme.textMuted}>Loading application details...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return null;
  }

  const statusInfo = statusConfig[application.status] || {
    label: application.status || 'Unknown',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    icon: Clock,
    step: 1,
  };
  const StatusIcon = statusInfo.icon;
  const currentStep = getCurrentStep();

  return (
    <div className={`min-h-screen ${currentTheme.background}`}>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
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
              onClick={() => router.push('/train/applications')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Applications
            </Button>
          </div>

          <div className="flex items-start gap-6">
            {/* Company Logo */}
            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-xl flex items-center justify-center">
              {application.companyLogo ? (
                <img
                  src={application.companyLogo}
                  alt={application.companyName}
                  className="w-12 h-12 object-contain"
                />
              ) : (
                <Building className="w-8 h-8 text-gray-500" />
              )}
            </div>

            <div className="flex-1">
              {/* Job Title & Status */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className={`text-3xl font-bold ${currentTheme.text} mb-2`}>
                    {application.jobTitle}
                  </h1>
                  <p className={`text-xl font-medium ${currentTheme.textMuted} mb-3`}>
                    {application.companyName}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={statusInfo.color}>
                    <StatusIcon className="w-4 h-4 mr-1" />
                    {statusInfo.label}
                  </Badge>
                  {application.source === 'AUTO_APPLY' && (
                    <Badge variant="outline" className="text-purple-400 border-purple-400/30">
                      Auto-Applied
                    </Badge>
                  )}
                </div>
              </div>

              {/* Job Details */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-6">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {application.location}
                </div>
                {application.salary && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    {application.salary}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  {application.jobType}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Applied on {formatDate(application.appliedAt)}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                {application.jobUrl && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(application.jobUrl, '_blank')}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Job Post
                  </Button>
                )}
                {application.resume && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(application.resume!.url, '_blank')}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download Resume
                  </Button>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Progress Tracker */}
            <Card className={`${currentTheme.cardBg} border ${currentTheme.cardBorder}`}>
              <CardHeader>
                <CardTitle>Application Progress</CardTitle>
                <CardDescription>Track your application status through the hiring process</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {/* Progress Line */}
                  <div className="absolute top-6 left-6 right-6 h-0.5 bg-gray-200 dark:bg-gray-700" />
                  <div
                    className="absolute top-6 left-6 h-0.5 bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
                    style={{
                      width: application.status === 'REJECTED' ? '0%' :
                             `${Math.max(0, (currentStep - 1) * 25)}%`
                    }}
                  />

                  {/* Steps */}
                  <div className="relative flex justify-between">
                    {progressSteps.map((step, index) => {
                      const StepIcon = step.icon;
                      const isCompleted = currentStep > index + 1 ||
                                        (currentStep === index + 1 && application.status !== 'REJECTED');
                      const isCurrent = currentStep === index + 1;
                      const isRejected = application.status === 'REJECTED' && index > 0;

                      return (
                        <div key={step.key} className="flex flex-col items-center">
                          <div className={`
                            w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all
                            ${isCompleted ?
                              'bg-gradient-to-r from-blue-500 to-green-500 border-transparent text-white' :
                              isCurrent ?
                              'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                              isRejected ?
                              'border-red-300 bg-red-50 dark:bg-red-900/30 text-red-400' :
                              'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-400'
                            }
                          `}>
                            <StepIcon className="w-5 h-5" />
                          </div>
                          <p className={`text-xs mt-2 text-center ${
                            isCompleted || isCurrent ? currentTheme.text : 'text-gray-400'
                          }`}>
                            {step.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Rejection Notice */}
                {application.status === 'REJECTED' && (
                  <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                      <XCircle className="w-5 h-5" />
                      <span className="font-medium">Application Rejected</span>
                    </div>
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      Unfortunately, your application was not selected for this position.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card className={`${currentTheme.cardBg} border ${currentTheme.cardBorder}`}>
              <CardHeader>
                <CardTitle>Application Timeline</CardTitle>
                <CardDescription>Detailed history of your application</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {application.timeline.map((event, index) => (
                    <div key={event.id} className="relative flex gap-4">
                      {/* Timeline Line */}
                      {index < application.timeline.length - 1 && (
                        <div className="absolute left-6 top-12 w-0.5 h-12 bg-gray-200 dark:bg-gray-700" />
                      )}

                      {/* Event Icon */}
                      <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>

                      {/* Event Content */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className={`font-medium ${currentTheme.text}`}>
                            {event.title}
                          </h4>
                          <span className="text-sm text-gray-500">
                            {formatDate(event.timestamp)}
                          </span>
                        </div>
                        {event.description && (
                          <p className={`text-sm ${currentTheme.textMuted}`}>
                            {event.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Job Description */}
            <Card className={`${currentTheme.cardBg} border ${currentTheme.cardBorder}`}>
              <CardHeader>
                <CardTitle>Job Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`prose prose-sm max-w-none ${currentTheme.textMuted}`}>
                  {application.jobDescription.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-3">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Requirements */}
            {application.requirements.length > 0 && (
              <Card className={`${currentTheme.cardBg} border ${currentTheme.cardBorder}`}>
                <CardHeader>
                  <CardTitle>Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {application.requirements.map((requirement, index) => (
                      <li key={index} className={`flex items-start gap-2 text-sm ${currentTheme.textMuted}`}>
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {requirement}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Match Score */}
            {application.matchScore && (
              <Card className={`${currentTheme.cardBg} border ${currentTheme.cardBorder}`}>
                <CardHeader>
                  <CardTitle>Profile Match</CardTitle>
                  <CardDescription>How well your profile matches this job</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-500 mb-2">
                      {application.matchScore}%
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-green-400 to-green-600"
                        style={{ width: `${application.matchScore}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-500">
                      {application.matchScore >= 80 ? 'Excellent match' :
                       application.matchScore >= 60 ? 'Good match' :
                       application.matchScore >= 40 ? 'Fair match' : 'Partial match'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Application Details */}
            <Card className={`${currentTheme.cardBg} border ${currentTheme.cardBorder}`}>
              <CardHeader>
                <CardTitle>Application Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-1">Application ID</p>
                  <p className="text-sm text-gray-500 font-mono">{application.id}</p>
                </div>

                <Separator />

                <div>
                  <p className="text-sm font-medium mb-1">Source</p>
                  <Badge variant={application.source === 'AUTO_APPLY' ? 'default' : 'secondary'}>
                    {application.source === 'AUTO_APPLY' ? 'Auto-Applied' : 'Manual Application'}
                  </Badge>
                </div>

                <Separator />

                <div>
                  <p className="text-sm font-medium mb-1">Last Updated</p>
                  <p className="text-sm text-gray-500">
                    {formatDate(application.lastUpdated)}
                  </p>
                </div>

                {application.resume && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium mb-2">Resume Used</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(application.resume!.url, '_blank')}
                        className="w-full justify-start"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        {application.resume.name}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Next Steps */}
            {application.status === 'INTERVIEW_SCHEDULED' && (
              <Card className={`${currentTheme.cardBg} border ${currentTheme.cardBorder}`}>
                <CardHeader>
                  <CardTitle>Next Steps</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Your interview has been scheduled. Here's what to do next:
                    </p>
                    <ul className="text-sm space-y-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Review the job description
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Prepare common interview questions
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Research the company
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}