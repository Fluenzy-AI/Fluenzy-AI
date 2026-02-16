'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { io, Socket } from 'socket.io-client';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Users, 
  Copy, 
  Check, 
  Share2, 
  Lock,
  Loader2,
  Crown,
  MessageSquare,
  XCircle,
  LogOut,
  LogIn
} from 'lucide-react';

// Dynamic import for LiveGDRoom
const LiveGDRoom = dynamic(() => import('@/components/LiveGDRoom'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
    </div>
  )
});

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

interface Participant {
  id: string;
  userId: string;
  userName: string;
  isHost: boolean;
  joinedAt: Date;
}

export default function PrivateGDPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;

  // State
  const [userId, setUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('Guest User');
  const [agoraUid] = useState<number>(() => Math.floor(Math.random() * 1000000));
  const [roomStatus, setRoomStatus] = useState<'loading' | 'not_found' | 'ready' | 'active'>('loading');
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [roomTopic, setRoomTopic] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  const roles = [
    'Initiator', 'Moderator', 'Analyzer', 'Challenger',
    'Supporter', 'Summarizer', 'InfoProvider'
  ];

  // Initialize user
  useEffect(() => {
    const storedUserId = typeof sessionStorage !== 'undefined' 
      ? sessionStorage.getItem('gd_userId') 
      : null;
    const newUserId = storedUserId || `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('gd_userId', newUserId);
    }
    setUserId(newUserId);
    setUserName(session?.user?.name || 'Guest User');
  }, [session]);

  // Validate room exists
  useEffect(() => {
    const validateRoom = async () => {
      try {
        const response = await fetch(`/api/gd/private-room?roomId=${roomId}`);
        if (!response.ok) {
          setRoomStatus('not_found');
          return;
        }
        const data = await response.json();
        setRoomStatus('ready');
        
        // Check if user is host by checking stored session data
        if (typeof sessionStorage !== 'undefined') {
          const storedData = sessionStorage.getItem('privateRoomData');
          if (storedData) {
            const parsed = JSON.parse(storedData);
            if (parsed.roomId === roomId) {
              setIsHost(parsed.isHost || false);
              // Use stored session data for video
              if (parsed.channelName) {
                setRoomData({
                  roomId: parsed.roomId,
                  sessionId: parsed.sessionId,
                  channelName: parsed.channelName,
                  topic: data.topic || 'Private Discussion',
                  participants: data.participants || []
                });
              }
            }
          }
        }
      } catch (err) {
        setRoomStatus('not_found');
      }
    };

    if (roomId && userId) {
      validateRoom();
    }
  }, [roomId, userId]);

  // Join room (called when user clicks Enter Room)
  const joinRoom = useCallback(async () => {
    setIsJoining(true);
    setError(null);

    try {
      // First, get the room info from the database
      const response = await fetch(`/api/gd/private-room?roomId=${roomId}`);
      const roomInfo = await response.json();

      if (!response.ok) {
        setError(roomInfo.error || 'Room not found');
        setIsJoining(false);
        return;
      }

      // Room exists - now join via socket
      const socketInstance = io({
        path: '/api/socket/io',
        addTrailingSlash: false,
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
      });

      socketInstance.on('connect', () => {
        setSocketConnected(true);
        socketInstance.emit('join-private-room', {
          roomId,
          userId,
          userName,
          role: selectedRole || null
        });
      });

      socketInstance.on('disconnect', () => setSocketConnected(false));

      socketInstance.on('room-joined', (roomData: { participants: Participant[], isHost: boolean }) => {
        setParticipants(roomData.participants);
        setIsHost(roomData.isHost);
        setIsJoining(false);
      });

      socketInstance.on('participant-joined', (data: { participant: Participant }) => {
        setParticipants(prev => [...prev, data.participant]);
      });

      socketInstance.on('participant-left', (data: { userId: string }) => {
        setParticipants(prev => prev.filter(p => p.userId !== data.userId));
      });

      socketInstance.on('room-error', (data: { error: string }) => {
        setError(data.error);
        setIsJoining(false);
      });

      socketInstance.on('topic-updated', (data: { topic: string }) => {
        setRoomTopic(data.topic);
      });

      // Get session data for LiveGDRoom
      socketInstance.on('match-found', (sessionData: RoomData) => {
        setRoomData(sessionData);
        setRoomStatus('active');
      });

      setSocket(socketInstance);

      // Use the room info from database to show LiveGDRoom
      // The channelName is private_{roomId}
      setRoomData({
        roomId: roomInfo.roomId,
        sessionId: roomInfo.sessionId,
        channelName: roomInfo.channelName,
        topic: roomInfo.topic || 'Private Discussion',
        participants: roomInfo.participants || []
      });
      setRoomStatus('active');
      setIsJoining(false);
    } catch (err) {
      setError('Failed to join room. Please try again.');
      setIsJoining(false);
    }
  }, [roomId, userId, userName, selectedRole]);

  // If room is active
  if (roomStatus === 'active' && roomData) {
    return (
      <LiveGDRoom roomData={roomData} userId={userId} agoraUid={agoraUid} />
    );
  }

  // Room not found
  if (roomStatus === 'not_found') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Room Not Found</h1>
          <p className="text-gray-400 mb-8">This private room doesn't exist or has been removed.</p>
          <Link href="/train/gd" className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to GD Modes
          </Link>
        </div>
      </div>
    );
  }

  // Loading
  if (authStatus === 'loading' || roomStatus === 'loading') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Not authenticated
  if (authStatus === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Sign In Required</h1>
          <p className="text-gray-400 mb-6">Please sign in to join the private GD room</p>
        </div>
      </div>
    );
  }

  const inviteLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/train/gd/private/${roomId}`;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link href="/train/gd" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to GD Modes
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-purple-500/10 text-purple-400 px-4 py-2 rounded-full text-sm mb-4">
            <Lock size={16} /> <span>Private Room</span>
            {isHost && <Crown className="w-4 h-4 ml-2 text-yellow-400" />}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Private Discussion Room</h1>
          <p className="text-gray-400">Room ID: <span className="font-mono text-purple-400">{roomId}</span></p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6">{error}</div>
        )}

        {/* Invite Link Card */}
        <div className="bg-slate-800/50 rounded-xl p-6 mb-6 border border-slate-700/50">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-purple-400" /> Invite Link
          </h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={inviteLink}
              readOnly
              className="flex-1 bg-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={() => { navigator.clipboard.writeText(inviteLink); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-gray-400 text-sm mt-3">Share this link with others to invite them to your discussion</p>
        </div>

        {/* Enter Room Button */}
        {!socket && (
          <div className="bg-slate-800/50 rounded-xl p-6 mb-6 border border-slate-700/50">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Ready to Join?</h2>
              <p className="text-gray-400 mb-6">Copy the invite link above, share it with participants, then click below to enter the room.</p>
              <button
                onClick={joinRoom}
                disabled={isJoining}
                className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center gap-2 mx-auto"
              >
                {isJoining ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /><span>Joining...</span></>
                ) : (
                  <><LogIn className="w-5 h-5" /><span>Enter Room</span></>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Discussion Setup (after joining) */}
        {socket && (
          <>
            {/* Discussion Setup */}
            <div className="bg-slate-800/50 rounded-xl p-6 mb-6 border border-slate-700/50">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-400" /> Discussion Setup
              </h2>
              
              <div className="mb-4">
                <label className="block text-gray-400 mb-2">
                  Topic (Optional) <span className="text-gray-500 text-sm ml-2">- Host can set the discussion topic</span>
                </label>
                <input
                  type="text"
                  value={roomTopic}
                  onChange={(e) => setRoomTopic(e.target.value)}
                  placeholder="Enter discussion topic or leave blank for free discussion..."
                  disabled={!isHost}
                  className="w-full bg-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-400 mb-2">
                  Your Role (Optional) <span className="text-gray-500 text-sm ml-2">- Choose a role or leave blank</span>
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full bg-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">No specific role</option>
                  {roles.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Participants */}
            <div className="bg-slate-800/50 rounded-xl p-6 mb-6 border border-slate-700/50">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-green-400" /> Participants ({participants.length})
              </h2>
              
              {participants.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {participants.map((participant) => (
                    <div key={participant.userId} className="bg-slate-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full" />
                      <span>{participant.userName}</span>
                      {participant.isHost && <Crown className="w-4 h-4 text-yellow-400" />}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">Waiting for participants to join...</p>
              )}

              <div className="flex items-center gap-2 text-sm text-gray-400 mt-4">
                <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-400' : 'bg-red-400'}`} />
                {socketConnected ? 'Connected' : 'Connecting...'}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => { socket?.disconnect(); router.push('/train/gd'); }}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="w-5 h-5" /> Leave Room
              </button>
            </div>
          </>
        )}

        <div className="text-center text-gray-500 text-sm mt-6">
          <p>Share the invite link to invite participants</p>
          <p>Discuss freely - no topic or role restrictions</p>
        </div>
      </div>
    </div>
  );
}
