'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTheme, themeConfig, ThemeName } from '@/contexts/ThemeContext';
import { JobCard } from '@/components/jobs/JobCard';
import { JobMatch, PLAN_LIMITS, UserPlan } from '@/types/jobs';
import {
  Menu, Bell, Home, Link2, BarChart3, User,
  Sun, Moon, Leaf, Coffee, Terminal, Sparkles, X, LogOut,
  BookMarked, History, Code, GraduationCap, Users, Building2,
  Radio, Trophy, UserSearch, FileCheck, UserCheck, BookOpen,
  Target, Brain, Search, MapPin, Briefcase, Globe, ChevronDown,
  CheckCircle2, AlertCircle, Award, ArrowLeft, ArrowRight, Loader2,
  FileText, Upload, RefreshCw
} from 'lucide-react';

/* ─── Theme Options (identical to MobileTrainPage) ─────────────────────── */
const THEME_OPTIONS: { value: ThemeName; label: string; icon: typeof Moon }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'midnight', label: 'Night', icon: Moon },
  { value: 'forest', label: 'Forest', icon: Leaf },
  { value: 'parchment', label: 'Parchment', icon: Coffee },
  { value: 'codeterm', label: 'Code', icon: Terminal },
];

/* ─── Bottom Tabs (identical to MobileTrainPage) ────────────────────────── */
const TABS = [
  { label: 'Quick Links', icon: Link2, href: '/train', tabColor: '#8B5CF6' },
  { label: 'Practice', icon: Target, href: '/train/hr', tabColor: '#10B981' },
  { label: 'Home', icon: Home, href: '/train', tabColor: '#7C3AED' },
  { label: 'Analytics', icon: BarChart3, href: '/analytics', tabColor: '#F97316' },
  { label: 'Profile', icon: User, href: '/profile', tabColor: '#0EA5E9' },
];

/* ─── Sidebar Sections ─────────────────────────────────────────────────── */
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

