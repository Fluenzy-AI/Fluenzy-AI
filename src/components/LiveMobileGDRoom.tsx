'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  BarChart3, Home, Link2,
  Mic, MicOff, PhoneOff, Sparkles, Target, User, Users, Video, Volume2, VolumeX,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { TrainNavigation } from './train/TrainNavigation';
import type {
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IRemoteAudioTrack,
  IRemoteVideoTrack,
  UID,
} from 'agora-rtc-sdk-ng';

export interface MobileRemoteUser {
  uid: UID;
  audioTrack: IRemoteAudioTrack | null;
  videoTrack: IRemoteVideoTrack | null;
  hasAudio: boolean;
  hasVideo: boolean;
}

interface LiveMobileGDRoomProps {
  userName: string;
  avatarUrl?: string | null;
  topic: string;
  currentPhase: string;
  phaseTimer: number;
  participantNames: string[];
  agoraUid: number;
  localVideoTrack: ICameraVideoTrack | null;
  localAudioTrack: IMicrophoneAudioTrack | null;
  remoteUsers: MobileRemoteUser[];
  isMuted: boolean;
  isVideoOff: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onEndSession: () => void;
  largeVideoLayout?: boolean;
}

const TABS = [
  { label: 'Quick Links', icon: Link2, href: '/train' },
  { label: 'Practice', icon: Target, href: '/train/hr' },
  { label: 'Home', icon: Home, href: '/train' },
  { label: 'Analytics', icon: BarChart3, href: '/analytics' },
  { label: 'Profile', icon: User, href: '/profile' },
];

function MediaPlayer({
  videoTrack,
  audioTrack,
  uid,
  local = false,
}: {
  videoTrack: IRemoteVideoTrack | ICameraVideoTrack | null;
  audioTrack: IRemoteAudioTrack | IMicrophoneAudioTrack | null;
  uid: UID;
  local?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !videoTrack) return;
    videoTrack.play(containerRef.current);
    return () => videoTrack.stop();
  }, [videoTrack]);

  useEffect(() => {
    if (!audioTrack || local) return;
    audioTrack.play();
    return () => audioTrack.stop();
  }, [audioTrack, local]);

  return <div ref={containerRef} id={`mobile-player-${uid}`} className="w-full h-full bg-[#16233b]" />;
}

