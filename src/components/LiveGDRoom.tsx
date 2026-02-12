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
import GDSessionReport from './GDSessionReport';
import { useSession } from 'next-auth/react';

// --- Interfaces ---

interface RoomData {
  roomId: string;
  sessionId?: string;
  channelName: string;
  topic: string;
  participants: {
    odlUserId: string;
    odlUserName: string;
    role: string;
  }[];
}

interface LiveGDRoomProps {
  roomData: RoomData;
  userId: string;
  agoraUid: number;
}

type SessionState = 'ready' | 'active' | 'ended';

interface RemoteUser {
  uid: UID;
  audioTrack: IRemoteAudioTrack | null;
  videoTrack: IRemoteVideoTrack | null;
  hasAudio: boolean;
  hasVideo: boolean;
}

// --- Helper Component for Media Playing ---
// This isolates the "play" logic to ensure the DOM element exists before Agora tries to attach video.
const MediaPlayer = ({ 
  videoTrack, 
  audioTrack, 
  uid, 
  local = false 
}: { 
  videoTrack: IRemoteVideoTrack | ICameraVideoTrack | null; 
  audioTrack: IRemoteAudioTrack | IMicrophoneAudioTrack | null; 
  uid: UID;
  local?: boolean;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !videoTrack) return;
    
    // Play video in the container
    videoTrack.play(containerRef.current);

    return () => {
      // Stop video on unmount
      videoTrack.stop();
    };
  }, [videoTrack]);

  useEffect(() => {
    // Local audio is never played (to prevent echo), only remote
    if (audioTrack && !local) {
      audioTrack.play();
    }
    return () => {
      if (audioTrack && !local) {
        audioTrack.stop();
      }
    };
  }, [audioTrack, local]);

  return <div ref={containerRef} id={`player-${uid}`} className="w-full h-full bg-slate-900" />;
};

// --- Main Component ---

