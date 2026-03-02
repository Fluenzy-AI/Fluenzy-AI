'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft, Users, Briefcase, Code2, Loader2, UserCheck } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

// Dynamically imported to avoid SSR conflicts with Agora
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LiveInterviewRoom = dynamic(() => import('@/components/LiveInterviewRoom'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
    </div>
  ),
// eslint-disable-next-line @typescript-eslint/no-explicit-any
}) as any;

type InterviewType = 'PI' | 'Technical';
type Role = 'HR' | 'Candidate' | 'EngineeringManager' | 'Host';

function getStableUserId(sessionId?: string): string {
  if (typeof window === 'undefined') return sessionId ?? `guest_${Date.now()}`;
  const stored = sessionStorage.getItem('interview_userId');
  if (stored) return stored;
  const id = sessionId ?? `guest_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  sessionStorage.setItem('interview_userId', id);
  return id;
}

function getStableAgoraUid(): number {
  if (typeof window === 'undefined') return Math.floor(Math.random() * 1_000_000);
  const stored = sessionStorage.getItem('interview_agoraUid');
  if (stored) return parseInt(stored, 10);
  const uid = Math.floor(Math.random() * 1_000_000);
  sessionStorage.setItem('interview_agoraUid', uid.toString());
  return uid;
}

export default function PrivateInterviewRoomPage() {
  const { data: session } = useSession();
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.roomId as string;
  const inviteToken = searchParams.get('t') ?? '';

  const [userId] = useState(() => getStableUserId(session?.user?.id));
  const [agoraUid] = useState(() => getStableAgoraUid());
  const userName = session?.user?.name ?? 'Anonymous';

  const [step, setStep] = useState<'validating' | 'select-role' | 'joined' | 'removed' | 'error'>('validating');
  const [interviewType, setInterviewType] = useState<InterviewType>('PI');
  const [topic, setTopic] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('Candidate');
  const [isHost, setIsHost] = useState(false);
  const [error, setError] = useState('');

  const socketRef = useRef<Socket | null>(null);

  // Validate invite token / room info
  useEffect(() => {
    async function validate() {
      try {
        const url = inviteToken
          ? `/api/interview/private-room?token=${encodeURIComponent(inviteToken)}`
          : `/api/interview/private-room?roomId=${roomId}`;
        const res = await fetch(url);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Invalid room');
        setInterviewType(data.interviewType ?? 'PI');
        setTopic(data.topic ?? '');
        setStep('select-role');
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to validate room');
        setStep('error');
      }
    }
    validate();
  }, [roomId, inviteToken]);

  const rolesForType: Record<InterviewType, Role[]> = {
    PI: ['HR', 'Candidate'],
    Technical: ['EngineeringManager', 'Candidate'],
  };

  const roleLabel: Record<Role, string> = {
    HR: 'HR (Interviewer)',
    Candidate: 'Candidate',
    EngineeringManager: 'Engineering Manager',
    Host: 'Host / Observer',
  };

  const handleJoin = () => {
    const s = io({ path: '/api/socket/io', transports: ['websocket'] });
    socketRef.current = s;

    s.on('connect', () => {
      s.emit('interview-private-join', {
        roomId,
        userId,
        userName,
        role: selectedRole,
        inviteToken,
      });
    });

    s.on('interview-private-participant-update', () => {/* handled inside LiveInterviewRoom */});
    s.on('interview-private-removed', () => setStep('removed'));

    setIsHost(false);
    setStep('joined');
  };

  const roomData = {
    roomId,
    channelName: `private_interview_${roomId}`,
    interviewType,
    topic: topic || `${interviewType} Interview`,
    participants: [],
  };

  if (step === 'validating') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center px-4">
        <p className="text-red-400 text-lg font-semibold mb-2">Room Error</p>
        <p className="text-slate-400 text-sm mb-6">{error}</p>
        <Link href="/train/interview" className="text-indigo-400 hover:text-indigo-300 text-sm">← Back to Interview</Link>
      </div>
    );
  }

  if (step === 'removed') {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center px-4">
        <p className="text-yellow-400 text-lg font-semibold mb-2">Removed from Room</p>
        <p className="text-slate-400 text-sm mb-6">The host removed you from this interview session.</p>
        <Link href="/train/interview" className="text-indigo-400 hover:text-indigo-300 text-sm">← Back to Interview</Link>
      </div>
    );
  }

  if (step === 'joined') {
    return (
      <LiveInterviewRoom
        roomData={roomData}
        userId={userId}
        agoraUid={agoraUid}
        myRole={selectedRole}
        userName={userName}
        isPrivate
        isHost={isHost}
        socket={socketRef.current}
        onEnd={() => { socketRef.current?.disconnect(); window.location.href = '/train/interview'; }}
      />
    );
  }

  // select-role step
  const availableRoles: Role[] = [...rolesForType[interviewType], 'Host'];

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/train/interview" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors">
          <ArrowLeft size={14} /> Back
        </Link>

        <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-full text-xs font-semibold mb-4">
          <Users size={12} /> Private Room · {roomId.slice(0, 8)}…
        </div>

        <h1 className="text-2xl font-extrabold mb-1">Joining Private Interview</h1>
        <div className="flex items-center gap-2 mb-6">
          {interviewType === 'PI' ? <Briefcase size={14} className="text-purple-400" /> : <Code2 size={14} className="text-blue-400" />}
          <p className="text-slate-400 text-sm">{interviewType === 'PI' ? 'Personal Interview' : 'Technical Interview'}{topic ? ` · ${topic}` : ''}</p>
        </div>

        <p className="text-sm font-semibold text-slate-300 mb-3">Choose your role</p>
        <div className="flex flex-col gap-2.5 mb-6">
          {availableRoles.map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRole(r)}
              className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
                selectedRole === r
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-slate-700 bg-slate-800/60 hover:border-slate-600'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedRole === r ? 'bg-indigo-500' : 'bg-slate-700'}`}>
                <UserCheck size={14} className="text-white" />
              </div>
              <p className="font-medium text-sm">{roleLabel[r]}</p>
            </button>
          ))}
        </div>

        <button
          onClick={handleJoin}
          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
        >
          Join as {roleLabel[selectedRole]} →
        </button>
      </div>
    </div>
  );
}
