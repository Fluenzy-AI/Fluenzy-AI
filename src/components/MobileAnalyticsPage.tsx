"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
} from "recharts";
import { useTheme, themeConfig, ThemeName } from "@/contexts/ThemeContext";
import {
  TrendingUp, Brain, Mic, BookOpen, Target, Zap, ChevronDown, ChevronRight,
  Star, Activity, BarChart2, Clock, Award, MessageSquare, AlertCircle,
  Menu, Bell, Home, Link2, BarChart3, User, Sun, Moon, Leaf, Coffee,
  Terminal, Sparkles, X, LogOut, BookMarked, History, Code, GraduationCap,
  Users, Building2, Radio, Trophy, UserSearch, FileCheck, UserCheck,
} from "lucide-react";

/* â”€â”€â”€ Theme option list (same as MobileTrainPage) â”€â”€â”€ */
const THEME_OPTIONS: { value: ThemeName; label: string; icon: typeof Moon }[] = [
  { value: 'light',     label: 'Light',     icon: Sun      },
  { value: 'dark',      label: 'Dark',      icon: Moon     },
  { value: 'midnight',  label: 'Night',     icon: Moon     },
  { value: 'forest',    label: 'Forest',    icon: Leaf     },
  { value: 'parchment', label: 'Parchment', icon: Coffee   },
  { value: 'codeterm',  label: 'Code',      icon: Terminal },
];

/* â”€â”€â”€ Bottom tabs (same as MobileTrainPage) â”€â”€â”€ */
const TABS = [
  { label: 'Quick Links', icon: Link2,    href: '/train',     tabColor: '#8B5CF6' },
  { label: 'Practice',    icon: Target,   href: '/train/hr',  tabColor: '#10B981' },
  { label: 'Home',        icon: Home,     href: '/train',     tabColor: '#7C3AED' },
  { label: 'Analytics',   icon: BarChart3,href: '/analytics', tabColor: '#F97316' },
  { label: 'Profile',     icon: User,     href: '/profile',   tabColor: '#0EA5E9' },
];

/* â”€â”€â”€ Sidebar sections (same as MobileTrainPage) â”€â”€â”€ */
const SIDEBAR_SECTIONS = [
  {
    title: 'MAIN',
    items: [
      { label: 'Dashboard',       icon: Home,          href: '/train'              },
      { label: 'HR Interview',    icon: UserCheck,     href: '/train/hr'           },
      { label: 'Technical',       icon: Code,          href: '/train/technical'    },
      { label: 'GD Coach',        icon: GraduationCap, href: '/train/gd-coach'    },
      { label: 'GD Agent',        icon: Users,         href: '/train/gd-agent'    },
      { label: 'Company Tracks',  icon: Building2,     href: '/train/company'     },
      { label: 'Live GD',         icon: Radio,         href: '/train/live'        },
      { label: 'Competitions',    icon: Trophy,        href: '/train/competitions'},
      { label: 'English Learning',icon: BookOpen,      href: '/train/english'     },
      { label: 'Vocabulary',      icon: BookMarked,    href: '/train/vocabulary'  },
      { label: 'PromptIQ',        icon: Brain,         href: '/train/promptiq'    },
    ],
  },
  {
    title: 'JOB & CAREER',
    items: [
      { label: 'AI Job Search',   icon: UserSearch, href: '/train/job-search'   },
      { label: 'My Applications', icon: FileCheck,  href: '/train/applications' },
      { label: 'Resume ATS',      icon: Target,     href: '/ats'                },
    ],
  },
  {
    title: 'ACCOUNT',
    items: [
      { label: 'Analytics', icon: BarChart3, href: '/analytics' },
      { label: 'History',   icon: History,   href: '/history'   },
      { label: 'Profile',   icon: User,      href: '/profile'   },
      { label: 'Billing',   icon: Sparkles,  href: '/billing'   },
    ],
  },
];