export default function LiveGDRoom({ roomData: initialRoomData, userId, agoraUid }: LiveGDRoomProps) {
  const { data: session } = useSession();
  const userName = session?.user?.name || 'Guest';

  // State
  const [state, setState] = useState<SessionState>('ready');
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<RemoteUser[]>([]);
  const [networkQuality, setNetworkQuality] = useState<NetworkQuality | null>(null);
  const [currentPhase, setCurrentPhase] = useState('waiting');
  const [phaseTimer, setPhaseTimer] = useState(0);
  const [analytics, setAnalytics] = useState<any>(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const phaseIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isJoinedRef = useRef(false);
  const isCleanupRef = useRef(false); // Guard against double cleanup

  const userRole = initialRoomData.participants.find(p => p.odlUserId === userId)?.role || 'Participant';

  // --- Agora Initialization ---
  useEffect(() => {
    // Prevent double init
    if (isJoinedRef.current || isCleanupRef.current) return;

    const initAgora = async () => {
      try {
        const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID;
        if (!APP_ID) throw new Error('Agora Configuration Missing');

        // 1. Create Client
        const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        clientRef.current = client;

        // 2. Set up Event Listeners
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
           // Only update significant changes to avoid rerenders
           if(stats.downlinkNetworkQuality !== 0) {
               setNetworkQuality(stats);
           }
        });

        // 3. Fetch Token
        const tokenResponse = await fetch('/api/gd/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: initialRoomData.sessionId || initialRoomData.roomId,
            channelName: initialRoomData.channelName,
            uid: agoraUid,
            role: 'publisher',
            userId,
          }),
        });

        if (!tokenResponse.ok) throw new Error('Connection failed. Please refresh.');
        const { token } = await tokenResponse.json();

        // 4. Join Channel
        await client.join(APP_ID, initialRoomData.channelName, token, agoraUid);
        isJoinedRef.current = true;

        // 5. Create & Publish Local Tracks
        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
        setLocalAudioTrack(audioTrack);
        setLocalVideoTrack(videoTrack);

        await client.publish([audioTrack, videoTrack]);

        // 6. Start Session Logic
        setState('active');
        setCurrentPhase('initiation');
        startPhaseTimer();

      } catch (err: any) {
        console.error('Agora Error:', err);
        setError('Failed to connect to the session. Please try refreshing.');
        // Clean up immediately on failure
        cleanup(); 
      }
    };

    initAgora();

    return () => {
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // --- Logic Helpers ---

  const cleanup = useCallback(async () => {
    if (isCleanupRef.current) return;
    isCleanupRef.current = true;

    if (phaseIntervalRef.current) {
      clearInterval(phaseIntervalRef.current);
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


  const startPhaseTimer = () => {
    const phases = [
      { name: 'initiation', duration: 120 },
      { name: 'discussion', duration: 600 },
      { name: 'summary', duration: 120 },
    ];

    let currentPhaseIndex = 0;
    setPhaseTimer(phases[0].duration);

    phaseIntervalRef.current = setInterval(() => {
      setPhaseTimer(prev => {
        if (prev <= 1) {
          currentPhaseIndex++;
          if (currentPhaseIndex < phases.length) {
            setCurrentPhase(phases[currentPhaseIndex].name);
            return phases[currentPhaseIndex].duration;
          } else {
            clearInterval(phaseIntervalRef.current!);
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);
  };

  const toggleMute = async () => {
    if (localAudioTrack) {
      await localAudioTrack.setEnabled(isMuted); // Note: setEnabled(true) enables it, so if currently muted (true), we pass false? No, setEnabled(true) turns it ON.
      // If isMuted is true, we want to unmute (enable). 
      // If isMuted is false, we want to mute (disable).
      // Actually Agora setEnabled takes boolean 'enabled'.
      await localAudioTrack.setEnabled(isMuted); // If isMuted=true (currently muted), we pass true (enable). Correct.
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = async () => {
    if (localVideoTrack) {
      await localVideoTrack.setEnabled(isVideoOff);
      setIsVideoOff(!isVideoOff);
    }
  };

  const endSession = async () => {
    const mockAnalytics = {
      overallScore: 78,
      communicationScore: 82,
      confidenceScore: 75,
      grammarScore: 80,
      relevanceScore: 70,
      leadershipScore: 75,
      rolePerformance: 85,
      speakingTime: 180,
      interruptions: 2,
      strengths: ['Great articulation', 'Maintained eye contact'],
      improvements: ['Invite others to speak more']
    };

    setAnalytics(mockAnalytics);
    setSessionEnded(true);
    await cleanup();
  };

  // --- Render ---

  if (sessionEnded && analytics) {
    return (
      <GDSessionReport
        sessionId={initialRoomData.roomId}
        topic={initialRoomData.topic}
        role={userRole}
        analytics={analytics}
        onRetry={() => { window.location.href = '/train/live-gd'; }}
      />
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
             <div className="bg-red-500 w-3 h-3 rounded-full animate-pulse"></div>
             <h1 className="text-2xl font-bold text-white">Live Discussion</h1>
          </div>
          
          {networkQuality && (
             <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700">
               <span className="text-xs text-gray-400">Connection:</span>
               <div className={`w-2 h-2 rounded-full ${
                  networkQuality.downlinkNetworkQuality <= 2 ? 'bg-green-500' : 
                  networkQuality.downlinkNetworkQuality <= 4 ? 'bg-yellow-500' : 'bg-red-500'
               }`} />
             </div>
          )}
        </div>

        {error ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
             <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-6 max-w-md">
                <h3 className="text-red-400 font-semibold mb-2">Connection Error</h3>
                <p className="text-gray-300 mb-4">{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                >
                  Reconnect
                </button>
             </div>
          </div>
        ) : (
          <>
            {/* Info Bar */}
            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4 mb-6 flex flex-wrap justify-between items-center gap-4 border border-slate-700">
              <div>
                <span className="text-gray-400 text-sm uppercase tracking-wider">Current Phase</span>
                <h3 className="text-xl font-bold text-white capitalize">{currentPhase}</h3>
              </div>
              
              <div className="flex flex-col items-center">
                 <span className="text-3xl font-mono font-bold text-blue-400">{formatTime(phaseTimer)}</span>
                 <span className="text-xs text-gray-500">REMAINING</span>
              </div>

              <div className="text-right">
                <span className="text-gray-400 text-sm uppercase tracking-wider">Your Role</span>
                <p className="text-white font-medium text-indigo-400">{userRole}</p>
              </div>
            </div>

            {/* Video Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              
              {/* Local User */}
              <div className="relative aspect-video bg-slate-800 rounded-xl overflow-hidden border-2 border-indigo-500/30 shadow-lg">
                 <MediaPlayer 
                    videoTrack={localVideoTrack} 
                    audioTrack={localAudioTrack} 
                    uid={agoraUid} 
                    local={true} 
                 />
                 
                 {/* Local Overlay */}
                 <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3">
                    <div className="flex justify-end">
                       <div className="bg-black/50 backdrop-blur px-2 py-1 rounded text-xs text-white">
                          You
                       </div>
                    </div>
                    <div>
                       <div className="flex items-center gap-2">
                          <span className="text-white font-semibold drop-shadow-md">{userName}</span>
                          {isMuted && <span className="text-red-400 bg-black/50 px-1 rounded text-xs">MUTED</span>}
                       </div>
                    </div>
                 </div>

                 {isVideoOff && (
                    <div className="absolute inset-0 bg-slate-800 flex items-center justify-center z-10">
                       <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-3xl font-bold text-white">
                          {userName.charAt(0).toUpperCase()}
                       </div>
                    </div>
                 )}
              </div>

              {/* Remote Users */}
              {remoteUsers.map(user => (
                 <div key={user.uid} className="relative aspect-video bg-slate-800 rounded-xl overflow-hidden shadow-lg border border-slate-700">
                    <MediaPlayer 
                       videoTrack={user.videoTrack} 
                       audioTrack={user.audioTrack} 
                       uid={user.uid} 
                       local={false} 
                    />

                    {/* Remote Overlay */}
                    <div className="absolute inset-0 pointer-events-none flex flex-col justify-end p-3">
                       <div className="flex items-center gap-2">
                          <span className="text-white font-semibold drop-shadow-md">
                             Participant {String(user.uid).slice(-4)}
                          </span>
                          {!user.hasAudio && <span className="text-red-400 bg-black/50 px-1 rounded text-xs">MUTED</span>}
                       </div>
                    </div>

                    {!user.hasVideo && (
                       <div className="absolute inset-0 bg-slate-800 flex items-center justify-center z-10">
                          <div className="w-20 h-20 rounded-full bg-slate-600 flex items-center justify-center text-3xl font-bold text-white">
                             P
                          </div>
                       </div>
                    )}
                 </div>
              ))}
            </div>

            {/* Controls */}
            <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4 z-50">
               <button
                  onClick={toggleMute}
                  className={`p-4 rounded-full transition-all shadow-lg ${
                     isMuted ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white'
                  }`}
               >
                  {isMuted ? (
                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3l18 18"></path></svg>
                  ) : (
                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                  )}
               </button>

               <button
                  onClick={toggleVideo}
                  className={`p-4 rounded-full transition-all shadow-lg ${
                     isVideoOff ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white'
                  }`}
               >
                  {isVideoOff ? (
                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3l18 18"></path></svg>
                  ) : (
                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                  )}
               </button>

               <button
                  onClick={endSession}
                  className="px-6 py-4 bg-red-600 hover:bg-red-700 text-white rounded-full font-semibold shadow-lg transition-colors"
               >
                  End Session
               </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}