'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, type ElementType } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { signOut } from 'next-auth/react';
import {
  Menu, Bell, ChevronRight, Home, Link2,
  BarChart3, User, Target, Users, Code,
  Building2, History, GraduationCap, Radio,
  Trophy, Sparkles, Brain, BookOpen, X,
  BookMarked, Mic, LogOut, Sun, Moon,
  Leaf, Coffee, Terminal, UserCheck, Shuffle, Lock, UserSearch, FileCheck,
} from 'lucide-react';
import { useTheme, ThemeName } from '@/contexts/ThemeContext';
import NotificationBell from '@/components/NotificationBell';

/* ─── Theme option list ──────────────────────────────────────────────────── */
const THEME_OPTIONS: { value: ThemeName; label: string; icon: typeof Moon }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'midnight', label: 'Night', icon: Sparkles },
  { value: 'forest', label: 'Forest', icon: Leaf },
  { value: 'parchment', label: 'Parchment', icon: Coffee },
  { value: 'codeterm', label: 'Code', icon: Terminal },
];

/* ─── Bottom tabs ─────────────────────────────────────────────────────────── */
const TABS = [
  { label: 'Quick Links', icon: Link2, href: '/train' },
  { label: 'Practice', icon: Target, href: '/train/hr' },
  { label: 'Home', icon: Home, href: '/train' },
  { label: 'Analytics', icon: BarChart3, href: '/analytics' },
  { label: 'Profile', icon: User, href: '/profile' },
];

/* ─── Sidebar sections ───────────────────────────────────────────────────── */
const SIDEBAR_SECTIONS = [
  {
    title: 'MAIN',
    items: [
      { label: 'Dashboard', icon: Home, href: '/train' },
      { label: 'HR Interview', icon: UserCheck, href: '/train/hr' },
      { label: 'Technical', icon: Code, href: '/train/technical' },
      { label: 'GD Coach', icon: GraduationCap, href: '/train/gd-coach' },
      { label: 'GD Agent', icon: Users, href: '/train/gd-agent' },
      { label: 'Company Tracks', icon: Building2, href: '/train/company' },
      { label: 'Live GD', icon: Radio, href: '/train/live' },
      { label: 'Competitions', icon: Trophy, href: '/train/competitions' },
      { label: 'English Learning', icon: BookOpen, href: '/train/english' },
      { label: 'Vocabulary', icon: BookMarked, href: '/train/vocabulary' },
      { label: 'Voice Practice', icon: Mic, href: '/train/corporate-voice' },
      { label: 'PromptIQ', icon: Brain, href: '/train/promptiq' },
    ],
  },
  {
    title: 'JOB & CAREER',
    items: [
      { label: 'AI Job Search', icon: UserSearch, href: '/train/job-search' },
      { label: 'My Applications', icon: FileCheck, href: '/train/applications' },
      { label: 'Resume ATS', icon: Target, href: '/ats' },
    ],
  },
  {
    title: 'ACCOUNT',
    items: [
      { label: 'Analytics', icon: BarChart3, href: '/analytics' },
      { label: 'History', icon: History, href: '/history' },
      { label: 'Profile', icon: User, href: '/profile' },
      { label: 'Billing', icon: Sparkles, href: '/billing' },
    ],
  },
];

interface LiveCard {
  id: string;
  title: string;
  description: string;
  icon: ElementType;
  accent: string;
  badge: string;
  badgeColor: string;
  borderColor: string;
  href: string;
}

