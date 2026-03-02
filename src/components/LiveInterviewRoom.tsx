'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IRemoteVideoTrack,
  IRemoteAudioTrack,
  UID,
} from 'agora-rtc-sdk-ng';
// InterviewReport is rendered by the parent page after this component unmounts
import { Socket } from 'socket.io-client';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Hand,
  Timer,
  Users,
  Wifi,
  WifiOff,
  Loader2,
  ClipboardList,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = 'HR' | 'Candidate' | 'EngineeringManager' | 'Host';
type InterviewType = 'PI' | 'Technical';

interface RoomData {
  roomId: string;
  channelName: string;
  interviewType: InterviewType;
  topic: string;
  participants: { userId: string; userName: string; role: Role }[];
}

interface LiveInterviewRoomProps {
  roomData: RoomData;
  userId: string;
  agoraUid: number;
  myRole: Role;
  userName: string;
  isPrivate?: boolean;
  isHost?: boolean;
  socket?: Socket | null;
  onEnd: (report?: ReportPayload) => void;
}

interface RemoteUser {
  uid: UID;
  audioTrack: IRemoteAudioTrack | null;
  videoTrack: IRemoteVideoTrack | null;
  hasVideo: boolean;
  hasAudio: boolean;
}

export interface ReportPayload {
  scores: Record<string, number>;
  strengths: string[];
  improvements: string[];
  aiSuggestions: string;
  summary: string;
  duration: number;
  role: Role;
  interviewType: InterviewType;
}

// ─── MediaPlayer ─────────────────────────────────────────────────────────────

function getRoleBadgeClass(role: string): string {
  if (role === 'HR') return 'bg-blue-600 text-white';
  if (role === 'Candidate') return 'bg-emerald-600 text-white';
  if (role === 'EngineeringManager') return 'bg-purple-600 text-white';
  return 'bg-slate-600 text-white';
}