/* â”€â”€â”€ Types â”€â”€â”€ */
interface MobileAnalyticsProps {
  summary: {
    communicationScore: number;
    confidenceScore: number;
    grammarScore: number;
    vocabularyScore: number;
    technicalScore: number;
    overallScore: number;
    overallStatus: string;
    totalSessions: number;
    totalDurationMinutes: number;
    totalQuestions: number;
    completionRate: number;
  };
  insights: {
    focusAreas: string[];
    tips: string[];
    mostPracticed: Array<{ name: string; count: number }>;
    commonGrammarIssues: string[];
  };
  trends: Array<{ date: string; communication: number; confidence: number; grammar: number; technical: number }>;
  history: {
    sessions: Array<{ sessionId: string; company: string; module: string; date: string; score: number; status: string }>;
  };
  advanced: {
    communication: { speakingWpm: number; fillerRate: number; sentenceStructureScore: number; toneConsistency: number };
    grammar: { beforeAfter: { before: number; after: number }; errorFrequency: number };
    coach: { strengths: string[]; weaknesses: string[]; plan7Day: string[]; nextSessionFocus: string; readinessSummary: string };
    behavioral?: { compositeRadar: Array<{ metric: string; score: number }>; hasData: boolean };
  };
  onRangeChange?: (range: string) => void;
  range?: string;
}

/* â”€â”€â”€ Score Ring â”€â”€â”€ */
const MiniRing = ({ score, color, label }: { score: number; color: string; label: string }) => {
  const r = 28;
  const stroke = 5;
  const nr = r - stroke / 2;
  const circ = nr * 2 * Math.PI;
  const offset = circ - (Math.max(0, Math.min(100, score)) / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg height={r * 2} width={r * 2} className="-rotate-90">
        <circle stroke="#1e293b" fill="transparent" strokeWidth={stroke} r={nr} cx={r} cy={r} />
        <circle stroke={color} fill="transparent" strokeLinecap="round" strokeWidth={stroke}
          strokeDasharray={`${circ} ${circ}`} style={{ strokeDashoffset: offset }} r={nr} cx={r} cy={r} />
      </svg>
      <span className="text-[10px] font-bold text-white -mt-8 mb-6">{Math.round(score)}</span>
      <span className="text-[9px] text-slate-400 text-center leading-tight">{label}</span>
    </div>
  );
};

/* â”€â”€â”€ Accordion â”€â”€â”€ */
const Accordion = ({
  title, icon: Icon, children, defaultOpen = false, textHex, mutedHex, borderHex,
}: {
  title: string; icon: React.ElementType; children: React.ReactNode; defaultOpen?: boolean;
  textHex: string; mutedHex: string; borderHex: string;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${borderHex}`, background: 'rgba(255,255,255,0.04)' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-4 text-left"
      >
        <span className="flex items-center gap-2.5 text-sm font-bold" style={{ color: textHex }}>
          <Icon className="h-4 w-4" style={{ color: '#a78bfa' }} />
          {title}
        </span>
        <ChevronDown
          className="h-4 w-4 transition-transform duration-300"
          style={{ color: mutedHex, transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
};

/* â”€â”€â”€ Status badge â”€â”€â”€ */
const StatusBadge = ({ status }: { status: string }) => {
  const color =
    status === "Passed" || status === "Excellent" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" :
      status === "Good" ? "bg-blue-500/20 text-blue-300 border-blue-500/30" :
        "bg-amber-500/20 text-amber-300 border-amber-500/30";
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${color}`}>{status}</span>
  );
};

