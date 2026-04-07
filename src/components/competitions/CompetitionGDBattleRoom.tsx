'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  NetworkQuality,
  IRemoteVideoTrack,
  IRemoteAudioTrack,
  UID,
} from 'agora-rtc-sdk-ng';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Users,
  Clock,
  MessageSquare,
  Trophy,
  Signal,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Interfaces ────────────────────────────────────────────────────────────────

interface Competition {
  id: string;
  name: string;
  type: string;
  topic?: string;
  durationPerModule: number;
  minGDParticipants?: number;
  maxGDParticipants?: number;
}

interface Participant {
  id: string;
  userId: string;
  user: {
    name: string;
    email: string;
  };
  status: string;
}

interface CompetitionGDBattleRoomProps {
  competition: Competition;
  competitionId: string;
  userId: string;
  participants: Participant[];
}

interface RemoteUser {
  uid: UID;
  audioTrack: IRemoteAudioTrack | null;
  videoTrack: IRemoteVideoTrack | null;
  hasAudio: boolean;
  hasVideo: boolean;
}

// ─── Media Player Component ────────────────────────────────────────────────────

const MediaPlayer = ({ 
  videoTrack, 
  audioTrack, 
  uid, 
  local = false,
  userName = 'User',
  hasAudio = true
}: { 
  videoTrack: IRemoteVideoTrack | ICameraVideoTrack | null; 
  audioTrack: IRemoteAudioTrack | IMicrophoneAudioTrack | null; 
  uid: UID;
  local?: boolean;
  userName?: string;
  hasAudio?: boolean;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !videoTrack) return;
    
    videoTrack.play(containerRef.current);

    return () => {
      videoTrack.stop();
    };
  }, [videoTrack]);

  useEffect(() => {
    if (audioTrack && !local) {
      audioTrack.play();
    }
    return () => {
      if (audioTrack && !local) {
        audioTrack.stop();
      }
    };
  }, [audioTrack, local]);

  return (
    <div className="relative w-full h-full bg-slate-900 rounded-lg overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
        <div className="bg-black/60 px-3 py-1 rounded-full text-xs text-white">
          {userName} {local && '(You)'}
        </div>
        {!hasAudio && (
          <div className="bg-red-500/80 p-1.5 rounded-full" title="Muted">
            <MicOff className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────

export default function CompetitionGDBattleRoom({
  competition,
  competitionId,
  userId,
  participants
}: CompetitionGDBattleRoomProps) {
  const { data: session } = useSession();
  const userName = session?.user?.name || 'Guest';

  // State
  const [waitingForParticipants, setWaitingForParticipants] = useState(false);
  const [currentParticipants, setCurrentParticipants] = useState(participants.length);
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<RemoteUser[]>([]);
  const [networkQuality, setNetworkQuality] = useState<NetworkQuality | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [channelName, setChannelName] = useState<string>('');
  const [agoraToken, setAgoraToken] = useState<string>('');
  const [agoraUid, setAgoraUid] = useState<number>(Math.floor(Math.random() * 1000000));
  const [timeRemaining, setTimeRemaining] = useState(competition.durationPerModule || 1800);
  
  // Evaluation state
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResults, setEvaluationResults] = useState<any>(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  
  // Transcript for AI evaluation (in a real app, this would come from speech-to-text)
  const transcriptRef = useRef<Array<{
    participantId: string;
    participantName: string;
    text: string;
    timestamp: Date;
  }>>([]);

  // Refs
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const isJoinedRef = useRef(false);
  const isCleanupRef = useRef(false);
  const participantCheckInterval = useRef<NodeJS.Timeout | null>(null);

  const minParticipants = competition.minGDParticipants || 2;

  // ─── Main Agora Initialization (Single Flow Like LiveGDRoom) ──────────────────

  useEffect(() => {
    // Prevent double init
    if (isJoinedRef.current || isCleanupRef.current) return;

    const initAgora = async () => {
      try {
        const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID;
        if (!APP_ID) throw new Error('Agora Configuration Missing');

        console.log('[Battle] Starting Agora initialization...');

        // 1. Check if we have enough participants first
        const checkMinParticipants = async () => {
          try {
            const response = await fetch(`/api/competitions/${competitionId}/participants`);
            if (!response.ok) return false;
            
            const data = await response.json();
            const activeParticipants = data.data.participants?.filter(
              (p: any) => p.status === 'REGISTERED' || p.status === 'IN_PROGRESS'
            ) || [];
            
            console.log(`[Battle] Active participants: ${activeParticipants.length}/${minParticipants}`);
            setCurrentParticipants(activeParticipants.length);
            
            return activeParticipants.length >= minParticipants;
          } catch (err) {
            console.error('[Battle] Error checking participants:', err);
            return false;
          }
        };

        // Wait for minimum participants
        const hasEnoughParticipants = await checkMinParticipants();
        if (!hasEnoughParticipants) {
          console.log('[Battle] Waiting for more participants...');
          setWaitingForParticipants(true);
          
          // Poll every 3 seconds
          participantCheckInterval.current = setInterval(async () => {
            const ready = await checkMinParticipants();
            if (ready) {
              console.log('[Battle] Minimum participants reached!');
              setWaitingForParticipants(false);
              if (participantCheckInterval.current) {
                clearInterval(participantCheckInterval.current);
              }
              // Restart init
              initAgora();
            }
          }, 3000);
          
          return;
        }

        setWaitingForParticipants(false);
        console.log('[Battle] Minimum participants met, proceeding...');

        // 2. Create Client
        const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        clientRef.current = client;

        // 3. Set up Event Listeners
        client.on('user-published', async (user, mediaType) => {
          await client.subscribe(user, mediaType);

          setRemoteUsers(prev => {
            const existingUserIndex = prev.findIndex(u => u.uid === user.uid);
            const newUserState = {
              uid: user.uid,
              audioTrack: mediaType === 'audio' ? user.audioTrack : (existingUserIndex >= 0 ? prev[existingUserIndex].audioTrack : null),
              videoTrack: mediaType === 'video' ? user.videoTrack : (existingUserIndex >= 0 ? prev[existingUserIndex].videoTrack : null),
              hasAudio: mediaType === 'audio' ? true : (existingUserIndex >= 0 ? prev[existingUserIndex].hasAudio : false),
              hasVideo: mediaType === 'video' ? true : (existingUserIndex >= 0 ? prev[existingUserIndex].hasVideo : false),
            } as RemoteUser;

            if (existingUserIndex >= 0) {
              const newArr = [...prev];
              newArr[existingUserIndex] = newUserState;
              return newArr;
            }
            return [...prev, newUserState];
          });
        });

        client.on('user-unpublished', (user, mediaType) => {
          setRemoteUsers(prev => prev.map(u => {
            if (u.uid === user.uid) {
              return {
                ...u,
                audioTrack: mediaType === 'audio' ? null : u.audioTrack,
                videoTrack: mediaType === 'video' ? null : u.videoTrack,
                hasAudio: mediaType === 'audio' ? false : u.hasAudio,
                hasVideo: mediaType === 'video' ? false : u.hasVideo,
              };
            }
            return u;
          }));
        });

        client.on('user-left', (user) => {
          setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
        });

        client.on('network-quality', (stats) => {
          if (stats.downlinkNetworkQuality !== 0) {
            setNetworkQuality(stats);
          }
        });

        // 4. Fetch Token
        console.log('[Battle] Fetching Agora token...');
        const tokenResponse = await fetch(`/api/competitions/${competitionId}/agora-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            agoraUid,
          }),
        });

        if (!tokenResponse.ok) throw new Error('Connection failed. Please refresh.');
        const tokenData = await tokenResponse.json();
        
        if (!tokenData.success) {
          throw new Error(tokenData.error || 'Failed to get token');
        }

        const { token, channelName: channel } = tokenData;
        setChannelName(channel);
        setAgoraToken(token);

        console.log('[Battle] Token received, joining channel:', channel);

        // 5. Join Channel
        await client.join(APP_ID, channel, token, agoraUid);
        isJoinedRef.current = true;
        console.log('[Battle] Joined channel successfully');

        // 6. Create & Publish Local Tracks
        console.log('[Battle] Creating local tracks...');
        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
        setLocalAudioTrack(audioTrack);
        setLocalVideoTrack(videoTrack);

        console.log('[Battle] Publishing tracks...');
        await client.publish([audioTrack, videoTrack]);

        // 7. Start Session
        setJoined(true);
        console.log('[Battle] Successfully joined and published!');

      } catch (err: any) {
        console.error('[Battle] Agora Error:', err);
        setError('Failed to connect to the battle room. Please try refreshing.');
        cleanup();
      }
    };

    initAgora();

    return () => {
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // ─── Timer ─────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (joined && !waitingForParticipants) {
      const interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleEndBattle();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [joined, waitingForParticipants]);

  // ─── Toggle Audio ──────────────────────────────────────────────────────────────

  const toggleAudio = useCallback(async () => {
    console.log('[Battle] Toggle audio clicked, track:', localAudioTrack, 'isMuted:', isMuted);
    if (localAudioTrack) {
      const newMutedState = !isMuted;
      await localAudioTrack.setEnabled(!newMutedState);
      setIsMuted(newMutedState);
      console.log('[Battle] Audio toggled, now muted:', newMutedState);
    } else {
      console.warn('[Battle] No local audio track available');
    }
  }, [localAudioTrack, isMuted]);

  // ─── Toggle Video ──────────────────────────────────────────────────────────────

  const toggleVideo = useCallback(async () => {
    console.log('[Battle] Toggle video clicked, track:', localVideoTrack, 'isVideoOff:', isVideoOff);
    if (localVideoTrack) {
      const newVideoOffState = !isVideoOff;
      await localVideoTrack.setEnabled(!newVideoOffState);
      setIsVideoOff(newVideoOffState);
      console.log('[Battle] Video toggled, now off:', newVideoOffState);
    } else {
      console.warn('[Battle] No local video track available');
    }
  }, [localVideoTrack, isVideoOff]);

  // ─── Cleanup ───────────────────────────────────────────────────────────────────

  const cleanup = useCallback(async () => {
    if (isCleanupRef.current) return;
    isCleanupRef.current = true;

    if (participantCheckInterval.current) {
      clearInterval(participantCheckInterval.current);
    }

    if (localAudioTrack) {
      localAudioTrack.close();
      setLocalAudioTrack(null);
    }
    if (localVideoTrack) {
      localVideoTrack.close();
      setLocalVideoTrack(null);
    }

    if (clientRef.current) {
      // Don't await leave in cleanup if unmounting, fire and forget to prevent UI blocking
      clientRef.current.leave().catch(console.error);
      clientRef.current = null;
    }
    isJoinedRef.current = false;
  }, [localAudioTrack, localVideoTrack]);

  // ─── Evaluate GD Performance ──────────────────────────────────────────────────

  const evaluateGDPerformance = async () => {
    setIsEvaluating(true);
    
    try {
      // Get transcript (in production, this would come from actual speech-to-text)
      // For now, generate simulated participation data
      const transcript = transcriptRef.current.length > 0 
        ? transcriptRef.current
        : generateSimulatedTranscript();
      
      // Call AI evaluation API
      const evalResponse = await fetch('/api/ai/evaluate-gd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          topic: competition.topic || 'General Discussion',
          userId,
          participantName: userName
        })
      });
      
      const evalData = await evalResponse.json();
      
      // Store module scores for the competition
      await fetch(`/api/competitions/${competitionId}/gd-scores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scores: evalData.scores,
          feedback: evalData.feedback,
          highlights: evalData.highlights,
          improvements: evalData.improvements,
          talkTimePercent: evalData.talkTimePercent || 25
        })
      });
      
      // Complete the competition
      const completeRes = await fetch(`/api/competitions/${competitionId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const completeData = await completeRes.json();
      
      setEvaluationResults({
        ...evalData,
        rank: completeData.data?.rank,
        totalScore: completeData.data?.totalScore,
        badgeType: completeData.data?.badgeType
      });
      
      setSessionEnded(true);
      
    } catch (err) {
      console.error('Error evaluating GD:', err);
      // Still complete the competition even if evaluation fails
      await fetch(`/api/competitions/${competitionId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      setSessionEnded(true);
    } finally {
      setIsEvaluating(false);
    }
  };
  
  // Generate simulated transcript for demo (in production, use actual speech-to-text)
  const generateSimulatedTranscript = () => {
    const allParticipants = [
      { id: userId, name: userName },
      ...participants.map(p => ({ id: p.userId, name: p.user.name }))
    ];
    
    const simulatedMessages = [
      "I think this topic is very relevant in today's context.",
      "Building on that point, we should also consider the economic aspects.",
      "I agree with the previous speaker, but we need to look at it from a different angle.",
      "Let me add another perspective to this discussion.",
      "That's an interesting point. However, I believe we should also consider...",
      "To summarize what we've discussed so far...",
      "I'd like to respectfully disagree and present an alternative view.",
      "Great points everyone. Let me connect this to the broader picture."
    ];
    
    const transcript = [];
    for (let i = 0; i < simulatedMessages.length; i++) {
      const participant = allParticipants[i % allParticipants.length];
      transcript.push({
        participantId: participant.id,
        participantName: participant.name,
        text: simulatedMessages[i],
        timestamp: new Date(Date.now() - (simulatedMessages.length - i) * 30000)
      });
    }
    
    return transcript;
  };

  // ─── End Battle ────────────────────────────────────────────────────────────────

  const handleEndBattle = useCallback(async () => {
    try {
      // Cleanup Agora first
      await cleanup();
      
      // Evaluate GD performance
      await evaluateGDPerformance();
      
    } catch (err) {
      console.error('Error ending battle:', err);
      setSessionEnded(true);
    }
  }, [cleanup, competitionId, userId, userName, competition.topic, participants]);

  // ─── Format Time ───────────────────────────────────────────────────────────────

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ─── Network Quality Badge ─────────────────────────────────────────────────────

  const getNetworkQualityColor = () => {
    if (!networkQuality) return 'text-gray-400';
    if (networkQuality.uplinkNetworkQuality <= 2) return 'text-green-400';
    if (networkQuality.uplinkNetworkQuality <= 4) return 'text-yellow-400';
    return 'text-red-400';
  };

  // ─── Render ────────────────────────────────────────────────────────────────────

  // Show evaluating screen
  if (isEvaluating) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-slate-800 rounded-xl p-8 max-w-md text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-violet-500 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-white mb-2">Evaluating Your Performance</h2>
          <p className="text-slate-400">
            AI is analyzing your participation in the GD...
          </p>
          <div className="mt-6 text-sm text-slate-500">
            <p>Evaluating communication skills, leadership, teamwork, and more...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show results screen
  if (sessionEnded && evaluationResults) {
    const getScoreColor = (score: number) => {
      if (score >= 80) return 'text-emerald-400';
      if (score >= 60) return 'text-yellow-400';
      if (score >= 40) return 'text-orange-400';
      return 'text-red-400';
    };

    const getScoreBg = (score: number) => {
      if (score >= 80) return 'bg-emerald-500/20 border-emerald-500/30';
      if (score >= 60) return 'bg-yellow-500/20 border-yellow-500/30';
      if (score >= 40) return 'bg-orange-500/20 border-orange-500/30';
      return 'bg-red-500/20 border-red-500/30';
    };

    const scores = evaluationResults.scores || {};
    const overallScore = scores.overall || 70;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-violet-500 to-purple-600 rounded-full mb-4">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">GD Battle Complete! 🎉</h1>
            <p className="text-slate-400">Your performance has been evaluated</p>
          </div>

          {/* Overall Score */}
          <div className={cn(
            "rounded-2xl p-8 mb-6 text-center border",
            getScoreBg(overallScore)
          )}>
            <h2 className="text-lg text-slate-400 mb-2">Overall Score</h2>
            <div className={cn("text-6xl font-bold mb-2", getScoreColor(overallScore))}>
              {overallScore}
            </div>
            <p className="text-slate-400">out of 100</p>
            
            {evaluationResults.rank && (
              <div className="mt-4 inline-flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-full">
                <span className="text-slate-400">Your Rank:</span>
                <span className="text-xl font-bold text-violet-400">#{evaluationResults.rank}</span>
              </div>
            )}
          </div>

          {/* Score Breakdown */}
          <div className="bg-slate-800/50 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Score Breakdown</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: 'Communication', value: scores.communication || 70 },
                { label: 'Leadership', value: scores.leadership || 70 },
                { label: 'Confidence', value: scores.confidence || 70 },
                { label: 'Content Quality', value: scores.contentQuality || 70 },
                { label: 'Teamwork', value: scores.teamwork || 70 },
              ].map((item) => (
                <div key={item.label} className="bg-slate-900/50 rounded-lg p-4">
                  <p className="text-sm text-slate-400 mb-1">{item.label}</p>
                  <p className={cn("text-2xl font-bold", getScoreColor(item.value))}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Feedback */}
          {evaluationResults.feedback && (
            <div className="bg-slate-800/50 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">AI Feedback</h3>
              <p className="text-slate-300">{evaluationResults.feedback}</p>
            </div>
          )}

          {/* Strengths & Improvements */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {evaluationResults.highlights && evaluationResults.highlights.length > 0 && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-emerald-400 mb-3">✨ Strengths</h3>
                <ul className="space-y-2">
                  {evaluationResults.highlights.map((h: string, i: number) => (
                    <li key={i} className="text-slate-300 flex items-start gap-2">
                      <span className="text-emerald-400">•</span>
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {evaluationResults.improvements && evaluationResults.improvements.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-amber-400 mb-3">📈 Areas to Improve</h3>
                <ul className="space-y-2">
                  {evaluationResults.improvements.map((imp: string, i: number) => (
                    <li key={i} className="text-slate-300 flex items-start gap-2">
                      <span className="text-amber-400">•</span>
                      {imp}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-center gap-4">
            <Button
              onClick={() => window.location.href = `/train/competitions/${competitionId}`}
              className="bg-violet-600 hover:bg-violet-700"
            >
              View Leaderboard
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/train/competitions'}
            >
              Back to Competitions
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Session ended without results - redirect
  if (sessionEnded) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-slate-800 rounded-xl p-8 max-w-md text-center">
          <Trophy className="w-16 h-16 text-violet-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Battle Complete!</h2>
          <p className="text-slate-400 mb-6">Your results have been saved.</p>
          <Button onClick={() => window.location.href = `/train/competitions/${competitionId}`}>
            View Results
          </Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-slate-800 rounded-xl p-8 max-w-md text-center">
          <div className="text-red-400 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-2">Connection Error</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (!joined) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        {waitingForParticipants ? (
          // Waiting for minimum participants
          <div className="bg-slate-800 rounded-xl p-8 max-w-md text-center">
            <div className="mb-6">
              <Users className="w-16 h-16 text-violet-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Waiting for Participants</h2>
              <p className="text-slate-400">
                The GD will start when minimum participants join
              </p>
            </div>
            
            {/* Topic */}
            {competition.topic && (
              <div className="bg-violet-500/10 border border-violet-500/30 rounded-lg p-4 mb-6">
                <p className="text-xs text-violet-400 uppercase tracking-wider mb-1">Discussion Topic</p>
                <p className="text-white font-medium">{competition.topic}</p>
              </div>
            )}
            
            <div className="bg-slate-900 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-center gap-8">
                <div className="text-center">
                  <div className="text-4xl font-bold text-violet-400 mb-1">
                    {currentParticipants}
                  </div>
                  <div className="text-sm text-slate-400">Current</div>
                </div>
                <div className="text-slate-600 text-2xl">/</div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-slate-500 mb-1">
                    {minParticipants}
                  </div>
                  <div className="text-sm text-slate-400">Minimum</div>
                </div>
                {competition.maxGDParticipants && (
                  <>
                    <div className="text-slate-600 text-2xl">-</div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-slate-500 mb-1">
                        {competition.maxGDParticipants}
                      </div>
                      <div className="text-sm text-slate-400">Maximum</div>
                    </div>
                  </>
                )}
              </div>
              
              <div className="mt-4">
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-violet-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((currentParticipants / minParticipants) * 100, 100)}%` }}
                  />
                </div>
              </div>
              
              {/* Duration info */}
              <div className="mt-4 flex items-center justify-center gap-2 text-slate-400">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Duration: {Math.floor(competition.durationPerModule / 60)} minutes</span>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-2 text-slate-500">
              <div className="animate-pulse w-2 h-2 rounded-full bg-violet-400" />
              <span className="text-sm">Checking for participants...</span>
            </div>
          </div>
        ) : (
          // Connecting to Agora
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-violet-500 mx-auto mb-4"></div>
            <p className="text-slate-400">Connecting to battle room...</p>
            <p className="text-slate-500 text-sm mt-2">Initializing video and audio...</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4 pb-28">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-4">
        <div className="bg-slate-800/50 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-violet-400" />
              <h1 className="text-lg font-semibold text-white">{competition.name}</h1>
            </div>
            <Badge variant="outline" className="gap-1">
              <Users className="h-3 w-3" />
              {remoteUsers.length + 1}/{competition.maxGDParticipants || 8}
            </Badge>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" />
              <span className={cn(
                "text-lg font-mono",
                timeRemaining < 60 ? "text-red-400" : "text-white"
              )}>
                {formatTime(timeRemaining)}
              </span>
            </div>
            <div className={cn("flex items-center gap-1", getNetworkQualityColor())}>
              <Signal className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Video Grid */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className={cn(
          "grid gap-4",
          remoteUsers.length === 0 && "grid-cols-1",
          remoteUsers.length === 1 && "grid-cols-2",
          remoteUsers.length >= 2 && remoteUsers.length <= 3 && "grid-cols-2 lg:grid-cols-3",
          remoteUsers.length >= 4 && "grid-cols-2 lg:grid-cols-4"
        )}>
          {/* Local Video */}
          <div className="relative aspect-video bg-slate-800 rounded-xl overflow-hidden border-2 border-violet-500/30 shadow-lg">
            {localVideoTrack && !isVideoOff ? (
              <MediaPlayer
                videoTrack={localVideoTrack}
                audioTrack={localAudioTrack}
                uid={agoraUid}
                local={true}
                userName={userName}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-800">
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full bg-violet-500/20 border-2 border-violet-400/30 flex items-center justify-center mx-auto mb-3">
                    <span className="text-3xl font-bold text-violet-400">
                      {userName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {/* User Name Label - Bottom */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
              <div className="flex items-center justify-between">
                <span className="text-white font-semibold drop-shadow-lg">
                  {userName} <span className="text-violet-400">(You)</span>
                </span>
                {isMuted && (
                  <div className="bg-red-500 p-1.5 rounded-full">
                    <MicOff className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Remote Videos */}
          {remoteUsers.map((user) => {
            const participant = participants.find(p => p.userId === user.uid.toString());
            const participantName = participant?.user.name || `User ${user.uid}`;
            
            return (
              <div key={user.uid} className="relative aspect-video bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-lg">
                {user.videoTrack ? (
                  <MediaPlayer
                    videoTrack={user.videoTrack}
                    audioTrack={user.audioTrack}
                    uid={user.uid}
                    userName={participantName}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-800">
                    <div className="text-center">
                      <div className="w-24 h-24 rounded-full bg-blue-500/20 border-2 border-blue-400/30 flex items-center justify-center mx-auto mb-3">
                        <span className="text-3xl font-bold text-blue-400">
                          {participantName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* User Name Label - Bottom */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-semibold drop-shadow-lg">
                      {participantName}
                    </span>
                    {!user.hasAudio && (
                      <div className="bg-red-500 p-1.5 rounded-full">
                        <MicOff className="h-3.5 w-3.5 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Topic Card */}
        {competition.topic && (
          <div className="mt-4 bg-slate-800/50 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <MessageSquare className="h-5 w-5 text-violet-400 mt-1" />
              <div>
                <h3 className="text-sm font-medium text-slate-400 mb-1">Discussion Topic</h3>
                <p className="text-lg text-white">{competition.topic}</p>
              </div>
            </div>
          </div>
        )}

        {/* Controls - Fixed at bottom center */}
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4 z-50">
          <Button
            onClick={toggleAudio}
            variant="ghost"
            size="icon"
            className={cn(
              "p-4 h-14 w-14 rounded-full transition-all shadow-lg",
              isMuted 
                ? "bg-red-500 hover:bg-red-600 text-white" 
                : "bg-slate-700 hover:bg-slate-600 text-white"
            )}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <MicOff className="w-6 h-6" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </Button>

          <Button
            onClick={toggleVideo}
            variant="ghost"
            size="icon"
            className={cn(
              "p-4 h-14 w-14 rounded-full transition-all shadow-lg",
              isVideoOff 
                ? "bg-red-500 hover:bg-red-600 text-white" 
                : "bg-slate-700 hover:bg-slate-600 text-white"
            )}
            title={isVideoOff ? "Turn on camera" : "Turn off camera"}
          >
            {isVideoOff ? (
              <VideoOff className="w-6 h-6" />
            ) : (
              <Video className="w-6 h-6" />
            )}
          </Button>

          <Button
            onClick={handleEndBattle}
            className="px-6 py-4 h-14 bg-red-600 hover:bg-red-700 text-white rounded-full font-semibold shadow-lg transition-colors"
          >
            End Session
          </Button>
        </div>
      </div>
    </div>
  );
}
