'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Heart, Radio, Sparkles, History, ArrowLeft,
  Wifi, WifiOff, Users, MessageCircleHeart, Zap,
  ShieldCheck, ChevronRight,
} from 'lucide-react';
import GDMatchingUI from '@/components/GDMatchingUI';
import GDHistory from '@/components/GDHistory';
import { useTheme, themeConfig } from '@/contexts/ThemeContext';

// Dynamic import for LiveGDRoom to avoid SSR issues with Agora
const LiveGDRoom = dynamic(() => import('@/components/LiveGDRoom'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#0D0F1A] flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#FF3B81]" />
    </div>
  ),
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
  if (typeof window === 'undefined') {
    return sessionUserId || `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  const stored = window.sessionStorage.getItem('gd_userId');
  if (stored) return stored;
  const localStored = window.localStorage.getItem('gd_userId');
  if (localStored) {
    window.sessionStorage.setItem('gd_userId', localStored);
    return localStored;
  }
  const newId = sessionUserId || `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  window.sessionStorage.setItem('gd_userId', newId);
  window.localStorage.setItem('gd_userId', newId);
  return newId;
}

/* ── Animated pulsing heart SVG ── */
function PulsingHeart({ size = 56 }: { size?: number }) {
  return (
    <motion.div
      animate={{ scale: [1, 1.12, 1] }}
      transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
      style={{ display: 'inline-flex', filter: 'drop-shadow(0 0 16px rgba(255,59,129,0.7))' }}
    >
      <Heart size={size} fill="#FF334F" stroke="#FF334F" />
    </motion.div>
  );
}

/* ── ECG / heartbeat SVG line ── */
function HeartbeatLine({ color = '#FF3B81' }: { color?: string }) {
  return (
    <svg viewBox="0 0 280 40" className="w-full h-10" aria-hidden="true">
      <motion.path
        d="M0 20H40L50 20L60 20L70 8L80 34L90 20H120L132 20L144 20L156 8L168 34L178 20H210L220 20L230 20L240 8L252 34L262 20H280"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 2, ease: 'easeInOut', repeat: Infinity, repeatDelay: 0.5 }}
      />
    </svg>
  );
}

/* ── Feature info card ── */
function FeatureCard({
  icon: Icon,
  title,
  desc,
  accentColor,
  cardBg,
  borderHex,
  textHex,
  mutedHex,
}: {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  title: string;
  desc: string;
  accentColor: string;
  cardBg: string;
  borderHex: string;
  textHex: string;
  mutedHex: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className="rounded-2xl p-5 flex flex-col gap-3"
      style={{
        background: cardBg,
        border: `1px solid ${borderHex}`,
        boxShadow: `0 4px 24px rgba(255,59,129,0.08)`,
      }}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center"
        style={{ background: `${accentColor}18`, border: `1px solid ${accentColor}30` }}
      >
        <Icon size={22} style={{ color: accentColor }} />
      </div>
      <div>
        <p className="font-bold text-sm mb-1" style={{ color: textHex }}>{title}</p>
        <p className="text-xs leading-relaxed" style={{ color: mutedHex }}>{desc}</p>
      </div>
    </motion.div>
  );
}