const formatDur = (min: number) => {
  if (!min) return "0m";
  const h = Math.floor(min / 60), m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

/* â”€â”€â”€ Radar custom tick wraps two-word labels to two lines â”€â”€â”€ */
function RadarTick({ x, y, payload, textAnchor }: { x?: number; y?: number; payload?: { value: string }; textAnchor?: "middle" | "start" | "end" | "inherit" }) {
  const words = (payload?.value ?? "").split(" ");
  return (
    <text x={x} y={y} textAnchor={(textAnchor ?? "middle") as "middle" | "start" | "end"} fill="#cbd5e1" fontSize={11} fontWeight={600}>
      {words.length === 1 ? (
        <tspan x={x} dy="0">{words[0]}</tspan>
      ) : (
        <>
          <tspan x={x} dy="-5">{words[0]}</tspan>
          <tspan x={x} dy="13">{words[1]}</tspan>
        </>
      )}
    </text>
  );
}

/* \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
   MobileAnalyticsPage \u2014 \u2264640 px
   Same top/bottom nav as MobileTrainPage (Light/Dark/Night/Forest/Parchment/Code)
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */
const MobileAnalyticsPage = ({ summary, insights, trends, history, advanced, onRangeChange, range = "all" }: MobileAnalyticsProps) => {
  const { data: session } = useSession();
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);

  const _ct = themeConfig[resolvedTheme] || themeConfig.dark;
  const isLight = resolvedTheme === 'light' || resolvedTheme === 'parchment';

  const firstName = session?.user?.name?.split(' ')[0] || 'there';
  const avatarUrl = session?.user?.image;

  /* \u2500\u2500 Per-theme colour tokens (same as MobileTrainPage) \u2500\u2500\u2500\u2500\u2500\u2500 */
  const ACCENT: Record<string, string> = {
    light: '#5A2D82', parchment: '#5A2D82',
    dark: '#7C3AED', midnight: '#7C3AED',
    forest: '#F59E0B', codeterm: '#CC4125',
  };
  const CARD_BG: Record<string, string> = {
    light: '#F8FAFC', parchment: '#FFFFFF',
    dark: '#161B2E', midnight: 'rgba(15,39,68,0.9)',
    forest: 'rgba(17,28,20,0.9)', codeterm: '#141414',
  };
  const PAGE_BG: Record<string, string> = {
    light: '#FFFFFF', parchment: 'hsl(42 18% 93%)',
    dark: '#0D0F1A', midnight: '#0a1929',
    forest: '#0b140e', codeterm: '#0D0D0D',
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
  const BORDER_HEX: Record<string, string> = {
    light: '#E5E7EB', parchment: '#E9ECEF',
    dark: 'rgba(255,255,255,0.08)', midnight: 'rgba(255,255,255,0.08)',
    forest: 'rgba(180,120,30,0.2)', codeterm: 'rgba(204,65,37,0.25)',
  };

  const t = resolvedTheme as string;
  const accentHex = ACCENT[t] ?? '#7C3AED';
  const cardBgHex = CARD_BG[t] ?? '#161B2E';
  const pageBgHex = PAGE_BG[t] ?? '#0D0F1A';
  const textHex   = TEXT_HEX[t] ?? '#F1F5F9';
  const mutedHex  = MUTED_HEX[t] ?? '#94A3B8';
  const borderHex = BORDER_HEX[t] ?? 'rgba(255,255,255,0.08)';

  /* \u2500\u2500 Helpers \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  const LogoContainer = () => (
    <div className="flex items-center justify-center shrink-0">
      <img src="/white-removebg-preview1.png" alt="Fluenzy AI Logo"
        className="w-9 h-9 object-contain filter drop-shadow-sm active:scale-95 transition-transform" />
    </div>
  );

  const ThemeIcon = () => {
    const iconColor = isLight ? '#1C1917' : '#F8FAFC';
    const icons: Record<ThemeName, React.ReactNode> = {
      light:    <Sun      size={18} style={{ color: iconColor, stroke: iconColor }} />,
      dark:     <Moon     size={18} style={{ color: iconColor, stroke: iconColor }} />,
      midnight: <Sparkles size={18} style={{ color: iconColor, stroke: iconColor }} />,
      forest:   <Leaf     size={18} style={{ color: iconColor, stroke: iconColor }} />,
      parchment:<Coffee   size={18} style={{ color: iconColor, stroke: iconColor }} />,
      codeterm: <Terminal size={18} style={{ color: iconColor, stroke: iconColor }} />,
    };
    return <>{icons[theme] || <Moon size={18} style={{ color: iconColor, stroke: iconColor }} />}</>;
  };

  /* \u2500\u2500 Analytics data \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  const recentSessions = history.sessions.slice(0, 5);
  const latestTrend = trends.slice(-5);
  const communicationRadar = [
    { metric: 'Communication', score: Number(summary.communicationScore.toFixed(1)) },
    { metric: 'Confidence',    score: Number(summary.confidenceScore.toFixed(1))    },
    { metric: 'Grammar',       score: Number(summary.grammarScore.toFixed(1))       },
    { metric: 'Speaking Pace', score: Number(advanced.communication.speakingWpm.toFixed(1)) },
    { metric: 'Sentence',      score: Number(advanced.communication.sentenceStructureScore.toFixed(1)) },
    { metric: 'Tone',          score: Number(advanced.communication.toneConsistency.toFixed(1)) },
  ];
  const overallColor = summary.overallScore >= 80 ? '#22c55e' : summary.overallScore >= 60 ? '#38bdf8' : '#f97316';
  const bodyPaddingBottom = isLight ? '96px' : '80px';
  const surfaceStyle = { background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)', border: `1px solid ${borderHex}` };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col sm:hidden" style={{ background: pageBgHex }}>

      {/* \u2500\u2500 TOP HEADER (exact same as MobileTrainPage) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */}
      <header
        className="flex items-center justify-between px-4 shrink-0"
        style={{
          height: '56px',
          background: isLight ? pageBgHex : cardBgHex,
          borderBottom: isLight ? 'none' : `1px solid ${borderHex}`,
          boxShadow: isLight ? 'none' : '0 1px 6px rgba(0,0,0,0.12)',
        }}
      >
        {/* Left: hamburger + logo + brand */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl active:opacity-60 flex items-center justify-center"
            style={{ color: isLight ? '#0F172A' : '#F8FAFC', background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)' }}
            aria-label="Open menu"
          >
            <Menu size={22} style={{ color: isLight ? '#0F172A' : '#F8FAFC', stroke: isLight ? '#0F172A' : '#F8FAFC' }} />
          </button>
          <LogoContainer />
          <span className="font-black text-lg tracking-tight"
            style={{ background: 'linear-gradient(90deg,#7C3AED,#4F46E5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Fluenzy AI
          </span>
        </div>

        {/* Right: theme toggle + bell + avatar */}
        <div className="flex items-center gap-1.5">
          {/* Theme toggle */}
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

          {/* Bell */}
          <Link
            href="/notifications"
            className="relative p-2 rounded-xl active:opacity-60 flex items-center justify-center"
            style={{ color: isLight ? '#0F172A' : '#F8FAFC', background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)' }}
            aria-label="Notifications"
          >
            <Bell size={20} style={{ color: isLight ? '#0F172A' : '#F8FAFC', stroke: isLight ? '#0F172A' : '#F8FAFC' }} />
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 text-white text-[9px] font-black rounded-full flex items-center justify-center"
              style={{ background: '#7C3AED' }}>
              3
            </span>
          </Link>

          {/* Avatar */}
          <button
            onClick={() => router.push('/profile')}
            className="w-9 h-9 rounded-xl overflow-hidden border-2 flex items-center justify-center active:opacity-80"
            style={{ borderColor: '#C4B5FD', background: 'linear-gradient(135deg,#7C3AED,#4F46E5)' }}
            aria-label="Profile"
          >
            {avatarUrl
              ? <img src={avatarUrl} alt={firstName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              : <span className="text-white font-black text-sm">{firstName[0]?.toUpperCase()}</span>
            }
          </button>
        </div>
      </header>

      {/* \u2500\u2500 SCROLLABLE BODY \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: bodyPaddingBottom }}>

        {/* \u2500\u2500 PAGE HEADER \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */}
        <div className="relative overflow-hidden px-5 pb-8 pt-5"
          style={{ background: isLight ? pageBgHex : 'linear-gradient(to bottom, rgba(88,28,135,0.15), transparent)' }}>
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-bold"
            style={{ border: `1px solid ${accentHex}40`, background: `${accentHex}18`, color: isLight ? accentHex : '#c4b5fd' }}
          >
            <BarChart2 className="h-3 w-3" style={{ color: accentHex }} />
            Performance Analytics
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-2xl font-extrabold leading-tight tracking-tight mb-1" style={{ color: textHex }}
          >
            Analytics{' '}
            <span style={{ background: 'linear-gradient(90deg,#a78bfa,#38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Dashboard
            </span>
          </motion.h1>
          <p className="text-xs mb-4" style={{ color: mutedHex }}>Your communication-first performance report</p>

          {/* Full Desktop View button */}
          <Link
            href="/analytics?view=full"
            className="flex items-center justify-center gap-2 w-full rounded-2xl px-4 py-3 text-sm font-bold mb-5 active:scale-[0.97] transition-transform"
            style={{ border: `1px solid ${accentHex}50`, background: `${accentHex}12`, color: isLight ? accentHex : '#67e8f9' }}
          >
            <BarChart2 className="h-4 w-4" />
            View Full Analytics Dashboard
            <ChevronRight className="h-4 w-4 ml-auto" />
          </Link>

          {/* Range selector */}
          {onRangeChange && (
            <select
              value={range}
              onChange={(e) => onRangeChange(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-sm mb-5 focus:outline-none"
              style={{ border: `1px solid ${borderHex}`, background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)', color: textHex }}
            >
              {[['all','All Time'],['last_session','Last Session'],['7d','Last 7 Days'],['30d','Last 30 Days'],['3m','Last 3 Months'],['1y','Last 1 Year']].map(([v, l]) => (
                <option key={v} value={v} style={{ backgroundColor: pageBgHex }}>{l}</option>
              ))}
            </select>
          )}

          {/* Overall score big ring */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
            className="flex items-center gap-5 rounded-2xl p-4" style={surfaceStyle}
          >
            <div className="relative flex flex-col items-center">
              {(() => {
                const r = 44, stroke = 7, nr = r - stroke / 2;
                const circ = nr * 2 * Math.PI;
                const offset = circ - (Math.max(0, Math.min(100, summary.overallScore)) / 100) * circ;
                return (
                  <>
                    <svg height={r * 2} width={r * 2} className="-rotate-90">
                      <circle stroke="#1e293b" fill="transparent" strokeWidth={stroke} r={nr} cx={r} cy={r} />
                      <circle stroke={overallColor} fill="transparent" strokeLinecap="round" strokeWidth={stroke}
                        strokeDasharray={`${circ} ${circ}`} style={{ strokeDashoffset: offset }} r={nr} cx={r} cy={r} />
                    </svg>
                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xl font-black" style={{ color: textHex }}>
                      {Math.round(summary.overallScore)}
                    </span>
                  </>
                );
              })()}
            </div>
            <div>
              <StatusBadge status={summary.overallStatus} />
              <p className="text-lg font-black mt-1" style={{ color: textHex }}>Overall Score</p>
              <p className="text-xs" style={{ color: mutedHex }}>{summary.totalSessions} sessions Â· {formatDur(summary.totalDurationMinutes)} practice</p>
            </div>
          </motion.div>
        </div>

        {/* \u2500\u2500 CORE SKILLS \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */}
        <section className="px-5 pt-6 pb-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: accentHex }}>Core Skills</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Communication', score: summary.communicationScore, color: '#a78bfa' },
              { label: 'Confidence',    score: summary.confidenceScore,    color: '#38bdf8' },
              { label: 'Grammar',       score: summary.grammarScore,       color: '#34d399' },
            ].map(({ label, score, color }) => (
              <motion.div key={label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="rounded-2xl p-3 flex flex-col items-center" style={surfaceStyle}>
                <MiniRing score={score} color={color} label={label} />
              </motion.div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            {[
              { icon: Mic,          label: 'Speaking Pace',   value: `${advanced.communication.speakingWpm.toFixed(1)} WPM`, color: 'from-orange-500 to-amber-500'  },
              { icon: BookOpen,     label: 'Vocabulary',      value: `${Math.round(summary.vocabularyScore ?? 0)}`,          color: 'from-purple-500 to-pink-500'   },
              { icon: MessageSquare,label: 'Tone Consistency',value: `${Math.round(advanced.communication.toneConsistency)}%`,color:'from-cyan-500 to-blue-500'      },
              { icon: Target,       label: 'Completion Rate', value: `${summary.completionRate}%`,                           color: 'from-emerald-500 to-teal-500'  },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="rounded-2xl px-3 py-3 flex items-center gap-2.5" style={surfaceStyle}>
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${color}`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-[10px] leading-none" style={{ color: mutedHex }}>{label}</p>
                  <p className="text-sm font-bold mt-0.5" style={{ color: textHex }}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* \u2500\u2500 QUICK STATS \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */}
        <section className="px-5 py-2">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Sessions',  value: summary.totalSessions },
              { label: 'Questions', value: summary.totalQuestions },
              { label: 'Practice',  value: formatDur(summary.totalDurationMinutes) },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl p-3 text-center" style={surfaceStyle}>
                <p className="text-lg font-extrabold" style={{ color: textHex }}>{value}</p>
                <p className="text-[10px] mt-0.5" style={{ color: mutedHex }}>{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* \u2500\u2500 RECENT TREND \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */}
        {latestTrend.length > 0 && (
          <section className="px-5 py-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: '#a78bfa' }}>Recent Trend</p>
            <div className="rounded-2xl p-4 overflow-x-auto" style={surfaceStyle}>
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ fontSize: '10px' }}>
                    <th className="text-left pb-2" style={{ color: mutedHex }}>Date</th>
                    <th className="text-right pb-2" style={{ color: '#c4b5fd' }}>Comm.</th>
                    <th className="text-right pb-2" style={{ color: '#7dd3fc' }}>Conf.</th>
                    <th className="text-right pb-2" style={{ color: '#6ee7b7' }}>Gram.</th>
                  </tr>
                </thead>
                <tbody>
                  {latestTrend.map((tr) => (
                    <tr key={tr.date} style={{ borderTop: `1px solid ${borderHex}` }}>
                      <td className="py-1.5" style={{ color: mutedHex }}>{tr.date.slice(5)}</td>
                      <td className="text-right font-semibold" style={{ color: '#c4b5fd' }}>{tr.communication}</td>
                      <td className="text-right font-semibold" style={{ color: '#7dd3fc' }}>{tr.confidence}</td>
                      <td className="text-right font-semibold" style={{ color: '#6ee7b7' }}>{tr.grammar}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* \u2500\u2500 ACCORDIONS \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */}
        <section className="px-5 space-y-3 pb-4">
          <Accordion title="AI Coach Tips" icon={Brain} defaultOpen textHex={textHex} mutedHex={mutedHex} borderHex={borderHex}>
            <div className="space-y-2">
              {insights.tips.length > 0 ? insights.tips.map((tip, i) => (
                <div key={i} className="flex gap-2.5 rounded-xl px-3 py-2.5" style={surfaceStyle}>
                  <Zap className="h-3.5 w-3.5 text-yellow-400 shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed" style={{ color: mutedHex }}>{tip}</p>
                </div>
              )) : <p className="text-xs" style={{ color: mutedHex }}>Complete more sessions to get personalized tips.</p>}
            </div>
          </Accordion>

          <Accordion title="Focus Areas" icon={Target} textHex={textHex} mutedHex={mutedHex} borderHex={borderHex}>
            <div className="space-y-2">
              {insights.focusAreas.length > 0 ? insights.focusAreas.map((area) => (
                <div key={area} className="flex items-center justify-between rounded-xl px-3 py-2.5"
                  style={{ border: `1px solid ${accentHex}30`, background: `${accentHex}12` }}>
                  <span className="text-xs font-semibold" style={{ color: isLight ? accentHex : '#c4b5fd' }}>{area}</span>
                  <AlertCircle className="h-3.5 w-3.5" style={{ color: accentHex }} />
                </div>
              )) : <p className="text-xs" style={{ color: mutedHex }}>No focus areas identified yet.</p>}
            </div>
          </Accordion>

          {advanced.coach.plan7Day.length > 0 && (
            <Accordion title="7-Day Improvement Plan" icon={Activity} textHex={textHex} mutedHex={mutedHex} borderHex={borderHex}>
              <ol className="space-y-2">
                {advanced.coach.plan7Day.map((step, i) => (
                  <li key={i} className="flex gap-2.5 items-start">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-blue-600 text-[10px] font-black text-white">{i + 1}</span>
                    <p className="text-xs leading-relaxed" style={{ color: mutedHex }}>{step}</p>
                  </li>
                ))}
              </ol>
            </Accordion>
          )}

          {(advanced.coach.strengths.length > 0 || advanced.coach.weaknesses.length > 0) && (
            <Accordion title="Strengths &amp; Weaknesses" icon={Award} textHex={textHex} mutedHex={mutedHex} borderHex={borderHex}>
              {advanced.coach.strengths.length > 0 && (
                <div className="mb-3">
                  <p className="text-[10px] font-bold uppercase text-emerald-400 mb-2">Strengths</p>
                  <div className="space-y-1.5">
                    {advanced.coach.strengths.map((s, i) => (
                      <div key={i} className="flex gap-2 items-start rounded-xl px-3 py-2"
                        style={{ border: '1px solid rgba(52,211,153,0.2)', background: 'rgba(52,211,153,0.08)' }}>
                        <Star className="h-3 w-3 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="text-xs text-emerald-300">{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {advanced.coach.weaknesses.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase text-amber-400 mb-2">Needs Work</p>
                  <div className="space-y-1.5">
                    {advanced.coach.weaknesses.map((w, i) => (
                      <div key={i} className="flex gap-2 items-start rounded-xl px-3 py-2"
                        style={{ border: '1px solid rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.08)' }}>
                        <AlertCircle className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />
                        <span className="text-xs text-amber-300">{w}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Accordion>
          )}

          {(advanced.grammar.beforeAfter.before > 0 || advanced.grammar.beforeAfter.after > 0) && (
            <Accordion title="Grammar Progress" icon={BookOpen} textHex={textHex} mutedHex={mutedHex} borderHex={borderHex}>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl p-3 text-center" style={surfaceStyle}>
                  <p className="text-xs mb-1" style={{ color: mutedHex }}>Before</p>
                  <p className="text-2xl font-extrabold text-amber-300">{Math.round(advanced.grammar.beforeAfter.before)}</p>
                </div>
                <div className="rounded-xl p-3 text-center"
                  style={{ border: '1px solid rgba(52,211,153,0.2)', background: 'rgba(52,211,153,0.08)' }}>
                  <p className="text-xs mb-1" style={{ color: mutedHex }}>After</p>
                  <p className="text-2xl font-extrabold text-emerald-300">{Math.round(advanced.grammar.beforeAfter.after)}</p>
                </div>
              </div>
              {advanced.grammar.errorFrequency > 0 && (
                <p className="text-xs mt-3" style={{ color: mutedHex }}>Grammar issues in {advanced.grammar.errorFrequency.toFixed(1)}% of responses.</p>
              )}
            </Accordion>
          )}

          {recentSessions.length > 0 && (
            <Accordion title="Recent Sessions" icon={Clock} textHex={textHex} mutedHex={mutedHex} borderHex={borderHex}>
              <div className="space-y-2">
                {recentSessions.map((s) => (
                  <div key={s.sessionId} className="flex items-center justify-between rounded-xl px-3 py-2.5" style={surfaceStyle}>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: textHex }}>{s.company || s.module}</p>
                      <p className="text-[10px]" style={{ color: mutedHex }}>{s.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold" style={{ color: textHex }}>{Math.round(s.score)}</span>
                      <StatusBadge status={s.status} />
                    </div>
                  </div>
                ))}
              </div>
            </Accordion>
          )}
        </section>

        {/* \u2500\u2500 RADAR CHARTS \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */}
        <section className="px-4 pb-4 space-y-4">
          {advanced.behavioral?.hasData && advanced.behavioral.compositeRadar.length > 0 && (
            <div className="rounded-2xl p-4" style={surfaceStyle}>
              <p className="text-sm font-bold mb-2" style={{ color: textHex }}>Body Language Composite Radar</p>
              <div style={{ width: '100%', height: '260px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={advanced.behavioral.compositeRadar} outerRadius="65%" margin={{ top: 25, right: 40, bottom: 25, left: 40 }}>
                    <PolarGrid stroke={borderHex} />
                    <PolarAngleAxis dataKey="metric" tick={<RadarTick />} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar dataKey="score" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.4} strokeWidth={2} />
                    <ChartTooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          <div className="rounded-2xl p-4" style={surfaceStyle}>
            <p className="text-sm font-bold mb-2" style={{ color: textHex }}>Communication Composite Radar</p>
            <div style={{ width: '100%', height: '260px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={communicationRadar} outerRadius="65%" margin={{ top: 25, right: 40, bottom: 25, left: 40 }}>
                  <PolarGrid stroke={borderHex} />
                  <PolarAngleAxis dataKey="metric" tick={<RadarTick />} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar dataKey="score" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.4} strokeWidth={2} />
                  <ChartTooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* \u2500\u2500 CTA FOOTER \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */}
        <section className="px-5 pt-2 pb-6">
          <div className="rounded-3xl p-5 text-center"
            style={{ border: `1px solid ${accentHex}40`, background: `linear-gradient(135deg,${accentHex}18,rgba(59,130,246,0.12))` }}>
            <p className="text-xs mb-1" style={{ color: mutedHex }}>Next Focus Area</p>
            <h3 className="text-base font-extrabold mb-3" style={{ color: textHex }}>{advanced.coach.nextSessionFocus || 'Keep practicing!'}</h3>
            <Link
              href="/train"
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-lg active:scale-[0.97]"
              style={{ background: 'linear-gradient(135deg,#7C3AED,#4F46E5)', boxShadow: '0 6px 20px rgba(124,58,237,0.3)' }}
            >
              <TrendingUp className="h-4 w-4" />
              Start Training Session
            </Link>
            <Link
              href="/analytics?view=full"
              className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold mt-2 active:scale-[0.97]"
              style={{ border: `1px solid ${borderHex}`, background: 'rgba(255,255,255,0.04)', color: mutedHex }}
            >
              View Full Report
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>

      {/* \u2500\u2500 ASK AI FAB (exact same as MobileTrainPage) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.7, type: 'spring', stiffness: 300, damping: 20 }}
        onClick={() => router.push('/train/chat')}
        className="fixed right-5 z-[210] sm:hidden w-14 h-14 rounded-full flex flex-col items-center justify-center gap-0.5 active:scale-95 shadow-xl"
        style={{
          bottom: '80px',
          background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)',
          boxShadow: '0 8px 24px rgba(124, 58, 237, 0.45)',
          border: '1.5px solid rgba(255, 255, 255, 0.3)',
        }}
        aria-label="Ask AI"
      >
        <Sparkles size={18} style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
        <span className="font-black tracking-wide" style={{ fontSize: '9px', color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>Ask AI</span>
      </motion.button>

      {/* \u2500\u2500 BOTTOM TAB BAR (exact same as MobileTrainPage â€” with Analytics highlighted) \u2500\u2500 */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-[210] sm:hidden flex items-end justify-around"
        style={{ height: '64px', paddingBottom: 'env(safe-area-inset-bottom, 4px)' }}
      >
        {/* Background curvy SVG */}
        <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
          <svg
            viewBox="0 0 375 64"
            preserveAspectRatio="none"
            className="w-full h-full"
            style={{ filter: isLight ? 'drop-shadow(0px -4px 12px rgba(0,0,0,0.08))' : 'drop-shadow(0px -4px 16px rgba(0,0,0,0.3))' }}
          >
            <path
              d="M 0,0 L 132,0 C 152,0 160,24 187.5,24 C 215,24 223,0 243,0 L 375,0 L 375,64 L 0,64 Z"
              fill={isLight ? '#FFFFFF' : cardBgHex}
              stroke={isLight ? '#E2E8F0' : borderHex}
              strokeWidth="1"
            />
          </svg>
        </div>

        {/* Tab items */}
        <div className="relative z-10 flex items-center justify-around w-full h-full pt-1 px-1">
          {TABS.map((tab) => {
            const isHome     = tab.label === 'Home';
            const isActive   = tab.label === 'Analytics'; // highlight current page
            const activeColor       = isLight ? '#7C3AED' : accentHex;
            const inactiveIconColor = isLight ? '#475569' : mutedHex;
            const inactiveTextColor = isLight ? '#334155' : mutedHex;
            const iconColor  = (isHome || isActive) ? activeColor : inactiveIconColor;
            const textColor  = (isHome || isActive) ? activeColor : inactiveTextColor;

            return (
              <Link
                key={tab.label}
                href={tab.href}
                className={`flex flex-col items-center justify-center gap-0.5 min-w-[54px] flex-1 active:opacity-75 ${isHome ? '-mt-5' : 'pb-1'}`}
                aria-label={tab.label}
              >
                {isHome ? (
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 shrink-0"
                    style={{ backgroundColor: '#7C3AED', boxShadow: '0 6px 16px rgba(124, 58, 237, 0.45)' }}
                  >
                    <Home size={22} strokeWidth={2.2} style={{ color: '#FFFFFF', stroke: '#FFFFFF', fill: 'none' }} />
                  </div>
                ) : (
                  <tab.icon size={22} style={{ color: iconColor, stroke: iconColor }} />
                )}
                <span
                  className="font-extrabold"
                  style={{ fontSize: '10px', color: textColor, WebkitTextFillColor: textColor, marginTop: isHome ? '1px' : '0px' }}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* \u2500\u2500 SIDEBAR DRAWER (exact same as MobileTrainPage) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */}
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
              <div className="flex items-center justify-between px-4 shrink-0"
                style={{ height: '56px', borderBottom: `1px solid ${borderHex}` }}>
                <div className="flex items-center gap-2.5">
                  <LogoContainer />
                  <span className="font-black text-lg tracking-tight"
                    style={{ background: 'linear-gradient(90deg,#7C3AED,#4F46E5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Fluenzy AI
                  </span>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg active:opacity-60" style={{ color: mutedHex }} aria-label="Close menu">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
                {SIDEBAR_SECTIONS.map((section) => (
                  <div key={section.title}>
                    <p className="font-black uppercase px-3 mb-1" style={{ fontSize: '10px', letterSpacing: '0.12em', color: mutedHex }}>
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
                          <span className="text-sm font-medium" style={{ color: textHex }}>{item.label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 shrink-0" style={{ borderTop: `1px solid ${borderHex}` }}>
                <div className="flex items-center gap-3 p-3 rounded-xl mb-2"
                  style={{ background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)' }}>
                  <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center shrink-0"
                    style={{ background: 'linear-gradient(135deg,#7C3AED,#4F46E5)' }}>
                    {avatarUrl
                      ? <img src={avatarUrl} alt={firstName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      : <span className="text-white font-black text-sm">{firstName[0]?.toUpperCase()}</span>
                    }
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold truncate" style={{ color: textHex }}>{session?.user?.name || 'User'}</p>
                    <p className="truncate" style={{ fontSize: '11px', color: mutedHex }}>{session?.user?.email}</p>
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
};

export default MobileAnalyticsPage;

