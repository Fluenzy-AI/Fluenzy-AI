'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Trophy,
  Star,
  TrendingUp,
  Target,
  MessageSquare,
  UserCheck,
  Award,
  RefreshCw,
  History
} from 'lucide-react';

interface GDSessionReportProps {
  sessionId: string;
  topic: string;
  role: string;
  analytics: {
    overallScore: number;
    communicationScore: number;
    confidenceScore: number;
    grammarScore: number;
    relevanceScore: number;
    leadershipScore: number;
    rolePerformance: number;
    speakingTime: number;
    interruptions: number;
    strengths: string[];
    improvements: string[];
    transcript?: string[];
  };
  onRetry: () => void;
}

export default function GDSessionReport({
  sessionId,
  topic,
  role,
  analytics,
  onRetry
}: GDSessionReportProps) {
  const router = useRouter();

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500/20';
    if (score >= 60) return 'bg-yellow-500/20';
    if (score >= 40) return 'bg-orange-500/20';
    return 'bg-red-500/20';
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mb-4">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Session Complete! 🎉</h1>
          <p className="text-gray-400">Your GD performance report is ready</p>
        </div>

        {/* Session Info */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400 text-sm">Topic</p>
              <p className="text-white font-semibold">{topic}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Your Role</p>
              <p className="text-white font-semibold capitalize">{role}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Session ID</p>
              <p className="text-white font-mono text-sm">{sessionId}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Speaking Time</p>
              <p className="text-white font-semibold">{formatTime(analytics.speakingTime)}</p>
            </div>
          </div>
        </div>

        {/* Overall Score */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 text-center">
          <p className="text-gray-400 mb-2">Overall Score</p>
          <div className={`text-6xl font-bold ${getScoreColor(analytics.overallScore)}`}>
            {analytics.overallScore}%
          </div>
          <div className="flex justify-center gap-2 mt-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-8 h-8 ${
                  star <= Math.round(analytics.overallScore / 20)
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-600'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Detailed Scores */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Communication', score: analytics.communicationScore, icon: MessageSquare },
            { label: 'Confidence', score: analytics.confidenceScore, icon: UserCheck },
            { label: 'Grammar', score: analytics.grammarScore, icon: Award },
            { label: 'Relevance', score: analytics.relevanceScore, icon: Target },
            { label: 'Leadership', score: analytics.leadershipScore, icon: TrendingUp },
            { label: 'Role Performance', score: analytics.rolePerformance, icon: Star },
          ].map((item) => (
            <div
              key={item.label}
              className={`${getScoreBg(item.score)} backdrop-blur-lg rounded-xl p-4 text-center`}
            >
              <item.icon className={`w-6 h-6 mx-auto mb-2 ${getScoreColor(item.score)}`} />
              <p className="text-gray-400 text-sm mb-1">{item.label}</p>
              <p className={`text-2xl font-bold ${getScoreColor(item.score)}`}>
                {item.score}%
              </p>
            </div>
          ))}
        </div>

        {/* Strengths & Improvements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-green-500/10 backdrop-blur-lg rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-6 h-6 text-green-400" />
              <h3 className="text-xl font-bold text-white">Strengths</h3>
            </div>
            <ul className="space-y-2">
              {analytics.strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-2 text-gray-300">
                  <span className="text-green-400 mt-1">✓</span>
                  {strength}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-blue-500/10 backdrop-blur-lg rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-6 h-6 text-blue-400" />
              <h3 className="text-xl font-bold text-white">Areas to Improve</h3>
            </div>
            <ul className="space-y-2">
              {analytics.improvements.map((improvement, index) => (
                <li key={index} className="flex items-start gap-2 text-gray-300">
                  <span className="text-blue-400 mt-1">→</span>
                  {improvement}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6">
          <h3 className="text-xl font-bold text-white mb-4">Session Statistics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/20 rounded-lg">
                <MessageSquare className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Speaking Time</p>
                <p className="text-white font-semibold">{formatTime(analytics.speakingTime)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <Award className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Interruptions</p>
                <p className="text-white font-semibold">{analytics.interruptions}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col md:flex-row gap-4">
          <button
            onClick={onRetry}
            className="flex-1 flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all"
          >
            <RefreshCw className="w-5 h-5" />
            Start New Session
          </button>
          <button
            onClick={() => router.push('/history')}
            className="flex-1 flex items-center justify-center gap-2 py-4 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-all"
          >
            <History className="w-5 h-5" />
            View History
          </button>
        </div>
      </div>
    </div>
  );
}
