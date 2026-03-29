"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Eye,
  User,
  Smile,
  AlertTriangle,
  Target,
  Zap,
  Brain,
  CheckCircle,
  XCircle,
  TrendingUp,
  MessageSquare,
  Award,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ============= Types =============

interface InterviewScores {
  communication: number;
  confidence: number;
  grammar: number;
  technicalKnowledge: number;
  overallRating: number;
  strengths?: string[];
  improvements?: string[];
  summary?: string;
  recommendation?: string;
}

interface VideoMetrics {
  confidence: number;
  eyeContact: number;
  posture: number;
  smile: number;
  stressLevel: number;
  engagement: number;
  stressControl: number;
  focus: number;
  faceDetection: number;
  expressionAnalysis: number;
}

interface VideoFeedback {
  confidence: string;
  eyeContact: string;
  posture: string;
  smile: string;
  engagement: string;
  stressLevel: string;
  stressControl: string;
  focus: string;
  faceDetection: string;
  expressionAnalysis: string;
  overallBehavioralScore: number;
  behavioralSummary: string;
  strengths?: string[];
  improvements?: string[];
}

interface PerformanceBreakdownProps {
  type: "AI_INTERVIEW" | "VOICE" | "GD" | "MCQ" | "CODING" | "CORPORATE_VOICE";
  interviewScores?: InterviewScores;
  videoMetrics?: VideoMetrics;
  videoFeedback?: VideoFeedback;
  totalScore: number;
  passed: boolean;
  passingScore: number;
  jobRole?: string;
}

// ============= Helper Functions =============

function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-400";
  if (score >= 60) return "text-yellow-400";
  if (score >= 40) return "text-orange-400";
  return "text-red-400";
}

function getScoreBgColor(score: number): string {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-yellow-500";
  if (score >= 40) return "bg-orange-500";
  return "bg-red-500";
}

function getScoreLabel(score: number): string {
  if (score >= 90) return "Exceptional";
  if (score >= 70) return "Proficient";
  if (score >= 50) return "Developing";
  if (score >= 30) return "Needs Work";
  return "Insufficient";
}

function getMetricColor(value: number, isStress = false): string {
  if (isStress) {
    if (value <= 30) return "text-green-400";
    if (value <= 60) return "text-yellow-400";
    return "text-red-400";
  }
  if (value >= 80) return "text-green-400";
  if (value >= 60) return "text-yellow-400";
  if (value >= 40) return "text-orange-400";
  return "text-red-400";
}

function getMetricLabel(value: number, isStress = false): string {
  if (isStress) {
    if (value <= 30) return "Excellent";
    if (value <= 60) return "Moderate";
    return "Critical";
  }
  if (value >= 80) return "Excellent";
  if (value >= 60) return "Good";
  if (value >= 40) return "Fair";
  return "Critical";
}

// ============= Sub-Components =============

const ScoreCircle: React.FC<{
  score: number;
  label: string;
  size?: "sm" | "md" | "lg";
}> = ({ score, label, size = "md" }) => {
  const sizes = {
    sm: { circle: "w-16 h-16", text: "text-lg", label: "text-xs" },
    md: { circle: "w-24 h-24", text: "text-2xl", label: "text-sm" },
    lg: { circle: "w-32 h-32", text: "text-4xl", label: "text-base" },
  };

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className={cn("relative", sizes[size].circle)}>
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-slate-700"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            className={getScoreColor(score)}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset,
              transition: "stroke-dashoffset 1s ease-out",
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-bold text-white", sizes[size].text)}>
            {Math.round(score)}
          </span>
        </div>
      </div>
      <span className={cn("mt-2 text-slate-400", sizes[size].label)}>{label}</span>
    </div>
  );
};

const InterviewScoreBar: React.FC<{
  label: string;
  score: number;
  maxScore?: number;
  icon?: React.ReactNode;
}> = ({ label, score, maxScore = 10, icon }) => {
  const percentage = (score / maxScore) * 100;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && <span className={cn("w-4 h-4", getScoreColor(percentage))}>{icon}</span>}
          <span className="text-sm font-medium text-slate-300">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("text-sm font-bold", getScoreColor(percentage))}>
            {score}/{maxScore}
          </span>
          <span className="text-xs text-slate-500">{getScoreLabel(percentage)}</span>
        </div>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={cn("h-full rounded-full", getScoreBgColor(percentage))}
        />
      </div>
    </div>
  );
};

