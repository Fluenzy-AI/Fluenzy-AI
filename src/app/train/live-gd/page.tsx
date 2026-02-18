'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import { io, Socket } from 'socket.io-client';
import GDMatchingUI from '@/components/GDMatchingUI';
import GDHistory from '@/components/GDHistory';

// Dynamic import for LiveGDRoom to avoid SSR issues with Agora
const LiveGDRoom = dynamic(() => import('@/components/LiveGDRoom'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  )
});

type GDStatus = 'idle' | 'queue' | 'matched' | 'active' | 'ended';

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

// Generate stable user ID (session storage preferred)
function getStableUserId(sessionUserId: string | undefined): string {
  // Only access storage on client side
  if (typeof window === 'undefined') {
    return sessionUserId || `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Try sessionStorage first (survives page reloads during session)
  const stored = window.sessionStorage.getItem('gd_userId');
  if (stored) return stored;

  // Try localStorage as fallback
  const localStored = window.localStorage.getItem('gd_userId');
  if (localStored) {
    window.sessionStorage.setItem('gd_userId', localStored);
    return localStored;
  }

  // Generate stable ID
  const newId = sessionUserId || `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  window.sessionStorage.setItem('gd_userId', newId);
  window.localStorage.setItem('gd_userId', newId);
  return newId;
}

export default function LiveGDPage() {
  const { data: session, status: authStatus } = useSession();

  // Generate stable user ID that persists during session (client-side only)
  const [userId, setUserId] = useState<string>(() => 
    getStableUserId(session?.user?.id)
  );
  const [userName, setUserName] = useState(() => session?.user?.name || 'Guest User');
  
  // Generate numeric UID for Agora (stable too)
  const [agoraUid, setAgoraUid] = useState<number>(() => {
    if (typeof window === 'undefined') return Math.floor(Math.random() * 1000000);
    const stored = window.sessionStorage.getItem('gd_agoraUid');
    if (stored) return parseInt(stored, 10);
    const newUid = Math.floor(Math.random() * 1000000);
    window.sessionStorage.setItem('gd_agoraUid', newUid.toString());
    return newUid;
  });

  // Initialize storage values on client mount
  useEffect(() => {
    if (typeof sessionStorage !== 'undefined') {
      const stored = sessionStorage.getItem('gd_userId');
      if (stored && stored !== userId) {
        setUserId(stored);
      }
      const uidStored = sessionStorage.getItem('gd_agoraUid');
      if (uidStored) {
        setAgoraUid(parseInt(uidStored, 10));
      }
    }
    if (session?.user?.name) {
      setUserName(session.user.name);
    }
  }, [session]);

  const [gdStatus, setGdStatus] = useState<GDStatus>('idle');
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [queueInfo, setQueueInfo] = useState<{ queueId: string; message: string } | null>(null);
  const [error, setError] = useState<React.ReactNode | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  
  // Socket connection
  const [socket, setSocket] = useState<Socket | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);

  // Form state
  const [participantCount, setParticipantCount] = useState(4);
  const [difficulty, setDifficulty] = useState('Medium');
  const [mode, setMode] = useState('Random');

  // Log userId on mount for debugging
  useEffect(() => {
    console.log('[Page] User ID:', userId);
    console.log('[Page] Agora UID:', agoraUid);
    console.log('[Page] Session userId:', session?.user?.id);
  }, [userId, agoraUid, session?.user?.id]);

  // Initialize socket connection
  useEffect(() => {
    console.log('[Page] Initializing socket connection...');
    
    const socketInstance = io({
      path: '/api/socket/io',
      addTrailingSlash: false,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
    });

    socketInstance.on('connect', () => {
      console.log('[Page] Socket connected:', socketInstance.id);
      setSocketConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('[Page] Socket disconnected');
      setSocketConnected(false);
    });

    socketInstance.on('connect_error', (err) => {
      console.error('[Page] Socket connection error:', err);
    });

    setSocket(socketInstance);

    return () => {
      console.log('[Page] Cleaning up socket...');
      socketInstance.disconnect();
    };
  }, []);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleQueueStatus = (data: { status: string; position: number; message: string }) => {
      console.log('[Page] Queue status:', data);
      setQueueInfo({
        queueId: data.position.toString(),
        message: data.message
      });
    };

    const handleMatchFound = (data: RoomData) => {
      console.log('[Page] Match found!');
      console.log('[Page] Room ID:', data.roomId);
      console.log('[Page] Channel:', data.channelName);
      console.log('[Page] Participants:', data.participants);
      console.log('[Page] Current userId:', userId);
      
      // Check if current user is in the participants list
      const isParticipant = data.participants.some(p => p.odlUserId === userId);
      console.log('[Page] Is current user a participant?:', isParticipant);
      
      if (isParticipant) {
        // Ensure sessionId is set (use roomId as fallback)
        const roomDataWithSession = {
          ...data,
          sessionId: data.sessionId || data.roomId
        };
        setRoomData(roomDataWithSession);
        setGdStatus('matched');
        setQueueInfo(null);
      } else {
        console.error('[Page] User not found in participants list!');
        setError('Error: You were not matched to this session. Please try again.');
        setGdStatus('idle');
      }
    };

    socket.on('queue-status', handleQueueStatus);
    socket.on('match-found', handleMatchFound);

    return () => {
      socket.off('queue-status', handleQueueStatus);
      socket.off('match-found', handleMatchFound);
    };
  }, [socket, userId]);

  // Join queue via socket
  const joinQueueSocket = useCallback(() => {
    if (!socket || !socketConnected) {
      console.error('[Page] Cannot join queue - socket not connected');
      setError('Not connected to server. Please refresh and try again.');
      return;
    }

    console.log('[Page] Joining queue...');
    console.log('[Page] Using userId:', userId);
    console.log('[Page] Using agoraUid:', agoraUid);
    
    setGdStatus('queue');
    setError(null);

    socket.emit('join-queue', {
      userId,
      userName,
      participantCount,
      difficulty,
      mode,
    });
  }, [socket, socketConnected, userId, userName, participantCount, difficulty, mode]);

  // Leave queue via socket
  const leaveQueueSocket = useCallback(() => {
    if (socket) {
      console.log('[Page] Leaving queue via socket...');
      socket.emit('leave-queue');
    }
    setGdStatus('idle');
    setQueueInfo(null);
  }, [socket]);

  const clearOldSessions = async () => {
    setIsClearing(true);
    setError(null);
    
    try {
      const response = await fetch('/api/gd/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cleanup' })
      });

      const data = await response.json();

      if (response.ok) {
        setError('Old sessions cleared! You can now join a new GD.');
      } else {
        setError(data.error || 'Failed to clear sessions');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setIsClearing(false);
    }
  };

  const handleJoinQueue = useCallback(async () => {
    if (!session?.user?.email) {
      setError('Please sign in to join a GD session');
      return;
    }

    // Try socket first, fall back to HTTP
    if (socketConnected) {
      joinQueueSocket();
      return;
    }

    // Fallback to HTTP
    setError(null);
    setGdStatus('queue');

    try {
      const response = await fetch('/api/gd/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'join',
          userId,
          participantCount,
          difficulty,
          mode,
          force: true
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 400 && data.error?.includes('active GD session')) {
          setError(
            <div className="text-center">
              <p className="mb-2">{data.error}</p>
              <button
                onClick={clearOldSessions}
                disabled={isClearing}
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {isClearing ? 'Clearing...' : 'Clear Old Sessions & Try Again'}
              </button>
            </div>
          );
          setGdStatus('idle');
          return;
        }
        setError(data.error || 'Failed to join queue');
        setGdStatus('idle');
        return;
      }

      if (data.matched) {
        setRoomData({
          roomId: data.sessionId,
          sessionId: data.sessionId,
          channelName: data.channelName,
          topic: data.topic,
          participants: data.participants || []
        });
        setGdStatus('matched');
      } else {
        setQueueInfo({
          queueId: data.queueId,
          message: data.message || 'Looking for participants...'
        });
        setGdStatus('queue');
      }
    } catch (err) {
      setError('Failed to connect to matchmaking server');
      setGdStatus('idle');
    }
  }, [session, socketConnected, joinQueueSocket, userId, participantCount, difficulty, mode, isClearing]);

  const handleLeaveQueue = useCallback(async () => {
    if (socketConnected) {
      leaveQueueSocket();
    } else {
      try {
        await fetch('/api/gd/match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'leave' })
        });
      } catch (err) {
        console.error('Error leaving queue:', err);
      }
      setGdStatus('idle');
      setQueueInfo(null);
    }
  }, [socketConnected, leaveQueueSocket]);

  const handleStartNew = useCallback(() => {
    setGdStatus('idle');
    setRoomData(null);
    setQueueInfo(null);
    setError(null);
    setShowHistory(false);
  }, []);

  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (authStatus === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Sign In Required</h1>
          <p className="text-gray-400 mb-6">Please sign in to join a Group Discussion</p>
        </div>
      </div>
    );
  }

  if (gdStatus === 'matched' && roomData) {
    return (
      <LiveGDRoom 
        roomData={roomData}
        userId={userId}
        agoraUid={agoraUid}
      />
    );
  }

  if (gdStatus === 'queue') {
    return (
      <GDMatchingUI
        queueInfo={queueInfo}
        onLeave={handleLeaveQueue}
        onRetry={handleStartNew}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              Live Group Discussion
            </h1>
            <p className="text-gray-400">
              Join random Omegle-style GD sessions with real participants
            </p>
            {/* Debug info */}
            <div className="mt-2 text-xs text-gray-500">
              User: {userId.slice(0, 20)}... | UID: {agoraUid}
            </div>
            {/* Socket status indicator */}
            <div className={`mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
              socketConnected 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-red-500/20 text-red-400'
            }`}>
              <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-400' : 'bg-red-400'}`} />
              {socketConnected ? 'Socket Connected' : 'Connecting...'}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-yellow-500/10 border border-yellow-500 text-yellow-400 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* GD Setup Card */}
          <div className="bg-slate-800 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-6">Configure Your GD Session</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Participant Count */}
              <div>
                <label className="block text-gray-400 mb-2">Participants</label>
                <select
                  value={participantCount}
                  onChange={(e) => setParticipantCount(parseInt(e.target.value))}
                  className="w-full bg-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={3}>3 Participants</option>
                  <option value={4}>4 Participants</option>
                  <option value={5}>5 Participants</option>
                  <option value={6}>6 Participants</option>
                  <option value={7}>7 Participants</option>
                  <option value={8}>8 Participants</option>
                </select>
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-gray-400 mb-2">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full bg-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              {/* Mode */}
              <div>
                <label className="block text-gray-400 mb-2">Topic Mode</label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  className="w-full bg-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Random">Random Topics</option>
                  <option value="Corporate">Corporate</option>
                  <option value="CurrentAffairs">Current Affairs</option>
                  <option value="Abstract">Abstract</option>
                  <option value="BusinessEthics">Business Ethics</option>
                  <option value="Technology">Technology</option>
                </select>
              </div>
            </div>

            {/* Join Button */}
            <button
              onClick={handleJoinQueue}
              disabled={!socketConnected}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {socketConnected ? '🔍 Find Discussion Room' : 'Connecting to server...'}
            </button>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-800 rounded-xl p-6">
              <div className="text-3xl mb-4">Random Matching</div>
              <h3 className="text-lg font-semibold text-white mb-2">Random Matching</h3>
              <p className="text-gray-400 text-sm">
                Get matched with real participants automatically based on your preferences.
              </p>
            </div>

            <div className="bg-slate-800 rounded-xl p-6">
              <div className="text-3xl mb-4">Dynamic Roles</div>
              <h3 className="text-lg font-semibold text-white mb-2">Dynamic Roles</h3>
              <p className="text-gray-400 text-sm">
                Each session assigns unique roles like Initiator, Moderator, Analyzer, etc.
              </p>
            </div>

            <div className="bg-slate-800 rounded-xl p-6">
              <div className="text-3xl mb-4">Performance Report</div>
              <h3 className="text-lg font-semibold text-white mb-2">Performance Report</h3>
              <p className="text-gray-400 text-sm">
                Get detailed analytics and feedback after each session.
              </p>
            </div>
          </div>

          {/* History Button */}
          <div className="mt-8 text-center">
            <button
              onClick={() => setShowHistory(true)}
              className="text-blue-400 hover:text-blue-300 font-medium"
            >
              View Past GD Sessions
            </button>
          </div>
        </div>
      </div>

      {/* History Modal */}
      {showHistory && (
        <GDHistory
          onStartNew={handleStartNew}
          showHistory={showHistory}
          setShowHistory={setShowHistory}
        />
      )}
    </div>
  );
}
