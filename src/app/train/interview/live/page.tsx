'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import { io, Socket } from 'socket.io-client';
import Link from 'next/link';
import InterviewReport from '@/components/InterviewReport';
import type { ReportPayload } from '@/components/LiveInterviewRoom';
import {
  ArrowLeft,
  UserCheck,
  Code2,
  Briefcase,
  Loader2,
  Radio,
  Users,
} from 'lucide-react';

// Dynamically imported to avoid SSR conflicts with Agora
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// @ts-expect-error – new file, TS server needs restart to index it
const LiveInterviewRoom = dynamic(() => import('@/components/LiveInterviewRoom'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
    </div>
  ),
// eslint-disable-next-line @typescript-eslint/no-explicit-any
}) as any;

type Step = 'select-type' | 'select-role' | 'queue' | 'matched';
type InterviewType = 'PI' | 'Technical';
type Role = 'HR' | 'Candidate' | 'EngineeringManager';

interface RoomData {
  roomId: string;
  channelName: string;
  interviewType: InterviewType;
  topic: string;
  participants: { userId: string; userName: string; role: Role }[];
}

function getStableUserId(): string {
  if (typeof window === 'undefined') return `tab_${Date.now()}`;
  const stored = window.sessionStorage.getItem('interview_userId');
  if (stored) return stored;
  // Always tab-unique: prevents self-match when same user opens two tabs
  const id = `tab_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  window.sessionStorage.setItem('interview_userId', id);
  return id;
}

function getStableAgoraUid(): number {
  if (typeof window === 'undefined') return Math.floor(Math.random() * 1_000_000);
  const stored = window.sessionStorage.getItem('interview_agoraUid');
  if (stored) return parseInt(stored, 10);
  const uid = Math.floor(Math.random() * 1_000_000);
  window.sessionStorage.setItem('interview_agoraUid', uid.toString());
  return uid;
}

export default function LiveInterviewPage() {
  const { data: session } = useSession();

  const [userId] = useState(() => getStableUserId());
  const [agoraUid] = useState(() => getStableAgoraUid());
  const userName = session?.user?.name || 'Anonymous';

  const [step, setStep] = useState<Step>('select-type');
  const [interviewType, setInterviewType] = useState<InterviewType | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [queueMsg, setQueueMsg] = useState('Searching for a match…');
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [timeoutMsg, setTimeoutMsg] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [sessionReport, setSessionReport] = useState<ReportPayload | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Keep a ref of current queue params so reconnect handler can re-emit
  const queueParamsRef = useRef<{ interviewType: InterviewType; role: Role } | null>(null);

  // Connect socket once
  useEffect(() => {
    const s = io({ path: '/api/socket/io' }); // default transports (polling → ws upgrade)
    socketRef.current = s;

    s.on('interview-queue-status', (d) => setQueueMsg(d.message));
    s.on('interview-match-found', (d: RoomData) => {
      clearTimer();
      queueParamsRef.current = null;
      setRoomData(d);
      setStep('matched');
    });
    s.on('interview-queue-timeout', (d) => {
      clearTimer();
      queueParamsRef.current = null;
      setTimeoutMsg(d.message);
      setStep('select-role');
    });

    // On reconnect: if still in queue, re-emit so server picks us up again
    s.on('connect', () => {
      const params = queueParamsRef.current;
      if (params) {
        s.emit('interview-join-queue', {
          userId,
          userName,
          interviewType: params.interviewType,
          role: params.role,
        });
      }
    });

    return () => { s.disconnect(); clearTimer(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setElapsed(0);
  };

  const startQueue = useCallback(() => {
    if (!interviewType || !role || !socketRef.current) return;
    setTimeoutMsg(null);
    setQueueMsg('Searching for a match…');
    setElapsed(0);
    setStep('queue');
    queueParamsRef.current = { interviewType, role };

    socketRef.current.emit('interview-join-queue', {
      userId,
      userName,
      interviewType,
      role,
    });

    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  }, [interviewType, role, userId, userName]);

  const leaveQueue = () => {
    queueParamsRef.current = null;
    socketRef.current?.emit('interview-leave-queue');
    clearTimer();
    setStep('select-role');
  };

  const rolesForType: Record<InterviewType, { value: Role; label: string; icon: typeof UserCheck }[]> = {
    PI: [
      { value: 'HR', label: 'HR (Interviewer)', icon: Briefcase },
      { value: 'Candidate', label: 'Candidate', icon: UserCheck },
    ],
    Technical: [
      { value: 'EngineeringManager', label: 'Engineering Manager', icon: Code2 },
      { value: 'Candidate', label: 'Candidate', icon: UserCheck },
    ],
  };

  const formatElapsed = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  if (step === 'matched' && roomData) {
    const myRole = roomData.participants.find((p) => p.userId === userId)?.role || role!;
    return (
      <LiveInterviewRoom
        roomData={roomData}
        userId={userId}
        agoraUid={agoraUid}
        myRole={myRole}
        userName={userName}
        onEnd={(report) => {
          setRoomData(null);
          setStep('select-type');
          setInterviewType(null);
          setRole(null);
          if (report) setSessionReport(report);
        }}
      />
    );
  }

  // Show report AFTER LiveInterviewRoom has fully unmounted (camera/mic released)
  if (sessionReport) {
    return (
      <InterviewReport
        report={sessionReport}
        onClose={() => setSessionReport(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <Link href="/train/interview" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors">
          <ArrowLeft size={14} /> Back
        </Link>

        {/* STEP 1: Select interview type */}
        {step === 'select-type' && (
          <div>
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1.5 rounded-full text-xs font-semibold mb-4">
              <Radio size={12} /> Live Interview
            </div>
            <h1 className="text-2xl font-extrabold mb-2">Select Interview Type</h1>
            <p className="text-slate-400 text-sm mb-8">What kind of interview do you want to practice?</p>

            <div className="grid grid-cols-2 gap-4">
              {[
                { value: 'PI' as InterviewType, label: 'Personal Interview', sub: 'HR ↔ Candidate', icon: Briefcase, gradient: 'from-purple-500 to-pink-500' },
                { value: 'Technical' as InterviewType, label: 'Technical Interview', sub: 'Eng. Manager ↔ Candidate', icon: Code2, gradient: 'from-blue-500 to-cyan-500' },
              ].map(({ value, label, sub, icon: Icon, gradient }) => (
                <button
                  key={value}
                  onClick={() => { setInterviewType(value); setStep('select-role'); }}
                  className="flex flex-col items-start p-5 rounded-2xl border border-slate-700 bg-slate-800/60 hover:border-indigo-500 hover:bg-slate-700/60 transition-all text-left"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3`}>
                    <Icon size={18} className="text-white" />
                  </div>
                  <p className="font-bold text-sm">{label}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{sub}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: Select role */}
        {step === 'select-role' && interviewType && (
          <div>
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1.5 rounded-full text-xs font-semibold mb-4">
              {interviewType === 'PI' ? <Briefcase size={12} /> : <Code2 size={12} />}
              {interviewType === 'PI' ? 'Personal Interview' : 'Technical Interview'}
            </div>
            <h1 className="text-2xl font-extrabold mb-2">Select Your Role</h1>
            <p className="text-slate-400 text-sm mb-2">You will be matched with the opposite role (1:1 strict).</p>
            {timeoutMsg && (
              <div className="mb-4 text-sm bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 px-4 py-2.5 rounded-lg">
                ⚠️ {timeoutMsg}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-6">
              {rolesForType[interviewType].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setRole(value)}
                  className={`flex flex-col items-start p-5 rounded-2xl border transition-all text-left ${
                    role === value
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-slate-700 bg-slate-800/60 hover:border-slate-600'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${role === value ? 'bg-indigo-500' : 'bg-slate-700'}`}>
                    <Icon size={16} className="text-white" />
                  </div>
                  <p className="font-bold text-sm">{label}</p>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setStep('select-type'); setRole(null); }}
                className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 text-sm font-medium transition-colors"
              >
                Back
              </button>
              <button
                onClick={startQueue}
                disabled={!role}
                className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
              >
                Find Match →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Queue / waiting */}
        {step === 'queue' && (
          <div className="text-center">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 animate-ping" />
              <div className="absolute inset-2 rounded-full border-4 border-indigo-500/40 animate-ping" style={{ animationDelay: '0.3s' }} />
              <div className="w-24 h-24 rounded-full bg-indigo-500/10 border-2 border-indigo-500 flex items-center justify-center">
                <Users size={32} className="text-indigo-400" />
              </div>
            </div>

            <h2 className="text-xl font-bold mb-1">Finding your match…</h2>
            <p className="text-slate-400 text-sm mb-1">{queueMsg}</p>
            <p className="text-indigo-400 font-mono text-lg mb-2">{formatElapsed(elapsed)}</p>
            <p className="text-xs text-slate-500 mb-6">
              {interviewType} · {role === 'EngineeringManager' ? 'Eng. Manager' : role} · matching with opposite role
            </p>

            <div className="flex gap-1.5 justify-center mb-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>

            <button
              onClick={leaveQueue}
              className="px-8 py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
