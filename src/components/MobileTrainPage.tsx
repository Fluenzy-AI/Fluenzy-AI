'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, Bell, ChevronRight, Home, Link2, Heart,
  BarChart3, User, Target, Users, Code,
  Building2, History, GraduationCap, Radio,
  Trophy, Sparkles, Brain, BookOpen, X,
  BookMarked, Clock, LogOut, Sun, Moon,
  Leaf, Coffee, Terminal, UserSearch,
  FileCheck, Bot, UserCheck, Mic,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useTheme, themeConfig, ThemeName } from '@/contexts/ThemeContext';

/* ─── Theme option list ──────────────────────────────────────────────────── */
const THEME_OPTIONS: { value: ThemeName; label: string; icon: typeof Moon }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'midnight', label: 'Night', icon: Moon },
  { value: 'forest', label: 'Forest', icon: Leaf },
  { value: 'parchment', label: 'Parchment', icon: Coffee },
  { value: 'codeterm', label: 'Code', icon: Terminal },
];

const MoreDots = () => (
  <span style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '1px', color: '#495057' }}>···</span>
);

/* ─── Company tiles ──────────────────────────────────────────────────────── */
interface CompanyItem {
  label: string;
  iconUrl?: string;
  logo?: React.ComponentType | null;
  href: string;
  isAdd?: boolean;
}

const COMPANIES: CompanyItem[] = [
  { label: 'Add Company', logo: null, href: '/train/company', isAdd: true },
  { label: 'Google', iconUrl: '/companeyicon/Google-Logo.wine.svg', href: '/train/company?track=google' },
  { label: 'Microsoft', iconUrl: '/companeyicon/Microsoft-Logo.wine.svg', href: '/train/company?track=microsoft' },
  { label: 'Amazon', iconUrl: '/companeyicon/Amazon_(company)-Logo.wine.svg', href: '/train/company?track=amazon' },
  { label: 'Flipkart', iconUrl: '/companeyicon/Flipkart-Logo.wine.svg', href: '/train/company?track=flipkart' },
  { label: 'TCS', iconUrl: '/companeyicon/Tata_Consultancy_Services_Logo_2020.svg', href: '/train/company?track=tcs' },
  { label: 'Deloitte', iconUrl: '/companeyicon/deloitte.svg', href: '/train/company?track=deloitte' },
  { label: 'Goldman', iconUrl: '/companeyicon/goldmansachs-ar21.svg', href: '/train/company?track=goldmansachs' },
  { label: 'Chase', iconUrl: '/companeyicon/icons8-chase-bank-480.svg', href: '/train/company?track=jpmorgan' },
  { label: 'More', logo: MoreDots, href: '/train/company' },
];

/* ─── 3D Solid Vector Icon Components ── */
const CompanyInterviewIcon = () => (
  <svg width="46" height="46" viewBox="0 0 48 48" fill="none">
    <rect x="14" y="8" width="20" height="34" rx="4" fill="#2563EB" />
    <rect x="6" y="20" width="10" height="22" rx="3" fill="#1D4ED8" />
    <rect x="32" y="16" width="10" height="26" rx="3" fill="#3B82F6" />
    <rect x="18" y="14" width="4" height="4" rx="1" fill="#93C5FD" />
    <rect x="26" y="14" width="4" height="4" rx="1" fill="#93C5FD" />
    <rect x="18" y="22" width="4" height="4" rx="1" fill="#93C5FD" />
    <rect x="26" y="22" width="4" height="4" rx="1" fill="#93C5FD" />
    <rect x="18" y="30" width="4" height="4" rx="1" fill="#93C5FD" />
    <rect x="26" y="30" width="4" height="4" rx="1" fill="#93C5FD" />
  </svg>
);

const AIJobSearchIcon = () => (
  <svg width="46" height="46" viewBox="0 0 48 48" fill="none">
    <circle cx="21" cy="21" r="14" fill="#10B981" />
    <circle cx="21" cy="17" r="4.5" fill="#FFFFFF" />
    <path d="M13.5 27.5C13.5 24.5 16.8 23 21 23C25.2 23 28.5 24.5 28.5 27.5V28.5H13.5V27.5Z" fill="#FFFFFF" />
    <rect x="29.5" y="27.5" width="7" height="15" rx="3.5" transform="rotate(-45 29.5 27.5)" fill="#059669" />
  </svg>
);

