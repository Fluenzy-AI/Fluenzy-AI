"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  Clock,
  Target,
  FileText,
  Download,
  ArrowLeft,
  TrendingUp,
  MessageSquare,
  Award,
  Building2,
  Calendar,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

interface AssessmentResult {
  score: number;
  passed: boolean;
  timeTaken: number;
  passingScore: number;
  completedAt: string;
  assessment: {
    title: string;
    description: string | null;
    type: string;
    duration: number;
  };
  company: {
    name: string;
    logo: string | null;
  };
  candidate: {
    name: string;
    email: string;
    jobTitle: string;
  };
  transcripts?: Array<{
    aiPrompt: string;
    userAnswer: string;
    aiFeedback?: string;
    idealAnswer?: string;
    scores?: any;
    perQuestionScore?: number;
  }>;
  videoAnalytics?: {
    confidence: number;
    eyeContact: number;
    posture: number;
    smile: number;
    engagement: number;
    stressLevel: number;
  };
}

export default function AssessmentResultPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/candidate/assessment/${token}/result`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Failed to load results");
          return;
        }

        setResult(data);
      } catch (err) {
        setError("Network error. Please check your connection.");
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchResult();
    }
  }, [token]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto mb-4" />
          <p className="text-slate-400">Loading results...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !result) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-slate-800 border-slate-700">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Unable to Load Results</h2>
            <p className="text-slate-400 mb-6">{error || "Results not found"}</p>
            <Button onClick={() => router.push("/train/assessments")}>
              Back to My Assessments
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const assessmentTypeLabels: Record<string, string> = {
    MCQ: "Multiple Choice",
    CODING: "Coding Challenge",
    AI_INTERVIEW: "AI Interview",
    VOICE: "Voice Interview",
    GD: "Group Discussion",
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-500/20";
    if (score >= 60) return "bg-yellow-500/20";
    return "bg-red-500/20";
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => router.push("/train/assessments")}
            className="text-slate-400 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to My Assessments
          </Button>

          <div className="flex items-center gap-4">
            {result.company.logo ? (
              <img
                src={result.company.logo}
                alt={result.company.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-slate-700 flex items-center justify-center">
                <Building2 className="w-8 h-8 text-slate-400" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-white">{result.assessment.title}</h1>
              <p className="text-slate-400">
                {result.company.name} • {result.candidate.jobTitle}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Score Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-8">
                  <div className="text-center mb-8">
                    {result.passed ? (
                      <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                        <CheckCircle className="w-12 h-12 text-green-500" />
                      </div>
                    ) : (
                      <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                        <XCircle className="w-12 h-12 text-red-500" />
                      </div>
                    )}
                    
                    <h2 className="text-3xl font-bold text-white mb-2">
                      {result.passed ? "Congratulations!" : "Assessment Complete"}
                    </h2>
                    <p className="text-slate-400">
                      {result.passed
                        ? "You have successfully passed this assessment"
                        : "Keep practicing - you'll do better next time"}
                    </p>
                  </div>

                  <div className={`rounded-xl p-8 mb-6 ${getScoreBgColor(result.score)}`}>
                    <div className="text-center">
                      <div className={`text-6xl font-bold mb-2 ${getScoreColor(result.score)}`}>
                        {result.score}%
                      </div>
                      <p className="text-slate-300">Your Score</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                      <Target className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-white">{result.passingScore}%</p>
                      <p className="text-sm text-slate-400">Passing Score</p>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                      <Clock className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-white">{result.timeTaken}</p>
                      <p className="text-sm text-slate-400">Minutes</p>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                      <Calendar className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-white">
                        {new Date(result.completedAt).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-slate-400">Completed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* AI Interview Transcript */}
            {result.assessment.type === "AI_INTERVIEW" && result.transcripts && result.transcripts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-indigo-400" />
                        Interview Transcript
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowTranscript(!showTranscript)}
                      >
                        {showTranscript ? "Hide" : "Show"}
                      </Button>
                    </div>
                  </CardHeader>
                  {showTranscript && (
                    <CardContent>
                      <div className="space-y-6">
                        {result.transcripts.map((transcript, idx) => (
                          <div key={idx} className="space-y-3">
                            <div className="bg-slate-700/50 rounded-lg p-4">
                              <p className="text-xs text-blue-400 mb-2">Question {idx + 1}</p>
                              <p className="text-white">{transcript.aiPrompt}</p>
                            </div>
                            <div className="bg-emerald-500/10 rounded-lg p-4 ml-4">
                              <p className="text-xs text-emerald-400 mb-2">Your Answer</p>
                              <p className="text-slate-200">{transcript.userAnswer}</p>
                              {transcript.perQuestionScore !== undefined && (
                                <div className="mt-3 flex items-center gap-2">
                                  <Award className="w-4 h-4 text-yellow-400" />
                                  <span className="text-sm text-yellow-400">
                                    Score: {transcript.perQuestionScore}/10
                                  </span>
                                </div>
                              )}
                            </div>
                            {transcript.aiFeedback && (
                              <div className="bg-blue-500/10 rounded-lg p-4 ml-4">
                                <p className="text-xs text-blue-400 mb-2">AI Feedback</p>
                                <p className="text-sm text-slate-300">{transcript.aiFeedback}</p>
                              </div>
                            )}
                            {idx < result.transcripts!.length - 1 && <Separator className="bg-slate-700" />}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              </motion.div>
            )}

            {/* Download Report */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-indigo-400" />
                      <div>
                        <h3 className="font-semibold text-white">Detailed Performance Report</h3>
                        <p className="text-sm text-slate-400">
                          Download your complete interview analysis and feedback
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => router.push("/history")}
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      View in History
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Column - Video Analysis & Stats */}
          <div className="space-y-6">
            {/* Video Analysis */}
            {result.assessment.type === "AI_INTERVIEW" && result.videoAnalytics && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-indigo-400" />
                      AI Video Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Confidence */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-400">Confidence</span>
                        <span className="text-sm font-semibold text-white">
                          {result.videoAnalytics.confidence}%
                        </span>
                      </div>
                      <Progress 
                        value={result.videoAnalytics.confidence} 
                        className="h-2"
                      />
                    </div>

                    {/* Eye Contact */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-400">Eye Contact</span>
                        <span className="text-sm font-semibold text-white">
                          {result.videoAnalytics.eyeContact}%
                        </span>
                      </div>
                      <Progress 
                        value={result.videoAnalytics.eyeContact} 
                        className="h-2"
                      />
                    </div>

                    {/* Posture */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-400">Posture</span>
                        <span className="text-sm font-semibold text-white">
                          {result.videoAnalytics.posture}%
                        </span>
                      </div>
                      <Progress 
                        value={result.videoAnalytics.posture} 
                        className="h-2"
                      />
                    </div>

                    {/* Smile */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-400">Smile</span>
                        <span className="text-sm font-semibold text-white">
                          {result.videoAnalytics.smile}%
                        </span>
                      </div>
                      <Progress 
                        value={result.videoAnalytics.smile} 
                        className="h-2"
                      />
                    </div>

                    {/* Engagement */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-400">Engagement</span>
                        <span className="text-sm font-semibold text-white">
                          {result.videoAnalytics.engagement}%
                        </span>
                      </div>
                      <Progress 
                        value={result.videoAnalytics.engagement} 
                        className="h-2"
                      />
                    </div>

                    {/* Stress Level */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-400">Stress Level</span>
                        <span className="text-sm font-semibold text-white">
                          {result.videoAnalytics.stressLevel}%
                        </span>
                      </div>
                      <Progress 
                        value={result.videoAnalytics.stressLevel} 
                        className="h-2"
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Assessment Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle>Assessment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Type</span>
                    <Badge variant="outline" className="bg-indigo-500/20 text-indigo-400">
                      {assessmentTypeLabels[result.assessment.type] || result.assessment.type}
                    </Badge>
                  </div>
                  
                  <Separator className="bg-slate-700" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Duration</span>
                    <span className="text-sm font-medium text-white">
                      {result.assessment.duration} minutes
                    </span>
                  </div>
                  
                  <Separator className="bg-slate-700" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Completed On</span>
                    <span className="text-sm font-medium text-white">
                      {new Date(result.completedAt).toLocaleString()}
                    </span>
                  </div>

                  {result.assessment.description && (
                    <>
                      <Separator className="bg-slate-700" />
                      <div>
                        <p className="text-sm text-slate-400 mb-2">Description</p>
                        <p className="text-sm text-white">{result.assessment.description}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Next Steps */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/30">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-white mb-3">Next Steps</h3>
                  <ul className="space-y-2 text-sm text-slate-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Your results have been shared with {result.company.name}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>They will review and contact you if shortlisted</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Continue practicing to improve your skills</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
