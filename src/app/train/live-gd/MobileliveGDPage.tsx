'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, Bell, Search, Link2, Target, Home, BarChart3, User,
  Sparkles, Sun, Moon, Leaf, Coffee, Terminal, X, LogOut,
} from 'lucide-react';
import { useTheme, ThemeName } from '@/contexts/ThemeContext';
import GDHistory from '@/components/GDHistory';

// Dynamic import for LiveGDRoom to avoid SSR issues with Agora
const LiveGDRoom = dynamic(() => import('@/components/LiveGDRoom'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#0D0F1A] flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#7C3AED]"></div>
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

/* ─── Theme option list — identical to MobileTrainPage ───────────────────── */
const THEME_OPTIONS: { value: ThemeName; label: string; icon: typeof Moon }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'midnight', label: 'Night', icon: Sparkles },
  { value: 'forest', label: 'Forest', icon: Leaf },
  { value: 'parchment', label: 'Parchment', icon: Coffee },
  { value: 'codeterm', label: 'Code', icon: Terminal },
];

const TABS = [
  { label: 'Quick Links', icon: Link2, href: '/train' },
  { label: 'Practice', icon: Target, href: '/train/hr' },
  { label: 'Home', icon: Home, href: '/train' },
  { label: 'Analytics', icon: BarChart3, href: '/analytics' },
  { label: 'Profile', icon: User, href: '/profile' },
];

export interface MobileliveGDPageProps {
  fixedParticipantCount?: number;
  labelTitle?: string;
  labelSubtitle?: string;
  labelSectionSetup?: string;
  labelConfigure?: string;
  labelParticipants?: string;
  labelParticipantFixed?: string;
  redirectOnEnd?: string;
}