const VideoMetricRow: React.FC<{
  label: string;
  value: number;
  feedback?: string;
  icon: React.ReactNode;
  isStress?: boolean;
}> = ({ label, value, feedback, icon, isStress = false }) => {
  const colorClass = getMetricColor(value, isStress);
  const statusLabel = getMetricLabel(value, isStress);
  
  return (
    <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={cn("w-5 h-5", colorClass)}>{icon}</span>
          <span className="font-medium text-white">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("text-lg font-bold", colorClass)}>{value}%</span>
          <Badge className={cn(
            "text-xs",
            isStress 
              ? (value <= 30 ? "bg-green-500/20 text-green-400" : value <= 60 ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400")
              : (value >= 80 ? "bg-green-500/20 text-green-400" : value >= 50 ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400")
          )}>
            {statusLabel}
          </Badge>
        </div>
      </div>
      {feedback && (
        <p className="text-sm text-slate-400 italic">"{feedback}"</p>
      )}
    </div>
  );
};

// ============= Main Component =============

export default function PerformanceBreakdown({
  type,
  interviewScores,
  videoMetrics,
  videoFeedback,
  totalScore,
  passed,
  passingScore,
  jobRole,
}: PerformanceBreakdownProps) {
  const showInterviewScores = ["AI_INTERVIEW", "VOICE", "GD"].includes(type) && interviewScores;
  const showVideoMetrics = videoMetrics && videoFeedback;

  return (
    <div className="space-y-6">
      {/* Overall Result Header */}
      <Card className="bg-gradient-to-r from-slate-800 to-slate-900 border-slate-700">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Pass/Fail indicator */}
            <div className={cn(
              "flex items-center justify-center w-20 h-20 rounded-full",
              passed ? "bg-green-500/20" : "bg-red-500/20"
            )}>
              {passed ? (
                <CheckCircle className="w-12 h-12 text-green-500" />
              ) : (
                <XCircle className="w-12 h-12 text-red-500" />
              )}
            </div>

            {/* Score */}
            <div className="text-center md:text-left flex-1">
              <h2 className={cn(
                "text-3xl font-bold mb-1",
                passed ? "text-green-400" : "text-red-400"
              )}>
                {passed ? "PASSED" : "NOT PASSED"}
              </h2>
              <p className="text-slate-400">
                Score: <span className="text-white font-semibold">{Math.round(totalScore)}/100</span>
                {" "}&bull;{" "}
                Pass Mark: <span className="text-white font-semibold">{passingScore}%</span>
              </p>
              {jobRole && (
                <p className="text-sm text-slate-500 mt-1">Assessment for {jobRole}</p>
              )}
            </div>

            {/* Score circle */}
            <ScoreCircle score={totalScore} label="Overall Score" size="lg" />
          </div>
        </CardContent>
      </Card>

      {/* Interview Performance Section */}
      {showInterviewScores && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <MessageSquare className="w-5 h-5 text-purple-400" />
              Interview Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InterviewScoreBar
                label="Communication"
                score={interviewScores.communication}
                icon={<MessageSquare />}
              />
              <InterviewScoreBar
                label="Confidence"
                score={interviewScores.confidence}
                icon={<Activity />}
              />
              <InterviewScoreBar
                label="Grammar"
                score={interviewScores.grammar}
                icon={<FileText />}
              />
              <InterviewScoreBar
                label="Technical Knowledge"
                score={interviewScores.technicalKnowledge}
                icon={<Brain />}
              />
            </div>

            {/* Overall Rating */}
            <div className="pt-4 border-t border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Overall Rating</span>
                <div className="flex items-center gap-2">
                  <Progress value={interviewScores.overallRating} className="w-32" />
                  <span className={cn("font-bold", getScoreColor(interviewScores.overallRating))}>
                    {Math.round(interviewScores.overallRating)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Recommendation */}
            {interviewScores.recommendation && (
              <div className="pt-4">
                <Badge className={cn(
                  "text-sm px-3 py-1",
                  interviewScores.recommendation === "Strongly Recommend" 
                    ? "bg-green-500/20 text-green-400"
                    : interviewScores.recommendation === "Recommend"
                    ? "bg-blue-500/20 text-blue-400"
                    : interviewScores.recommendation === "Consider"
                    ? "bg-yellow-500/20 text-yellow-400"
                    : "bg-red-500/20 text-red-400"
                )}>
                  {interviewScores.recommendation}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Video Analysis Section */}
      {showVideoMetrics && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Activity className="w-5 h-5 text-blue-400" />
              AI Video Analysis Report
              <span className="text-sm font-normal text-slate-400 ml-2">
                Behavioral & Visual Metrics
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <VideoMetricRow
              label="Confidence"
              value={videoMetrics.confidence}
              feedback={videoFeedback.confidence}
              icon={<Activity />}
            />
            <VideoMetricRow
              label="Eye Contact"
              value={videoMetrics.eyeContact}
              feedback={videoFeedback.eyeContact}
              icon={<Eye />}
            />
            <VideoMetricRow
              label="Posture"
              value={videoMetrics.posture}
              feedback={videoFeedback.posture}
              icon={<User />}
            />
            <VideoMetricRow
              label="Smile"
              value={videoMetrics.smile}
              feedback={videoFeedback.smile}
              icon={<Smile />}
            />
            <VideoMetricRow
              label="Engagement"
              value={videoMetrics.engagement}
              feedback={videoFeedback.engagement}
              icon={<Zap />}
            />
            <VideoMetricRow
              label="Stress Level"
              value={videoMetrics.stressLevel}
              feedback={videoFeedback.stressLevel}
              icon={<AlertTriangle />}
              isStress={true}
            />
            <VideoMetricRow
              label="Stress Control"
              value={videoMetrics.stressControl}
              feedback={videoFeedback.stressControl}
              icon={<Target />}
              isStress={true}
            />
            <VideoMetricRow
              label="Focus"
              value={videoMetrics.focus}
              feedback={videoFeedback.focus}
              icon={<Target />}
            />
            <VideoMetricRow
              label="Expression Analysis"
              value={videoMetrics.expressionAnalysis}
              feedback={videoFeedback.expressionAnalysis}
              icon={<Brain />}
            />

            {/* Overall behavioral score */}
            <div className="pt-4 border-t border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-medium">Overall Behavioral Score</span>
                <div className="flex items-center gap-3">
                  <Progress value={videoFeedback.overallBehavioralScore} className="w-32" />
                  <span className={cn(
                    "text-xl font-bold",
                    getScoreColor(videoFeedback.overallBehavioralScore)
                  )}>
                    {videoFeedback.overallBehavioralScore}%
                  </span>
                </div>
              </div>
            </div>

            {/* Behavioral Summary */}
            {videoFeedback.behavioralSummary && (
              <div className="pt-4">
                <p className="text-slate-300 text-sm leading-relaxed">
                  {videoFeedback.behavioralSummary}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Strengths & Improvements */}
      {(interviewScores?.strengths || interviewScores?.improvements || 
        videoFeedback?.strengths || videoFeedback?.improvements) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Strengths */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-green-400 text-base">
                <CheckCircle className="w-4 h-4" />
                Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {[...(interviewScores?.strengths || []), ...(videoFeedback?.strengths || [])]
                  .slice(0, 5)
                  .map((strength, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="text-green-400 mt-1">✓</span>
                      {strength}
                    </li>
                  ))}
              </ul>
            </CardContent>
          </Card>

          {/* Improvements */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-amber-400 text-base">
                <TrendingUp className="w-4 h-4" />
                Areas for Improvement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {[...(interviewScores?.improvements || []), ...(videoFeedback?.improvements || [])]
                  .slice(0, 5)
                  .map((improvement, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="text-amber-400 mt-1">→</span>
                      {improvement}
                    </li>
                  ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Summary */}
      {interviewScores?.summary && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-white text-base">
              <Award className="w-4 h-4 text-purple-400" />
              AI Feedback Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-300 leading-relaxed">{interviewScores.summary}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Missing import
const FileText = MessageSquare; // Placeholder - use appropriate icon
