'use client';

import { useState, useEffect } from 'react';

interface GDHistoryItem {
  id: string;
  topic: string;
  topicCategory: string;
  role: string;
  duration: number;
  overallScore: number | null;
  communicationScore: number | null;
  confidenceScore: number | null;
  grammarScore: number | null;
  relevanceScore: number | null;
  leadershipScore: number | null;
  roleScore: number | null;
  strengths: string[];
  improvements: string[];
  createdAt: string;
}

interface GDHistoryProps {
  onStartNew: () => void;
  showHistory: boolean;
  setShowHistory: (show: boolean) => void;
}

export default function GDHistory({ onStartNew, setShowHistory }: GDHistoryProps) {
  const [history, setHistory] = useState<GDHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<GDHistoryItem | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/gd/history');
      const data = await response.json();
      setHistory(data.history || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-gray-400';
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreLabel = (score: number | null) => {
    if (score === null) return 'N/A';
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Average';
    return 'Needs Improvement';
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">GD Session History</h2>
          <button
            onClick={() => setShowHistory(false)}
            className="text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-white mb-2">No Sessions Yet</h3>
              <p className="text-gray-400 mb-6">You haven't participated in any GD sessions yet.</p>
              <button
                onClick={onStartNew}
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-lg transition-colors"
              >
                Start Your First Session
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {history.map((session) => (
                <div
                  key={session.id}
                  className="bg-slate-700 rounded-lg p-4 hover:bg-slate-600 transition-colors cursor-pointer"
                  onClick={() => setSelectedSession(session)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-sm font-medium">
                          {session.topicCategory}
                        </span>
                        <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded text-sm font-medium">
                          {session.role}
                        </span>
                      </div>
                      <h3 className="text-white font-medium mb-1">{session.topic}</h3>
                      <p className="text-gray-400 text-sm">
                        {formatDate(session.createdAt)} • {formatDuration(session.duration)}
                      </p>
                    </div>
                    {session.overallScore !== null && (
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getScoreColor(session.overallScore)}`}>
                          {session.overallScore.toFixed(0)}
                        </div>
                        <div className="text-xs text-gray-500">Overall Score</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {history.length > 0 && (
          <div className="p-6 border-t border-slate-700">
            <button
              onClick={onStartNew}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all"
            >
              Start New GD Session
            </button>
          </div>
        )}
      </div>

      {/* Session Detail Modal */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Session Details</h3>
                <button
                  onClick={() => setSelectedSession(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Topic Info */}
              <div>
                <h4 className="text-gray-400 text-sm mb-1">Topic</h4>
                <p className="text-white font-medium">{selectedSession.topic}</p>
              </div>

              {/* Role & Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-gray-400 text-sm mb-1">Your Role</h4>
                  <p className="text-white">{selectedSession.role}</p>
                </div>
                <div>
                  <h4 className="text-gray-400 text-sm mb-1">Duration</h4>
                  <p className="text-white">{formatDuration(selectedSession.duration)}</p>
                </div>
              </div>

              {/* Scores */}
              <div>
                <h4 className="text-gray-400 text-sm mb-3">Performance Scores</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Overall', score: selectedSession.overallScore },
                    { label: 'Communication', score: selectedSession.communicationScore },
                    { label: 'Confidence', score: selectedSession.confidenceScore },
                    { label: 'Leadership', score: selectedSession.leadershipScore },
                    { label: 'Role Performance', score: selectedSession.roleScore },
                    { label: 'Grammar', score: selectedSession.grammarScore },
                  ].map((item) => (
                    <div key={item.label} className="bg-slate-700 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">{item.label}</span>
                        <span className={`font-bold ${getScoreColor(item.score)}`}>
                          {item.score !== null ? item.score.toFixed(0) : 'N/A'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strengths & Improvements */}
              {selectedSession.strengths.length > 0 && (
                <div>
                  <h4 className="text-gray-400 text-sm mb-2">Strengths</h4>
                  <ul className="space-y-1">
                    {selectedSession.strengths.map((strength, i) => (
                      <li key={i} className="text-green-400 text-sm flex items-center gap-2">
                        <span>✓</span> {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedSession.improvements.length > 0 && (
                <div>
                  <h4 className="text-gray-400 text-sm mb-2">Areas for Improvement</h4>
                  <ul className="space-y-1">
                    {selectedSession.improvements.map((improvement, i) => (
                      <li key={i} className="text-yellow-400 text-sm flex items-center gap-2">
                        <span>→</span> {improvement}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-700">
              <button
                onClick={() => setSelectedSession(null)}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