const LIVE_CARDS: LiveCard[] = [
  {
    id: 'live-interview',
    title: 'Live Interview',
    description: 'Get matched 1:1 instantly with a real participant for a live interview.',
    icon: UserCheck,
    accent: '#22C55E',
    badge: 'Live',
    badgeColor: 'bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/25',
    borderColor: 'border-[#22C55E]/20',
    href: '/train/interview/live',
  },
  {
    id: 'random-gd',
    title: 'Random GD Match',
    description: 'Get matched instantly in a random group discussion with real participants.',
    icon: Shuffle,
    accent: '#3B82F6',
    badge: 'Live',
    badgeColor: 'bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/25',
    borderColor: 'border-[#3B82F6]/20',
    href: '/train/live-gd',
  },
  {
    id: 'private-gd',
    title: 'Private GD',
    description: 'Create a private room and invite friends or classmates via a unique link.',
    icon: Lock,
    accent: '#EC4899',
    badge: 'Invite-Only',
    badgeColor: 'bg-[#7C3AED]/15 text-[#A78BFA] border-[#7C3AED]/25',
    borderColor: 'border-[#EC4899]/20',
    href: '/train/gd/private',
  },
  {
    id: 'private-interview',
    title: 'Private Interview',
    description: 'Host a structured interview room and invite specific people via a link.',
    icon: Users,
    accent: '#7C3AED',
    badge: 'Invite-Only',
    badgeColor: 'bg-[#7C3AED]/15 text-[#A78BFA] border-[#7C3AED]/25',
    borderColor: 'border-[#7C3AED]/20',
    href: '/train/interview/private',
  },
];

