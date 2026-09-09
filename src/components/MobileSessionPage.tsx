"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Sparkles, Home, Link2, BarChart3, User, Target,
  Settings, X, Check, Clock, Menu, Bell, CameraOff
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import VoiceAgent from '../../Learn_English/components/VoiceAgent';
import VideoAnalysisPanel from './VideoAnalysisPanel';
import { UserProfile } from '../../Learn_English/types';
import { INITIAL_USER } from '../../Learn_English/constants';
import { ThemeName } from '@/contexts/ThemeContext';
import {
  InterviewSettings,
  VoiceSpeed,
  VoiceId,
  PressureStyle,
  ResponseTiming,
  VOICE_SPEEDS,
  PRESSURE_STYLE_OPTIONS,
  RESPONSE_TIMING_OPTIONS,
  DEFAULT_SETTINGS,
} from '@/types/interviewSettings';
import {
  getInterviewSettings,
  saveInterviewSettings,
} from '@/lib/interviewSettingsStore';

const TABS = [
  { label: 'Quick Links', icon: Link2, href: '/train', tabColor: '#8B5CF6' },
  { label: 'Practice', icon: Target, href: '/train/hr', tabColor: '#10B981' },
  { label: 'Home', icon: Home, href: '/train', tabColor: '#7C3AED' },
  { label: 'Analytics', icon: BarChart3, href: '/analytics', tabColor: '#F97316' },
  { label: 'Profile', icon: User, href: '/profile', tabColor: '#0EA5E9' },
];

