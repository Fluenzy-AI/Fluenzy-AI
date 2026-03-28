'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Download,
  TrendingUp,
  TrendingDown,
  Eye,
  Smile,
  Users,
  Clock,
  Award,
  Target,
  BarChart3,
  Activity,
  MessageSquare,
  Loader2,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from 'recharts';

interface AnalyticsData {
  session: {
    id: string;
    sessionToken: string;
    status: string;
    score: number;
    passed: boolean;
    timeTaken: number;
    startedAt: string;
    completedAt: string;
  };
  candidate: {
    name: string;
    email: string;
    phone: string;
    jobTitle: string;
  };
  assessment: {
    title: string;
    description: string;
    type: string;
    duration: number;
    passingScore: number;
  };
  summary: {
    overallScore: number;
    overallStatus: string;
    totalQuestions: number;
    totalDurationMinutes: number;
    avgWordsPerAnswer: number;
    speakingPace: number;
    completionRate: number;
  };
  behavioral: {
    eyeContact: number;
    posture: number;
    smile: number;
    engagement: number;
    stressControl: number;
    faceDetection: number;
  };
  communication: {
    communication: number;
    confidence: number;
    grammar: number;
    speakingPace: number;
    sentence: number;
    tone: number;
  };
  transcripts: Array<{
    questionNumber: number;
    aiPrompt: string;
    userAnswer: string;
    score: number;
    scores: any;
    wordCount: number;
  }>;
  textAnalysis: {
    topKeywords: Array<{ word: string; count: number }>;
    totalWords: number;
    avgWordsPerAnswer: number;
    wordsPerMinute: number;
  };
  insights: {
    strengths: string[];
    focusAreas: string[];
    tips: string[];
  };
}