export default function LiveMobileGDRoom({
  userName,
  avatarUrl,
  topic,
  currentPhase,
  phaseTimer,
  participantNames,
  agoraUid,
  localVideoTrack,
  localAudioTrack,
  remoteUsers,
  isMuted,
  isVideoOff,
  onToggleMute,
  onToggleVideo,
  onEndSession,
  largeVideoLayout = false,
}: LiveMobileGDRoomProps) {
  const { resolvedTheme } = useTheme();
  const [isMobileViewport, setIsMobileViewport] = useState<boolean | null>(null);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);

  const toggleSpeaker = () => {
    const newMuted = !isSpeakerMuted;
    setIsSpeakerMuted(newMuted);
    remoteUsers.forEach((user) => {
      if (user.audioTrack) {
        user.audioTrack.setVolume(newMuted ? 0 : 100);
      }
    });
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 640px)');
    const updateViewport = () => setIsMobileViewport(mediaQuery.matches);
    updateViewport();
    mediaQuery.addEventListener('change', updateViewport);
    return () => mediaQuery.removeEventListener('change', updateViewport);
  }, []);

  if (isMobileViewport !== true) return null;

  const phaseDurations: Record<string, number> = {
    initiation: 120,
    discussion: 600,
    summary: 120,
  };
  const phaseStartTime = currentPhase === 'discussion' ? 120 : currentPhase === 'summary' ? 720 : 0;
  const elapsedTime = Math.max(0, phaseStartTime + (phaseDurations[currentPhase] ?? 0) - phaseTimer);
  const formatElapsedTime = (seconds: number) =>
    `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

  const isLight = resolvedTheme === 'light' || resolvedTheme === 'parchment';
  const themeColors: Record<string, {
    page: string; surface: string; panel: string; card: string; text: string;
    muted: string; border: string; accent: string; control: string; danger: string;
  }> = {
    light: { page: '#F8F7FF', surface: '#FFFFFF', panel: '#FFFFFF', card: '#F1F5F9', text: '#1E1B3A', muted: '#6B7280', border: '#E5E0FF', accent: '#5B21E6', control: '#E8E7F5', danger: '#E11D48' },
    parchment: { page: '#F4F1EA', surface: '#FCFBF8', panel: '#FFFFFF', card: '#F7F3EA', text: '#212529', muted: '#6C757D', border: '#E6E2D8', accent: '#5A2D82', control: '#E9ECEF', danger: '#DC3545' },
    dark: { page: '#0D0F1A', surface: '#161B2E', panel: '#0F172A', card: '#1A2340', text: '#F1F5F9', muted: '#94A3B8', border: 'rgba(255,255,255,0.12)', accent: '#7C3AED', control: '#17243D', danger: '#F43F5E' },
    midnight: { page: '#0A1929', surface: '#0F2744', panel: '#0F2744', card: '#153252', text: '#F1F5F9', muted: '#94A3B8', border: 'rgba(147,197,253,0.2)', accent: '#60A5FA', control: '#173A5F', danger: '#FB7185' },
    forest: { page: '#0B140E', surface: '#111C14', panel: '#111C14', card: '#1A2B1D', text: '#E8E4D9', muted: '#9AAD8E', border: 'rgba(180,120,30,0.28)', accent: '#F59E0B', control: '#1A3320', danger: '#F87171' },
    codeterm: { page: '#0D0D0D', surface: '#141414', panel: '#141414', card: '#1E1E1E', text: '#F0EDE8', muted: '#888580', border: 'rgba(204,65,37,0.3)', accent: '#CC4125', control: '#242424', danger: '#F87171' },
  };
  const colors = themeColors[resolvedTheme] ?? themeColors.dark;
  const { page: pageBg, surface, panel, card, text, muted, border, accent, control, danger } = colors;

  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden pb-28 pt-14 sm:pt-0" style={{ background: pageBg, color: text }}>
      <TrainNavigation />

      <main className={`px-4 ${largeVideoLayout ? 'pt-[100px]' : 'pt-[160px]'} sm:pt-7`}>
        <div className="fixed left-0 right-0 top-14 z-40 px-4 pb-2 pt-3" style={{ background: pageBg }}>
          <div className="mb-4 flex min-w-0 items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <button onClick={onEndSession} aria-label="Leave discussion"><span className="text-4xl leading-none">‹</span></button>
              <span className="flex min-w-0 items-center gap-2 rounded-full border px-3 py-2 text-sm font-bold" style={{ color: danger, borderColor: `${danger}66`, background: `${danger}18` }}>
                <span className="h-3 w-3 animate-pulse rounded-full" style={{ background: danger }} />
                Live Discussion · {formatElapsedTime(elapsedTime)}
              </span>
            </div>
            <span className="flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-2 text-xs font-semibold" style={{ color: muted, borderColor: border, background: card }}>
              <Users size={16} /> {remoteUsers.length + 1}
            </span>
          </div>

          {!largeVideoLayout && (
            <section>
              <div className="min-w-0 rounded-[22px] border px-4 py-3 text-center" style={{ background: panel, borderColor: border }}>
                <span className="line-clamp-2 break-words text-sm font-bold leading-tight [overflow-wrap:anywhere]" style={{ color: text }}>{topic}</span>
              </div>
            </section>
          )}
        </div>

        <section className={largeVideoLayout ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-2 gap-3'}>
          <div className={`relative ${largeVideoLayout ? 'aspect-video' : 'aspect-[4/3]'} min-w-0 overflow-hidden rounded-2xl border-2 shadow-[0_0_14px_rgba(124,58,237,0.55)] sm:rounded-3xl sm:border-4`} style={{ borderColor: accent, boxShadow: `0 0 14px ${accent}88` }}>
            <MediaPlayer videoTrack={localVideoTrack} audioTrack={localAudioTrack} uid={agoraUid} local />
            {isVideoOff && <div className="absolute inset-0 flex items-center justify-center z-10" style={{ background: card }}><div className="flex h-20 w-20 items-center justify-center rounded-full text-3xl font-black" style={{ background: accent, color: '#FFFFFF' }}>{userName[0]?.toUpperCase()}</div></div>}
            <span className="absolute right-2 top-2 rounded-lg px-2 py-1 text-[10px] font-bold sm:right-4 sm:top-4 sm:px-4 sm:py-2 sm:text-base sm:rounded-xl" style={{ background: accent, color: '#FFFFFF' }}>You</span>
            <span className="absolute bottom-2 left-2 max-w-[calc(100%-4.5rem)] truncate rounded-lg px-2 py-1 text-[10px] font-semibold sm:bottom-4 sm:left-4 sm:px-4 sm:py-2 sm:text-base sm:rounded-xl" style={{ background: `${pageBg}dd`, color: text }}>{userName}</span>
            <div className="absolute bottom-2 right-2 flex gap-1 sm:bottom-4 sm:right-4 sm:gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full sm:h-11 sm:w-11" style={{ background: control, color: isMuted ? danger : '#10B981' }}>
                {isMuted ? <MicOff size={16} style={{ color: danger }} className="sm:h-5 sm:w-5" /> : <Mic size={16} className="sm:h-5 sm:w-5" />}
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full sm:h-11 sm:w-11" style={{ background: control, color: isVideoOff ? danger : text }}><Video size={16} className="sm:h-5 sm:w-5" /></span>
            </div>
          </div>
          {remoteUsers.slice(0, 3).map((user, index) => (
            <div key={user.uid} className={`relative ${largeVideoLayout ? 'aspect-video' : 'aspect-[4/3]'} min-w-0 overflow-hidden rounded-2xl border sm:rounded-3xl`} style={{ borderColor: border }}>
              <MediaPlayer videoTrack={user.videoTrack} audioTrack={user.audioTrack} uid={user.uid} />
              {!user.hasVideo && <div className="absolute inset-0 flex items-center justify-center z-10" style={{ background: card }}><div className="flex h-20 w-20 items-center justify-center rounded-full" style={{ background: control, color: muted }}><User size={30} /></div></div>}
              <span className="absolute bottom-2 left-2 max-w-[calc(100%-4.5rem)] truncate rounded-lg px-2 py-1 text-[10px] font-semibold sm:bottom-4 sm:left-4 sm:px-4 sm:py-2 sm:text-base sm:rounded-xl" style={{ background: `${pageBg}dd`, color: text }}>{participantNames[index + 1] || `Participant ${index + 2}`}</span>
              <div className="absolute bottom-2 right-2 flex gap-1 sm:bottom-4 sm:right-4 sm:gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full sm:h-11 sm:w-11" style={{ background: control, color: user.hasAudio ? '#10B981' : danger }}>
                  {user.hasAudio ? <Mic size={16} className="sm:h-5 sm:w-5" /> : <MicOff size={16} style={{ color: danger }} className="sm:h-5 sm:w-5" />}
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full sm:h-11 sm:w-11" style={{ background: control, color: user.hasVideo ? text : danger }}><Video size={16} className="sm:h-5 sm:w-5" /></span>
              </div>
            </div>
          ))}
        </section>
      </main>

      <div className="fixed bottom-[76px] left-2 right-2 z-40 flex items-center justify-between gap-2 rounded-3xl border px-2.5 py-3 shadow-2xl backdrop-blur-xl sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:gap-3 sm:px-3" style={{ background: `${surface}f2`, borderColor: border }}>
        <button onClick={onToggleMute} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full sm:h-14 sm:w-14" style={{ background: control, color: isMuted ? danger : text }}>{isMuted ? <MicOff /> : <Mic />}</button>
        <button onClick={onToggleVideo} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full sm:h-14 sm:w-14" style={{ background: control, color: isVideoOff ? danger : text }}>{isVideoOff ? <Video /> : <Video />}</button>
        <button onClick={toggleSpeaker} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full sm:h-14 sm:w-14" style={{ background: control, color: isSpeakerMuted ? danger : text }}>
          {isSpeakerMuted ? <VolumeX /> : <Volume2 />}
        </button>
        <button onClick={onEndSession} className="flex h-12 min-w-0 flex-1 items-center justify-center gap-1 rounded-full px-3 font-bold sm:h-14 sm:flex-none sm:px-5" style={{ background: danger, color: '#FFFFFF' }}><PhoneOff size={18} /> <span>End</span></button>
        <button onClick={() => { window.dispatchEvent(new CustomEvent('open-side-chatbot')); }} className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-full shadow-[0_0_20px_rgba(124,58,237,0.65)] sm:h-14 sm:w-14" style={{ background: accent, color: '#FFFFFF' }}><Sparkles size={18} /><span className="text-[8px] font-bold">Ask AI</span></button>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-30 h-16 flex items-end justify-around" style={{ paddingBottom: 'env(safe-area-inset-bottom, 4px)' }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <svg viewBox="0 0 375 64" preserveAspectRatio="none" className="w-full h-full" style={{ filter: isLight ? 'drop-shadow(0 -4px 12px rgba(0,0,0,0.08))' : 'drop-shadow(0 -4px 16px rgba(0,0,0,0.3))' }}>
            <path d="M 0,0 L 132,0 C 152,0 160,24 187.5,24 C 215,24 223,0 243,0 L 375,0 L 375,64 L 0,64 Z" fill={surface} stroke={border} strokeWidth="1" />
          </svg>
        </div>
        <div className="relative z-10 flex items-center justify-around w-full h-full pt-1 px-1">
          {TABS.map((tab) => {
            const isHome = tab.label === 'Home';
            const Icon = tab.icon;
            return <Link key={tab.label} href={tab.href} className={`flex flex-col items-center justify-center gap-0.5 min-w-[54px] flex-1 ${isHome ? '-mt-5' : 'pb-1'}`}>
              {isHome ? <span className="flex h-12 w-12 items-center justify-center rounded-full shadow-lg" style={{ background: accent, boxShadow: `0 6px 18px ${accent}70` }}><Home size={23} color="#FFFFFF" /></span> : <Icon size={22} style={{ color: muted }} />}
              <span className="text-[10px] font-extrabold" style={{ color: isHome ? accent : muted }}>{tab.label}</span>
            </Link>;
          })}
        </div>
      </nav>
    </div>
  );
}