// Country options
const COUNTRIES = [
  { code: 'IN', name: 'India', cities: ['Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Gurgaon', 'Noida'] },
  { code: 'US', name: 'United States', cities: ['New York', 'San Francisco', 'Los Angeles', 'Seattle', 'Austin', 'Chicago', 'Boston'] },
  { code: 'UK', name: 'United Kingdom', cities: ['London', 'Manchester', 'Birmingham', 'Edinburgh', 'Bristol'] },
  { code: 'CA', name: 'Canada', cities: ['Toronto', 'Vancouver', 'Montreal', 'Calgary'] },
  { code: 'AU', name: 'Australia', cities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth'] },
  { code: 'DE', name: 'Germany', cities: ['Berlin', 'Munich', 'Frankfurt', 'Hamburg'] },
  { code: 'SG', name: 'Singapore', cities: ['Singapore'] },
  { code: 'AE', name: 'UAE', cities: ['Dubai', 'Abu Dhabi'] },
];

const JOB_TYPES = [
  { value: 'internship', label: 'Internship' },
  { value: 'fulltime', label: 'Full-time' },
  { value: 'parttime', label: 'Part-time' },
  { value: 'contract', label: 'Contract / Freelance' },
];

const EXPERIENCE_LEVELS = [
  { value: 'internship', label: 'Internship / Apprentice' },
  { value: 'entry', label: 'Entry-level (0–2 yrs)' },
  { value: 'mid', label: 'Mid-level (2–5 yrs)' },
  { value: 'senior', label: 'Senior (5+ yrs)' },
  { value: 'director', label: 'Leadership' },
];

interface MobileJobSearchProps {
  jobPosition: string;
  setJobPosition: (val: string) => void;
  selectedJobTypes: string[];
  toggleJobType: (val: string) => void;
  country: string;
  setCountry: (val: string) => void;
  selectedCities: string[];
  toggleCity: (val: string) => void;
  isRemote: boolean;
  setIsRemote: (val: boolean) => void;
  selectedExperience: string[];
  toggleExperience: (val: string) => void;
  jobs: JobMatch[];
  isLoading: boolean;
  error: string | null;
  savedIds: Set<string>;
  userSkills: string[];
  resumeFileName: string | null;
  resumeUploading: boolean;
  handleResumeUpload: (file: File) => void;
  fetchJobs: () => void;
  canSearch: () => boolean;
  getSearchSummary: () => string;
  handleSave: (job: JobMatch) => void;
  handleApply: (job: JobMatch) => void;
  sessionInfo: any;
  searchHistory: any[];
  runHistorySearch: (item: any) => void;
}

export default function MobileJobSearchPage({
  jobPosition,
  setJobPosition,
  selectedJobTypes,
  toggleJobType,
  country,
  setCountry,
  selectedCities,
  toggleCity,
  isRemote,
  setIsRemote,
  selectedExperience,
  toggleExperience,
  jobs,
  isLoading,
  error,
  savedIds,
  userSkills,
  resumeFileName,
  resumeUploading,
  handleResumeUpload,
  fetchJobs,
  canSearch,
  getSearchSummary,
  handleSave,
  handleApply,
  sessionInfo,
  searchHistory,
  runHistorySearch,
}: MobileJobSearchProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);

  // 3-Step Wizard state
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);

  // Theme resolution
  const activeTheme = theme || resolvedTheme || 'dark';
  const t = activeTheme as string;
  const isLight = t === 'light' || t === 'parchment';

  const firstName = session?.user?.name?.split(' ')[0] || 'there';
  const avatarUrl = session?.user?.image;

  /* ── Per-theme colour tokens ── */
  const ACCENT: Record<string, string> = {
    light: '#5A2D82',
    parchment: '#5A2D82',
    dark: '#7C3AED',
    midnight: '#7C3AED',
    forest: '#F59E0B',
    codeterm: '#CC4125',
  };
  const CARD_BG: Record<string, string> = {
    light: '#F8FAFC',
    parchment: '#FFFFFF',
    dark: '#161B2E',
    midnight: 'rgba(15,39,68,0.95)',
    forest: 'rgba(17,28,20,0.95)',
    codeterm: '#141414',
  };
  const PAGE_BG: Record<string, string> = {
    light: '#FFFFFF',
    parchment: 'hsl(42 18% 93%)',
    dark: '#0D0F1A',
    midnight: '#0a1929',
    forest: '#0b140e',
    codeterm: '#0D0D0D',
  };
  const TEXT_HEX: Record<string, string> = {
    light: '#0F0B2E',
    parchment: '#212529',
    dark: '#F1F5F9',
    midnight: '#F1F5F9',
    forest: '#e8e4d9',
    codeterm: '#F0EDE8',
  };
  const MUTED_HEX: Record<string, string> = {
    light: '#475569',
    parchment: '#525860',
    dark: '#94A3B8',
    midnight: '#94A3B8',
    forest: '#9aad8e',
    codeterm: '#888580',
  };
  const BORDER_HEX: Record<string, string> = {
    light: '#E5E7EB',
    parchment: '#E9ECEF',
    dark: 'rgba(255,255,255,0.08)',
    midnight: 'rgba(255,255,255,0.08)',
    forest: 'rgba(180,120,30,0.2)',
    codeterm: 'rgba(204,65,37,0.25)',
  };

  const accentHex = ACCENT[t] ?? (isLight ? '#5A2D82' : '#7C3AED');
  const cardBgHex = CARD_BG[t] ?? (isLight ? '#FFFFFF' : '#161B2E');
  const pageBgHex = PAGE_BG[t] ?? (isLight ? 'hsl(42 18% 93%)' : '#0D0F1A');
  const textHex = TEXT_HEX[t] ?? (isLight ? '#212529' : '#F1F5F9');
  const mutedHex = MUTED_HEX[t] ?? (isLight ? '#525860' : '#94A3B8');
  const borderHex = BORDER_HEX[t] ?? (isLight ? '#E9ECEF' : 'rgba(255,255,255,0.08)');

  const selectedCountry = COUNTRIES.find((c) => c.code === country);
  const availableCities = selectedCountry?.cities || [];

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

  return (
    <div className="fixed inset-0 z-[200] flex flex-col sm:hidden" style={{ background: pageBgHex }}>
      {/* ── TOP HEADER (identical to MobileTrainPage) ──────────────────── */}
      <header
        className="flex items-center justify-between px-4 shrink-0"
        style={{
          height: '56px',
          background: isLight ? pageBgHex : cardBgHex,
          borderBottom: isLight ? 'none' : `1px solid ${borderHex}`,
        }}
      >
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center justify-center w-9 h-9 rounded-xl active:opacity-70"
            style={{ background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)' }}
            aria-label="Menu"
          >
            <Menu size={22} style={{ color: isLight ? '#0F172A' : '#F8FAFC', stroke: isLight ? '#0F172A' : '#F8FAFC' }} />
          </button>

          <LogoContainer />

          <span
            className="text-base font-black tracking-tight"
            style={{
              background: 'linear-gradient(90deg,#7C3AED,#C084FC)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Fluenzy AI
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Selector */}
          <div className="relative">
            <button
              onClick={() => setThemeMenuOpen((o) => !o)}
              className="p-2 rounded-xl active:opacity-60 flex items-center justify-center border shadow-xs transition-transform active:scale-95"
              style={{
                color: isLight ? '#1C1917' : '#F8FAFC',
                background: isLight ? '#FFFFFF' : 'rgba(255,255,255,0.08)',
                borderColor: isLight ? '#CBD5E1' : borderHex,
              }}
              aria-label="Theme"
            >
              <ThemeIcon />
            </button>

            <AnimatePresence>
              {themeMenuOpen && (
                <>
                  <div className="fixed inset-0 z-[300]" onClick={() => setThemeMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-11 z-[310] w-40 rounded-xl overflow-hidden shadow-2xl py-1"
                    style={{
                      background: isLight ? '#FFFFFF' : cardBgHex,
                      border: `1px solid ${isLight ? '#CBD5E1' : borderHex}`,
                    }}
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
                            background: active ? `${accentHex}18` : 'transparent',
                          }}
                        >
                          <opt.icon size={15} style={{ color: itemIconColor }} />
                          {opt.label}
                        </button>
                      );
                    })}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              className="flex items-center justify-center w-9 h-9 rounded-xl active:opacity-70"
              style={{
                color: isLight ? '#0F172A' : '#F8FAFC',
                background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)',
                border: `1px solid ${borderHex}`,
              }}
              aria-label="Notifications"
            >
              <Bell size={18} style={{ color: isLight ? '#0F172A' : '#F8FAFC', stroke: isLight ? '#0F172A' : '#F8FAFC' }} />
            </button>
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-purple-600 text-[9px] font-black text-white">
              3
            </span>
          </div>

          {/* Profile Avatar */}
          <button
            onClick={() => router.push('/profile')}
            className="w-9 h-9 rounded-xl overflow-hidden border-2 flex items-center justify-center active:opacity-80 shrink-0"
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

      {/* ── SCROLLABLE BODY ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-4" style={{ paddingBottom: '90px' }}>

        {/* ── PAGE TITLE HERO BAR ────────────────────────────────────── */}
        <div
          className="rounded-3xl p-4 shadow-md space-y-2 relative overflow-hidden"
          style={{ background: cardBgHex, border: `1px solid ${borderHex}` }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm" style={{ background: 'linear-gradient(135deg,#3B82F6,#7C3AED)' }}>
                <Sparkles size={20} className="text-white" style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
              </div>
              <div>
                <h1 className="text-base font-black tracking-tight" style={{ color: textHex, WebkitTextFillColor: textHex }}>
                  AI Job Search
                </h1>
                <p className="text-xs font-semibold" style={{ color: mutedHex, WebkitTextFillColor: mutedHex }}>
                  Find perfect matching career tracks
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {searchHistory.length > 0 && (
                <button
                  onClick={() => setShowHistoryModal(true)}
                  className="p-2 rounded-xl active:scale-95 transition-transform"
                  style={{ background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)', color: textHex }}
                  aria-label="Recent Searches"
                >
                  <History size={16} style={{ color: accentHex, stroke: accentHex }} />
                </button>
              )}
              <button
                onClick={() => setShowResumeModal(true)}
                className="p-2 rounded-xl active:scale-95 transition-transform"
                style={{ background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)', color: textHex }}
                aria-label="Upload Resume"
              >
                <FileText size={16} style={{ color: accentHex, stroke: accentHex }} />
              </button>
            </div>
          </div>

          {/* Session Usage Bar */}
          {sessionInfo && (
            <div className="pt-2 border-t space-y-1.5" style={{ borderColor: borderHex }}>
              <div className="flex items-center justify-between text-[10px] font-bold">
                <span style={{ color: mutedHex }}>Search Sessions</span>
                <span style={{ color: textHex }}>
                  {sessionInfo.sessionsUsed}/{sessionInfo.sessionsLimit || 5} used • <span className="capitalize" style={{ color: accentHex }}>{sessionInfo.plan || 'free'}</span>
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: isLight ? '#CBD5E1' : 'rgba(255,255,255,0.1)' }}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(((sessionInfo.sessionsUsed || 0) / (sessionInfo.sessionsLimit || 5)) * 100, 100)}%`,
                    background: 'linear-gradient(90deg,#3B82F6,#7C3AED)',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── 3-STEP WIZARD CONTAINER ─────────────────────────────────── */}
        <div
          className="rounded-3xl p-4 shadow-md space-y-4"
          style={{ background: cardBgHex, border: `1px solid ${borderHex}` }}
        >
          {/* Step Progress Indicator Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-black">
              <span className="flex items-center gap-1.5" style={{ color: accentHex, WebkitTextFillColor: accentHex }}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white" style={{ background: accentHex }}>
                  {wizardStep}
                </span>
                {wizardStep === 1 && 'Step 1 of 3: Target Role & Resume'}
                {wizardStep === 2 && 'Step 2 of 3: Job Type & Experience'}
                {wizardStep === 3 && 'Step 3 of 3: Location & AI Match'}
              </span>
              <span style={{ color: mutedHex, WebkitTextFillColor: mutedHex }}>
                {wizardStep === 1 ? '33%' : wizardStep === 2 ? '66%' : '100%'}
              </span>
            </div>

            {/* Progress line */}
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: isLight ? '#E2E8F0' : 'rgba(255,255,255,0.08)' }}>
              <div
                className="h-full rounded-full transition-all duration-400"
                style={{
                  width: wizardStep === 1 ? '33%' : wizardStep === 2 ? '66%' : '100%',
                  background: 'linear-gradient(90deg, #7C3AED 0%, #3B82F6 50%, #10B981 100%)',
                }}
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* ═══════════════════════════════════════════════════════════
               STEP 1: ROLE & RESUME
               ═══════════════════════════════════════════════════════════ */}
            {wizardStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
                className="space-y-4 pt-1"
              >
                <div className="space-y-1.5">
                  <label className="text-xs font-black block" style={{ color: textHex, WebkitTextFillColor: textHex }}>
                    1. What job are you looking for?
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2" size={17} style={{ color: mutedHex }} />
                    <input
                      type="text"
                      value={jobPosition}
                      onChange={(e) => setJobPosition(e.target.value)}
                      placeholder="e.g. Data Scientist, React Developer, Product Manager"
                      className="w-full pl-10 pr-3.5 py-3 rounded-2xl text-xs font-semibold outline-none"
                      style={{
                        background: isLight ? '#FFFFFF' : 'rgba(255,255,255,0.06)',
                        color: textHex,
                        border: `1px solid ${isLight ? '#CBD5E1' : borderHex}`,
                      }}
                    />
                  </div>
                </div>

                {/* Resume / Skills Preview Box */}
                <div
                  className="rounded-2xl p-3.5 space-y-2 border"
                  style={{
                    background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)',
                    borderColor: isLight ? '#E2E8F0' : borderHex,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold flex items-center gap-1.5" style={{ color: textHex }}>
                      <FileText size={14} style={{ color: accentHex }} />
                      {resumeFileName ? `Resume: ${resumeFileName.slice(0, 18)}...` : 'Resume Skill Auto-Match'}
                    </span>
                    <button
                      onClick={() => setShowResumeModal(true)}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
                      style={{ background: `${accentHex}20`, color: accentHex }}
                    >
                      {resumeFileName ? 'Change PDF' : 'Upload Resume'}
                    </button>
                  </div>

                  {userSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {userSkills.slice(0, 6).map((skill, i) => (
                        <span key={i} className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
                          ✓ {skill}
                        </span>
                      ))}
                      {userSkills.length > 6 && (
                        <span className="text-[9px] font-bold" style={{ color: mutedHex }}>+{userSkills.length - 6} more</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Step 1 Next Button */}
                <button
                  onClick={() => setWizardStep(2)}
                  disabled={!jobPosition.trim()}
                  className="w-full py-3.5 rounded-2xl font-black text-xs text-white flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg,#7C3AED,#4F46E5)' }}
                >
                  Next: Job Type & Experience <ArrowRight size={16} />
                </button>
              </motion.div>
            )}

            {/* ═══════════════════════════════════════════════════════════
               STEP 2: JOB TYPE & EXPERIENCE
               ═══════════════════════════════════════════════════════════ */}
            {wizardStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
                className="space-y-4 pt-1"
              >
                <div className="space-y-2">
                  <label className="text-xs font-black block" style={{ color: textHex, WebkitTextFillColor: textHex }}>
                    2. What type of job? <span className="text-[10px] font-semibold" style={{ color: mutedHex }}>(select multiple)</span>
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    {JOB_TYPES.map((jt) => {
                      const selected = selectedJobTypes.includes(jt.value);
                      return (
                        <button
                          key={jt.value}
                          onClick={() => toggleJobType(jt.value)}
                          className="py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-between border transition-all active:scale-95"
                          style={{
                            background: selected ? accentHex : (isLight ? '#FFFFFF' : 'rgba(255,255,255,0.06)'),
                            color: selected ? '#FFFFFF' : textHex,
                            borderColor: selected ? accentHex : (isLight ? '#CBD5E1' : borderHex),
                          }}
                        >
                          <span>{jt.label}</span>
                          {selected && <CheckCircle2 size={14} className="text-white shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black block" style={{ color: textHex, WebkitTextFillColor: textHex }}>
                    Experience Level <span className="text-[10px] font-semibold" style={{ color: mutedHex }}>(optional)</span>
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    {EXPERIENCE_LEVELS.map((exp) => {
                      const selected = selectedExperience.includes(exp.value);
                      return (
                        <button
                          key={exp.value}
                          onClick={() => toggleExperience(exp.value)}
                          className="py-2.5 px-2.5 rounded-xl text-[11px] font-extrabold flex items-center justify-between border transition-all active:scale-95"
                          style={{
                            background: selected ? '#10B981' : (isLight ? '#FFFFFF' : 'rgba(255,255,255,0.06)'),
                            color: selected ? '#FFFFFF' : textHex,
                            borderColor: selected ? '#10B981' : (isLight ? '#CBD5E1' : borderHex),
                          }}
                        >
                          <span className="truncate">{exp.label}</span>
                          {selected && <CheckCircle2 size={13} className="text-white shrink-0 ml-1" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Step 2 Back & Next Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => setWizardStep(1)}
                    className="py-3 px-4 rounded-2xl font-black text-xs border active:scale-95 transition-transform flex items-center gap-1 shrink-0"
                    style={{ background: isLight ? '#FFFFFF' : 'rgba(255,255,255,0.06)', color: textHex, borderColor: borderHex }}
                  >
                    <ArrowLeft size={15} /> Back
                  </button>
                  <button
                    onClick={() => setWizardStep(3)}
                    disabled={selectedJobTypes.length === 0}
                    className="flex-1 py-3.5 rounded-2xl font-black text-xs text-white flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg,#7C3AED,#4F46E5)' }}
                  >
                    Next: Location & AI Match <ArrowRight size={16} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ═══════════════════════════════════════════════════════════
               STEP 3: LOCATION & SEARCH
               ═══════════════════════════════════════════════════════════ */}
            {wizardStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
                className="space-y-4 pt-1"
              >
                <div className="space-y-2">
                  <label className="text-xs font-black block" style={{ color: textHex, WebkitTextFillColor: textHex }}>
                    3. Where do you want to work?
                  </label>

                  {/* Country Selector */}
                  <div className="relative">
                    <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2" size={17} style={{ color: mutedHex }} />
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full pl-10 pr-8 py-3 rounded-2xl text-xs font-semibold outline-none appearance-none cursor-pointer"
                      style={{
                        background: isLight ? '#FFFFFF' : 'rgba(255,255,255,0.06)',
                        color: textHex,
                        border: `1px solid ${isLight ? '#CBD5E1' : borderHex}`,
                      }}
                    >
                      <option value="">Select Target Country</option>
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>{c.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" size={16} style={{ color: mutedHex }} />
                  </div>

                  {/* Remote Toggle Option */}
                  <button
                    onClick={() => { setIsRemote(!isRemote); if (!isRemote) toggleCity(''); }}
                    className="w-full py-2.5 px-3.5 rounded-xl text-xs font-extrabold flex items-center justify-between border active:scale-95 transition-transform"
                    style={{
                      background: isRemote ? accentHex : (isLight ? '#FFFFFF' : 'rgba(255,255,255,0.06)'),
                      color: isRemote ? '#FFFFFF' : textHex,
                      borderColor: isRemote ? accentHex : (isLight ? '#CBD5E1' : borderHex),
                    }}
                  >
                    <span className="flex items-center gap-1.5">
                      <Globe size={15} /> Remote / Work from Home
                    </span>
                    {isRemote && <CheckCircle2 size={15} className="text-white" />}
                  </button>

                  {/* Cities Multi-Select Grid */}
                  {!isRemote && availableCities.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <p className="text-[10px] font-bold" style={{ color: mutedHex }}>Select Cities (max 6):</p>
                      <div className="grid grid-cols-3 gap-1.5">
                        {availableCities.map((c) => {
                          const selected = selectedCities.includes(c);
                          return (
                            <button
                              key={c}
                              onClick={() => toggleCity(c)}
                              className="py-2 px-2 rounded-xl text-[10px] font-bold border truncate transition-all active:scale-95"
                              style={{
                                background: selected ? '#3B82F6' : (isLight ? '#FFFFFF' : 'rgba(255,255,255,0.06)'),
                                color: selected ? '#FFFFFF' : textHex,
                                borderColor: selected ? '#3B82F6' : (isLight ? '#CBD5E1' : borderHex),
                              }}
                            >
                              <MapPin size={10} className="inline mr-1" />
                              {c}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* AI Search Summary Card */}
                {canSearch() && (
                  <div
                    className="p-3.5 rounded-2xl border space-y-1 shadow-sm"
                    style={{
                      background: isLight ? 'rgba(59,130,246,0.08)' : 'rgba(59,130,246,0.12)',
                      borderColor: isLight ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.3)',
                    }}
                  >
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      <Sparkles size={12} /> AI Search Query:
                    </p>
                    <p className="text-xs font-black text-blue-900 dark:text-blue-200">
                      {getSearchSummary()}
                    </p>
                  </div>
                )}

                {/* Step 3 Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => setWizardStep(2)}
                    className="py-3.5 px-4 rounded-2xl font-black text-xs border active:scale-95 transition-transform flex items-center gap-1 shrink-0"
                    style={{ background: isLight ? '#FFFFFF' : 'rgba(255,255,255,0.06)', color: textHex, borderColor: borderHex }}
                  >
                    <ArrowLeft size={15} /> Back
                  </button>
                  <button
                    onClick={fetchJobs}
                    disabled={isLoading || !canSearch()}
                    className="flex-1 py-3.5 rounded-2xl font-black text-xs text-white flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg,#7C3AED,#3B82F6)' }}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Finding Jobs...
                      </>
                    ) : (
                      <>
                        <Search size={16} /> Search Matching Jobs 🚀
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── ERROR DISPLAY ─────────────────────────────────────────────── */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-500 font-extrabold">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div className="flex-1">
              <p>{error}</p>
              {error.includes('limit') && (
                <Link href="/billing" className="underline mt-1 block font-bold text-red-400">
                  Upgrade plan for more searches →
                </Link>
              )}
            </div>
          </div>
        )}

        {/* ── JOB RESULTS SECTION ──────────────────────────────────────── */}
        {jobs.length > 0 && !isLoading && (
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-black" style={{ color: textHex }}>
                Found <span style={{ color: accentHex }}>{jobs.length}</span> Matching Jobs
              </span>
              <button
                onClick={fetchJobs}
                className="text-[10px] font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg"
                style={{ background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)', color: textHex }}
              >
                <RefreshCw size={11} /> Refresh
              </button>
            </div>

            <div className="space-y-3">
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  isSaved={savedIds.has(job.id)}
                  onSave={handleSave}
                  onApply={handleApply}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── RECENT HISTORY MODAL ──────────────────────────────────────── */}
      <AnimatePresence>
        {showHistoryModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[300]"
              onClick={() => setShowHistoryModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
              className="fixed bottom-0 left-0 right-0 z-[310] rounded-t-3xl p-4 space-y-3 max-h-[75vh] overflow-y-auto"
              style={{ background: cardBgHex, borderTop: `1px solid ${borderHex}` }}
            >
              <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: borderHex }}>
                <span className="text-sm font-black flex items-center gap-2" style={{ color: textHex }}>
                  <History size={17} style={{ color: accentHex }} /> Recent Searches
                </span>
                <button onClick={() => setShowHistoryModal(false)} className="p-1 rounded-lg" style={{ color: mutedHex }}>
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-2">
                {searchHistory.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { runHistorySearch(item); setShowHistoryModal(false); setWizardStep(3); }}
                    className="w-full p-3 rounded-2xl text-left border flex items-center justify-between active:scale-95 transition-transform"
                    style={{ background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.04)', borderColor: borderHex }}
                  >
                    <div>
                      <p className="text-xs font-extrabold" style={{ color: textHex }}>{item.query}</p>
                      <p className="text-[10px]" style={{ color: mutedHex }}>{item.location || 'Any location'} • {item.resultsCount} results</p>
                    </div>
                    <Search size={14} style={{ color: accentHex }} />
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── RESUME UPLOAD MODAL ───────────────────────────────────────── */}
      <AnimatePresence>
        {showResumeModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[300]"
              onClick={() => setShowResumeModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
              className="fixed bottom-0 left-0 right-0 z-[310] rounded-t-3xl p-5 space-y-4"
              style={{ background: cardBgHex, borderTop: `1px solid ${borderHex}` }}
            >
              <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: borderHex }}>
                <span className="text-sm font-black flex items-center gap-2" style={{ color: textHex }}>
                  <FileText size={17} style={{ color: accentHex }} /> Upload Resume (PDF)
                </span>
                <button onClick={() => setShowResumeModal(false)} className="p-1 rounded-lg" style={{ color: mutedHex }}>
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) { handleResumeUpload(file); setShowResumeModal(false); }
                  }}
                  disabled={resumeUploading}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-purple-600 file:text-white"
                />
                <p className="text-[10px]" style={{ color: mutedHex }}>
                  Upload your PDF resume to extract skills and enable AI-powered job matching.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── BOTTOM TAB BAR (identical to MobileTrainPage) ─────────────── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-[210] sm:hidden flex items-end justify-around"
        style={{ height: '64px', paddingBottom: 'env(safe-area-inset-bottom, 4px)' }}
      >
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

        <div className="relative z-10 flex items-center justify-around w-full h-full pt-1 px-1">
          {TABS.map((tab) => {
            const isHome = tab.label === 'Home';
            const activeColor = isLight ? '#7C3AED' : accentHex;
            const inactiveIconColor = isLight ? '#475569' : mutedHex;
            const inactiveTextColor = isLight ? '#334155' : mutedHex;

            return (
              <Link
                key={tab.label}
                href={tab.href}
                className={`flex flex-col items-center justify-center gap-0.5 min-w-[54px] flex-1 active:opacity-75 ${isHome ? '-mt-5' : 'pb-1'
                  }`}
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
                  <tab.icon size={22} style={{ color: inactiveIconColor, stroke: inactiveIconColor }} />
                )}
                <span
                  className="font-extrabold"
                  style={{ fontSize: '10px', color: inactiveTextColor, WebkitTextFillColor: inactiveTextColor, marginTop: isHome ? '1px' : '0px' }}
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
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={firstName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="text-white font-black text-sm">{firstName[0]?.toUpperCase()}</span>
                    )}
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