export default function LiveGDPage({
  fixedParticipantCount,
  labelTitle,
  labelSubtitle,
  labelSectionSetup,
  labelConfigure,
  labelParticipants,
  labelParticipantFixed,
  redirectOnEnd,
}: MobileliveGDPageProps = {}) {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();

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
  const [participantCount, setParticipantCount] = useState(fixedParticipantCount ?? 4);
  const difficulty = 'Medium';
  const mode = 'Random';

  // UI-only state (nav chrome) — does not affect matchmaking logic
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);

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
  }, [socket, socketConnected, userId, userName, participantCount]);

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
  }, [session, socketConnected, joinQueueSocket, userId, participantCount, isClearing]);

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

  /* ── Theme tokens — matching MobileTrainPage exactly ─────────────────── */
  const isLight = resolvedTheme === 'light' || resolvedTheme === 'parchment';
  const t = resolvedTheme as string;

  const ACCENT: Record<string, string> = {
    light: '#6D3FE8', parchment: '#6D3FE8', dark: '#7C3AED',
    midnight: '#7C3AED', forest: '#F59E0B', codeterm: '#CC4125',
  };
  const CARD_BG: Record<string, string> = {
    light: '#F8FAFC', parchment: '#FFFFFF', dark: '#161B2E',
    midnight: 'rgba(15,39,68,0.9)', forest: 'rgba(17,28,20,0.9)', codeterm: '#141414',
  };
  const PAGE_BG: Record<string, string> = {
    light: '#F8F7F4', parchment: '#F3F0EB', dark: '#0D0F1A',
    midnight: '#0a1929', forest: '#0b140e', codeterm: '#0D0D0D',
  };
  const TEXT_HEX: Record<string, string> = {
    light: '#0F0B2E', parchment: '#212529', dark: '#F1F5F9',
    midnight: '#F1F5F9', forest: '#e8e4d9', codeterm: '#F0EDE8',
  };
  const MUTED_HEX: Record<string, string> = {
    light: '#6B7280', parchment: '#6C757D', dark: '#94A3B8',
    midnight: '#94A3B8', forest: '#9aad8e', codeterm: '#888580',
  };
  const BORDER_HEX: Record<string, string> = {
    light: '#E5E7EB', parchment: '#E9ECEF', dark: 'rgba(255,255,255,0.08)',
    midnight: 'rgba(255,255,255,0.08)', forest: 'rgba(180,120,30,0.2)', codeterm: 'rgba(204,65,37,0.25)',
  };

  const accentHex = ACCENT[t] ?? '#7C3AED';
  const cardBgHex = CARD_BG[t] ?? '#161B2E';
  const pageBgHex = PAGE_BG[t] ?? '#0D0F1A';
  const textHex = TEXT_HEX[t] ?? '#F1F5F9';
  const mutedHex = MUTED_HEX[t] ?? '#94A3B8';
  const borderHex = BORDER_HEX[t] ?? 'rgba(255,255,255,0.08)';

  const firstName = session?.user?.name?.split(' ')[0] || 'there';
  const avatarUrl = session?.user?.image;

  const ThemeIcon = () => {
    const iconColor = isLight ? '#1C1917' : '#F8FAFC';
    const icons: Record<ThemeName, React.ReactNode> = {
      light: <Sun size={18} style={{ color: iconColor, stroke: iconColor }} />,
      dark: <Moon size={18} style={{ color: iconColor, stroke: iconColor }} />,
      midnight: <Sparkles size={18} style={{ color: iconColor, stroke: iconColor }} />,
      forest: <Leaf size={18} style={{ color: iconColor, stroke: iconColor }} />,
      parchment: <Coffee size={18} style={{ color: iconColor, stroke: iconColor }} />,
      codeterm: <Terminal size={18} style={{ color: iconColor, stroke: iconColor }} />,
    };
    return <>{icons[theme] || <Moon size={18} style={{ color: iconColor, stroke: iconColor }} />}</>;
  };

  /* ── Shared chrome: top header + bottom nav + Ask AI FAB (MobileTrainPage) */
  const AppChrome = ({ children }: { children: React.ReactNode }) => (
    <div className="fixed inset-0 z-[200] flex flex-col sm:hidden" style={{ background: pageBgHex }}>
      {/* TOP HEADER */}
      <header
        className="flex items-center justify-between px-4 shrink-0"
        style={{
          height: '56px',
          background: isLight ? pageBgHex : cardBgHex,
          borderBottom: isLight ? 'none' : `1px solid ${borderHex}`,
          boxShadow: isLight ? 'none' : '0 1px 6px rgba(0,0,0,0.12)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl active:opacity-60 flex items-center justify-center"
            style={{ color: isLight ? '#0F172A' : '#F8FAFC', background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)' }}
            aria-label="Open menu"
          >
            <Menu size={22} style={{ color: isLight ? '#0F172A' : '#F8FAFC', stroke: isLight ? '#0F172A' : '#F8FAFC' }} />
          </button>
          <div className="flex items-center justify-center shrink-0">
            <img src="/white-removebg-preview1.png" alt="Fluenzy AI Logo" className="w-9 h-9 object-contain filter drop-shadow-sm" />
          </div>
          <span className="font-black text-lg tracking-tight" style={{ background: 'linear-gradient(90deg,#7C3AED,#4F46E5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Fluenzy AI
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="relative">
            <button
              onClick={() => setThemeMenuOpen(!themeMenuOpen)}
              className="p-2 rounded-xl active:opacity-60 flex items-center justify-center border shadow-sm transition-transform active:scale-95"
              style={{ color: isLight ? '#1C1917' : '#F8FAFC', background: isLight ? '#FFFFFF' : 'rgba(255,255,255,0.08)', borderColor: isLight ? '#CBD5E1' : borderHex }}
              aria-label="Change theme"
            >
              <ThemeIcon />
            </button>
            <AnimatePresence>
              {themeMenuOpen && (
                <>
                  <div className="fixed inset-0 z-[300]" onClick={() => setThemeMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-1 rounded-xl overflow-hidden shadow-2xl z-[310]"
                    style={{ width: '160px', background: isLight ? '#FFFFFF' : cardBgHex, border: `1px solid ${isLight ? '#CBD5E1' : borderHex}` }}
                  >
                    {THEME_OPTIONS.map((opt) => {
                      const active = theme === opt.value;
                      const itemTextColor = active ? accentHex : (isLight ? '#1C1917' : '#E2E8F0');
                      const itemIconColor = active ? accentHex : (isLight ? '#475569' : '#94A3B8');
                      return (
                        <button
                          key={opt.value}
                          onClick={() => { setTheme(opt.value); setThemeMenuOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-extrabold transition-colors"
                          style={{
                            color: itemTextColor,
                            WebkitTextFillColor: itemTextColor,
                            background: active ? (isLight ? '#F3E8FF' : `${accentHex}25`) : 'transparent',
                          }}
                        >
                          <opt.icon size={16} style={{ color: itemIconColor, stroke: itemIconColor }} />
                          <span>{opt.label}</span>
                        </button>
                      );
                    })}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <button className="relative p-2 rounded-xl active:opacity-60 flex items-center justify-center" style={{ color: isLight ? '#0F172A' : '#F8FAFC', background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)' }} aria-label="Notifications">
            <Bell size={20} style={{ color: isLight ? '#0F172A' : '#F8FAFC', stroke: isLight ? '#0F172A' : '#F8FAFC' }} />
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 text-white text-[9px] font-black rounded-full flex items-center justify-center" style={{ background: '#7C3AED' }}>3</span>
          </button>

          <button onClick={() => router.push('/profile')} className="w-9 h-9 rounded-xl overflow-hidden border-2 flex items-center justify-center active:opacity-80" style={{ borderColor: '#C4B5FD', background: 'linear-gradient(135deg,#7C3AED,#4F46E5)' }} aria-label="Profile">
            {avatarUrl ? <img src={avatarUrl} alt={firstName} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <span className="text-white font-black text-sm">{firstName[0]?.toUpperCase()}</span>}
          </button>
        </div>
      </header>

      {/* BODY */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: isLight ? '96px' : '80px' }}>
        {children}
      </div>

      {/* ASK AI FAB */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 300, damping: 20 }}
        onClick={() => window.dispatchEvent(new CustomEvent('open-side-chatbot'))}
        className="fixed right-5 z-[210] w-14 h-14 rounded-full flex flex-col items-center justify-center gap-0.5 active:scale-95 shadow-xl"
        style={{ bottom: '80px', background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)', boxShadow: '0 8px 24px rgba(124, 58, 237, 0.45)', border: '1.5px solid rgba(255, 255, 255, 0.3)' }}
        aria-label="Ask AI"
      >
        <Sparkles size={18} style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
        <span className="font-black tracking-wide" style={{ fontSize: '9px', color: '#FFFFFF' }}>Ask AI</span>
      </motion.button>

      {/* BOTTOM TAB BAR */}
      <nav className="fixed bottom-0 left-0 right-0 z-[210] sm:hidden flex items-end justify-around" style={{ height: '64px', paddingBottom: 'env(safe-area-inset-bottom, 4px)' }}>
        <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
          <svg viewBox="0 0 375 64" preserveAspectRatio="none" className="w-full h-full" style={{ filter: isLight ? 'drop-shadow(0px -4px 12px rgba(0,0,0,0.08))' : 'drop-shadow(0px -4px 16px rgba(0,0,0,0.3))' }}>
            <path d="M 0,0 L 132,0 C 152,0 160,24 187.5,24 C 215,24 223,0 243,0 L 375,0 L 375,64 L 0,64 Z" fill={isLight ? '#FFFFFF' : cardBgHex} stroke={isLight ? '#E2E8F0' : borderHex} strokeWidth="1" />
          </svg>
        </div>
        <div className="relative z-10 flex items-center justify-around w-full h-full pt-1 px-1">
          {TABS.map((tab) => {
            const isHome = tab.label === 'Home';
            const activeColor = isLight ? '#7C3AED' : accentHex;
            const inactiveIconColor = isLight ? '#475569' : mutedHex;
            const inactiveTextColor = isLight ? '#334155' : mutedHex;
            const iconColor = isHome ? activeColor : inactiveIconColor;
            const textColor = isHome ? activeColor : inactiveTextColor;
            return (
              <Link
                key={tab.label}
                href={tab.href}
                className={`flex flex-col items-center justify-center gap-0.5 min-w-[54px] flex-1 active:opacity-75 ${isHome ? '-mt-5' : 'pb-1'}`}
                aria-label={tab.label}
              >
                {isHome ? (
                  <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 shrink-0 force-purple-bg force-white" style={{ backgroundColor: '#7C3AED', background: '#7C3AED', boxShadow: '0 6px 16px rgba(124, 58, 237, 0.45)' }}>
                    <Home size={22} className="force-white" strokeWidth={2.2} style={{ color: '#FFFFFF', stroke: '#FFFFFF', fill: 'none' }} />
                  </div>
                ) : (
                  <tab.icon size={22} style={{ color: iconColor, stroke: iconColor }} />
                )}
                <span className="font-extrabold" style={{ fontSize: '10px', color: textColor, WebkitTextFillColor: textColor, marginTop: isHome ? '1px' : '0px' }}>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* SIDEBAR DRAWER */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 bg-black/55 z-[300]" onClick={() => setSidebarOpen(false)} />
            <motion.div
              key="drawer"
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed top-0 left-0 bottom-0 z-[310] flex flex-col shadow-2xl"
              style={{ width: '280px', background: cardBgHex, borderRight: `1px solid ${borderHex}` }}
            >
              <div className="flex items-center justify-between px-4 shrink-0" style={{ height: '56px', borderBottom: `1px solid ${borderHex}` }}>
                <div className="flex items-center gap-2.5">
                  <img src="/white-removebg-preview1.png" alt="Fluenzy AI Logo" className="w-9 h-9 object-contain" />
                  <span className="font-black text-lg tracking-tight" style={{ background: 'linear-gradient(90deg,#7C3AED,#4F46E5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Fluenzy AI</span>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg active:opacity-60" style={{ color: mutedHex }} aria-label="Close menu">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-3 px-3">
                <button onClick={() => { setSidebarOpen(false); router.push('/train'); }} className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-left active:opacity-70" style={{ color: textHex }}>
                  <Home size={17} /> <span className="text-sm font-medium">Back to Dashboard</span>
                </button>
                <button onClick={() => { setSidebarOpen(false); setShowHistory(true); }} className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-left active:opacity-70" style={{ color: textHex }}>
                  <BarChart3 size={17} /> <span className="text-sm font-medium">Past GD Sessions</span>
                </button>
              </div>
              <div className="p-4 shrink-0" style={{ borderTop: `1px solid ${borderHex}` }}>
                <div className="flex items-center gap-3 p-3 rounded-xl mb-2" style={{ background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)' }}>
                  <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#7C3AED,#4F46E5)' }}>
                    {avatarUrl ? <img src={avatarUrl} alt={firstName} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <span className="text-white font-black text-sm">{firstName[0]?.toUpperCase()}</span>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold truncate" style={{ color: textHex }}>{session?.user?.name || 'User'}</p>
                    <p className="truncate" style={{ fontSize: '11px', color: mutedHex }}>{session?.user?.email}</p>
                  </div>
                </div>
                <button onClick={() => { setSidebarOpen(false); signOut({ callbackUrl: '/' }); }} className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm font-semibold active:opacity-70" style={{ color: '#EF4444' }}>
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );

  /* --------------------------------------------------------------------- */

  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: pageBgHex }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: accentHex }}></div>
      </div>
    );
  }

  if (authStatus === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: pageBgHex }}>
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4" style={{ color: textHex }}>Sign In Required</h1>
          <p className="mb-6" style={{ color: mutedHex }}>Please sign in to join a Group Discussion</p>
        </div>
      </div>
    );
  }

  if (gdStatus === 'matched' && roomData) {
    // Active video room — full-screen, no chrome
    return (
      <LiveGDRoom
        roomData={roomData}
        userId={userId}
        agoraUid={agoraUid}
        largeVideoLayout={fixedParticipantCount === 2}
        redirectOnEnd={redirectOnEnd}
      />
    );
  }

  if (gdStatus === 'queue') {
    const waitingSlots = Array.from({ length: Math.max(participantCount - 1, 0) });
    return (
      <AppChrome>
        <div className="px-5 pt-8 pb-4 flex flex-col items-center">
          {/* Concentric pulsing circles */}
          <div className="relative w-52 h-52 flex items-center justify-center mb-6">
            <div className="absolute inset-0 rounded-full border" style={{ borderColor: `${accentHex}30` }} />
            <div className="absolute inset-4 rounded-full border" style={{ borderColor: `${accentHex}50` }} />
            <motion.div
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              className="w-24 h-24 rounded-full flex items-center justify-center shadow-lg"
              style={{ background: `linear-gradient(135deg, ${accentHex}, #4F46E5)`, boxShadow: `0 0 30px ${accentHex}60` }}
            >
              <Search size={30} style={{ color: '#FFFFFF' }} />
            </motion.div>
          </div>

          <h2 className="text-xl font-extrabold mb-3" style={{ color: textHex }}>Matching in Progress</h2>

          <div className="px-4 py-1.5 rounded-full mb-6" style={{ background: `${accentHex}20`, border: `1px solid ${accentHex}40` }}>
            <span className="text-sm font-semibold" style={{ color: accentHex }}>
              {queueInfo?.message || 'Looking for participants...'}
            </span>
          </div>

          {/* Participant avatars row */}
          <div className="flex items-center justify-center gap-3 mb-6 w-full max-w-sm">
            <div className="flex flex-col items-center gap-1.5">
              <div className="relative w-14 h-14 rounded-2xl overflow-hidden border-2" style={{ borderColor: accentHex }}>
                {avatarUrl ? <img src={avatarUrl} alt={firstName} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#7C3AED,#4F46E5)' }}>
                    <span className="text-white font-black">{firstName[0]?.toUpperCase()}</span>
                  </div>
                )}
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2" style={{ background: '#22C55E', borderColor: cardBgHex }} />
              </div>
              <span className="text-xs font-semibold" style={{ color: textHex }}>You</span>
            </div>

            {waitingSlots.slice(0, 3).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `${accentHex}22`, border: `1px solid ${accentHex}40` }}>
                  <Search size={18} style={{ color: accentHex }} />
                  <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2" style={{ background: accentHex, borderColor: cardBgHex }} />
                </div>
                <span className="text-xs font-semibold" style={{ color: mutedHex }}>Waiting</span>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="w-full max-w-sm h-1.5 rounded-full overflow-hidden mb-8" style={{ background: isLight ? '#E5E7EB' : 'rgba(255,255,255,0.08)' }}>
            <motion.div
              animate={{ width: ['20%', '85%', '20%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${accentHex}, #4F46E5)` }}
            />
          </div>

          {error && (
            <div className="w-full max-w-sm mb-4 text-sm text-center rounded-xl px-4 py-3" style={{ background: '#EAB30820', color: '#EAB308', border: '1px solid #EAB30840' }}>
              {error}
            </div>
          )}

          <button
            onClick={handleLeaveQueue}
            className="w-full max-w-sm py-3.5 rounded-full font-bold text-sm mb-3"
            style={{ background: isLight ? '#E5E7EB' : 'rgba(255,255,255,0.06)', color: textHex, border: `1px solid ${borderHex}` }}
          >
            Cancel Queue
          </button>

          <button onClick={handleStartNew} className="text-sm font-semibold" style={{ color: accentHex }}>
            Change Preferences
          </button>
        </div>
      </AppChrome>
    );
  }

  return (
    <AppChrome>
      <div className="px-4 pt-5 pb-3">
        {/* Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3 text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: accentHex, background: `${accentHex}14` }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: accentHex }} />
            Practice room
          </div>
          <h1 className="text-[25px] font-black tracking-tight mb-1" style={{ color: textHex }}>{labelTitle ?? 'Live Group Discussion'}</h1>
          <p className="text-[13px]" style={{ color: mutedHex }}>
            {labelSubtitle ?? 'Join random GD sessions with real participants'}
          </p>

          <div className="mt-3 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-bold border shadow-sm" style={{
            background: socketConnected ? '#22C55E20' : '#EF444420',
            color: socketConnected ? '#22C55E' : '#EF4444',
            borderColor: socketConnected ? '#22C55E40' : '#EF444440',
          }}>
            <div className="w-2 h-2 rounded-full" style={{ background: socketConnected ? '#22C55E' : '#EF4444' }} />
            {socketConnected ? 'Socket Connected' : 'Connecting...'}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-xl px-4 py-3 mb-5 text-sm" style={{ background: '#EAB30815', border: '1px solid #EAB30840', color: '#EAB308' }}>
            {error}
          </div>
        )}

        {/* GD Setup Card */}
        <div className="rounded-[24px] p-4 mb-5 border shadow-sm" style={{ background: cardBgHex, borderColor: borderHex, boxShadow: isLight ? '0 10px 28px rgba(43,35,25,0.08)' : undefined }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] mb-1" style={{ color: accentHex }}>{labelSectionSetup ?? 'Session setup'}</p>
              <h2 className="text-[17px] font-black" style={{ color: textHex }}>{labelConfigure ?? 'Configure your GD'}</h2>
            </div>
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: `${accentHex}14`, color: accentHex }}>
              <Target size={19} />
            </div>
          </div>

          <div className="mb-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: mutedHex }}>{labelParticipants ?? 'Participants'}</label>
              {fixedParticipantCount ? (
                <div className="w-full rounded-2xl px-4 py-3.5 text-sm font-semibold" style={{ background: pageBgHex, color: textHex, border: `1px solid ${borderHex}` }}>
                  {labelParticipantFixed ?? '2 Participants'}
                </div>
              ) : (
                <select
                  value={participantCount}
                  onChange={(e) => setParticipantCount(parseInt(e.target.value))}
                  className="w-full rounded-2xl px-4 py-3.5 text-sm font-semibold focus:outline-none"
                  style={{ background: pageBgHex, color: textHex, border: `1px solid ${borderHex}` }}
                >
                  <option value={3}>3 Participants</option>
                  <option value={4}>4 Participants</option>
                  <option value={5}>5 Participants</option>
                  <option value={6}>6 Participants</option>
                  <option value={7}>7 Participants</option>
                  <option value={8}>8 Participants</option>
                </select>
              )}
            </div>
          </div>

          <button
            onClick={handleJoinQueue}
            disabled={!socketConnected}
            className="w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
            style={{ background: 'linear-gradient(135deg,#7C3AED,#4F46E5)', color: '#FFFFFF', boxShadow: '0 8px 20px rgba(124,58,237,0.35)' }}
          >
            <Search size={16} />
            {socketConnected ? 'Find Discussion Room' : 'Connecting to server...'}
          </button>
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
    </AppChrome>
  );
}