'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  NetworkQuality,
  IRemoteVideoTrack,
  IRemoteAudioTrack,
  UID,
} from 'agora-rtc-sdk-ng';
import LiveMobileGDRoom from './LiveMobileGDRoom';
import { useSession } from 'next-auth/react';
import { useTheme } from '@/contexts/ThemeContext';
import { BarChart3, ChevronDown, Clock3, FileText, Home, Link2, PhoneOff, Sparkles, Target, User } from 'lucide-react';

const ROOM_TABS = [
  { label: 'Quick Links', icon: Link2, href: '/train' },
  { label: 'Practice', icon: Target, href: '/train/hr' },
  { label: 'Home', icon: Home, href: '/train' },
  { label: 'Analytics', icon: BarChart3, href: '/analytics' },
  { label: 'Profile', icon: User, href: '/profile' },
];

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
  largeVideoLayout?: boolean;
  redirectOnEnd?: string;
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

export default function LiveGDRoom({ roomData: initialRoomData, userId, agoraUid, largeVideoLayout = false, redirectOnEnd = '/train/live-gd' }: LiveGDRoomProps) {
  const { data: session } = useSession();
  const { resolvedTheme } = useTheme();
  const userName = session?.user?.name || 'Guest';
  const isLight = resolvedTheme === 'light' || resolvedTheme === 'parchment';
  const roomColors = {
    page: isLight ? (resolvedTheme === 'parchment' ? '#F3F0EB' : '#F8FAFC') : '#050914',
    surface: isLight ? '#FFFFFF' : '#0B1324',
    panel: isLight ? '#FFFFFF' : '#0E1A31',
    text: isLight ? '#221F1D' : '#FFFFFF',
    muted: isLight ? '#64748B' : '#A5B4FC',
    border: isLight ? '#E4DED5' : 'rgba(129,140,248,0.2)',
    accent: isLight ? '#6D3FE8' : '#7C3AED',
  };

  // State
  const [state, setState] = useState<SessionState>('ready');
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<RemoteUser[]>([]);
  const [networkQuality, setNetworkQuality] = useState<NetworkQuality | null>(null);
  const [currentPhase, setCurrentPhase] = useState('waiting');
  const [phaseTimer, setPhaseTimer] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  // Refs
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const phaseIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isJoinedRef = useRef(false);
  const isCleanupRef = useRef(false); // Guard against double cleanup

  const userRole = initialRoomData.participants.find(p => p.odlUserId === userId)?.role || 'Participant';

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 640px)');
    const updateViewport = () => setIsMobile(mediaQuery.matches);
    updateViewport();
    mediaQuery.addEventListener('change', updateViewport);
    return () => mediaQuery.removeEventListener('change', updateViewport);
  }, []);

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
    await cleanup();
    window.location.href = redirectOnEnd;
  };

  // --- Render ---

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isMobile === null) return null;

  if (isMobile) {
    return (
      <LiveMobileGDRoom
        userName={userName}
        avatarUrl={session?.user?.image}
        topic={initialRoomData.topic || userRole}
        currentPhase={currentPhase}
        phaseTimer={phaseTimer}
        participantNames={initialRoomData.participants.map((participant) => participant.odlUserName)}
        agoraUid={agoraUid}
        localVideoTrack={localVideoTrack}
        localAudioTrack={localAudioTrack}
        remoteUsers={remoteUsers}
        isMuted={isMuted}
        isVideoOff={isVideoOff}
        onToggleMute={toggleMute}
        onToggleVideo={toggleVideo}
        onEndSession={endSession}
        largeVideoLayout={largeVideoLayout}
      />
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 pb-28" style={{ background: roomColors.page, color: roomColors.text }}>
      <div className="max-w-7xl mx-auto">
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
            <div className="bg-gradient-to-r from-[#0e1a31] to-[#0a1223] backdrop-blur rounded-3xl p-5 mb-7 flex flex-wrap justify-between items-center gap-5 border border-indigo-400/20">
              <div>
                <span className="text-gray-400 text-sm uppercase tracking-wider">Current Phase</span>
                <h3 className="text-xl font-bold text-white capitalize">{currentPhase}</h3>
              </div>
              
              <div className="flex flex-col items-center">
                 <span className="text-4xl font-mono font-bold text-blue-400 flex items-center gap-2"><Clock3 size={28} />{formatTime(phaseTimer)}</span>
                 <span className="text-xs text-gray-500">REMAINING</span>
              </div>

              <div className="text-right">
                <span className="text-gray-400 text-sm uppercase tracking-wider">Your Role</span>
                <p className="text-white font-medium text-indigo-400 flex items-center gap-2"><FileText size={17} />{initialRoomData.topic || userRole}<ChevronDown size={16} /></p>
              </div>
            </div>

            {/* Video Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5 mb-8">
              
              {/* Local User */}
              <div className="relative aspect-video bg-[#16233b] rounded-3xl overflow-hidden border-4 border-[#7437ff] shadow-[0_0_18px_rgba(124,58,237,0.55)]">
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
              {remoteUsers.slice(0, 3).map(user => (
                 <div key={user.uid} className="relative aspect-video bg-[#16233b] rounded-3xl overflow-hidden shadow-lg border border-indigo-500/50">
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
            <div className="fixed bottom-5 left-1/2 transform -translate-x-1/2 flex items-center gap-3 md:gap-5 z-50 rounded-3xl border border-indigo-400/10 bg-[#0b1427]/95 backdrop-blur-xl px-4 py-3 shadow-2xl">
               <button
                  onClick={toggleMute}
                  className={`p-4 rounded-full transition-all shadow-lg bg-[#152440] ${
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
                  className={`p-4 rounded-full transition-all shadow-lg bg-[#152440] ${
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
                  className="px-6 md:px-10 py-4 bg-gradient-to-r from-rose-500 to-red-500 text-white rounded-full font-bold shadow-lg transition-colors flex items-center gap-2"
               >
                  <PhoneOff size={19} />
                  End Session
               </button>
            </div>
            <button
              onClick={() => { window.dispatchEvent(new CustomEvent('open-side-chatbot')); }}
              className="fixed right-5 md:right-10 bottom-8 z-50 w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 shadow-[0_0_25px_rgba(124,58,237,0.7)] flex flex-col items-center justify-center font-bold"
            >
              <Sparkles size={22} />
              <span className="text-[10px]">Ask AI</span>
            </button>
          </>
        )}
      </div>
      <nav className="fixed bottom-0 left-0 right-0 z-[210] sm:hidden h-16 flex items-end justify-around border-t" style={{ background: roomColors.surface, borderColor: roomColors.border, paddingBottom: 'env(safe-area-inset-bottom, 4px)' }}>
        <div className="flex items-center justify-around w-full h-full px-1">
          {ROOM_TABS.map((tab) => {
            const isHome = tab.label === 'Home';
            const Icon = tab.icon;
            return (
              <Link key={tab.label} href={tab.href} aria-label={tab.label} className={`flex flex-col items-center justify-center gap-0.5 min-w-[54px] flex-1 ${isHome ? '-mt-5' : 'pb-1'}`}>
                {isHome ? (
                  <span className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg" style={{ background: roomColors.accent, boxShadow: `0 6px 18px ${roomColors.accent}70` }}>
                    <Home size={22} color="#FFFFFF" strokeWidth={2.2} />
                  </span>
                ) : (
                  <Icon size={22} style={{ color: isLight ? '#475569' : '#A5B4FC' }} />
                )}
                <span className="font-extrabold text-[10px]" style={{ color: isHome ? roomColors.accent : (isLight ? '#334155' : '#A5B4FC') }}>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}