const MediaPlayer = ({
  videoTrack,
  audioTrack,
  uid,
  local = false,
  label,
  role,
}: {
  videoTrack: IRemoteVideoTrack | ICameraVideoTrack | null;
  audioTrack: IRemoteAudioTrack | IMicrophoneAudioTrack | null;
  uid: UID;
  local?: boolean;
  label?: string;
  role?: string;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !videoTrack) return;
    videoTrack.play(containerRef.current);
    return () => { try { videoTrack.stop(); } catch (_) { /* ignore */ } };
  }, [videoTrack]);

  useEffect(() => {
    if (audioTrack && !local) { audioTrack.play(); }
    return () => { if (audioTrack && !local) { try { audioTrack.stop(); } catch (_) { /* ignore */ } } };
  }, [audioTrack, local]);

  return (
    <div className="relative w-full h-full min-h-[160px] bg-slate-800 rounded-xl overflow-hidden">
      <div ref={containerRef} id={`player-${uid}`} className="w-full h-full" />
      {!videoTrack && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
          <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center">
            <span className="text-2xl font-bold text-indigo-300">{label?.charAt(0) ?? '?'}</span>
          </div>
        </div>
      )}
      {/* Name + Role badge */}
      {label && (
        <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
          <div className="bg-black/70 text-white text-xs px-2 py-0.5 rounded-md backdrop-blur-sm">
            {label}
          </div>
          {role && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${getRoleBadgeClass(role)}`}>
              {role === 'EngineeringManager' ? 'Eng. Manager' : role}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LiveInterviewRoom({
  roomData,
  userId,
  agoraUid,
  myRole,
  userName,
  isPrivate = false,
  isHost = false,
  socket,
  onEnd,
}: LiveInterviewRoomProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [localAudio, setLocalAudio] = useState<IMicrophoneAudioTrack | null>(null);
  const [localVideo, setLocalVideo] = useState<ICameraVideoTrack | null>(null);
  // Refs so cleanup() always has the live track even across stale closures
  const localAudioRef = useRef<IMicrophoneAudioTrack | null>(null);
  const localVideoRef = useRef<ICameraVideoTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<RemoteUser[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [handRaised, setHandRaised] = useState(false);
  const [raisedHands, setRaisedHands] = useState<Set<string>>(new Set());
  const [loadingReport, setLoadingReport] = useState(false);
  const [participants, setParticipants] = useState(roomData.participants);
  const [transcriptInput, setTranscriptInput] = useState('');

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const isJoinedRef = useRef(false);
  const isCleanedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  // ── Timer ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  // ── Socket listeners (private room) ──────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    socket.on('interview-private-participant-update', (data: { participants: typeof roomData.participants }) => {
      setParticipants(data.participants);
    });

    socket.on('interview-raise-hand', ({ userId: uid, raised }: { userId: string; raised: boolean }) => {
      setRaisedHands((prev) => {
        const next = new Set(prev);
        raised ? next.add(uid) : next.delete(uid);
        return next;
      });
    });

    socket.on('interview-transcript', ({ userId: uid, text }: { userId: string; text: string }) => {
      const name = participants.find((p) => p.userId === uid)?.userName ?? uid;
      setTranscript((t) => [...t, `${name}: ${text}`]);
    });

    socket.on('interview-session-ended', () => endSession());

    return () => {
      socket.off('interview-private-participant-update');
      socket.off('interview-raise-hand');
      socket.off('interview-transcript');
      socket.off('interview-session-ended');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, participants]);

  // ── Agora init ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isJoinedRef.current || isCleanedRef.current) return;

    const init = async () => {
      try {
        const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID;
        if (!APP_ID) throw new Error('Agora app ID not configured');

        const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        clientRef.current = client;

        client.on('user-published', async (user, mediaType) => {
          await client.subscribe(user, mediaType);
          setRemoteUsers((prev) => {
            const idx = prev.findIndex((u) => u.uid === user.uid);
            const updated: RemoteUser = {
              uid: user.uid,
              audioTrack: mediaType === 'audio' ? user.audioTrack! : (prev[idx]?.audioTrack ?? null),
              videoTrack: mediaType === 'video' ? user.videoTrack! : (prev[idx]?.videoTrack ?? null),
              hasAudio: mediaType === 'audio' ? true : (prev[idx]?.hasAudio ?? false),
              hasVideo: mediaType === 'video' ? true : (prev[idx]?.hasVideo ?? false),
            };
            if (idx >= 0) { const a = [...prev]; a[idx] = updated; return a; }
            return [...prev, updated];
          });
        });

        client.on('user-unpublished', (user, mediaType) => {
          setRemoteUsers((prev) => prev.map((u) =>
            u.uid === user.uid
              ? { ...u, audioTrack: mediaType === 'audio' ? null : u.audioTrack, videoTrack: mediaType === 'video' ? null : u.videoTrack, hasAudio: mediaType === 'audio' ? false : u.hasAudio, hasVideo: mediaType === 'video' ? false : u.hasVideo }
              : u
          ));
        });

        client.on('user-left', (user) => {
          setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
        });

        // Token from interview API
        const tokenRes = await fetch('/api/interview/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channelName: roomData.channelName,
            uid: agoraUid,
            role: 'publisher',
            userId,
          }),
        });
        if (!tokenRes.ok) throw new Error('Failed to get media token');
        const { token } = await tokenRes.json();

        await client.join(APP_ID, roomData.channelName, token, agoraUid);
        isJoinedRef.current = true;

        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
        localAudioRef.current = audioTrack;
        localVideoRef.current = videoTrack;
        setLocalAudio(audioTrack);
        setLocalVideo(videoTrack);
        await client.publish([audioTrack, videoTrack]);

        setConnected(true);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Connection failed');
        cleanup();
      }
    };

    init();
    return () => { cleanup(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cleanup = useCallback(async () => {
    if (isCleanedRef.current) return;
    isCleanedRef.current = true;
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    // Use refs — always have the live track regardless of closure staleness
    const vid = localVideoRef.current;
    const aud = localAudioRef.current;
    localVideoRef.current = null;
    localAudioRef.current = null;
    try { vid?.stop(); } catch (_) { /* ignore */ }
    try { vid?.close(); } catch (_) { /* ignore */ }
    try { aud?.stop(); } catch (_) { /* ignore */ }
    try { aud?.close(); } catch (_) { /* ignore */ }
    setLocalVideo(null);
    setLocalAudio(null);
    if (clientRef.current) {
      await clientRef.current.leave().catch(() => {});
      clientRef.current = null;
    }
    isJoinedRef.current = false;

    // ── Nuclear: stop every MediaStreamTrack the browser has open ──────────
    // This guarantees camera LED goes off even if Agora cleanup partially fails
    try {
      document.querySelectorAll('video, audio').forEach((el) => {
        const stream = (el as HTMLMediaElement).srcObject as MediaStream | null;
        if (stream) {
          stream.getTracks().forEach((t) => t.stop());
          (el as HTMLMediaElement).srcObject = null;
        }
      });
    } catch (_) { /* ignore */ }
  }, []); // no deps — reads from refs, never stale

  // ── Controls ──────────────────────────────────────────────────────────────
  const toggleMute = async () => {
    if (!localAudio) return;
    await localAudio.setEnabled(isMuted);
    setIsMuted(!isMuted);
  };

  const toggleVideo = async () => {
    if (!localVideo) return;
    await localVideo.setEnabled(isVideoOff);
    setIsVideoOff(!isVideoOff);
  };

  const toggleHand = () => {
    const next = !handRaised;
    setHandRaised(next);
    socket?.emit('interview-raise-hand', { roomId: roomData.roomId, userId, raised: next });
  };

  const sendTranscript = () => {
    if (!transcriptInput.trim()) return;
    const text = transcriptInput.trim();
    setTranscript((t) => [...t, `${userName} (me): ${text}`]);
    if (isPrivate) {
      socket?.emit('interview-transcript', { roomId: roomData.roomId, userId, text });
    } else {
      socket?.emit('interview-live-transcript', { roomId: roomData.roomId, userId, text });
    }
    setTranscriptInput('');
    setTimeout(() => { transcriptRef.current?.scrollTo(0, transcriptRef.current.scrollHeight); }, 50);
  };

  const endSession = useCallback(async () => {
    if (loadingReport) return;
    setLoadingReport(true);
    if (timerRef.current) clearInterval(timerRef.current);

    // Emit end to socket
    if (isPrivate) {
      socket?.emit('interview-private-control', { roomId: roomData.roomId, action: 'end' });
    } else {
      socket?.emit('interview-end', { roomId: roomData.roomId });
    }

    try {
      const res = await fetch('/api/interview/session-end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewType: roomData.interviewType,
          role: myRole,
          duration: elapsed,
          transcript: transcript.join('\n'),
          topic: roomData.topic,
        }),
      });
      const data = await res.json();
      if (res.ok && data.report) {
        const raw = data.report as Record<string, unknown>;
        const META_KEYS = new Set(['strengths', 'improvements', 'aiSuggestions', 'summary']);
        const scores: Record<string, number> = {};
        for (const [k, v] of Object.entries(raw)) {
          if (!META_KEYS.has(k) && typeof v === 'number') {
            scores[k] = v > 10 ? Math.round((v / 10) * 10) / 10 : v;
          }
        }
        const suggestions = raw.aiSuggestions;
        const reportPayload: ReportPayload = {
          scores,
          strengths: (raw.strengths as string[]) ?? [],
          improvements: (raw.improvements as string[]) ?? [],
          aiSuggestions: Array.isArray(suggestions)
            ? (suggestions as string[]).join('\n')
            : (suggestions as string) ?? '',
          summary: (raw.summary as string) ?? '',
          duration: elapsed,
          role: myRole,
          interviewType: roomData.interviewType,
        };
        // cleanup first — fully release camera/mic BEFORE unmounting
        await cleanup();
        onEnd(reportPayload);
        return;
      }
    } catch (_) {
      // Silently fail
    } finally {
      setLoadingReport(false);
    }
    await cleanup();
    onEnd();
  }, [loadingReport, isPrivate, socket, roomData, elapsed, transcript, myRole, cleanup, onEnd]);

  // ── Show report — REMOVED: report now lifted to parent so this component
  // fully unmounts (camera/mic released) before report renders.

  if (loadingReport) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-4 text-white">
        <Loader2 className="w-12 h-12 text-indigo-400 animate-spin" />
        <p className="text-lg font-semibold">Generating your AI report…</p>
        <p className="text-slate-400 text-sm">This takes a few seconds.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white gap-4 px-4 text-center">
        <p className="text-red-400 text-lg font-semibold">Connection Error</p>
        <p className="text-slate-400 text-sm max-w-sm">{error}</p>
        <button onClick={onEnd} className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-medium transition-colors">
          Back
        </button>
      </div>
    );
  }

  const allRemote = remoteUsers;
  const participantLabel = participants.find((p) => p.userId === userId)?.role ?? myRole;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-slate-600'}`} />
          <span className="text-sm font-semibold text-slate-200">{roomData.topic}</span>
          <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">{roomData.interviewType}</span>
          <span className="text-xs text-slate-500">{myRole}</span>
        </div>

        <div className="flex items-center gap-3">
          {isPrivate && (
            <div className="flex items-center gap-1 text-slate-400 text-xs">
              <Users size={12} />
              <span>{participants.length}</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-slate-300 text-sm font-mono">
            <Timer size={13} className="text-indigo-400" />
            {formatTime(elapsed)}
          </div>
          <div className="flex items-center gap-1 text-slate-500 text-xs">
            {connected ? <Wifi size={12} className="text-green-400" /> : <WifiOff size={12} />}
          </div>
        </div>
      </div>

      {/* ── Main area ─────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video grid */}
        <div className="flex-1 p-4 grid gap-3 auto-rows-fr"
          style={{ gridTemplateColumns: allRemote.length > 1 ? 'repeat(auto-fit, minmax(240px, 1fr))' : '1fr 1fr' }}>
          {/* Local */}
          <div className="relative">
            {raisedHands.has(userId) && (
              <div className="absolute top-2 right-2 z-10 bg-yellow-500 text-black text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                <Hand size={10} /> You
              </div>
            )}
            <MediaPlayer
              videoTrack={localVideo}
              audioTrack={localAudio}
              uid={agoraUid}
              local
              label={`${userName} (You)`}
              role={myRole}
            />
          </div>

          {/* Remote users */}
          {allRemote.map((u) => {
            // Match by userId — find the participant who is NOT the local user
            const remoteParticipant = participants.find(p => p.userId !== userId);
            const remoteLabel = remoteParticipant ? remoteParticipant.userName : `Participant ${u.uid}`;
            const remoteRole = remoteParticipant?.role;
            const uid_str = String(u.uid);
            return (
              <div key={String(u.uid)} className="relative">
                {raisedHands.has(uid_str) && (
                  <div className="absolute top-2 right-2 z-10 bg-yellow-500 text-black text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                    <Hand size={10} /> Hand Raised
                  </div>
                )}
                <MediaPlayer
                  videoTrack={u.videoTrack}
                  audioTrack={u.audioTrack}
                  uid={u.uid}
                  label={remoteLabel}
                  role={remoteRole}
                />
              </div>
            );
          })}

          {/* Placeholder when no remote */}
          {allRemote.length === 0 && (
            <div className="flex flex-col items-center justify-center bg-slate-800/60 rounded-xl border border-slate-700 border-dashed gap-3 min-h-[160px]">
              <Loader2 size={24} className="text-slate-600 animate-spin" />
              <p className="text-slate-500 text-sm">Waiting for the other participant…</p>
            </div>
          )}
        </div>

        {/* Transcript sidebar */}
        <div className="w-72 flex flex-col bg-slate-900 border-l border-slate-800 shrink-0">
          <div className="px-3 py-2 border-b border-slate-800 flex items-center gap-2">
            <ClipboardList size={13} className="text-slate-400" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Transcript</span>
          </div>
          <div ref={transcriptRef} className="flex-1 overflow-y-auto p-3 space-y-2">
            {transcript.length === 0 && (
              <p className="text-slate-600 text-xs text-center mt-6">No messages yet.<br />Type below to add notes or relay speech.</p>
            )}
            {transcript.map((line, i) => (
              <div key={i} className="text-xs text-slate-300 bg-slate-800/60 px-2.5 py-1.5 rounded-lg">
                {line}
              </div>
            ))}
          </div>
          <div className="p-2 border-t border-slate-800 flex gap-1.5">
            <input
              type="text"
              value={transcriptInput}
              onChange={(e) => setTranscriptInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendTranscript()}
              placeholder="Type & Enter…"
              className="flex-1 bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2.5 py-1.5 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={sendTranscript}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-medium transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* ── Controls ──────────────────────────────────────────────────────── */}
      <div className="bg-slate-900 border-t border-slate-800 px-6 py-3 flex items-center justify-center gap-3">
        <button
          onClick={toggleMute}
          title={isMuted ? 'Unmute' : 'Mute'}
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${isMuted ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
        >
          {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
        </button>

        <button
          onClick={toggleVideo}
          title={isVideoOff ? 'Camera On' : 'Camera Off'}
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${isVideoOff ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
        >
          {isVideoOff ? <VideoOff size={18} /> : <Video size={18} />}
        </button>

        {isPrivate && (
          <button
            onClick={toggleHand}
            title={handRaised ? 'Lower Hand' : 'Raise Hand'}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${handRaised ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
          >
            <Hand size={18} />
          </button>
        )}

        <div className="w-px h-8 bg-slate-700 mx-1" />

        <button
          onClick={endSession}
          disabled={loadingReport}
          title="End Session"
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold text-sm transition-colors"
        >
          <PhoneOff size={16} />
          End Session
        </button>

        <span className="ml-2 text-xs text-slate-600">
          {participantLabel}
        </span>
      </div>
    </div>
  );
}
