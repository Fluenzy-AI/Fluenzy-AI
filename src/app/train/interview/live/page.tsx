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
        onClose={() => { window.location.href = '/train'; }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* ── Hero gradient background ─────────────────────────────────────── */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(99,102,241,0.12),transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_80%,rgba(139,92,246,0.08),transparent_60%)] pointer-events-none" />

      <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-10">
        {/* ── Step indicator ──────────────────────────────────────────────── */}
        <div className="w-full max-w-xl mb-8">
          <div className="flex items-center gap-0 justify-center">
            {(['Type', 'Role', 'Match'] as const).map((label, idx) => {
              const stepIdx = step === 'select-type' ? 0 : step === 'select-role' ? 1 : 2;
              const done = idx < stepIdx;
              const active = idx === stepIdx;
              return (
                <React.Fragment key={label}>
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      done ? 'bg-indigo-500 text-white' : active ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/20' : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}>
                      {done ? '✓' : idx + 1}
                    </div>
                    <span className={`text-[10px] font-medium ${active ? 'text-indigo-400' : done ? 'text-slate-400' : 'text-slate-600'}`}>{label}</span>
                  </div>
                  {idx < 2 && (
                    <div className={`w-16 sm:w-24 h-px mb-5 mx-1 transition-all ${idx < stepIdx ? 'bg-indigo-500' : 'bg-slate-700'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="w-full max-w-xl">
          <Link href="/train/interview" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-300 text-xs mb-6 transition-colors">
            <ArrowLeft size={13} /> Back
          </Link>

          {/* ── STEP 1: Select interview type ─────────────────────────────── */}
          {step === 'select-type' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full text-xs font-semibold mb-5">
                <Radio size={11} /> Live Interview
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 tracking-tight">Select Interview Type</h1>
              <p className="text-slate-400 text-sm mb-8">Practice with a real person matched instantly.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    value: 'PI' as InterviewType,
                    label: 'Personal Interview',
                    sub: 'HR ↔ Candidate',
                    desc: 'Behavioral, situational & cultural fit questions',
                    icon: Briefcase,
                    gradient: 'from-purple-500 to-pink-500',
                    ring: 'hover:border-purple-500/60 hover:shadow-purple-500/10',
                  },
                  {
                    value: 'Technical' as InterviewType,
                    label: 'Technical Interview',
                    sub: 'Eng. Manager ↔ Candidate',
                    desc: 'DSA, system design & coding concepts',
                    icon: Code2,
                    gradient: 'from-blue-500 to-cyan-400',
                    ring: 'hover:border-blue-500/60 hover:shadow-blue-500/10',
                  },
                ].map(({ value, label, sub, desc, icon: Icon, gradient, ring }) => (
                  <button
                    key={value}
                    onClick={() => { setInterviewType(value); setStep('select-role'); }}
                    className={`group relative flex flex-col items-start p-6 rounded-2xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800/80 transition-all duration-200 text-left shadow-lg hover:shadow-xl ${ring}`}
                  >
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 shadow-lg`}>
                      <Icon size={22} className="text-white" />
                    </div>
                    <p className="font-bold text-base mb-0.5">{label}</p>
                    <p className="text-xs text-slate-500 mb-2">{sub}</p>
                    <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
                    <div className="mt-4 flex items-center gap-1 text-xs text-indigo-400 font-medium group-hover:gap-2 transition-all">
                      Start <ArrowLeft size={11} className="rotate-180" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 2: Select role ───────────────────────────────────────── */}
          {step === 'select-role' && interviewType && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full text-xs font-semibold mb-5">
                {interviewType === 'PI' ? <Briefcase size={11} /> : <Code2 size={11} />}
                {interviewType === 'PI' ? 'Personal Interview' : 'Technical Interview'}
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 tracking-tight">Choose Your Role</h1>
              <p className="text-slate-400 text-sm mb-6">You'll be matched 1:1 with the opposite role.</p>

              {timeoutMsg && (
                <div className="mb-5 flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 px-4 py-3 rounded-xl text-sm">
                  <span className="text-lg leading-none">⚠️</span>
                  <span>{timeoutMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {rolesForType[interviewType].map(({ value, label, icon: Icon }) => {
                  const selected = role === value;
                  const colors: Record<string, string> = {
                    HR: 'from-blue-500 to-indigo-500',
                    Candidate: 'from-emerald-500 to-teal-500',
                    EngineeringManager: 'from-purple-500 to-violet-500',
                  };
                  const roleDesc: Record<string, string> = {
                    HR: 'Ask questions, evaluate the candidate',
                    Candidate: 'Answer questions, showcase your skills',
                    EngineeringManager: 'Conduct technical assessment',
                  };
                  return (
                    <button
                      key={value}
                      onClick={() => setRole(value)}
                      className={`relative flex flex-col items-start p-6 rounded-2xl border transition-all duration-200 text-left ${
                        selected
                          ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10'
                          : 'border-slate-800 bg-slate-900/80 hover:border-slate-700 hover:bg-slate-800/60'
                      }`}
                    >
                      {selected && (
                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
                          <span className="text-white text-[10px] font-bold">✓</span>
                        </div>
                      )}
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${colors[value] ?? 'from-slate-500 to-slate-600'} flex items-center justify-center mb-4 shadow-md`}>
                        <Icon size={20} className="text-white" />
                      </div>
                      <p className="font-bold text-sm mb-1">{label}</p>
                      <p className="text-xs text-slate-500 leading-relaxed">{roleDesc[value]}</p>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setStep('select-type'); setRole(null); }}
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 text-sm font-medium transition-colors"
                >
                  <ArrowLeft size={14} /> Back
                </button>
                <button
                  onClick={startQueue}
                  disabled={!role}
                  className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold text-sm transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 flex items-center justify-center gap-2"
                >
                  Find Match <Radio size={14} />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Queue / waiting ──────────────────────────────────── */}
          {step === 'queue' && (
            <div className="text-center animate-in fade-in zoom-in-95 duration-300">
              {/* Animated radar */}
              <div className="relative w-32 h-32 mx-auto mb-8">
                <div className="absolute inset-0 rounded-full border-2 border-indigo-500/10 animate-ping" style={{ animationDuration: '2s' }} />
                <div className="absolute inset-3 rounded-full border-2 border-indigo-500/20 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.4s' }} />
                <div className="absolute inset-6 rounded-full border-2 border-indigo-500/30 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.8s' }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-indigo-500/10 border border-indigo-500/40 flex items-center justify-center">
                    <Users size={28} className="text-indigo-400" />
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-extrabold mb-2">Finding your match…</h2>
              <p className="text-slate-400 text-sm mb-4">{queueMsg}</p>

              {/* Timer pill */}
              <div className="inline-flex items-center gap-2 bg-slate-800 border border-slate-700 px-5 py-2 rounded-full mb-5">
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                <span className="text-indigo-300 font-mono text-xl font-bold">{formatElapsed(elapsed)}</span>
              </div>

              {/* Info tags */}
              <div className="flex items-center justify-center gap-2 flex-wrap mb-8">
                <span className="text-xs bg-slate-800 border border-slate-700 text-slate-400 px-3 py-1 rounded-full">
                  {interviewType === 'PI' ? 'Personal Interview' : 'Technical Interview'}
                </span>
                <span className="text-xs bg-slate-800 border border-slate-700 text-slate-400 px-3 py-1 rounded-full">
                  {role === 'EngineeringManager' ? 'Eng. Manager' : role}
                </span>
                <span className="text-xs bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full">
                  1:1 matched
                </span>
              </div>

              <button
                onClick={leaveQueue}
                className="px-8 py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 text-sm font-medium transition-all"
              >
                Cancel Search
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