const ResumeATSIcon = () => (
  <svg width="46" height="46" viewBox="0 0 48 48" fill="none">
    <path d="M10 8C10 5.79086 11.7909 4 14 4H26L36 14V38C36 40.2091 34.2091 42 32 42H14C11.7909 42 10 40.2091 10 38V8Z" fill="#9333EA" />
    <path d="M26 4V14H36L26 4Z" fill="#C084FC" />
    <rect x="16" y="16" width="12" height="3" rx="1.5" fill="#F3E8FF" />
    <rect x="16" y="22" width="8" height="3" rx="1.5" fill="#F3E8FF" />
    <path d="M34 25C34 25 27 27 27 33C27 39 34 42 34 42C34 42 41 39 41 33C41 27 34 25 34 25Z" fill="#7E22CE" />
    <path d="M31 33L33.5 35.5L37.5 31.5" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const GDAgentIcon = () => (
  <svg width="46" height="46" viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="14" r="7" fill="#EA580C" />
    <path d="M12 36C12 30 17 27 24 27C31 27 36 30 36 36V38H12V36Z" fill="#EA580C" />
    <circle cx="12" cy="18" r="5" fill="#F97316" />
    <path d="M3 35C3 30.5 7 28 12 28C13.8 28 15.4 28.3 16.8 28.9C15.6 30.8 15 33.2 15 36V38H3V35Z" fill="#F97316" />
    <circle cx="36" cy="18" r="5" fill="#FB923C" />
    <path d="M45 35C45 30.5 41 28 36 28C34.2 28 32.6 28.3 31.2 28.9C32.4 30.8 33 33.2 33 36V38H45V35Z" fill="#FB923C" />
  </svg>
);

const AssessmentIcon = () => (
  <svg width="46" height="46" viewBox="0 0 48 48" fill="none">
    <circle cx="22" cy="26" r="16" stroke="#0D9488" strokeWidth="5" />
    <circle cx="22" cy="26" r="10" fill="#0D9488" />
    <circle cx="22" cy="26" r="4" fill="#FFFFFF" />
    <path d="M36 12L24 24" stroke="#0F766E" strokeWidth="4" strokeLinecap="round" />
    <path d="M32 10L38 10L38 16" stroke="#0F766E" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const InterviewGuideIcon = () => (
  <svg width="46" height="46" viewBox="0 0 48 48" fill="none">
    <path d="M6 10C6 10 12 8 22 13V38C12 33 6 35 6 35V10Z" fill="#DB2777" />
    <path d="M42 10C42 10 36 8 26 13V38C36 33 42 35 42 35V10Z" fill="#E11D48" />
    <rect x="22" y="14" width="4" height="24" rx="2" fill="#BE123C" />
    <line x1="12" y1="18" x2="18" y2="20" stroke="#FCE7F3" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="12" y1="24" x2="18" y2="26" stroke="#FCE7F3" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="30" y1="20" x2="36" y2="18" stroke="#FCE7F3" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="30" y1="26" x2="36" y2="24" stroke="#FCE7F3" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

const HistoryIcon = () => (
  <svg width="46" height="46" viewBox="0 0 48 48" fill="none">
    <path d="M24 8C15.1634 8 8 15.1634 8 24C8 32.8366 15.1634 40 24 40C32.8366 40 40 32.8366 40 24C40 18.5 37.2 13.7 33 10.8" stroke="#2563EB" strokeWidth="5.5" strokeLinecap="round" />
    <path d="M33 4V12H41" stroke="#2563EB" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M24 14V24L31 31" stroke="#1D4ED8" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const AIAssistantIcon = () => (
  <svg width="46" height="46" viewBox="0 0 48 48" fill="none">
    <rect x="8" y="16" width="32" height="24" rx="8" fill="#7C3AED" />
    <circle cx="18" cy="26" r="3.5" fill="#FFFFFF" />
    <circle cx="30" cy="26" r="3.5" fill="#FFFFFF" />
    <rect x="18" y="33" width="12" height="3" rx="1.5" fill="#FFFFFF" />
    <rect x="22" y="8" width="4" height="8" rx="2" fill="#6D28D9" />
    <circle cx="24" cy="7" r="3" fill="#A78BFA" />
    <path d="M40 8L42 12L46 14L42 16L40 20L38 16L34 14L38 12L40 8Z" fill="#C084FC" />
  </svg>
);

const AICoachIcon = () => (
  <svg width="46" height="46" viewBox="0 0 48 48" fill="none">
    <path d="M24 6L4 17L24 28L44 17L24 6Z" fill="#16A34A" />
    <path d="M10 23.5V34C10 34 16 38 24 38C32 38 38 34 38 34V23.5L24 31L10 23.5Z" fill="#15803D" />
    <path d="M40 19V32M40 32C40 33.5 38.5 35 37 35C35.5 35 34 33.5 34 32V19" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const LiveIcon = () => (
  <svg width="46" height="46" viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="24" r="5" fill="#DC2626" />
    <path d="M16 16C11.5 20.5 11.5 27.5 16 32" stroke="#DC2626" strokeWidth="4.5" strokeLinecap="round" />
    <path d="M32 16C36.5 20.5 36.5 27.5 32 32" stroke="#DC2626" strokeWidth="4.5" strokeLinecap="round" />
    <path d="M10 10C3.5 16.5 3.5 31.5 10 38" stroke="#EF4444" strokeWidth="4.5" strokeLinecap="round" />
    <path d="M38 10C44.5 16.5 44.5 31.5 38 38" stroke="#EF4444" strokeWidth="4.5" strokeLinecap="round" />
  </svg>
);

const CompetitionsIcon = () => (
  <svg width="46" height="46" viewBox="0 0 48 48" fill="none">
    <path d="M14 8H34V22C34 27.5228 29.5228 32 24 32C18.4772 32 14 27.5228 14 22V8Z" fill="#F59E0B" />
    <path d="M14 12H8C6.34315 12 5 13.3431 5 15V18C5 21.3137 7.68629 24 11 24H14V12Z" fill="#D97706" />
    <path d="M34 12H40C41.6569 12 43 13.3431 43 15V18C43 21.3137 40.3137 24 37 24H34V12Z" fill="#D97706" />
    <rect x="20" y="32" width="8" height="8" fill="#D97706" />
    <rect x="12" y="38" width="24" height="6" rx="3" fill="#B45309" />
    <path d="M24 14L25.8 17.6L29.8 18.2L26.9 21L27.6 25L24 23.1L20.4 25L21.1 21L18.2 18.2L22.2 17.6L24 14Z" fill="#FEF3C7" />
  </svg>
);

const HRInterviewIcon = () => (
  <svg width="46" height="46" viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="14" r="8" fill="#0284C7" />
    <path d="M10 40V34C10 29.5 15 26 24 26C33 26 38 29.5 38 34V40H10Z" fill="#0284C7" />
    <path d="M24 26L20 35H28L24 26Z" fill="#FFFFFF" />
    <path d="M22 35L24 41L26 35H22Z" fill="#0369A1" />
  </svg>
);

/* ─── 12 Feature Tile Background Fill Colors (Editable Pastel Palette) ───── */
export const FEATURE_TILE_COLORS: Record<string, string> = {
  'Company\nInterview': '#9cc4f5ff', // Soft Blue (matches Blue Building Icon)
  'AI Job\nSearch': '#38DF73', // Soft Green (matches Green Search Icon)
  'Resume\nATS': '#BD81FD', // Soft Purple (matches Purple Shield Icon)
  'GD Agent': '#B7844B', // Soft Peach/Orange (matches Orange Group Icon)
  'Assessment': '#99F6E4', // Soft Cyan/Teal (matches Teal Target Icon)
  'Interview\nGuide': '#FBCFE8', // Soft Pink (matches Pink Book Icon)
  'History': '#C7D2FE', // Soft Sky Blue (matches Blue Clock Icon)
  'AI\nAssistant': '#DDD6FE', // Soft Violet (matches Purple Robot Icon)
  'AI Coach': '#86EFAC', // Soft Leaf Green (matches Green Cap Icon)
  'Live': '#FECDD3', // Soft Red (matches Red Signal Icon)
  'Competitions': '#FDE68A', // Soft Gold Yellow (matches Gold Trophy Icon)
  'HR Interview': '#BAE6FD', // Soft Ice Blue (matches Blue Avatar Icon)
};

/* ─── Feature grid (Category-Matched Glass Tiles for Light & Dark Modes) ─── */
const FEATURES = [
  { label: 'Company\nInterview', icon: CompanyInterviewIcon, darkTileBg: 'rgba(37, 99, 235, 0.16)', darkBorder: 'rgba(59, 130, 246, 0.35)', darkGlow: '0 4px 20px rgba(37, 99, 235, 0.22)', lightBg: '#EBF3FF', href: '/train/company' },
  { label: 'AI Job\nSearch', icon: AIJobSearchIcon, darkTileBg: 'rgba(16, 185, 129, 0.16)', darkBorder: 'rgba(16, 185, 129, 0.35)', darkGlow: '0 4px 20px rgba(16, 185, 129, 0.22)', lightBg: '#EAF8EF', href: '/train/job-search' },
  { label: 'Resume\nATS', icon: ResumeATSIcon, darkTileBg: 'rgba(147, 51, 234, 0.16)', darkBorder: 'rgba(168, 85, 247, 0.35)', darkGlow: '0 4px 20px rgba(147, 51, 234, 0.22)', lightBg: '#F4EBFF', href: '/ats' },
  { label: 'GD Agent', icon: GDAgentIcon, darkTileBg: 'rgba(234, 88, 12, 0.16)', darkBorder: 'rgba(249, 115, 22, 0.35)', darkGlow: '0 4px 20px rgba(234, 88, 12, 0.22)', lightBg: '#FFF3EB', href: '/train/gd-agent' },
  { label: 'Assessment', icon: AssessmentIcon, darkTileBg: 'rgba(13, 148, 136, 0.16)', darkBorder: 'rgba(20, 184, 166, 0.35)', darkGlow: '0 4px 20px rgba(13, 148, 136, 0.22)', lightBg: '#E8FAFA', href: '/train/assessments' },
  { label: 'Interview\nGuide', icon: InterviewGuideIcon, darkTileBg: 'rgba(219, 39, 119, 0.16)', darkBorder: 'rgba(236, 72, 153, 0.35)', darkGlow: '0 4px 20px rgba(219, 39, 119, 0.22)', lightBg: '#FCE8F3', href: '/interview-guide' },
  { label: 'History', icon: HistoryIcon, darkTileBg: 'rgba(37, 99, 235, 0.16)', darkBorder: 'rgba(59, 130, 246, 0.35)', darkGlow: '0 4px 20px rgba(37, 99, 235, 0.22)', lightBg: '#EFF5FF', href: '/history' },
  { label: 'AI\nAssistant', icon: AIAssistantIcon, darkTileBg: 'rgba(124, 58, 237, 0.16)', darkBorder: 'rgba(139, 92, 246, 0.35)', darkGlow: '0 4px 20px rgba(124, 58, 237, 0.22)', lightBg: '#F5EAFF', href: '/train/chat' },
  { label: 'AI Coach', icon: AICoachIcon, darkTileBg: 'rgba(22, 163, 74, 0.16)', darkBorder: 'rgba(34, 197, 94, 0.35)', darkGlow: '0 4px 20px rgba(22, 163, 74, 0.22)', lightBg: '#EAF8EF', href: '/train/gd-coach' },
  { label: 'Live', icon: LiveIcon, darkTileBg: 'rgba(220, 38, 38, 0.16)', darkBorder: 'rgba(239, 68, 68, 0.35)', darkGlow: '0 4px 20px rgba(220, 38, 38, 0.22)', lightBg: '#FFEEEE', href: '/train/live', badge: 'LIVE' },
  { label: 'Competitions', icon: CompetitionsIcon, darkTileBg: 'rgba(245, 158, 11, 0.16)', darkBorder: 'rgba(251, 191, 36, 0.35)', darkGlow: '0 4px 20px rgba(245, 158, 11, 0.22)', lightBg: '#FFF8E7', href: '/train/competitions' },
  { label: 'HR Interview', icon: HRInterviewIcon, darkTileBg: 'rgba(2, 132, 199, 0.16)', darkBorder: 'rgba(56, 189, 248, 0.35)', darkGlow: '0 4px 20px rgba(2, 132, 199, 0.22)', lightBg: '#EEF6FF', href: '/train/hr' },
] satisfies {
  label: string;
  icon: React.ComponentType;
  darkTileBg: string; darkBorder: string; darkGlow: string; lightBg: string; href: string; badge?: string;
}[];

/* ─── Bottom tabs — each has its own icon color ──────────────────────────── */
const TABS = [
  { label: 'Quick Links', icon: Link2, href: '/train', tabColor: '#8B5CF6' },
  { label: 'Practice', icon: Target, href: '/train/hr', tabColor: '#10B981' },
  { label: 'Home', icon: Home, href: '/train', tabColor: '#7C3AED' },
  { label: 'Analytics', icon: BarChart3, href: '/analytics', tabColor: '#F97316' },
  { label: 'Profile', icon: User, href: '/profile', tabColor: '#0EA5E9' },
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

/* ─── More modules ───────────────────────────────────────────────────────── */
const MORE_MODULES = [
  { label: 'GD Coach', desc: 'Group discussion training', icon: GraduationCap, darkBg: 'linear-gradient(135deg,#22C55E,#16A34A)', color: '#16A34A', lightBg: '#DCFCE7', href: '/train/gd-coach' },
  { label: 'English Learning', desc: 'Master professional English', icon: BookOpen, darkBg: 'linear-gradient(135deg,#EC4899,#DB2777)', color: '#EC4899', lightBg: '#FCE7F3', href: '/train/english' },
  { label: 'Vocabulary', desc: 'Expand professional vocabulary', icon: BookMarked, darkBg: 'linear-gradient(135deg,#F59E0B,#D97706)', color: '#D97706', lightBg: '#FEF3C7', href: '/train/vocabulary' },
  { label: 'Voice Practice', desc: 'Corporate pronunciation coach', icon: Mic, darkBg: 'linear-gradient(135deg,#3B82F6,#2563EB)', color: '#0284C7', lightBg: '#E0F2FE', href: '/train/corporate-voice' },
  { label: 'PromptIQ', desc: 'AI prompt intelligence', icon: Brain, darkBg: 'linear-gradient(135deg,#8B5CF6,#7C3AED)', color: '#7C3AED', lightBg: '#EDE9FE', href: '/train/promptiq' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   MobileTrainPage — ≤640 px  (sm:hidden)
   Fully theme-aware: Light / Dark / Night / Forest / Parchment / Code
═══════════════════════════════════════════════════════════════════════════ */
export default function MobileTrainPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);

  const _ct = themeConfig[resolvedTheme] || themeConfig.dark;
  const isLight = resolvedTheme === 'light' || resolvedTheme === 'parchment';

  const firstName = session?.user?.name?.split(' ')[0] || 'there';
  const avatarUrl = session?.user?.image;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'GOOD MORNING' : hour < 17 ? 'GOOD AFTERNOON' : 'GOOD EVENING';

  /* ── Per-theme colour tokens ─────────────────────────────────────────── */
  const ACCENT: Record<string, string> = {
    light: '#5A2D82',  // deep purple per spec
    parchment: '#5A2D82',
    dark: '#7C3AED',
    midnight: '#7C3AED',
    forest: '#F59E0B',
    codeterm: '#CC4125',
  };
  const CARD_BG: Record<string, string> = {
    light: '#F8FAFC',
    parchment: '#FFFFFF',           // pure white per spec
    dark: '#161B2E',
    midnight: 'rgba(15,39,68,0.9)',
    forest: 'rgba(17,28,20,0.9)',
    codeterm: '#141414',
  };
  const PAGE_BG: Record<string, string> = {
    light: '#FFFFFF',                 // pure white background for Light Theme per user request
    parchment: 'hsl(42 18% 93%)',     // continuous sandal cream background for Parchment Theme
    dark: '#0D0F1A',
    midnight: '#0a1929',
    forest: '#0b140e',
    codeterm: '#0D0D0D',
  };
  const TILE_BG: Record<string, string> = {
    light: '#F1F5F9',
    parchment: '#FFFFFF',           // pure white company tiles per spec
    dark: '#1a2340',
    midnight: '#0a1e38',
    forest: '#1a2b1d',
    codeterm: '#1e1e1e',
  };
  const TEXT_HEX: Record<string, string> = {
    light: '#0F0B2E',
    parchment: '#212529',           // near-black per spec
    dark: '#F1F5F9',
    midnight: '#F1F5F9',
    forest: '#e8e4d9',
    codeterm: '#F0EDE8',
  };
  const MUTED_HEX: Record<string, string> = {
    light: '#6B7280',
    parchment: '#6C757D',           // bootstrap gray per spec
    dark: '#94A3B8',
    midnight: '#94A3B8',
    forest: '#9aad8e',
    codeterm: '#888580',
  };
  const BORDER_HEX: Record<string, string> = {
    light: '#E5E7EB',
    parchment: '#E9ECEF',           // very subtle per spec
    dark: 'rgba(255,255,255,0.08)',
    midnight: 'rgba(255,255,255,0.08)',
    forest: 'rgba(180,120,30,0.2)',
    codeterm: 'rgba(204,65,37,0.25)',
  };

  const t = resolvedTheme as string;
  const accentHex = ACCENT[t] ?? '#7C3AED';
  const cardBgHex = CARD_BG[t] ?? '#161B2E';
  const pageBgHex = PAGE_BG[t] ?? '#0D0F1A';
  const tileBg = TILE_BG[t] ?? '#1a2340';
  const textHex = TEXT_HEX[t] ?? '#F1F5F9';
  const mutedHex = MUTED_HEX[t] ?? '#94A3B8';
  const borderHex = BORDER_HEX[t] ?? 'rgba(255,255,255,0.08)';

  /* ── Logo helper ─────────────────────────────────────────────────────── */
  const LogoContainer = () => (
    <div className="flex items-center justify-center shrink-0">
      <img
        src="/white-removebg-preview1.png"
        alt="Fluenzy AI Logo"
        className="w-9 h-9 object-contain filter drop-shadow-sm active:scale-95 transition-transform"
      />
    </div>
  );

  /* ── Theme icon helper ───────────────────────────────────────────────── */
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

  /* ── Nav bottom padding — parchment/light use floating pill (taller gap) */
  const bodyPaddingBottom = isLight ? '96px' : '80px';

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col sm:hidden"
      style={{ background: pageBgHex }}
    >
      {/* ── TOP HEADER ─────────────────────────────────────────────────── */}
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

        {/* Right: theme + bell + avatar */}
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

          {/* Bell */}
          <Link
            href="/notifications"
            className="relative p-2 rounded-xl active:opacity-60 flex items-center justify-center"
            style={{
              color: isLight ? '#0F172A' : '#F8FAFC',
              background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)',
            }}
            aria-label="Notifications"
          >
            <Bell size={20} style={{ color: isLight ? '#0F172A' : '#F8FAFC', stroke: isLight ? '#0F172A' : '#F8FAFC' }} />
            <span
              className="absolute -top-0.5 -right-0.5 w-5 h-5 text-white text-[9px] font-black rounded-full flex items-center justify-center"
              style={{ background: '#7C3AED' }}
            >
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

        {/* Greeting */}
        <div className="px-4 pt-5 pb-2">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: mutedHex }}>{greeting}</p>
          <h1 className="text-2xl font-black mt-0.5" style={{ color: textHex }}>
            {firstName} <span role="img" aria-label="wave">👋</span>
          </h1>
        </div>

        {/* ── COMPANY WISE INTERVIEW ──────────────────────────────────────── */}
        <section className="mb-5 mt-1">
          <div className="flex items-center justify-between px-4 mb-3">
            <h2 className="text-sm font-bold" style={{ color: textHex }}>Company Wise Interview</h2>
            <Link href="/train/company" className="flex items-center gap-0.5 text-xs font-semibold" style={{ color: accentHex }}>
              View All <ChevronRight size={13} />
            </Link>
          </div>
          <div
            style={{
              display: 'flex', overflowX: 'auto', gap: '16px',
              paddingLeft: '16px', paddingRight: '16px', paddingBottom: '8px',
              scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none', msOverflowStyle: 'none',
            }}
          >
            {COMPANIES.map((c) => (
              <Link
                key={c.label}
                href={c.href}
                style={{ scrollSnapAlign: 'start', flexShrink: 0, width: '108px' }}
                className="flex flex-col items-center gap-2 active:opacity-70"
              >
                <div
                  className="w-[108px] h-[76px] rounded-2xl flex items-center justify-center overflow-hidden p-2"
                  style={{
                    background: tileBg,
                    border: c.isAdd
                      ? `2px dashed ${accentHex}60`
                      : `1px solid ${borderHex}`,
                    boxShadow: isLight ? '0 3px 12px rgba(0,0,0,0.06)' : 'none',
                  }}
                >
                  {c.isAdd ? (
                    <span style={{ color: isLight ? '#212529' : accentHex, fontSize: '36px', fontWeight: 900, lineHeight: 1 }}>+</span>
                  ) : c.iconUrl ? (
                    <img
                      src={c.iconUrl}
                      alt={c.label}
                      className="w-full h-full object-contain p-1 scale-[1.45] transform transition-transform"
                    />
                  ) : c.logo ? (
                    <div className="transform scale-[1.45] flex items-center justify-center">
                      <c.logo />
                    </div>
                  ) : null}
                </div>
                <span className="text-center leading-tight font-bold" style={{ fontSize: '12px', color: textHex, width: '104px' }}>
                  {c.label}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── CONTINUE LEARNING ─────────────────────────────────────────── */}
        <section className="px-4 mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold" style={{ color: textHex }}>Continue Learning</h2>
            <Link href="/history" className="flex items-center gap-0.5 text-xs font-semibold" style={{ color: accentHex }}>
              View All <ChevronRight size={13} />
            </Link>
          </div>
          <div
            className="relative overflow-visible rounded-2xl p-4 pb-8 flex items-center gap-3"
            style={{
              background: cardBgHex,
              border: `1px solid ${borderHex}`,
              boxShadow: isLight ? '0 2px 12px rgba(0,0,0,0.08)' : '0 2px 8px rgba(0,0,0,0.2)',
            }}
          >
            {/* Code icon — light purple in light/parchment, gradient in dark */}
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                background: isLight ? '#EDE9FE' : 'linear-gradient(135deg,#7C3AED,#4F46E5)',
                boxShadow: isLight ? 'none' : '0 4px 12px rgba(124,58,237,0.3)',
              }}
            >
              <Code size={26} style={{ color: isLight ? '#7C3AED' : '#FFFFFF' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm leading-tight" style={{ color: textHex }}>Technical Interview</p>
              <div className="mt-1.5 h-1.5 w-full rounded-full overflow-hidden" style={{ background: isLight ? '#E9ECEF' : 'rgba(255,255,255,0.1)' }}>
                <div className="h-full rounded-full" style={{ width: '50%', background: 'linear-gradient(90deg,#7C3AED,#4F46E5)' }} />
              </div>
              <p className="mt-1" style={{ fontSize: '11px', color: mutedHex }}>50% Completed · 5 of 10 sessions</p>
            </div>
            {/* Resume button: Coral-Orange gradient in Light/Parchment, Royal Purple in Dark themes */}
            <Link
              href="/train/technical"
              className="flex items-center gap-1 font-extrabold rounded-xl whitespace-nowrap shrink-0 active:scale-95 transition-transform shadow-md"
              style={{
                fontSize: '12px',
                color: '#FFFFFF',
                WebkitTextFillColor: '#FFFFFF',
                background: isLight
                  ? 'linear-gradient(135deg, #FF5A5F 0%, #E98726 100%)'
                  : 'linear-gradient(135deg, #7C3AED 0%, #6C2BD9 100%)',
                boxShadow: isLight
                  ? '0 4px 12px rgba(233, 135, 38, 0.35)'
                  : '0 4px 12px rgba(124, 58, 237, 0.35)',
                padding: '8px 14px',
              }}
            >
              <span>Resume</span> <ChevronRight size={14} style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
            </Link>
            <Link
              href="/train/live-red-heart"
              aria-label="Open Red Heart live discussion"
              className="absolute -bottom-5 left-1/2 z-10 flex h-14 w-[190px] -translate-x-1/2 items-center justify-center"
            >
              <svg viewBox="0 0 190 42" className="absolute left-0 top-1/2 h-10 w-full -translate-y-1/2" aria-hidden="true">
                <path d="M0 22H25L31 20L36 25L42 8L48 34L54 22H76" fill="none" stroke="#FF3B81" strokeWidth="2" />
                <path d="M114 22H136L142 20L148 25L154 8L160 34L166 22H190" fill="none" stroke="#FF3B81" strokeWidth="2" />
              </svg>
              <span
                className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2"
                style={{ background: cardBgHex, borderColor: '#FF3B81', boxShadow: '0 0 14px rgba(255,59,129,0.45)' }}
              >
                <Heart size={27} fill="#FF334F" stroke="#FF334F" />
              </span>
            </Link>
          </div>
        </section>

        {/* ── FEATURE GRID (4 × 3 = 12 icons) ─────────────────────────── */}
        <section className="px-4 mb-5">
          <div className="grid grid-cols-4 gap-x-3 gap-y-5">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03, type: 'spring', stiffness: 300, damping: 22 }}
              >
                <Link
                  href={f.href}
                  onClick={(e) => {
                    if (f.href === '/train/chat') {
                      e.preventDefault();
                      window.dispatchEvent(new CustomEvent('open-side-chatbot'));
                    }
                  }}
                  className="flex flex-col items-center gap-2 active:opacity-75"
                >
                  <div className="relative">
                    <div
                      className="w-[72px] h-[72px] rounded-[22px] flex items-center justify-center border-0 outline-none shadow-sm"
                      style={{
                        backgroundColor: isLight ? f.lightBg : 'rgba(255, 255, 255, 0.05)',
                        background: isLight ? f.lightBg : 'rgba(255, 255, 255, 0.05)',
                        border: isLight ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: isLight ? 'none' : '0 4px 12px rgba(0, 0, 0, 0.2)',
                      }}
                    >
                      <f.icon />
                    </div>
                    {('badge' in f) && f.badge && (
                      <span
                        className="absolute -top-1 -right-1 font-black text-white rounded-full"
                        style={{ fontSize: '8px', background: '#EF4444', padding: '2px 5px', lineHeight: 1.4 }}
                      >
                        {f.badge}
                      </span>
                    )}
                  </div>
                  <span
                    className="font-bold text-center leading-tight whitespace-pre-line"
                    style={{ fontSize: '11px', color: isLight ? '#495057' : mutedHex }}
                  >
                    {f.label}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── RECOMMENDED FOR YOU ───────────────────────────────────────── */}
        <section className="px-4 mb-5">
          <div
            className="rounded-2xl p-4"
            style={{
              background: cardBgHex,
              border: `1px solid ${borderHex}`,
              boxShadow: isLight ? '0 2px 12px rgba(0,0,0,0.07)' : `0 2px 8px ${accentHex}08`,
            }}
          >
            <p className="font-bold mb-3 flex items-center gap-1" style={{ fontSize: '11px', color: accentHex }}>
              <Sparkles size={11} /> Recommended for You
            </p>
            <div className="flex items-center gap-3">
              {/* Star icon — soft light-yellow circle per spec */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: isLight ? '#FEF9C3' : 'linear-gradient(135deg,#F59E0B,#F97316)',
                  boxShadow: isLight ? 'none' : '0 4px 12px rgba(245,158,11,0.35)',
                }}
              >
                <span style={{ fontSize: '22px' }} role="img" aria-label="star">⭐</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm leading-tight" style={{ color: textHex }}>Continue Technical Interview</p>
                <p className="flex items-center gap-1 mt-0.5" style={{ fontSize: '11px', color: mutedHex }}>
                  <Clock size={11} className="shrink-0" /> 18 Minutes
                </p>
              </div>
              <Link
                href="/train/technical"
                className="px-3.5 py-2 font-extrabold rounded-xl whitespace-nowrap shrink-0 text-white shadow-md flex items-center gap-1 active:scale-95 transition-transform"
                style={{
                  fontSize: '12px',
                  color: '#FFFFFF',
                  WebkitTextFillColor: '#FFFFFF',
                  background: isLight
                    ? 'linear-gradient(135deg, #FF5A5F 0%, #E98726 100%)'
                    : 'linear-gradient(135deg, #7C3AED 0%, #6C2BD9 100%)',
                  boxShadow: isLight
                    ? '0 4px 12px rgba(233, 135, 38, 0.35)'
                    : '0 4px 12px rgba(124, 58, 237, 0.35)',
                }}
              >
                <span>Start</span> <ChevronRight size={13} style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* ── ASK AI FAB ─────────────────────────────────────────────────── */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.7, type: 'spring', stiffness: 300, damping: 20 }}
        onClick={() => window.dispatchEvent(new CustomEvent('open-side-chatbot'))}
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

      {/* ── BOTTOM TAB BAR (Downward Concave Scoop Curve around Home Tab) ──── */}
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
              <div className="flex items-center justify-between px-4 shrink-0" style={{ height: '56px', borderBottom: `1px solid ${borderHex}` }}>
                <div className="flex items-center gap-2.5">
                  <LogoContainer />
                  <span className="font-black text-lg tracking-tight" style={{ background: 'linear-gradient(90deg,#7C3AED,#4F46E5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
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
                <div className="flex items-center gap-3 p-3 rounded-xl mb-2" style={{ background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)' }}>
                  <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#7C3AED,#4F46E5)' }}>
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
}