/* =============================================================================
   DesktopLiveRedHeartPage — Desktop (> 640px)
   HeartSync: 1-on-1 random video connection with romantic branding
============================================================================= */
export default function DesktopLiveRedHeartPage() {
  const { data: session, status: authStatus } = useSession();
  const { resolvedTheme } = useTheme();

  const isLightMode = resolvedTheme === 'parchment' || resolvedTheme === 'light';

  // ── Theme tokens ──────────────────────────────────────────────────────
  const ACCENT: Record<string, string> = {
    light: '#E11D48', parchment: '#E11D48',
    dark: '#FF3B81', midnight: '#FF3B81',
    forest: '#FF3B81', codeterm: '#FF3B81',
  };
  const CARD_BG: Record<string, string> = {
    light: '#FFFFFF', parchment: '#FFFFFF',
    dark: '#161B2E', midnight: 'rgba(15,39,68,0.92)',
    forest: 'rgba(17,28,20,0.92)', codeterm: '#141414',
  };
  const PAGE_BG: Record<string, string> = {
    light: '#FFF5F8', parchment: 'hsl(42 18% 93%)',
    dark: '#0D0F1A', midnight: '#0a1929',
    forest: '#0b140e', codeterm: '#0D0D0D',
  };
  const BORDER_HEX: Record<string, string> = {
    light: '#FCE7EF', parchment: '#FCCDD9',
    dark: 'rgba(255,59,129,0.15)', midnight: 'rgba(255,59,129,0.12)',
    forest: 'rgba(255,59,129,0.18)', codeterm: 'rgba(255,59,129,0.22)',
  };
  const TEXT_HEX: Record<string, string> = {
    light: '#0F0B2E', parchment: '#212529',
    dark: '#F1F5F9', midnight: '#F1F5F9',
    forest: '#e8e4d9', codeterm: '#F0EDE8',
  };
  const MUTED_HEX: Record<string, string> = {
    light: '#6B7280', parchment: '#6C757D',
    dark: '#94A3B8', midnight: '#94A3B8',
    forest: '#9aad8e', codeterm: '#888580',
  };

  const t = resolvedTheme as string;
  const accentHex = ACCENT[t] ?? '#FF3B81';
  const cardBg = CARD_BG[t] ?? '#161B2E';
  const pageBg = PAGE_BG[t] ?? '#0D0F1A';
  const borderHex = BORDER_HEX[t] ?? 'rgba(255,59,129,0.15)';
  const textHex = TEXT_HEX[t] ?? '#F1F5F9';
  const mutedHex = MUTED_HEX[t] ?? '#94A3B8';

  // ── State ─────────────────────────────────────────────────────────────
  const [userId, setUserId] = useState<string>(() => getStableUserId(session?.user?.id));
  const [userName, setUserName] = useState(() => session?.user?.name || 'Guest User');
  const [agoraUid, setAgoraUid] = useState<number>(() => {
    if (typeof window === 'undefined') return Math.floor(Math.random() * 1000000);
    const stored = window.sessionStorage.getItem('gd_agoraUid');
    if (stored) return parseInt(stored, 10);
    const newUid = Math.floor(Math.random() * 1000000);
    window.sessionStorage.setItem('gd_agoraUid', newUid.toString());
    return newUid;
  });

  const [gdStatus, setGdStatus] = useState<GDStatus>('idle');
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [queueInfo, setQueueInfo] = useState<{ queueId: string; message: string } | null>(null);
  const [error, setError] = useState<React.ReactNode | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const [socket, setSocket] = useState<Socket | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);

  // Fixed participant count for 1-on-1 heart connection
  const participantCount = 2;
  const difficulty = 'Medium';
  const mode = 'Random';

  // ── Initialize storage values on client mount ─────────────────────────
  useEffect(() => {
    if (typeof sessionStorage !== 'undefined') {
      const stored = sessionStorage.getItem('gd_userId');
      if (stored && stored !== userId) setUserId(stored);
      const uidStored = sessionStorage.getItem('gd_agoraUid');
      if (uidStored) setAgoraUid(parseInt(uidStored, 10));
    }
    if (session?.user?.name) setUserName(session.user.name);
  }, [session]);

  // ── Socket connection ─────────────────────────────────────────────────
  useEffect(() => {
    const socketInstance = io({
      path: '/api/socket/io',
      addTrailingSlash: false,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
    });

    socketInstance.on('connect', () => setSocketConnected(true));
    socketInstance.on('disconnect', () => setSocketConnected(false));
    socketInstance.on('connect_error', (err) => console.error('[HeartSync] Socket error:', err));

    setSocket(socketInstance);
    return () => { socketInstance.disconnect(); };
  }, []);

  // ── Socket event handlers ─────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handleQueueStatus = (data: { status: string; position: number; message: string }) => {
      setQueueInfo({ queueId: data.position.toString(), message: data.message });
    };

    const handleMatchFound = (data: RoomData) => {
      const isParticipant = data.participants.some(p => p.odlUserId === userId);
      if (isParticipant) {
        setRoomData({ ...data, sessionId: data.sessionId || data.roomId });
        setGdStatus('matched');
        setQueueInfo(null);
      } else {
        setError('Connection error: You were not matched to this session. Please try again.');
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

  // ── Join Queue ────────────────────────────────────────────────────────
  const joinQueueSocket = useCallback(() => {
    if (!socket || !socketConnected) {
      setError('Not connected to server. Please refresh and try again.');
      return;
    }
    setGdStatus('queue');
    setError(null);
    socket.emit('join-queue', { userId, userName, participantCount, difficulty, mode });
  }, [socket, socketConnected, userId, userName, participantCount]);

  const handleJoinQueue = useCallback(async () => {
    if (!session?.user?.email) {
      setError('Please sign in to connect with someone');
      return;
    }
    if (socketConnected) { joinQueueSocket(); return; }

    setError(null);
    setGdStatus('queue');

    try {
      const response = await fetch('/api/gd/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join', userId, participantCount, difficulty, mode, force: true }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to find a connection');
        setGdStatus('idle');
        return;
      }

      if (data.matched) {
        setRoomData({
          roomId: data.sessionId,
          sessionId: data.sessionId,
          channelName: data.channelName,
          topic: data.topic,
          participants: data.participants || [],
        });
        setGdStatus('matched');
      } else {
        setQueueInfo({ queueId: data.queueId, message: data.message || 'Finding your match...' });
        setGdStatus('queue');
      }
    } catch {
      setError('Failed to connect to the matching server');
      setGdStatus('idle');
    }
  }, [session, socketConnected, joinQueueSocket, userId, participantCount]);

  const handleLeaveQueue = useCallback(async () => {
    if (socketConnected && socket) {
      socket.emit('leave-queue');
    } else {
      try {
        await fetch('/api/gd/match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'leave' }),
        });
      } catch { /* ignore */ }
    }
    setGdStatus('idle');
    setQueueInfo(null);
  }, [socketConnected, socket]);

  const handleStartNew = useCallback(() => {
    setGdStatus('idle');
    setRoomData(null);
    setQueueInfo(null);
    setError(null);
    setShowHistory(false);
  }, []);

  // ── Render states ─────────────────────────────────────────────────────
  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: pageBg }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
          <Heart size={40} fill="#FF3B81" stroke="#FF3B81" style={{ filter: 'drop-shadow(0 0 12px rgba(255,59,129,0.6))' }} />
        </motion.div>
      </div>
    );
  }

  if (authStatus === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: pageBg }}>
        <div className="text-center space-y-4">
          <PulsingHeart size={64} />
          <h1 className="text-3xl font-black" style={{ color: textHex }}>Sign In Required</h1>
          <p style={{ color: mutedHex }}>Please sign in to connect with someone on HeartSync</p>
          <Link href="/" className="inline-block px-6 py-3 rounded-full font-bold text-white"
            style={{ background: `linear-gradient(135deg, ${accentHex}, #FF6B9D)` }}>
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (gdStatus === 'matched' && roomData) {
    return <LiveGDRoom roomData={roomData} userId={userId} agoraUid={agoraUid} />;
  }

  if (gdStatus === 'queue') {
    return <GDMatchingUI queueInfo={queueInfo} onLeave={handleLeaveQueue} onRetry={handleStartNew} />;
  }

  // ── Main idle UI ──────────────────────────────────────────────────────
  const features = [
    {
      icon: Users,
      title: '1-on-1 Connection',
      desc: 'Instantly connect face-to-face with one other person for a real, personal conversation.',
    },
    {
      icon: MessageCircleHeart,
      title: 'Open Conversations',
      desc: 'Talk about anything — your day, your dreams, your ideas. No scripts, just genuine talk.',
    },
    {
      icon: ShieldCheck,
      title: 'Safe & Anonymous',
      desc: 'Your identity stays protected. Connect fearlessly in a moderated, safe environment.',
    },
    {
      icon: Zap,
      title: 'Instant Match',
      desc: 'No waiting in long queues. Our smart engine finds you a connection in seconds.',
    },
  ];

  return (
    <div className="min-h-screen" style={{ background: pageBg }}>
      {/* ── Ambient background glows ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10" aria-hidden="true">
        <div
          className="absolute -top-20 -left-20 w-[500px] h-[500px] rounded-full blur-3xl opacity-30 animate-pulse"
          style={{ background: 'radial-gradient(circle, rgba(255,59,129,0.25), transparent)', animationDuration: '6s' }}
        />
        <div
          className="absolute -bottom-20 -right-20 w-[400px] h-[400px] rounded-full blur-3xl opacity-20 animate-pulse"
          style={{ background: 'radial-gradient(circle, rgba(225,29,72,0.25), transparent)', animationDuration: '8s', animationDelay: '2s' }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full blur-3xl opacity-10"
          style={{ background: 'radial-gradient(circle, rgba(255,107,157,0.18), transparent)' }}
        />
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* ── Back navigation ── */}
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} className="mb-6">
          <Link
            href="/train"
            className="inline-flex items-center gap-2 text-sm font-semibold transition-colors hover:opacity-80"
            style={{ color: mutedHex }}
          >
            <ArrowLeft size={16} />
            Back to Training
          </Link>
        </motion.div>

        {/* ── Hero header ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="flex justify-center mb-4">
            <PulsingHeart size={64} />
          </div>

          {/* Live badge */}
          <div className="flex justify-center mb-3">
            <motion.div
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.8, repeat: Infinity }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-extrabold text-xs uppercase tracking-widest"
              style={{
                background: `${accentHex}18`,
                border: `1.5px solid ${accentHex}50`,
                color: accentHex,
              }}
            >
              <Radio size={12} />
              LIVE 1-on-1
            </motion.div>
          </div>

          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3" style={{ color: textHex }}>
            Heart<span style={{ color: accentHex }}>Sync</span>
          </h1>
          <p className="text-base md:text-lg max-w-lg mx-auto leading-relaxed" style={{ color: mutedHex }}>
            Connect randomly and share your thoughts face-to-face. One conversation can change everything.
          </p>

          {/* Heartbeat line */}
          <div className="mt-6 max-w-sm mx-auto">
            <HeartbeatLine color={accentHex} />
          </div>
        </motion.div>

        {/* ── Main CTA card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="relative overflow-hidden rounded-3xl p-8 mb-8 text-center"
          style={{
            background: cardBg,
            border: `1.5px solid ${accentHex}35`,
            boxShadow: `0 8px 40px ${accentHex}18`,
          }}
        >
          {/* Decorative corner glow */}
          <div
            className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl pointer-events-none"
            style={{ background: `${accentHex}25` }}
          />
          <div
            className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full blur-3xl pointer-events-none"
            style={{ background: `${accentHex}15` }}
          />

          <div className="relative z-10">
            {/* Socket status */}
            <div className="flex justify-center mb-6">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
                style={{
                  background: socketConnected ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                  border: `1px solid ${socketConnected ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                  color: socketConnected ? '#10B981' : '#EF4444',
                }}
              >
                {socketConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
                {socketConnected ? 'Ready to Connect' : 'Connecting to server...'}
              </motion.div>
            </div>

            {/* HeartSync setup label */}
            <h2 className="text-xl font-bold mb-2" style={{ color: textHex }}>
              HeartSync Setup
            </h2>
            <p className="text-sm mb-6" style={{ color: mutedHex }}>
              Find Someone to Talk To — 1-on-1 Video Chat
            </p>

            {/* Error display */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mb-5 px-4 py-3 rounded-xl text-sm font-medium"
                  style={{
                    background: 'rgba(239,68,68,0.10)',
                    border: '1px solid rgba(239,68,68,0.25)',
                    color: '#EF4444',
                  }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Connection info */}
            <div
              className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl mb-8"
              style={{
                background: `${accentHex}10`,
                border: `1px solid ${accentHex}25`,
              }}
            >
              <Heart size={18} fill={accentHex} stroke={accentHex} />
              <span className="font-bold text-sm" style={{ color: textHex }}>
                Connection: 1-on-1 Video Chat
              </span>
              <Heart size={18} fill={accentHex} stroke={accentHex} />
            </div>

            {/* Join button */}
            <div className="flex justify-center">
              <motion.button
                id="heartsync-connect-btn"
                whileHover={{ scale: socketConnected ? 1.04 : 1, y: socketConnected ? -2 : 0 }}
                whileTap={{ scale: socketConnected ? 0.97 : 1 }}
                onClick={handleJoinQueue}
                disabled={!socketConnected}
                className="flex items-center gap-3 font-black text-white rounded-2xl transition-all duration-300"
                style={{
                  background: socketConnected
                    ? `linear-gradient(135deg, ${accentHex} 0%, #FF6B9D 100%)`
                    : 'rgba(255,255,255,0.12)',
                  boxShadow: socketConnected ? `0 8px 30px ${accentHex}50` : 'none',
                  padding: '16px 40px',
                  fontSize: '16px',
                  cursor: socketConnected ? 'pointer' : 'not-allowed',
                  opacity: socketConnected ? 1 : 0.5,
                  border: `1.5px solid ${socketConnected ? `${accentHex}60` : 'rgba(255,255,255,0.12)'}`,
                  color: '#FFFFFF',
                }}
              >
                <Heart size={20} fill="#FFFFFF" stroke="#FFFFFF" />
                {socketConnected ? 'Find Someone to Talk To' : 'Connecting...'}
                <ChevronRight size={20} style={{ color: '#FFFFFF' }} />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* ── Feature info cards ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {features.map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.07 }}
            >
              <FeatureCard
                icon={feat.icon}
                title={feat.title}
                desc={feat.desc}
                accentColor={accentHex}
                cardBg={cardBg}
                borderHex={borderHex}
                textHex={textHex}
                mutedHex={mutedHex}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* ── Stats / trust strip ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl p-5 flex flex-wrap items-center justify-center gap-8 mb-8"
          style={{
            background: cardBg,
            border: `1px solid ${borderHex}`,
          }}
        >
          {[
            { value: '10K+', label: 'Connections Made' },
            { value: '< 10s', label: 'Avg Match Time' },
            { value: '4.9\u2605', label: 'User Rating' },
            { value: '100%', label: 'Safe & Secure' },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-black" style={{ color: accentHex }}>{stat.value}</p>
              <p className="text-xs font-semibold mt-0.5" style={{ color: mutedHex }}>{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* ── History link ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <button
            id="heartsync-history-btn"
            onClick={() => setShowHistory(true)}
            className="inline-flex items-center gap-2 font-semibold transition-colors hover:opacity-80"
            style={{ color: accentHex, fontSize: '14px' }}
          >
            <History size={15} />
            View Past Connections
            <Sparkles size={13} />
          </button>
        </motion.div>
      </div>

      {/* ── History modal ── */}
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