export default function MobileSessionPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, setTheme, resolvedTheme } = useTheme();

  const company = searchParams.get('company') || 'Google';
  const role = searchParams.get('role') || 'Software Engineer';
  const experience = searchParams.get('experience') || 'Fresher';
  const roundType = searchParams.get('roundType') || 'Technical';

  // Initially set to FALSE (waiting for user to click START INTERVIEW)
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [settings, setSettings] = useState<InterviewSettings>(DEFAULT_SETTINGS);
  
  // Timer starts at 0 (Actual live calculated elapsed time)
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  // Load interview settings
  useEffect(() => {
    setSettings(getInterviewSettings());
  }, []);

  // Timer interval - ticks ONLY when interview is active
  useEffect(() => {
    if (!isInterviewActive) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isInterviewActive]);

  const formatTimer = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const updateSetting = (patch: Partial<InterviewSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveInterviewSettings(next);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('fluenzy_settings_updated', { detail: next }));
    }
  };

  /* Theme tokens */
  const isDarkTheme = resolvedTheme === 'dark' || resolvedTheme === 'midnight' || resolvedTheme === 'forest' || resolvedTheme === 'codeterm';
  const isLight = !isDarkTheme;

  const cardBgHex = isDarkTheme ? '#111827' : (resolvedTheme === 'parchment' ? '#FCFBF8' : '#FFFFFF');
  const pageBgHex = isDarkTheme ? '#0A0F1D' : (resolvedTheme === 'parchment' ? 'hsl(42 18% 93%)' : '#F8FAFC');
  const textHex = isDarkTheme ? '#F8FAFC' : '#1C1917';
  const mutedHex = isDarkTheme ? '#94A3B8' : '#57534E';
  const borderHex = isDarkTheme ? 'rgba(255,255,255,0.08)' : (resolvedTheme === 'parchment' ? '#E6E2D8' : '#E2E8F0');
  const accentHex = isDarkTheme ? '#7C3AED' : '#5A2D82';

  const user: UserProfile = {
    ...INITIAL_USER,
    id: session?.user?.email || 'u1',
    name: session?.user?.name || 'User',
    email: session?.user?.email || 'user@example.com',
    picture: session?.user?.image || undefined,
  };

  const getPillStyle = (isSelected: boolean) => {
    const textColor = isSelected ? '#FFFFFF' : (isDarkTheme ? '#F1F5F9' : '#1C1917');
    return {
      background: isSelected ? '#5B21E6' : (isDarkTheme ? '#1E243B' : '#E2E8F0'),
      color: textColor,
      WebkitTextFillColor: textColor,
      borderColor: isSelected ? '#5B21E6' : (isDarkTheme ? 'rgba(255,255,255,0.12)' : '#CBD5E1'),
    };
  };

  const triggerSafeNavigate = (targetUrl: string = '/train') => {
    if (isInterviewActive) {
      window.dispatchEvent(new CustomEvent('fluenzy_end_session_and_save', { detail: { targetUrl } }));
    }
    if (targetUrl === 'back') {
      router.back();
    } else {
      router.push(targetUrl);
    }
  };

  const handleStartInterview = () => {
    setElapsedSeconds(0);
    setIsInterviewActive(true);
  };

  const handleEndInterview = () => {
    // 1. Dispatch custom save & cleanup event to VoiceAgent & VideoAnalysisPanel
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('fluenzy_end_interview'));
    }

    // 2. Set interview inactive
    setIsInterviewActive(false);

    // 3. Navigate user directly back to Mobile Train Page (/train)
    triggerSafeNavigate('/train');
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col sm:hidden overflow-hidden"
      style={{ background: pageBgHex, color: textHex }}
    >
      {/* ── 1. TOP BAR (Menu Icon, Fluenzy AI Logo, Settings Gear, Bell, Avatar) ── */}
      <div
        className="px-4 pt-3 pb-2.5 shrink-0 flex items-center justify-between border-b"
        style={{ background: pageBgHex, borderColor: borderHex }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => triggerSafeNavigate('/train')}
            className="p-1 -ml-1 active:opacity-60"
            style={{ color: textHex }}
          >
            <Menu size={22} style={{ color: textHex, stroke: textHex }} />
          </button>
          <div className="flex items-center gap-2">
            <img
              src="/white-removebg-preview1.png"
              alt="Fluenzy AI Logo"
              className="w-8 h-8 object-contain filter drop-shadow-sm active:scale-95 transition-transform shrink-0"
            />
            <span
              className="font-black text-lg tracking-tight"
              style={{ background: 'linear-gradient(90deg,#7C3AED,#4F46E5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            >
              Fluenzy AI
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Settings Gear Button */}
          <button
            type="button"
            onClick={() => setSettingsModalOpen(true)}
            className="p-1.5 rounded-full active:opacity-60 transition-transform active:scale-95"
            style={{ color: textHex }}
            aria-label="Interview Settings"
          >
            <Settings size={20} style={{ color: textHex, stroke: textHex, fill: 'none' }} />
          </button>

          {/* Notification Bell */}
          <button
            type="button"
            onClick={() => setSettingsModalOpen(true)}
            className="relative p-1.5 rounded-full active:opacity-60"
            style={{ color: textHex }}
          >
            <Bell size={20} style={{ color: textHex, stroke: textHex }} />
            <span className="absolute top-0 right-0 w-4 h-4 bg-purple-600 text-white rounded-full text-[9px] font-black flex items-center justify-center">
              3
            </span>
          </button>

          {/* User Avatar */}
          <div className="w-8 h-8 rounded-full overflow-hidden border border-purple-500/40">
            <img
              src={user.picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'}
              alt="User Avatar"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* ── MAIN SCROLLABLE CONTAINER ────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-3.5 pt-3 pb-28 space-y-3.5">
        
        {/* ── 2. CONDITIONAL TOP TIMER & COMPANY BANNER ─────────────────────── */}
        <AnimatePresence>
          {isInterviewActive && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-1.5 overflow-hidden"
            >
              {/* Google Interview Header Tile */}
              <div
                className="rounded-xl p-2.5 border flex items-center justify-between shadow-md"
                style={{ background: cardBgHex, borderColor: borderHex }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm shrink-0 p-1 border border-slate-200">
                    <svg viewBox="0 0 24 24" className="w-full h-full">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                  </div>
                  <div>
                    <h2 className="font-extrabold text-sm tracking-tight leading-tight" style={{ color: textHex }}>
                      {company} Interview
                    </h2>
                    <p className="text-[9px] font-semibold" style={{ color: mutedHex }}>
                      {role} • {roundType} • {experience}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleEndInterview}
                  className="px-3 py-1 rounded-full text-xs font-black text-white bg-red-600 hover:bg-red-700 active:scale-95 transition-all shadow-md force-white shrink-0"
                  style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}
                >
                  End Interview
                </button>
              </div>

              {/* Status & Actual Live Timer Row */}
              <div className="flex items-center justify-between px-1 text-[11px] font-bold">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span style={{ color: textHex }}>
                    Interview in Progress
                  </span>
                </div>
                <div className="flex items-center gap-1" style={{ color: textHex }}>
                  <Clock size={13} style={{ color: textHex }} />
                  <span className="font-mono font-extrabold tracking-wide">
                    {formatTimer(elapsedSeconds)}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── 3. SINGLE PRIMARY WORKSPACE: AI HR VOICE AGENT & START INTERVIEW ─ */}
        <div
          className="rounded-xl border p-2 shadow-md overflow-hidden"
          style={{ background: cardBgHex, borderColor: borderHex }}
        >
          <VoiceAgent
            user={user}
            onSessionEnd={handleEndInterview}
            onInterviewStart={handleStartInterview}
            showSettings={showSettings}
            onShowSettingsChange={setShowSettings}
            hideEndButton={true}
          />
        </div>

        {/* ── 4. LIVE ANALYSIS SECTION HEADER ───────────────────────────────── */}
        <div className="pt-0 flex items-center justify-between">
          <h3 className="font-extrabold text-xs tracking-tight" style={{ color: textHex }}>
            Original AI Video & Expression Analysis
          </h3>
          <span className="text-[8px] font-extrabold px-2 py-0.5 rounded-full text-white force-white" style={{ background: isInterviewActive ? '#10B981' : accentHex, color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>
            {isInterviewActive ? 'Live Stream' : 'Idle'}
          </span>
        </div>

        {/* ── 5. ORIGINAL REAL-TIME CANDIDATE AI VIDEO ANALYSIS PANEL ───────── */}
        <div
          className="rounded-xl border shadow-md overflow-hidden"
          style={{ background: cardBgHex, borderColor: borderHex }}
        >
          <VideoAnalysisPanel
            sessionId={sessionId}
            isActive={isInterviewActive}
            isCompact={false}
          />
        </div>
      </div>

      {/* ── 8. FLOATING ASK AI BUTTON ─────────────────────────────────────── */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={() => window.dispatchEvent(new CustomEvent('open-side-chatbot'))}
        className="fixed right-5 z-[210] sm:hidden w-14 h-14 rounded-full flex flex-col items-center justify-center gap-0.5 active:scale-95"
        style={{
          bottom: '80px',
          background: '#6C2BD9',
          boxShadow: '0 8px 24px rgba(108,43,217,0.5)',
        }}
        aria-label="Ask AI"
      >
        <Sparkles size={18} className="text-white" />
        <span className="text-white font-black tracking-wide" style={{ fontSize: '8px' }}>Ask AI</span>
      </motion.button>

      {/* ── 9. BOTTOM TAB BAR (Downward Concave Scoop Curve around Home Tab) ──── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-[210] sm:hidden flex items-end justify-around"
        style={{
          height: '64px',
          paddingBottom: 'env(safe-area-inset-bottom, 4px)',
        }}
      >
        {/* Background Downward Curvy SVG shape */}
        <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
          <svg
            viewBox="0 0 375 64"
            preserveAspectRatio="none"
            className="w-full h-full"
            style={{
              filter: isLight
                ? 'drop-shadow(0px -4px 12px rgba(0,0,0,0.08))'
                : 'drop-shadow(0px -4px 16px rgba(0,0,0,0.3))',
            }}
          >
            <path
              d="M 0,0 L 132,0 C 152,0 160,24 187.5,24 C 215,24 223,0 243,0 L 375,0 L 375,64 L 0,64 Z"
              fill={isLight ? '#FFFFFF' : cardBgHex}
              stroke={isLight ? '#E2E8F0' : borderHex}
              strokeWidth="1"
            />
          </svg>
        </div>

        {/* Tab Items */}
        <div className="relative z-10 flex items-center justify-around w-full h-full pt-1 px-1">
          {TABS.map((tab) => {
            const isHome = tab.label === 'Home';
            const activeColor = isLight ? '#7C3AED' : accentHex;
            const inactiveIconColor = isLight ? '#475569' : mutedHex;
            const inactiveTextColor = isLight ? '#334155' : mutedHex;

            const iconColor = isHome ? activeColor : inactiveIconColor;
            const textColor = isHome ? activeColor : inactiveTextColor;

            return (
              <button
                key={tab.label}
                type="button"
                onClick={() => triggerSafeNavigate(tab.href)}
                className={`flex flex-col items-center justify-center gap-0.5 min-w-[54px] flex-1 active:opacity-75 ${
                  isHome ? '-mt-5' : 'pb-1'
                }`}
                aria-label={tab.label}
              >
                {isHome ? (
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 shrink-0 force-purple-bg force-white"
                    style={{
                      backgroundColor: '#7C3AED',
                      background: '#7C3AED',
                      boxShadow: '0 6px 16px rgba(124, 58, 237, 0.45)',
                    }}
                  >
                    <Home
                      size={22}
                      className="force-white"
                      strokeWidth={2.2}
                      style={{
                        color: '#FFFFFF',
                        stroke: '#FFFFFF',
                        fill: 'none',
                      }}
                    />
                  </div>
                ) : (
                  <tab.icon size={22} style={{ color: iconColor, stroke: iconColor }} />
                )}
                <span
                  className="font-extrabold"
                  style={{
                    fontSize: '10px',
                    color: textColor,
                    WebkitTextFillColor: textColor,
                    marginTop: isHome ? '1px' : '0px',
                  }}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── INTERVIEW SETTINGS MODAL SHEET ───────────────────────────────────── */}
      <AnimatePresence>
        {settingsModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[240]"
              onClick={() => setSettingsModalOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed bottom-0 left-0 right-0 z-[250] rounded-t-3xl p-5 pb-8 max-h-[85vh] overflow-y-auto shadow-2xl space-y-4"
              style={{ background: cardBgHex, borderTop: `1px solid ${borderHex}` }}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: borderHex }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${accentHex}18` }}>
                    <Settings size={18} style={{ color: accentHex }} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base leading-tight" style={{ color: textHex }}>
                      Voice & Interview Settings
                    </h3>
                    <p className="text-[11px] font-medium mt-0.5" style={{ color: mutedHex }}>
                      Customize voice speed, style, and AI response timing
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSettingsModalOpen(false)}
                  className="p-2 rounded-full active:opacity-60 flex items-center justify-center shrink-0"
                  style={{ color: textHex }}
                >
                  <X size={20} style={{ color: textHex }} />
                </button>
              </div>

              {/* Setting 1: Speed */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider block mb-1.5" style={{ color: textHex }}>
                  Speed
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {VOICE_SPEEDS.map((speed) => {
                    const isSelected = settings.voiceSpeed === speed;
                    const styleObj = getPillStyle(isSelected);
                    return (
                      <button
                        key={speed}
                        type="button"
                        onClick={() => updateSetting({ voiceSpeed: speed as VoiceSpeed })}
                        className="h-10 rounded-xl text-xs font-extrabold border transition-all flex items-center justify-center shadow-sm"
                        style={styleObj}
                      >
                        {speed === 1 ? '● 1x' : `${speed}x`}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] font-medium mt-1" style={{ color: mutedHex }}>
                  Normal interview pace
                </p>
              </div>

              {/* Setting 2: Voice */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider block mb-1.5" style={{ color: textHex }}>
                  Voice
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 'Priya', label: 'Priya ✓' },
                    { id: 'Arjun', label: 'Arjun' },
                    { id: 'Sarah', label: 'Sarah' },
                    { id: 'Marcus', label: 'Marcus' },
                  ].map((v) => {
                    const isSelected = settings.voiceId === v.id;
                    const styleObj = getPillStyle(isSelected);
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => updateSetting({ voiceId: v.id as VoiceId })}
                        className="h-10 rounded-xl text-xs font-extrabold border transition-all flex items-center justify-center shadow-sm"
                        style={styleObj}
                      >
                        {v.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Setting 3: Style */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider block mb-1.5" style={{ color: textHex }}>
                  Style
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {PRESSURE_STYLE_OPTIONS.map((opt) => {
                    const isSelected = settings.pressureStyle === opt.id;
                    const styleObj = getPillStyle(isSelected);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => updateSetting({ pressureStyle: opt.id as PressureStyle })}
                        className="h-10 rounded-xl text-xs font-extrabold border transition-all flex items-center justify-center gap-1 shadow-sm px-1 truncate"
                        style={styleObj}
                      >
                        <span>{opt.emoji}</span>
                        <span className="truncate">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Setting 4: AI Response Time */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider block mb-1.5" style={{ color: textHex }}>
                  AI Response Time
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {RESPONSE_TIMING_OPTIONS.map((opt) => {
                    const isSelected = settings.responseTiming === opt.id;
                    const styleObj = getPillStyle(isSelected);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => updateSetting({ responseTiming: opt.id as ResponseTiming })}
                        className="h-10 rounded-xl text-xs font-extrabold border transition-all flex items-center justify-center gap-1 shadow-sm px-1 truncate"
                        style={styleObj}
                      >
                        <span>{opt.emoji}</span>
                        <span className="truncate">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] font-medium mt-1 leading-snug" style={{ color: mutedHex }}>
                  Controls if the AI replies immediately as soon as you speak, or takes a pause.
                </p>
              </div>

              {/* Setting 5: App Theme */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider block mb-1.5" style={{ color: textHex }}>
                  App Theme
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'light', label: '☀️ Light' },
                    { id: 'dark', label: '🌙 Dark' },
                    { id: 'midnight', label: '✨ Night' },
                    { id: 'forest', label: '🍃 Forest' },
                    { id: 'parchment', label: '☕ Parchment' },
                    { id: 'codeterm', label: '>_ Code' },
                  ].map((t) => {
                    const isSelected = resolvedTheme === t.id;
                    const styleObj = getPillStyle(isSelected);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTheme(t.id as ThemeName)}
                        className="h-10 rounded-xl text-xs font-extrabold border transition-all flex items-center justify-center shadow-sm"
                        style={styleObj}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