export default function MobileLiveTrainPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);

  const isLight = resolvedTheme === 'light' || resolvedTheme === 'parchment';

  /* ── Per-theme colour tokens (matches desktop LiveTrainPage) ─────────── */
  const ACCENT: Record<string, string> = {
    light: '#5A2D82',
    parchment: '#5B3FE8',
    dark: '#7C3AED',
    midnight: '#7C3AED',
    forest: '#F59E0B',
    codeterm: '#CC4125',
  };
  const CARD_BG: Record<string, string> = {
    light: '#F8FAFC',
    parchment: '#FFFFFF',
    dark: '#161B2E',
    midnight: 'rgba(15,39,68,0.9)',
    forest: 'rgba(17,28,20,0.9)',
    codeterm: '#141414',
  };
  const PAGE_BG: Record<string, string> = {
    light: '#FFFFFF',
    parchment: '#F3F0EB',
    dark: '#0D0F1A',
    midnight: '#0a1929',
    forest: '#0b140e',
    codeterm: '#0D0D0D',
  };
  const TEXT_HEX: Record<string, string> = {
    light: '#0F0B2E',
    parchment: '#221F1D',
    dark: '#F1F5F9',
    midnight: '#F1F5F9',
    forest: '#e8e4d9',
    codeterm: '#F0EDE8',
  };
  const MUTED_HEX: Record<string, string> = {
    light: '#6B7280',
    parchment: '#514D49',
    dark: '#94A3B8',
    midnight: '#94A3B8',
    forest: '#9aad8e',
    codeterm: '#888580',
  };
  const BORDER_HEX: Record<string, string> = {
    light: '#E5E7EB',
    parchment: '#E4DED5',
    dark: 'rgba(255,255,255,0.08)',
    midnight: 'rgba(255,255,255,0.08)',
    forest: 'rgba(180,120,30,0.2)',
    codeterm: 'rgba(204,65,37,0.25)',
  };

  const t = resolvedTheme as string;
  const accentHex = ACCENT[t] ?? '#7C3AED';
  const cardBgHex = CARD_BG[t] ?? '#161B2E';
  const pageBgHex = PAGE_BG[t] ?? '#0D0F1A';
  const textHex = TEXT_HEX[t] ?? '#F1F5F9';
  const mutedHex = MUTED_HEX[t] ?? '#94A3B8';
  const borderHex = BORDER_HEX[t] ?? 'rgba(255,255,255,0.08)';

  const firstName = session?.user?.name?.split(' ')[0] || 'there';
  const avatarUrl = session?.user?.image;

  const LogoContainer = () => (
    <div className="flex items-center justify-center shrink-0">
      <img
        src="/white-removebg-preview1.png"
        alt="Fluenzy AI Logo"
        className="w-9 h-9 object-contain filter drop-shadow-sm active:scale-95 transition-transform"
      />
    </div>
  );

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

  const bodyPaddingBottom = isLight ? '96px' : '80px';

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col sm:hidden"
      style={{ background: pageBgHex }}
    >
      {/* ── TOP HEADER ───────────────────────────────────────────────────── */}
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
            style={{
              color: isLight ? '#0F172A' : '#F8FAFC',
              background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)',
            }}
            aria-label="Open menu"
          >
            <Menu size={22} style={{ color: isLight ? '#0F172A' : '#F8FAFC', stroke: isLight ? '#0F172A' : '#F8FAFC' }} />
          </button>
          <LogoContainer />
          <span
            className="font-black text-lg tracking-tight"
            style={{ background: 'linear-gradient(90deg,#7C3AED,#4F46E5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          >
            Fluenzy AI
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="relative">
            <button
              onClick={() => setThemeMenuOpen(!themeMenuOpen)}
              className="p-2 rounded-xl active:opacity-60 flex items-center justify-center border shadow-sm transition-transform active:scale-95"
              style={{
                color: isLight ? '#1C1917' : '#F8FAFC',
                background: isLight ? '#FFFFFF' : 'rgba(255,255,255,0.08)',
                borderColor: isLight ? '#CBD5E1' : borderHex,
              }}
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
                      const itemTextColor = active
                        ? accentHex
                        : (isLight ? '#1C1917' : '#E2E8F0');
                      const itemIconColor = active
                        ? accentHex
                        : (isLight ? '#475569' : '#94A3B8');

                      return (
                        <button
                          key={opt.value}
                          onClick={() => { setTheme(opt.value); setThemeMenuOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-extrabold transition-colors"
                          style={{
                            color: itemTextColor,
                            WebkitTextFillColor: itemTextColor,
                            background: active
                              ? (isLight ? '#F3E8FF' : `${accentHex}25`)
                              : 'transparent',
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

          <NotificationBell isDark={!isLight} iconSize={20} />

          <button
            onClick={() => router.push('/profile')}
            className="w-9 h-9 rounded-xl overflow-hidden border-2 flex items-center justify-center active:opacity-80"
            style={{ borderColor: '#C4B5FD', background: 'linear-gradient(135deg,#7C3AED,#4F46E5)' }}
            aria-label="Profile"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={firstName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <span className="text-white font-black text-sm">{firstName[0]?.toUpperCase()}</span>
            )}
          </button>
        </div>
      </header>

      {/* ── SCROLLABLE BODY ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: bodyPaddingBottom }}>
        {/* Heading */}
        <div className="px-4 pt-5 pb-2">
          <h1 className="text-2xl font-black" style={{ color: textHex }}>Live Practice Modes</h1>
        </div>

        {/* ── LIVE CARDS GRID (2 columns) ───────────────────────────────── */}
        <section className="px-4 mt-3 mb-5">
          <div className="grid grid-cols-2 gap-3">
            {LIVE_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <motion.button
                  key={card.id}
                  onClick={() => router.push(card.href)}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                  className={`mobile-live-card relative flex flex-col items-start p-3.5 rounded-2xl border text-left transition-all duration-150 active:scale-[0.98] ${card.borderColor}`}
                  style={{
                    background: cardBgHex,
                    boxShadow: isLight ? '0 2px 12px rgba(0,0,0,0.06)' : '0 2px 8px rgba(0,0,0,0.2)',
                  }}
                >
                  <div className="flex items-start justify-between w-full mb-2.5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: `${card.accent}18` }}
                    >
                      <Icon size={20} style={{ color: card.accent, stroke: card.accent }} />
                    </div>
                    <span
                      data-status={card.badge}
                      className={`mobile-live-badge px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${card.badgeColor}`}
                    >
                      {card.badge}
                    </span>
                  </div>

                  <h3 className="text-[13px] font-black mb-1 leading-tight" style={{ color: textHex }}>
                    {card.title}
                  </h3>
                  <p
                    className="text-[10.5px] font-semibold leading-relaxed line-clamp-3 mb-3"
                    style={{ color: mutedHex }}
                  >
                    {card.description}
                  </p>

                  <div className="mt-auto flex items-center justify-end w-full">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center border"
                      style={{
                        borderColor: isLight ? '#CBD5E1' : 'rgba(255,255,255,0.1)',
                        background: isLight ? '#F8FAFC' : 'rgba(255,255,255,0.04)',
                      }}
                    >
                      <ChevronRight
                        size={14}
                        style={{
                          color: isLight ? '#475569' : '#94A3B8',
                          stroke: isLight ? '#475569' : '#94A3B8',
                        }}
                      />
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* ── MOTIVATION BANNER ──────────────────────────────────────────── */}
        <section className="px-4 mb-5">
          <div
            className="rounded-2xl p-4 border flex items-center gap-3"
            style={{ background: cardBgHex, borderColor: borderHex }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ background: isLight ? '#F3E8FF' : 'rgba(124,58,237,0.15)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
              <p className="text-[13px] font-bold leading-tight min-w-0" style={{ color: textHex }}>
                Real people. Real conversations. Real growth.
              </p>
              <div className="shrink-0 flex items-center gap-1">
                <div className="flex -space-x-2">
                  {[
                    'https://randomuser.me/api/portraits/women/44.jpg',
                    'https://randomuser.me/api/portraits/men/32.jpg',
                    'https://randomuser.me/api/portraits/women/68.jpg',
                  ].map((src) => (
                    <div
                      key={src}
                      className="w-8 h-8 rounded-full border-2 flex items-center justify-center"
                      style={{
                        borderColor: isLight ? '#FFFFFF' : cardBgHex,
                        background: 'linear-gradient(135deg,#7C3AED,#4F46E5)',
                      }}
                    >
                      <img src={src} alt="Live participant" className="w-full h-full rounded-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ── BOTTOM TAB BAR ──────────────────────────────────────────────── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-[210] sm:hidden flex items-end justify-around"
        style={{
          height: '64px',
          paddingBottom: 'env(safe-area-inset-bottom, 4px)',
        }}
      >
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
                className={`flex flex-col items-center justify-center gap-0.5 min-w-[54px] flex-1 active:opacity-75 ${
                  isHome ? '-mt-5' : 'pb-1'
                }`}
                aria-label={tab.label}
              >
                {isHome ? (
                  <div
                    className="force-purple-bg force-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 shrink-0"
                    style={{
                      backgroundColor: '#7C3AED',
                      background: '#7C3AED',
                      boxShadow: '0 6px 16px rgba(124, 58, 237, 0.45)',
                    }}
                  >
                    <Home
                      className="force-white"
                      size={22}
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
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── SIDEBAR DRAWER ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/55 z-[300]"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              key="drawer"
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed top-0 left-0 bottom-0 z-[310] flex flex-col shadow-2xl"
              style={{ width: '280px', background: cardBgHex, borderRight: `1px solid ${borderHex}` }}
            >
              <div
                className="flex items-center justify-between px-4 shrink-0"
                style={{ height: '56px', borderBottom: `1px solid ${borderHex}` }}
              >
                <div className="flex items-center gap-2.5">
                  <LogoContainer />
                  <span
                    className="font-black text-lg tracking-tight"
                    style={{
                      background: 'linear-gradient(90deg,#7C3AED,#4F46E5)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    Fluenzy AI
                  </span>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 rounded-lg active:opacity-60"
                  style={{ color: mutedHex }}
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
                {SIDEBAR_SECTIONS.map((section) => (
                  <div key={section.title}>
                    <p
                      className="font-black uppercase px-3 mb-1"
                      style={{ fontSize: '10px', letterSpacing: '0.12em', color: mutedHex }}
                    >
                      {section.title}
                    </p>
                    <div className="space-y-0.5">
                      {section.items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors active:opacity-70"
                          style={{ color: mutedHex }}
                        >
                          <item.icon size={17} className="shrink-0" />
                          <span className="text-sm font-medium" style={{ color: textHex }}>
                            {item.label}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 shrink-0" style={{ borderTop: `1px solid ${borderHex}` }}>
                <div
                  className="flex items-center gap-3 p-3 rounded-xl mb-2"
                  style={{ background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)' }}
                >
                  <div
                    className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center shrink-0"
                    style={{ background: 'linear-gradient(135deg,#7C3AED,#4F46E5)' }}
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={firstName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="text-white font-black text-sm">{firstName[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold truncate" style={{ color: textHex }}>
                      {session?.user?.name || 'User'}
                    </p>
                    <p className="truncate" style={{ fontSize: '11px', color: mutedHex }}>
                      {session?.user?.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setSidebarOpen(false); signOut({ callbackUrl: '/' }); }}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm font-semibold active:opacity-70"
                  style={{ color: '#EF4444' }}
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