export default function AssessmentAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const assessmentId = params.id as string;
  const sessionToken = params.sessionToken as string;

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch(`/api/company/assessments/${assessmentId}/analytics/${sessionToken}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch analytics');
        }

        const analyticsData = await response.json();
        setData(analyticsData);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError('Failed to load analytics data');
      } finally {
        setIsLoading(false);
      }
    };

    if (assessmentId && sessionToken) {
      fetchAnalytics();
    }
  }, [assessmentId, sessionToken]);

  const handleExportPDF = async () => {
    // TODO: Implement PDF export
    alert('PDF export coming soon!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Loading Analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">{error || 'No data available'}</p>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const behavioralChartData = [
    { metric: 'Eye Contact', value: Math.round(data.behavioral.eyeContact) },
    { metric: 'Posture', value: Math.round(data.behavioral.posture) },
    { metric: 'Smile', value: Math.round(data.behavioral.smile) },
    { metric: 'Engagement', value: Math.round(data.behavioral.engagement) },
    { metric: 'Stress Control', value: Math.round(data.behavioral.stressControl) },
  ];

  const communicationRadarData = [
    { skill: 'Communication', value: Math.round(data.communication.communication) },
    { skill: 'Confidence', value: Math.round(data.communication.confidence) },
    { skill: 'Grammar', value: Math.round(data.communication.grammar) },
    { skill: 'Sentence', value: Math.round(data.communication.sentence) },
    { skill: 'Tone', value: Math.round(data.communication.tone) },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="text-slate-300 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Assessments
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{data.candidate.name}</h1>
                <p className="text-sm text-slate-400">{data.assessment.title}</p>
              </div>
            </div>
            <Button onClick={handleExportPDF} className="bg-blue-600 hover:bg-blue-700">
              <Download className="w-4 h-4 mr-2" />
              Export Report PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Banner */}
        <Card className="mb-8 bg-gradient-to-r from-slate-800 to-slate-700 border-slate-600">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <Badge
                  variant={data.session.passed ? 'default' : 'destructive'}
                  className="text-lg px-4 py-1 mb-2"
                >
                  {data.summary.overallStatus}
                </Badge>
                <p className="text-slate-300 text-sm">
                  {data.candidate.name} · {data.candidate.email}
                </p>
                <p className="text-slate-400 text-sm">
                  Applied for: {data.candidate.jobTitle}
                </p>
              </div>
              <div className="text-right">
                <div className="text-6xl font-bold text-blue-400">
                  {data.summary.overallScore}
                </div>
                <p className="text-slate-400 text-sm">Overall Score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Questions</p>
                  <p className="text-3xl font-bold">{data.summary.totalQuestions}</p>
                </div>
                <MessageSquare className="w-10 h-10 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Duration</p>
                  <p className="text-3xl font-bold">{data.summary.totalDurationMinutes}m</p>
                </div>
                <Clock className="w-10 h-10 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Speaking Pace</p>
                  <p className="text-3xl font-bold">{data.summary.speakingPace}</p>
                  <p className="text-xs text-slate-500">WPM</p>
                </div>
                <Activity className="w-10 h-10 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Avg Words</p>
                  <p className="text-3xl font-bold">{data.summary.avgWordsPerAnswer}</p>
                  <p className="text-xs text-slate-500">per answer</p>
                </div>
                <FileText className="w-10 h-10 text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Body Language Metrics */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-400" />
                Body Language Snapshot
              </CardTitle>
              <CardDescription>Behavioral metrics during assessment</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={behavioralChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="metric" stroke="#9ca3af" angle={-45} textAnchor="end" height={100} />
                  <YAxis stroke="#9ca3af" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #475569',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Communication Radar */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-green-400" />
                Communication Composite
              </CardTitle>
              <CardDescription>Multi-dimensional skill analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={communicationRadarData}>
                  <PolarGrid stroke="#374151" />
                  <PolarAngleAxis dataKey="skill" stroke="#9ca3af" />
                  <PolarRadiusAxis domain={[0, 100]} stroke="#9ca3af" />
                  <Radar
                    name="Score"
                    dataKey="value"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.6}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Individual Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Communication */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg">Communication</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Score</span>
                    <span className="font-bold">{Math.round(data.communication.communication)}</span>
                  </div>
                  <Progress value={data.communication.communication} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Confidence */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg">Confidence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Score</span>
                    <span className="font-bold">{Math.round(data.communication.confidence)}</span>
                  </div>
                  <Progress value={data.communication.confidence} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grammar */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg">Grammar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Score</span>
                    <span className="font-bold">{Math.round(data.communication.grammar)}</span>
                  </div>
                  <Progress value={data.communication.grammar} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Keywords */}
        {data.textAnalysis.topKeywords.length > 0 && (
          <Card className="mb-8 bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle>Top Keywords (Answers)</CardTitle>
              <CardDescription>Most frequently used words</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.textAnalysis.topKeywords.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="word" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #475569',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* AI Insights */}
        <Card className="mb-8 bg-gradient-to-br from-slate-800 to-slate-700 border-slate-600">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-400" />
              AI Coach Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Strengths */}
              {data.insights.strengths.length > 0 && (
                <div>
                  <h4 className="font-semibold text-green-400 mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Top Strengths
                  </h4>
                  <ul className="space-y-1">
                    {data.insights.strengths.map((strength, idx) => (
                      <li key={idx} className="text-sm text-slate-300">
                        • {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Focus Areas */}
              {data.insights.focusAreas.length > 0 && (
                <div>
                  <h4 className="font-semibold text-orange-400 mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Needs Focus
                  </h4>
                  <ul className="space-y-1">
                    {data.insights.focusAreas.map((area, idx) => (
                      <li key={idx} className="text-sm text-slate-300">
                        • {area}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Tips */}
            <div className="mt-6">
              <h4 className="font-semibold text-blue-400 mb-3">Personalized Tips</h4>
              <ul className="space-y-2">
                {data.insights.tips.map((tip, idx) => (
                  <li key={idx} className="text-sm text-slate-300 pl-4">
                    - {tip}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Interview Transcript */}
        {data.transcripts.length > 0 && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle>Interview Transcript</CardTitle>
              <CardDescription>
                Complete conversation with AI interviewer ({data.transcripts.length} questions)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {data.transcripts.map((transcript, idx) => (
                  <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-blue-400">
                          Question {transcript.questionNumber}
                        </span>
                        <Badge variant="outline">
                          Score: {transcript.score}/100
                        </Badge>
                      </div>
                      <p className="text-slate-300 text-sm">{transcript.aiPrompt}</p>
                    </div>
                    <div className="bg-slate-700/50 rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-400">Candidate Answer</span>
                        <span className="text-xs text-slate-500">
                          {transcript.wordCount} words
                        </span>
                      </div>
                      <p className="text-slate-200 text-sm">{transcript.userAnswer || 'No answer provided'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
