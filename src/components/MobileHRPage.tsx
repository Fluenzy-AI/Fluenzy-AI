'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationBell from '@/components/NotificationBell';
import {
  Menu, Home, Link2, BarChart3, User, Target, Sparkles, X,
  Trophy, Lock, CheckCircle2, PlayCircle, Star, Gift, Map,
  GraduationCap, Crown, Flame, Sun, Moon, Leaf, Coffee, Terminal,
  BookOpen, BookMarked, Mic, Brain, UserSearch, FileCheck,
  Users, Code, Building2, Radio, UserCheck, History, ArrowLeft,
} from 'lucide-react';
import { useTheme, ThemeName } from '@/contexts/ThemeContext';

const THEME_OPTIONS: { value: ThemeName; label: string; icon: typeof Moon }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'midnight', label: 'Night', icon: Moon },
  { value: 'forest', label: 'Forest', icon: Leaf },
  { value: 'parchment', label: 'Parchment', icon: Coffee },
  { value: 'codeterm', label: 'Code', icon: Terminal },
];

/* ── Logo helper matching MobileTrainPage ── */
const LogoContainer = () => (
  <div className="flex items-center justify-center shrink-0">
    <img
      src="/white-removebg-preview1.png"
      alt="Fluenzy AI Logo"
      className="w-9 h-9 object-contain filter drop-shadow-sm active:scale-95 transition-transform"
    />
  </div>
);

/* ── Theme icon helper matching MobileTrainPage ── */
const ThemeIcon = ({ activeTheme, color }: { activeTheme: ThemeName; color: string }) => {
  const icons: Record<ThemeName, React.ReactNode> = {
    light: <Sun size={18} style={{ color, stroke: color }} />,
    dark: <Moon size={18} style={{ color, stroke: color }} />,
    midnight: <Sparkles size={18} style={{ color, stroke: color }} />,
    forest: <Leaf size={18} style={{ color, stroke: color }} />,
    parchment: <Coffee size={18} style={{ color, stroke: color }} />,
    codeterm: <Terminal size={18} style={{ color, stroke: color }} />,
  };
  return <>{icons[activeTheme] || <Moon size={18} style={{ color, stroke: color }} />}</>;
};

const SIDEBAR_SECTIONS = [
  { title: 'MAIN', items: [
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
  ]},
  { title: 'JOB & CAREER', items: [
    { label: 'AI Job Search', icon: UserSearch, href: '/train/job-search' },
    { label: 'My Applications', icon: FileCheck, href: '/train/applications' },
    { label: 'Resume ATS', icon: Target, href: '/ats' },
  ]},
  { title: 'ACCOUNT', items: [
    { label: 'Analytics', icon: BarChart3, href: '/analytics' },
    { label: 'History', icon: History, href: '/history' },
    { label: 'Profile', icon: User, href: '/profile' },
    { label: 'Billing', icon: Sparkles, href: '/billing' },
  ]},
];

const TABS = [
  { label: 'Quick Links', icon: Link2, href: '/train', tabColor: '#8B5CF6' },
  { label: 'Practice', icon: Target, href: '/train/hr', tabColor: '#10B981' },
  { label: 'Home', icon: Home, href: '/train', tabColor: '#7C3AED' },
  { label: 'Analytics', icon: BarChart3, href: '/analytics', tabColor: '#F97316' },
  { label: 'Profile', icon: User, href: '/profile', tabColor: '#0EA5E9' },
];

interface HRLevel {
  id: string; num: number; title: string;
  track: 'beginner' | 'intermediate' | 'advanced';
  cx: number; cy: number; // centre-x (0–100%), centre-y (px from top of map)
  signText?: string; signDir?: 'left' | 'right';
  char?: 'hero' | 'ghost' | 'skull' | 'devil' | 'crown';
}

// yPos=0 = TOP (level 18), yPos increases downward → level 1 at bottom
const LEVELS: HRLevel[] = [
  { id:'h18', num:18, title:'Final Round Confidence',   track:'advanced',     cx:52, cy:80,   char:'crown',  signText:'Final Level – Be Interview Ready!', signDir:'right' },
  { id:'h17', num:17, title:'Executive Presence',       track:'advanced',     cx:30, cy:175,  char:'crown' },
  { id:'h16', num:16, title:'Company Culture Fit',      track:'advanced',     cx:68, cy:270  },
  { id:'h15', num:15, title:'Leadership Scenarios',     track:'advanced',     cx:78, cy:365  },
  { id:'h14', num:14, title:'Conflict Management',      track:'advanced',     cx:52, cy:460  },
  { id:'h13', num:13, title:'Salary Negotiation',       track:'advanced',     cx:28, cy:555, char:'devil', signText:'Harder Challenges Make You Stronger!', signDir:'left' },

  { id:'h12', num:12, title:'Professional Attitude',    track:'intermediate', cx:50, cy:680  },
  { id:'h11', num:11, title:'STAR Method Situations',   track:'intermediate', cx:70, cy:775  },
  { id:'h10', num:10, title:'Handling Follow-up Qs',    track:'intermediate', cx:48, cy:870, signText:'Face Real-World Situations!', signDir:'right' },
  { id:'h9',  num:9,  title:'Carework & Collaboration', track:'intermediate', cx:28, cy:965  },
  { id:'h8',  num:8,  title:'Teamwork & Collaboration', track:'intermediate', cx:50, cy:1060, char:'ghost' },
  { id:'h7',  num:7,  title:'Why Should We Hire You',   track:'intermediate', cx:72, cy:1155, signText:'Practice More, Grow Faster!', signDir:'left' },

  { id:'h6',  num:6,  title:'Common HR Mistakes',       track:'beginner',     cx:52, cy:1280, char:'skull' },
  { id:'h5',  num:5,  title:'Body Language & Tone',     track:'beginner',     cx:28, cy:1375, signText:'Small Steps Big Results!', signDir:'right' },
  { id:'h4',  num:4,  title:'Basic Communication & Confidence', track:'beginner', cx:50, cy:1470 },
  { id:'h3',  num:3,  title:'Strengths & Weaknesses',   track:'beginner',     cx:72, cy:1565 },
  { id:'h2',  num:2,  title:'Tell Me About Yourself',   track:'beginner',     cx:48, cy:1660 },
  { id:'h1',  num:1,  title:'Introduction to HR Interviews', track:'beginner', cx:26, cy:1755, signText:'Start Your Journey Today! ❤️', signDir:'left' },
];

const MAP_H = 1900; // total scrollable canvas height

// ─── Theme Color Palettes ──────────────────────────────────────────────────
export interface ThemePalette {
  headerBg: string;
  headerText: string;
  headerIcon: string;
  headerBorder: string;
  menuBtnBg: string;
  themeMenuBg: string;
  themeMenuBorder: string;
  themeMenuItemBg: string;
  themeMenuItemText: string;
  cardBg: string;
  cardText: string;
  cardBorder: string;
  navBg: string;
  navBorder: string;
  navActive: string;
  navInactive: string;
  drawerBg: string;
  drawerBorder: string;
  drawerText: string;
  sky: [string, string];
  mtn1: [string, string];
  mtn2: [string, string];
  castle: [string, string];
  tower: [string, string];
  hills: [string, string][];
  river: [string, string, string];
  path: [string, string, string, string];
  pathShadow: string;
}

const THEME_PALETTES: Record<ThemeName, ThemePalette> = {
  light: {
    headerBg: '#FFFFFF',
    headerText: '#1E293B',
    headerIcon: '#1E293B',
    headerBorder: 'rgba(0,0,0,0.08)',
    menuBtnBg: 'rgba(0,0,0,0.06)',
    themeMenuBg: '#FFFFFF',
    themeMenuBorder: '#E2E8F0',
    themeMenuItemBg: '#F3E8FF',
    themeMenuItemText: '#7C3AED',
    cardBg: 'rgba(255,255,255,0.97)',
    cardText: '#1E293B',
    cardBorder: 'rgba(0,0,0,0.08)',
    navBg: '#FFFFFF',
    navBorder: 'rgba(0,0,0,0.08)',
    navActive: '#7C3AED',
    navInactive: '#94A3B8',
    drawerBg: '#0F172A',
    drawerBorder: 'rgba(168,85,247,0.5)',
    drawerText: '#FFFFFF',
    sky: ['#A7D8F7', '#DFF6FF'],
    mtn1: ['#9B5DE5', '#5E0B8B'],
    mtn2: ['#7B2FBE', '#3A0068'],
    castle: ['#C4B5FD', '#6D28D9'],
    tower: ['#DDD6FE', '#7C3AED'],
    hills: [
      ['#5DD875', '#22A84A'],
      ['#4ADE80', '#16A34A'],
      ['#86EFAC', '#4ADE80'],
      ['#6EE7B7', '#34D399'],
      ['#5DD875', '#22A84A'],
    ],
    river: ['#60C8F5', '#2996D6', '#0B76B7'],
    path: ['#34D399', '#38BDF8', '#A78BFA', '#F9A8D4'],
    pathShadow: '#FDE68A',
  },
  dark: {
    headerBg: '#0F172A',
    headerText: '#F8FAFC',
    headerIcon: '#F8FAFC',
    headerBorder: 'rgba(255,255,255,0.08)',
    menuBtnBg: 'rgba(255,255,255,0.08)',
    themeMenuBg: '#1E293B',
    themeMenuBorder: 'rgba(255,255,255,0.12)',
    themeMenuItemBg: 'rgba(91,108,255,0.2)',
    themeMenuItemText: '#818CF8',
    cardBg: 'rgba(30,41,59,0.96)',
    cardText: '#F8FAFC',
    cardBorder: 'rgba(255,255,255,0.12)',
    navBg: '#0F172A',
    navBorder: 'rgba(255,255,255,0.08)',
    navActive: '#818CF8',
    navInactive: '#64748B',
    drawerBg: '#0F172A',
    drawerBorder: 'rgba(99,102,241,0.5)',
    drawerText: '#FFFFFF',
    sky: ['#0B132B', '#1C2541'],
    mtn1: ['#4338CA', '#312E81'],
    mtn2: ['#3730A3', '#1E1B4B'],
    castle: ['#818CF8', '#3730A3'],
    tower: ['#A5B4FC', '#4338CA'],
    hills: [
      ['#1E293B', '#0F172A'],
      ['#334155', '#1E293B'],
      ['#475569', '#334155'],
      ['#1E293B', '#0F172A'],
      ['#334155', '#1E293B'],
    ],
    river: ['#3B82F6', '#1D4ED8', '#1E3A8A'],
    path: ['#6366F1', '#818CF8', '#A855F7', '#EC4899'],
    pathShadow: '#A5B4FC',
  },
  midnight: {
    headerBg: '#0A1929',
    headerText: '#F8FAFC',
    headerIcon: '#F8FAFC',
    headerBorder: 'rgba(255,255,255,0.08)',
    menuBtnBg: 'rgba(255,255,255,0.08)',
    themeMenuBg: '#0F2744',
    themeMenuBorder: 'rgba(255,255,255,0.12)',
    themeMenuItemBg: 'rgba(56,189,248,0.2)',
    themeMenuItemText: '#38BDF8',
    cardBg: 'rgba(15,39,68,0.96)',
    cardText: '#F8FAFC',
    cardBorder: 'rgba(255,255,255,0.12)',
    navBg: '#0A1929',
    navBorder: 'rgba(255,255,255,0.08)',
    navActive: '#38BDF8',
    navInactive: '#64748B',
    drawerBg: '#0A1929',
    drawerBorder: 'rgba(56,189,248,0.5)',
    drawerText: '#FFFFFF',
    sky: ['#030712', '#0A1929'],
    mtn1: ['#1E3A8A', '#0F172A'],
    mtn2: ['#172554', '#0284C7'],
    castle: ['#38BDF8', '#0369A1'],
    tower: ['#7DD3FC', '#0284C7'],
    hills: [
      ['#0F2744', '#0A1929'],
      ['#173A5E', '#0F2744'],
      ['#1E4976', '#173A5E'],
      ['#0F2744', '#0A1929'],
      ['#173A5E', '#0F2744'],
    ],
    river: ['#0284C7', '#0369A1', '#075985'],
    path: ['#38BDF8', '#818CF8', '#C084FC', '#E879F9'],
    pathShadow: '#BAE6FD',
  },
  forest: {
    headerBg: '#0B140E',
    headerText: '#E8E4D9',
    headerIcon: '#E8E4D9',
    headerBorder: 'rgba(217,119,6,0.2)',
    menuBtnBg: 'rgba(255,255,255,0.08)',
    themeMenuBg: '#111C14',
    themeMenuBorder: 'rgba(217,119,6,0.25)',
    themeMenuItemBg: 'rgba(245,158,11,0.2)',
    themeMenuItemText: '#F59E0B',
    cardBg: 'rgba(17,28,20,0.96)',
    cardText: '#E8E4D9',
    cardBorder: 'rgba(245,158,11,0.25)',
    navBg: '#0B140E',
    navBorder: 'rgba(217,119,6,0.2)',
    navActive: '#F59E0B',
    navInactive: '#9AAD8E',
    drawerBg: '#0B140E',
    drawerBorder: 'rgba(245,158,11,0.5)',
    drawerText: '#E8E4D9',
    sky: ['#05180D', '#0B2414'],
    mtn1: ['#166534', '#052E16'],
    mtn2: ['#15803D', '#14532D'],
    castle: ['#F59E0B', '#B45309'],
    tower: ['#FBBF24', '#D97706'],
    hills: [
      ['#14532D', '#0B2414'],
      ['#166534', '#14532D'],
      ['#15803D', '#166534'],
      ['#14532D', '#0B2414'],
      ['#166534', '#14532D'],
    ],
    river: ['#0D9488', '#0F766E', '#115E59'],
    path: ['#F59E0B', '#10B981', '#34D399', '#FBBF24'],
    pathShadow: '#FDE68A',
  },
  parchment: {
    headerBg: '#F4F1EA',
    headerText: '#1C1917',
    headerIcon: '#1C1917',
    headerBorder: '#E6E2D8',
    menuBtnBg: 'rgba(0,0,0,0.06)',
    themeMenuBg: '#FCFBF8',
    themeMenuBorder: '#E6E2D8',
    themeMenuItemBg: 'rgba(239,68,68,0.15)',
    themeMenuItemText: '#EF4444',
    cardBg: 'rgba(252,251,248,0.97)',
    cardText: '#1C1917',
    cardBorder: '#E6E2D8',
    navBg: '#FCFBF8',
    navBorder: '#E6E2D8',
    navActive: '#EF4444',
    navInactive: '#57534E',
    drawerBg: '#27272A',
    drawerBorder: 'rgba(239,68,68,0.5)',
    drawerText: '#FFFFFF',
    sky: ['#D7D2C4', '#E6E2D8'],
    mtn1: ['#B45309', '#78350F'],
    mtn2: ['#92400E', '#451A03'],
    castle: ['#EF4444', '#991B1B'],
    tower: ['#F87171', '#DC2626'],
    hills: [
      ['#C8C2B3', '#A8A293'],
      ['#D8D2C3', '#B8B2A3'],
      ['#E5DFC0', '#C8C2B3'],
      ['#C8C2B3', '#A8A293'],
      ['#D8D2C3', '#B8B2A3'],
    ],
    river: ['#B45309', '#92400E', '#78350F'],
    path: ['#DC2626', '#D97706', '#B45309', '#F59E0B'],
    pathShadow: '#FEF3C7',
  },
  codeterm: {
    headerBg: '#0D0D0D',
    headerText: '#F0EDE8',
    headerIcon: '#F0EDE8',
    headerBorder: 'rgba(204,65,37,0.25)',
    menuBtnBg: 'rgba(255,255,255,0.08)',
    themeMenuBg: '#141414',
    themeMenuBorder: 'rgba(204,65,37,0.3)',
    themeMenuItemBg: 'rgba(204,65,37,0.2)',
    themeMenuItemText: '#CC4125',
    cardBg: 'rgba(20,20,20,0.97)',
    cardText: '#F0EDE8',
    cardBorder: 'rgba(204,65,37,0.3)',
    navBg: '#141414',
    navBorder: 'rgba(204,65,37,0.25)',
    navActive: '#CC4125',
    navInactive: '#888580',
    drawerBg: '#141414',
    drawerBorder: 'rgba(204,65,37,0.5)',
    drawerText: '#F0EDE8',
    sky: ['#050505', '#0D0D0D'],
    mtn1: ['#992200', '#440B00'],
    mtn2: ['#CC4125', '#661100'],
    castle: ['#CC4125', '#881100'],
    tower: ['#F97316', '#C2410C'],
    hills: [
      ['#1A1A1A', '#0D0D0D'],
      ['#262626', '#1A1A1A'],
      ['#333333', '#262626'],
      ['#1A1A1A', '#0D0D0D'],
      ['#262626', '#1A1A1A'],
    ],
    river: ['#CC4125', '#992200', '#661100'],
    path: ['#22C55E', '#10B981', '#CC4125', '#F59E0B'],
    pathShadow: '#86EFAC',
  },
};

// ─── Pure-code Candy Crush world SVG background ──────────────────────────────
function WorldSVG({ palette }: { palette: ThemePalette }) {
  return (
    <svg
      viewBox={`0 0 375 ${MAP_H}`}
      width="375" height={MAP_H}
      xmlns="http://www.w3.org/2000/svg"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, width: '100%', height: MAP_H }}
    >
      <defs>
        {/* Gradients */}
        <linearGradient id="gSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.sky[0]}/>
          <stop offset="100%" stopColor={palette.sky[1]}/>
        </linearGradient>
        <linearGradient id="gMtn1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.mtn1[0]}/>
          <stop offset="100%" stopColor={palette.mtn1[1]}/>
        </linearGradient>
        <linearGradient id="gMtn2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.mtn2[0]}/>
          <stop offset="100%" stopColor={palette.mtn2[1]}/>
        </linearGradient>
        <linearGradient id="gHill1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.hills[0][0]}/>
          <stop offset="100%" stopColor={palette.hills[0][1]}/>
        </linearGradient>
        <linearGradient id="gHill2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.hills[1][0]}/>
          <stop offset="100%" stopColor={palette.hills[1][1]}/>
        </linearGradient>
        <linearGradient id="gHill3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.hills[2][0]}/>
          <stop offset="100%" stopColor={palette.hills[2][1]}/>
        </linearGradient>
        <linearGradient id="gHill4" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.hills[3][0]}/>
          <stop offset="100%" stopColor={palette.hills[3][1]}/>
        </linearGradient>
        <linearGradient id="gRiver" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={palette.river[0]}/>
          <stop offset="50%" stopColor={palette.river[1]}/>
          <stop offset="100%" stopColor={palette.river[2]}/>
        </linearGradient>
        <linearGradient id="gPath" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={palette.path[0]}/>
          <stop offset="40%" stopColor={palette.path[1]}/>
          <stop offset="75%" stopColor={palette.path[2]}/>
          <stop offset="100%" stopColor={palette.path[3]}/>
        </linearGradient>
        <linearGradient id="gTower" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.tower[0]}/>
          <stop offset="100%" stopColor={palette.tower[1]}/>
        </linearGradient>
        <linearGradient id="gCastle" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.castle[0]}/>
          <stop offset="100%" stopColor={palette.castle[1]}/>
        </linearGradient>
        <filter id="fGlow">
          <feGaussianBlur stdDeviation="3" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="fShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#00000040"/>
        </filter>
      </defs>

      {/* ── SKY (top 500 px) ─────────────────────────────────────── */}
      <rect x="0" y="0" width="375" height="500" fill="url(#gSky)"/>

      {/* Clouds */}
      {[[30,45,1],[90,25,0.9],[220,35,1.1],[310,20,0.85],[150,55,0.75]].map(([cx,cy,sc],i)=>(
        <g key={i} transform={`translate(${cx},${cy}) scale(${sc})`} opacity={0.75}>
          <ellipse cx="0"  cy="0" rx="26" ry="16" fill="#fff"/>
          <ellipse cx="22" cy="-6" rx="20" ry="14" fill="#fff"/>
          <ellipse cx="44" cy="0" rx="24" ry="15" fill="#fff"/>
          <ellipse cx="22" cy="8"  rx="30" ry="12" fill="#f0f9ff"/>
        </g>
      ))}

      {/* ── PURPLE MOUNTAINS ─────────────────────────────────────── */}
      <path d="M 200,260 L 290,60 L 375,260 Z" fill="url(#gMtn1)"/>
      <path d="M 260,260 L 340,100 L 375,220 L 375,260 Z" fill={palette.mtn2[1]} opacity="0.7"/>
      <path d="M 0,300 L 80,120 L 170,300 Z" fill="url(#gMtn2)" opacity="0.6"/>
      {/* Snow caps */}
      <path d="M 290,60 L 275,95 L 305,95 Z" fill="white" opacity="0.95"/>
      <path d="M 80,120 L 67,152 L 93,152 Z"  fill="white" opacity="0.85"/>

      {/* ── FANTASY CASTLE (top right) ──────────────────────────── */}
      <g transform="translate(240,55)">
        {/* Main Keep */}
        <rect x="10" y="35" width="48" height="60" rx="2" fill="url(#gCastle)" filter="url(#fShadow)"/>
        {/* Battlements */}
        {[10,18,26,34,42,50].map(x=>(
          <rect key={x} x={x} y="28" width="6" height="10" rx="1" fill={palette.tower[0]}/>
        ))}
        {/* Gate */}
        <rect x="24" y="72" width="20" height="23" rx="10" fill={palette.mtn2[1]}/>
        {/* Towers */}
        <rect x="-2"  y="45" width="16" height="50" rx="2" fill="url(#gTower)"/>
        <rect x="54"  y="45" width="16" height="50" rx="2" fill="url(#gTower)"/>
        {/* Tower caps (cone) */}
        <path d="M -8,45 L 6,22 L 20,45 Z"  fill={palette.tower[1]}/>
        <path d="M 48,45 L 62,22 L 76,45 Z" fill={palette.tower[1]}/>
        {/* Main cone */}
        <path d="M 4,35 L 34,5 L 64,35 Z"   fill={palette.castle[1]}/>
        {/* Flags */}
        <line x1="6" y1="22" x2="6" y2="10" stroke="#F59E0B" strokeWidth="1.5"/>
        <path d="M 6,10 L 16,13 L 6,16 Z" fill="#F59E0B"/>
        <line x1="62" y1="22" x2="62" y2="10" stroke="#F59E0B" strokeWidth="1.5"/>
        <path d="M 62,10 L 72,13 L 62,16 Z" fill="#F59E0B"/>
        {/* Star on main cone */}
        <text x="34" y="22" fontSize="10" textAnchor="middle" fill="#FCD34D">★</text>
      </g>

      {/* ── ROLLING HILLS (behind everything) ──────────────────── */}
      <path d="M 0,300 Q 80,220 190,280 Q 280,330 375,270 L 375,1900 L 0,1900 Z" fill="url(#gHill1)"/>
      <path d="M 0,540 Q 100,460 220,520 Q 310,565 375,490 L 375,1900 L 0,1900 Z" fill="url(#gHill2)"/>
      <path d="M 0,820 Q 120,740 240,810 Q 320,850 375,790 L 375,1900 L 0,1900 Z" fill="url(#gHill3)"/>
      <path d="M 0,1150 Q 130,1070 250,1130 Q 330,1165 375,1110 L 375,1900 L 0,1900 Z" fill="url(#gHill4)"/>
      <path d="M 0,1480 Q 110,1400 230,1460 Q 320,1500 375,1440 L 375,1900 L 0,1900 Z" fill="url(#gHill1)"/>

      {/* ── RIVER ────────────────────────────────────────────────── */}
      <path
        d="M 320,130 Q 240,260 290,500 Q 320,650 180,780 Q 60,900 140,1100 Q 200,1250 100,1450 Q 30,1600 110,1850 L 160,1850 Q 90,1620 160,1480 Q 240,1290 155,1120 Q 65,930 185,800 Q 310,670 280,510 Q 225,270 305,145 Z"
        fill="url(#gRiver)" opacity="0.85"
      />
      {/* River shimmer */}
      <path
        d="M 310,160 Q 248,280 290,490 Q 312,620 185,760 Q 80,880 148,1090 Q 200,1240 108,1440 Q 40,1580 118,1830"
        fill="none" stroke="white" strokeWidth="4" strokeDasharray="12 10" opacity="0.45"
      />

      {/* ── WOODEN BRIDGES ───────────────────────────────────────── */}
      {/* Bridge 1 over river ~y=680 */}
      <g transform="translate(155,670)">
        <rect x="0" y="0" width="80" height="22" rx="4" fill="#92400E"/>
        <rect x="0" y="0" width="80" height="8"  rx="3" fill="#B45309"/>
        {[0,16,32,48,64].map(x=>(
          <rect key={x} x={x+4} y="0" width="8" height="22" rx="2" fill="#78350F"/>
        ))}
        {/* Rope rails */}
        <path d="M 0,0 Q 40,-8 80,0" fill="none" stroke="#D97706" strokeWidth="2.5"/>
        <path d="M 0,22 Q 40,14 80,22" fill="none" stroke="#D97706" strokeWidth="2.5"/>
      </g>

      {/* Bridge 2 over river ~y=1310 */}
      <g transform="translate(80,1300)">
        <rect x="0" y="0" width="80" height="22" rx="4" fill="#92400E"/>
        <rect x="0" y="0" width="80" height="8"  rx="3" fill="#B45309"/>
        {[0,16,32,48,64].map(x=>(
          <rect key={x} x={x+4} y="0" width="8" height="22" rx="2" fill="#78350F"/>
        ))}
        <path d="M 0,0 Q 40,-8 80,0" fill="none" stroke="#D97706" strokeWidth="2.5"/>
        <path d="M 0,22 Q 40,14 80,22" fill="none" stroke="#D97706" strokeWidth="2.5"/>
      </g>

      {/* ── TREES ────────────────────────────────────────────────── */}
      {/* Big round-top trees */}
      {(
        [
          [18,380,22,'#16A34A','#4ADE80'],[340,430,20,'#15803D','#22C55E'],
          [12,700,24,'#166534','#4ADE80'],[350,760,20,'#15803D','#22C55E'],
          [14,1020,22,'#14532D','#16A34A'],[345,1080,20,'#166534','#22C55E'],
          [18,1360,22,'#15803D','#4ADE80'],[348,1420,20,'#14532D','#16A34A'],
          [15,1650,24,'#166534','#22C55E'],[342,1700,20,'#15803D','#4ADE80'],
        ] as [number,number,number,string,string][]
      ).map(([tx,ty,tr,dark,light],i)=>(
        <g key={i}>
          <rect x={tx+tr-5} y={ty+tr} width="10" height="18" fill="#78350F"/>
          <circle cx={tx+tr} cy={ty+tr} r={tr} fill={dark}/>
          <circle cx={tx+tr-4} cy={ty+tr-4} r={tr-6} fill={light} opacity="0.7"/>
        </g>
      ))}
      {/* Pine/triangle trees */}
      {[
        [30,580],[350,640],[22,980],[345,1180],[25,1530],
      ].map(([x,y],i)=>(
        <g key={i}>
          <rect x={+x+8} y={+y+30} width="8" height="14" fill="#78350F"/>
          <path d={`M ${x} ${y+30} L ${x+12} ${y} L ${x+24} ${y+30} Z`} fill="#15803D"/>
          <path d={`M ${x+2} ${y+20} L ${x+12} ${y-8} L ${x+22} ${y+20} Z`} fill="#22C55E"/>
        </g>
      ))}

      {/* ── FLOWERS & GRASS DETAILS ───────────────────────────────── */}
      {[
        [50,430,'#F472B6'],[100,490,'#FBBF24'],[80,520,'#F472B6'],
        [290,520,'#A78BFA'],[330,560,'#F472B6'],
        [40,880,'#FBBF24'],[70,920,'#F472B6'],[310,900,'#A78BFA'],
        [40,1250,'#FBBF24'],[330,1230,'#F472B6'],
        [50,1580,'#A78BFA'],[320,1560,'#FBBF24'],
      ].map(([x,y,c],i)=>(
        <g key={i}>
          <circle cx={+x} cy={+y} r="6" fill={c as string} opacity="0.9"/>
          <circle cx={+x-5} cy={+y+2} r="4" fill={c as string} opacity="0.7"/>
          <circle cx={+x+5} cy={+y+2} r="4" fill={c as string} opacity="0.7"/>
          <rect x={+x-1} y={+y+4} width="2" height="8" fill="#16A34A"/>
        </g>
      ))}

      {/* ── MUSHROOMS ────────────────────────────────────────────── */}
      {[[340,1320,'#EF4444'],[35,1320,'#F59E0B'],[340,820,'#EF4444']].map(([x,y,c],i)=>(
        <g key={i}>
          <rect x={+x+4} y={+y+10} width="8" height="12" fill="#FAFAFA"/>
          <ellipse cx={+x+8} cy={+y+10} rx="12" ry="8" fill={c as string}/>
          {[+x+4,+x+9,+x+14].map((dx,j)=>(
            <circle key={j} cx={dx} cy={+y+8} r="2" fill="white" opacity="0.9"/>
          ))}
        </g>
      ))}

      {/* ── THE GOLDEN WINDING PATH ───────────────────────────────── */}
      {/* Shadow/outline */}
      <path
        d={`M ${LEVELS.map(l=>`${l.cx*3.75},${l.cy+28}`).join(' L ')}`}
        fill="none" stroke={palette.pathShadow} strokeWidth="24"
        strokeLinecap="round" strokeLinejoin="round" opacity="0.5"
      />
      {/* Main coloured trail */}
      <path
        d={`M ${LEVELS.map(l=>`${l.cx*3.75},${l.cy+28}`).join(' L ')}`}
        fill="none" stroke="url(#gPath)" strokeWidth="16"
        strokeLinecap="round" strokeLinejoin="round"
        filter="url(#fGlow)"
      />
      {/* White dashes */}
      <path
        d={`M ${LEVELS.map(l=>`${l.cx*3.75},${l.cy+28}`).join(' L ')}`}
        fill="none" stroke="white" strokeWidth="3"
        strokeDasharray="10 8" strokeLinecap="round" opacity="0.9"
      />

      {/* ── DECORATIVE WATERFALLS near river banks ─────────────── */}
      {[[290,510],[135,900]].map(([x,y],i)=>(
        <g key={i}>
          {[0,6,12].map(dx=>(
            <path key={dx} d={`M ${x+dx},${y} Q ${x+dx+2},${y+20} ${x+dx},${y+45}`}
              fill="none" stroke="#BAE6FD" strokeWidth="2.5" opacity="0.8"/>
          ))}
          <ellipse cx={x+6} cy={y+50} rx="12" ry="5" fill="#7DD3FC" opacity="0.6"/>
        </g>
      ))}
    </svg>
  );
}

// ─── 3D Level Node ─────────────────────────────────────────────────────────
function LevelNode({
  level, isCompleted, isActive, isUnlocked, onPress,
}: {
  level: HRLevel; isCompleted: boolean; isActive: boolean; isUnlocked: boolean;
  onPress: () => void;
}) {
  const col = isCompleted
    ? { bg:'#4ADE80', mid:'#16A34A', shadow:'rgba(22,163,74,0.55)', border:'#BBF7D0', text:'#fff', ring:'' }
    : isActive
    ? { bg:'#F472B6', mid:'#DB2777', shadow:'rgba(219,39,119,0.6)', border:'#FDE68A', text:'#fff', ring:'ring-4 ring-pink-400/40 ring-offset-1' }
    : isUnlocked
    ? { bg:'#60A5FA', mid:'#2563EB', shadow:'rgba(37,99,235,0.45)', border:'#BFDBFE', text:'#fff', ring:'' }
    : { bg:'#94A3B8', mid:'#475569', shadow:'rgba(0,0,0,0.3)', border:'#CBD5E1', text:'#CBD5E1', ring:'' };

  return (
    <motion.div
      whileHover={{ scale: isUnlocked ? 1.1 : 1 }}
      whileTap={{ scale: isUnlocked ? 0.92 : 0.96 }}
      onClick={onPress}
      className="relative flex flex-col items-center cursor-pointer select-none"
      style={{ userSelect: 'none' }}
    >
      {/* Active ring pulse */}
      {isActive && (
        <span className="absolute inset-0 rounded-full bg-pink-400/50 animate-ping" style={{ borderRadius:'50%' }}/>
      )}

      {/* Crown badge */}
      {(level.num === 17 || level.num === 18) && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
          <div className="w-7 h-7 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center shadow-lg">
            <Crown size={14} className="text-amber-900 fill-amber-900"/>
          </div>
        </div>
      )}

      {/* 3D Sphere */}
      <div
        className={`relative flex items-center justify-center ${col.ring}`}
        style={{
          width: 58, height: 58, borderRadius: '50%',
          background: `radial-gradient(circle at 36% 36%, ${col.bg}, ${col.mid})`,
          border: `3.5px solid ${col.border}`,
          boxShadow: `0 8px 20px ${col.shadow}, inset 0 -6px 10px rgba(0,0,0,0.3), inset 0 4px 8px rgba(255,255,255,0.6)`,
        }}
      >
        {/* Specular gloss */}
        <div style={{ position:'absolute', top:8, left:12, width:14, height:8, borderRadius:'50%', background:'rgba(255,255,255,0.65)', transform:'rotate(-30deg)', filter:'blur(1px)' }}/>

        {isCompleted ? (
          <div className="flex flex-col items-center -mt-0.5">
            <span className="font-black text-white text-base leading-none drop-shadow">{level.num}</span>
            <CheckCircle2 size={14} className="text-emerald-100 mt-0.5"/>
          </div>
        ) : isActive ? (
          <div className="flex flex-col items-center -mt-0.5">
            <span className="font-black text-white text-lg leading-none drop-shadow">{level.num}</span>
            <PlayCircle size={14} className="text-amber-100 mt-0.5 animate-bounce"/>
          </div>
        ) : isUnlocked ? (
          <span className="font-black text-white text-lg drop-shadow">{level.num}</span>
        ) : (
          <div className="flex flex-col items-center">
            <span className="font-bold text-slate-300 text-sm">{level.num}</span>
            <Lock size={12} className="text-slate-300"/>
          </div>
        )}
      </div>

      {/* Stars */}
      {isCompleted && (
        <div className="flex gap-0.5 mt-1">
          {[0,1,2].map(i=>(
            <Star key={i} size={11} className="text-amber-400 fill-amber-400 drop-shadow"/>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ─── Wooden Sign ────────────────────────────────────────────────────────────
function WoodenSign({ text }: { text: string }) {
  return (
    <div style={{
      background:'linear-gradient(180deg,#A16207 0%,#78350F 60%,#451A03 100%)',
      border:'2.5px solid #F59E0B',
      borderRadius: 12,
      boxShadow:'0 6px 14px rgba(0,0,0,0.35), inset 0 2px 4px rgba(255,255,255,0.25)',
      padding:'6px 10px',
      maxWidth: 130,
    }}>
      <p className="text-[10px] font-black text-amber-100 leading-snug text-center" style={{ fontFamily:'Georgia, serif', textShadow:'0 1px 3px rgba(0,0,0,0.7)' }}>
        {text}
      </p>
    </div>
  );
}

// ─── Character decorations ─────────────────────────────────────────────────
function Character({ type }: { type: HRLevel['char'] }) {
  const emoji: Record<string, string> = { hero:'👦🏻', ghost:'👻', skull:'💀', devil:'👹', crown:'🧙‍♂️' };
  return (
    <motion.div
      animate={type === 'ghost' ? { y:[0,-10,0], rotate:[-5,5,-5] } : { y:[0,-6,0] }}
      transition={{ repeat:Infinity, duration: type === 'ghost' ? 3 : 2.2, ease:'easeInOut' }}
      className="flex items-center justify-center"
      style={{
        width:44, height:44, borderRadius:'50%',
        background: type === 'skull' ? 'rgba(15,23,42,0.9)' : type === 'devil' ? 'rgba(127,29,29,0.7)' : 'rgba(255,255,255,0.2)',
        border: type === 'hero' ? '2px solid #FDE68A' : '1.5px solid rgba(255,255,255,0.4)',
        boxShadow:'0 6px 18px rgba(0,0,0,0.4)',
        fontSize: 22,
      }}
    >
      {emoji[type!] ?? ''}
    </motion.div>
  );
}

// ─── Track Banner ───────────────────────────────────────────────────────────
function TrackBanner({ track }: { track: HRLevel['track'] }) {
  const cfg = {
    beginner:     { label:'Beginner HR Track (1 – 6)',     sub:'Build Your Basics',            grad:'linear-gradient(135deg,#059669,#065F46)', border:'#6EE7B7', icon:'🌱' },
    intermediate: { label:'Intermediate HR Track (7 – 12)', sub:'Real Scenarios & Situations', grad:'linear-gradient(135deg,#0284C7,#1E3A8A)', border:'#7DD3FC', icon:'🔥' },
    advanced:     { label:'Advanced HR Track (13 – 18)',   sub:'Mastery & Leadership',         grad:'linear-gradient(135deg,#7C3AED,#BE185D)', border:'#DDD6FE', icon:'👑' },
  }[track];

  return (
    <div style={{
      background: cfg.grad,
      border: `2px solid ${cfg.border}`,
      borderRadius: 16,
      padding: '8px 14px',
      boxShadow:'0 8px 24px rgba(0,0,0,0.35), inset 0 1px 3px rgba(255,255,255,0.35)',
      textAlign:'center',
    }}>
      <div className="flex items-center justify-center gap-1.5">
        <span className="text-sm">{cfg.icon}</span>
        <p className="text-xs font-black text-white uppercase tracking-wide drop-shadow">{cfg.label}</p>
      </div>
      <p className="text-[10px] font-bold text-white/80 mt-0.5">{cfg.sub}</p>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function MobileHRPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [selected, setSelected] = useState<HRLevel | null>(null);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [celebrate, setCelebrate] = useState<string | null>(null);
  const [lockedToast, setLockedToast] = useState<string | null>(null);

  const activeThemeKey = (resolvedTheme || theme || 'dark') as ThemeName;
  const palette = THEME_PALETTES[activeThemeKey] || THEME_PALETTES.dark;

  const firstName = session?.user?.name?.split(' ')[0] ?? 'there';
  const avatarUrl = session?.user?.image;

  // ── Load progress from database (with fallback to cached localStorage) ──
  const fetchProgress = async () => {
    try {
      const r = await fetch('/api/hr-progress');
      if (r.ok) {
        const d = await r.json();
        if (d && typeof d === 'object') {
          setDone(d);
          try { localStorage.setItem('hrProgress', JSON.stringify(d)); } catch {}
          return;
        }
      }
    } catch (e) {
      console.error('Failed to load HR progress from backend DB:', e);
    }
    // Fallback to cached localStorage if network error
    try {
      const s = localStorage.getItem('hrProgress');
      if (s) {
        const parsed = JSON.parse(s);
        if (parsed && typeof parsed === 'object') setDone(parsed);
      }
    } catch {}
  };

  useEffect(() => {
    fetchProgress();

    // Refetch latest DB progress when window/tab receives focus (e.g. after completing a lesson)
    const onFocus = () => fetchProgress();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const completedCount = Object.keys(done).filter(k => done[k]).length;
  const totalLevels = LEVELS.length; // 18
  const pct = Math.round((completedCount / totalLevels) * 100);

  // ── Status of a level based on STRICT sequential unlock ─────────────
  const statusOf = (level: HRLevel) => {
    const isCompleted = !!done[level.id];
    // Level 1 is unlocked initially.
    // Level N (N > 1) is unlocked ONLY IF all preceding levels 1..N-1 are completed!
    let allPrevCompleted = true;
    for (let i = 1; i < level.num; i++) {
      if (!done[`h${i}`]) {
        allPrevCompleted = false;
        break;
      }
    }
    const isUnlocked = level.num === 1 || allPrevCompleted;
    const isActive = isUnlocked && !isCompleted;
    return { isCompleted, isUnlocked, isActive };
  };

  // ── Compute the player's current level (next unlocked+incomplete) ──
  const playerLevel = [...LEVELS]
    .sort((a, b) => a.num - b.num)                   // ascending by num (1→18)
    .find(l => {
      const { isUnlocked, isCompleted } = statusOf(l);
      return isUnlocked && !isCompleted;
    })
    ?? LEVELS.find(l => l.num === 18)                // fallback: last level
    ?? LEVELS[0];

  // pixel centre of the player on the map canvas (375 px wide)
  const MAP_W = 375;
  const playerX = (playerLevel.cx / 100) * MAP_W - 22;  // 44px wide char → centre
  const playerY = playerLevel.cy - 58;                   // 58px above level node

  // ── Auto-scroll to center the active player level node on load & level change ──
  useEffect(() => {
    const scrollToActiveLevel = () => {
      if (!scrollRef.current) return;
      const viewportH = scrollRef.current.clientHeight || 500;
      // Center the active player level node vertically in the scroll container
      const targetScroll = Math.max(0, playerLevel.cy - viewportH / 2 + 30);
      scrollRef.current.scrollTo({
        top: targetScroll,
        behavior: 'smooth',
      });
    };

    const timer = setTimeout(scrollToActiveLevel, 100);
    return () => clearTimeout(timer);
  }, [playerLevel.id, playerLevel.cy]);

  // ── Handle tapping on a level node ────────────────────────────────
  const handleLevelPress = (level: HRLevel) => {
    const { isUnlocked } = statusOf(level);
    if (!isUnlocked) {
      setLockedToast(`🔒 Level ${level.num} is Locked! Complete Level ${level.num - 1} first.`);
      setTimeout(() => setLockedToast(null), 2800);
      return;
    }
    setSelected(level);
  };

  // ── Reset progress function (Deletes from DB + state) ──────────────
  const resetProgress = async () => {
    setDone({});
    try { localStorage.removeItem('hrProgress'); } catch {}
    try {
      await fetch('/api/hr-progress', { method: 'DELETE' });
    } catch (e) {
      console.error('Failed to reset HR progress in DB:', e);
    }
  };

  // ── Start AI Interview lesson session ──────────────────────────────
  const startLesson = (level: HRLevel) => {
    setSelected(null);
    router.push(`/train/session/HR_INTERVIEW?lessonId=${level.id}&lessonTitle=${encodeURIComponent(level.title)}`);
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col sm:hidden overflow-hidden transition-colors duration-300">

      {/* ══ LEVEL COMPLETION CELEBRATION OVERLAY ══════════════════════ */}
      <AnimatePresence>
        {celebrate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 500,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.3, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 18 }}
              style={{
                background: 'linear-gradient(135deg,#F59E0B,#EC4899,#7C3AED)',
                borderRadius: 28, padding: '24px 36px', textAlign: 'center',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5), inset 0 2px 6px rgba(255,255,255,0.4)',
                border: '3px solid #FCD34D',
              }}
            >
              <div style={{ fontSize: 48 }}>🎉</div>
              <p style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: '8px 0 4px', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>Level Complete!</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', margin: 0, fontWeight: 700 }}>Starting your lesson…</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 10 }}>
                {[0,1,2].map(i => <span key={i} style={{ fontSize: 24 }}>⭐</span>)}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ LOCKED LEVEL TOAST OVERLAY ════════════════════════════════ */}
      <AnimatePresence>
        {lockedToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 380, damping: 24 }}
            style={{
              position: 'fixed', top: 68, left: '50%', transform: 'translateX(-50%)',
              zIndex: 500,
              background: 'linear-gradient(135deg, #1E293B, #0F172A)',
              border: '2px solid #F59E0B',
              borderRadius: 20,
              padding: '10px 18px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              display: 'flex', alignItems: 'center', gap: 8,
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 800, color: '#FDE68A' }}>{lockedToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ TOP HEADER (Exact Match with MobileTrainPage) ══════════════ */}
      <header
        className="flex items-center justify-between px-4 shrink-0"
        style={{
          height: '56px',
          background: palette.headerBg,
          backdropFilter: 'blur(16px)',
          borderBottom: `1px solid ${palette.headerBorder}`,
          boxShadow: '0 1px 6px rgba(0,0,0,0.12)',
          flexShrink: 0,
          zIndex: 50,
          transition: 'background-color 0.3s, border-color 0.3s',
        }}
      >
        {/* Left: Hamburger + Logo + Fluenzy AI Brand */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl active:opacity-60 flex items-center justify-center transition-colors"
            style={{
              color: palette.headerIcon,
              background: palette.menuBtnBg,
            }}
            aria-label="Open menu"
          >
            <Menu size={22} style={{ color: palette.headerIcon, stroke: palette.headerIcon }} />
          </button>
          <LogoContainer />
          <span className="font-black text-lg tracking-tight bg-gradient-to-r from-violet-600 via-indigo-600 to-pink-500 bg-clip-text text-transparent">
            Fluenzy AI
          </span>
        </div>

        {/* Right: Theme button + Notification Bell + Profile Avatar */}
        <div className="flex items-center gap-1.5">
          <div className="relative">
            <button
              onClick={() => setThemeOpen(!themeOpen)}
              className="p-2 rounded-xl active:opacity-60 flex items-center justify-center border shadow-sm transition-transform active:scale-95"
              style={{
                color: palette.headerIcon,
                background: palette.menuBtnBg,
                borderColor: palette.headerBorder,
              }}
              aria-label="Change theme"
            >
              <ThemeIcon activeTheme={activeThemeKey} color={palette.headerIcon} />
            </button>
            <AnimatePresence>
              {themeOpen && (
                <>
                  <div className="fixed inset-0 z-[300]" onClick={() => setThemeOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-1 rounded-xl overflow-hidden shadow-2xl z-[310]"
                    style={{
                      width: '160px',
                      background: palette.themeMenuBg,
                      border: `1px solid ${palette.themeMenuBorder}`,
                    }}
                  >
                    {THEME_OPTIONS.map((opt) => {
                      const active = activeThemeKey === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => { setTheme(opt.value); setThemeOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-extrabold transition-colors"
                          style={{
                            color: active ? palette.themeMenuItemText : palette.headerText,
                            WebkitTextFillColor: active ? palette.themeMenuItemText : palette.headerText,
                            background: active ? palette.themeMenuItemBg : 'transparent',
                          }}
                        >
                          <opt.icon size={16} style={{ color: active ? palette.themeMenuItemText : palette.headerIcon, stroke: active ? palette.themeMenuItemText : palette.headerIcon }} />
                          <span>{opt.label}</span>
                        </button>
                      );
                    })}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          <NotificationBell isDark={activeThemeKey !== 'light' && activeThemeKey !== 'parchment'} iconSize={20} />
          <button
            onClick={() => router.push('/profile')}
            className="w-9 h-9 rounded-xl overflow-hidden border-2 border-indigo-400/50 shadow-sm flex items-center justify-center active:scale-95 transition-transform shrink-0"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #4F46E5)' }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={firstName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <span className="text-white font-black text-sm">{firstName[0]?.toUpperCase()}</span>
            )}
          </button>
        </div>
      </header>

      {/* ══ PROGRESS STRIP ═══════════════════════════════════════════════ */}
      <div style={{
        padding: '6px 14px',
        background: palette.headerBg,
        borderBottom: `1px solid ${palette.headerBorder}`,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexShrink: 0,
        zIndex: 49,
        backdropFilter: 'blur(12px)',
      }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: palette.navActive, whiteSpace: 'nowrap' }}>
          {completedCount}/{totalLevels} Levels
        </span>
        <div style={{ flex: 1, height: 8, borderRadius: 99, background: 'rgba(0,0,0,0.15)', overflow: 'hidden', border: `1px solid ${palette.headerBorder}` }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{
              height: '100%',
              borderRadius: 99,
              background: 'linear-gradient(90deg,#34D399,#60A5FA,#A78BFA,#F472B6)',
              boxShadow: '0 0 8px rgba(167,139,250,0.6)',
            }}
          />
        </div>
        <span style={{ fontSize: 10, fontWeight: 900, color: palette.navActive, whiteSpace: 'nowrap' }}>
          {pct}%
        </span>
        {completedCount >= totalLevels && (
          <span style={{ fontSize: 14 }}>🏆</span>
        )}
      </div>

      {/* ══ MAP SCROLL CANVAS ════════════════════════════════════════════ */}
      <div ref={scrollRef} style={{ flex:1,overflowY:'auto',position:'relative',paddingBottom:80 }}>
        {/* Full-size pure-code world SVG dynamically styled by active theme */}
        <div style={{ position:'relative', width:'100%', height: MAP_H }}>
          <WorldSVG palette={palette}/>

          {/* ── ANIMATED PLAYER CHARACTER (moves to active level) ──── */}
          <motion.div
            key="player-hero"
            animate={{ x: playerX, y: playerY }}
            initial={{ x: (26 / 100) * MAP_W - 22, y: 1755 - 58 }}  // start at level 1
            transition={{
              type: 'spring',
              stiffness: 55,
              damping: 14,
              mass: 1.1,
              duration: 1.4,
            }}
            style={{ position: 'absolute', top: 0, left: 0, zIndex: 36, width: 44 }}
          >
            {/* Glow ring under character */}
            <motion.div
              animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0.9, 0.6] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              style={{
                position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)',
                width: 36, height: 10, borderRadius: '50%',
                background: 'radial-gradient(ellipse, rgba(251,191,36,0.7) 0%, transparent 75%)',
                filter: 'blur(2px)',
              }}
            />
            {/* Character bubble */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
              style={{
                width: 44, height: 44, borderRadius: '50%',
                background: 'radial-gradient(circle at 40% 35%, #FDE68A, #F59E0B)',
                border: '3px solid #FCD34D',
                boxShadow: '0 8px 24px rgba(245,158,11,0.55), inset 0 3px 6px rgba(255,255,255,0.6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22,
              }}
            >
              👦🏻
            </motion.div>

            {/* Speech bubble – shown at current active level */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.6, type: 'spring', stiffness: 300, damping: 18 }}
              style={{
                position: 'absolute', bottom: 50, left: '50%', transform: 'translateX(-50%)',
                background: '#fff',
                borderRadius: 10,
                padding: '3px 7px',
                fontSize: 9,
                fontWeight: 900,
                color: '#7C3AED',
                whiteSpace: 'nowrap',
                boxShadow: '0 3px 10px rgba(0,0,0,0.25)',
                border: '1.5px solid #DDD6FE',
              }}
            >
              Lv {playerLevel.num} 🎯
              {/* Tail */}
              <span style={{
                position: 'absolute', bottom: -7, left: '50%', transform: 'translateX(-50%)',
                width: 0, height: 0,
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderTop: '7px solid #fff',
              }}/>
            </motion.div>
          </motion.div>

          {/* ── Render each level in absolute position ──────────────── */}
          {LEVELS.map((level, idx) => {
            const { isCompleted, isUnlocked, isActive } = statusOf(level);
            // track banners appear just below first level of each track
            const showBegBanner = level.num === 1;
            const showIntBanner = level.num === 7;
            const showAdvBanner = level.num === 13;
            const BANNER_OFFSET = 65;

            const leftPct  = level.cx;
            const topPx    = level.cy;
            // label card sits to the right if cx < 50, left if cx >= 50
            const labelRight = level.cx < 50;

            return (
              <div key={level.id}>
                {/* Track Banners */}
                {showBegBanner && (
                  <div style={{ position:'absolute', left:'5%', right:'5%', top: topPx + BANNER_OFFSET + 5, zIndex:15 }}>
                    <TrackBanner track="beginner"/>
                  </div>
                )}
                {showIntBanner && (
                  <div style={{ position:'absolute', left:'5%', right:'5%', top: topPx + BANNER_OFFSET - 5, zIndex:15 }}>
                    <TrackBanner track="intermediate"/>
                  </div>
                )}
                {showAdvBanner && (
                  <div style={{ position:'absolute', left:'5%', right:'5%', top: topPx + BANNER_OFFSET - 5, zIndex:15 }}>
                    <TrackBanner track="advanced"/>
                  </div>
                )}

                {/* Character above node */}
                {level.char && (
                  <div style={{ position:'absolute', left:`${leftPct}%`, top: topPx - 52, transform:'translateX(-50%)', zIndex:25 }}>
                    <Character type={level.char}/>
                  </div>
                )}

                {/* Wooden sign */}
                {level.signText && (
                  <div style={{
                    position:'absolute',
                    [level.signDir === 'left' ? 'left' : 'right']: 6,
                    top: topPx + 4,
                    zIndex: 20,
                  }}>
                    <WoodenSign text={level.signText}/>
                  </div>
                )}

                {/* Level node + label card */}
                <div style={{ position:'absolute', left:`${leftPct}%`, top: topPx, transform:'translateX(-50%)', zIndex:30 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, flexDirection: labelRight ? 'row' : 'row-reverse' }}>
                    <LevelNode
                      level={level}
                      isCompleted={isCompleted}
                      isActive={isActive}
                      isUnlocked={isUnlocked}
                      onPress={() => handleLevelPress(level)}
                    />
                    {/* Theme-aware title pill card */}
                    <motion.div
                      initial={{ opacity:0, x: labelRight ? -10 : 10 }}
                      animate={{ opacity: isUnlocked ? 1 : 0.65, x:0 }}
                      transition={{ delay: idx * 0.04 }}
                      onClick={() => handleLevelPress(level)}
                      style={{
                        background: palette.cardBg,
                        borderRadius: 14,
                        padding: '5px 10px',
                        border: `1.5px solid ${palette.cardBorder}`,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                        maxWidth: 140,
                        backdropFilter: 'blur(8px)',
                        cursor: isUnlocked ? 'pointer' : 'not-allowed',
                        transition: 'background-color 0.3s, border-color 0.3s, color 0.3s, opacity 0.3s',
                      }}
                    >
                      <p style={{ fontSize:10, fontWeight:900, color: palette.cardText, lineHeight:1.35, margin:0 }}>
                        {level.title}
                      </p>
                      {isCompleted ? (
                        <div style={{ display:'flex',gap:2,marginTop:3 }}>
                          {[0,1,2].map(i=><span key={i} style={{ fontSize:10 }}>⭐</span>)}
                        </div>
                      ) : !isUnlocked ? (
                        <span style={{ fontSize:8, fontWeight:800, color: palette.navInactive, marginTop:2, display:'inline-block' }}>
                          🔒 Locked
                        </span>
                      ) : null}
                    </motion.div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Castle / Final Banner at very top */}
          <div style={{ position:'absolute', left:'5%', right:'5%', top: 10, zIndex:30 }}>
            <motion.div
              animate={{ boxShadow:['0 8px 30px rgba(124,58,237,0.3)','0 12px 40px rgba(236,72,153,0.45)','0 8px 30px rgba(124,58,237,0.3)'] }}
              transition={{ duration:3, repeat:Infinity }}
              style={{ background:'linear-gradient(135deg,#F59E0B,#D97706,#92400E)', borderRadius:20, padding:'10px 16px', border:'3px solid #FCD34D', boxShadow:'0 10px 30px rgba(0,0,0,0.3), inset 0 2px 6px rgba(255,255,255,0.5)', textAlign:'center' }}
            >
              <div style={{ display:'flex',justifyContent:'center',marginBottom:4 }}>
                <motion.div animate={{ scale:[1,1.15,1] }} transition={{ duration:2,repeat:Infinity }}
                  style={{ width:38,height:38,borderRadius:'50%',background:'#FCD34D',border:'2.5px solid white',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 10px rgba(0,0,0,0.3)',marginTop:-22 }}>
                  <Crown size={20} color="#451A03"/>
                </motion.div>
              </div>
              <p style={{ fontSize:13,fontWeight:900,color:'#FEF3C7',fontFamily:'Georgia,serif',textShadow:'0 2px 4px rgba(0,0,0,0.6)',margin:'0 0 2px' }}>
                🎯 Final Level – Be Interview Ready!
              </p>
              <p style={{ fontSize:10,fontWeight:700,color:'rgba(254,243,199,0.85)',margin:0 }}>
                Complete all 18 steps to master HR Interviews
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ══ LESSON DRAWER ═══════════════════════════════════════════════ */}
      <AnimatePresence>
        {selected && (() => {
          const { isCompleted, isUnlocked, isActive } = statusOf(selected);
          return (
            <>
              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                onClick={() => setSelected(null)} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',backdropFilter:'blur(4px)',zIndex:300 }}/>
              <motion.div
                initial={{ y:'100%' }} animate={{ y:0 }} exit={{ y:'100%' }}
                transition={{ type:'spring', damping:26, stiffness:290 }}
                style={{ position:'fixed',bottom:0,left:0,right:0,zIndex:310,borderRadius:'24px 24px 0 0',background: palette.drawerBg, borderTop:`2px solid ${palette.drawerBorder}`,padding:20,boxShadow:'0 -20px 60px rgba(0,0,0,0.6)' }}
              >
                <div style={{ width:44,height:5,borderRadius:99,background:'rgba(255,255,255,0.2)',margin:'0 auto 16px' }}/>
                <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:16 }}>
                  <div style={{ display:'flex',alignItems:'center',gap:12 }}>
                    <div style={{ width:48,height:48,borderRadius:14,background: isCompleted ? '#059669' : isUnlocked ? 'linear-gradient(135deg,#EC4899,#7C3AED)':'#334155', display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 6px 16px rgba(0,0,0,0.4)' }}>
                      <span style={{ fontSize:20,fontWeight:900,color:'#fff' }}>{selected.num}</span>
                    </div>
                    <div>
                      <p style={{ fontSize:10,fontWeight:900,color: palette.navActive,textTransform:'uppercase',letterSpacing:1,margin:'0 0 2px' }}>{selected.track} track</p>
                      <p style={{ fontSize:16,fontWeight:900,color: palette.drawerText,margin:0,lineHeight:1.3 }}>{selected.title}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelected(null)} style={{ padding:8,borderRadius:'50%',background:'rgba(255,255,255,0.1)',border:'none',cursor:'pointer' }}>
                    <X size={18} color={palette.drawerText}/>
                  </button>
                </div>
                <div style={{ background:'rgba(255,255,255,0.06)',borderRadius:14,padding:'12px 14px',marginBottom:14,border:'1px solid rgba(255,255,255,0.08)' }}>
                  {[
                    ['Status', isCompleted ? '✅ Completed – 3 Stars' : isActive ? '▶️ Ready to Practice' : '🔒 Locked', isCompleted ? '#34D399' : isActive ? '#F472B6' : '#94A3B8'],
                    ['Estimated Time', '5 – 8 Minutes', palette.drawerText],
                    ['Mode', '🎙️ AI Voice Coach', '#F472B6'],
                  ].map(([k,v,col])=>(
                    <div key={k as string} style={{ display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ fontSize:11,color:'rgba(255,255,255,0.6)' }}>{k}</span>
                      <span style={{ fontSize:11,fontWeight:700,color:col as string }}>{v}</span>
                    </div>
                  ))}
                </div>
                {isUnlocked ? (
                  <motion.button
                    whileTap={{ scale:0.96 }}
                    onClick={() => startLesson(selected)}
                    style={{ width:'100%',padding:'14px 0',borderRadius:18,background:'linear-gradient(135deg,#EC4899,#8B5CF6,#3B82F6)',border:'none',color:'#fff',fontSize:14,fontWeight:900,cursor:'pointer',boxShadow:'0 8px 24px rgba(139,92,246,0.4)',display:'flex',alignItems:'center',justifyContent:'center',gap:8 }}
                  >
                    <PlayCircle size={20} color="white"/>
                    {isCompleted ? 'Retry Lesson ' : 'Start Lesson '}{selected.num}
                  </motion.button>
                ) : (
                  <div style={{ textAlign:'center',padding:'12px',background:'rgba(255,255,255,0.05)',borderRadius:14,border:'1px solid rgba(255,255,255,0.1)' }}>
                    <Lock size={18} color="#94A3B8"/>
                    <p style={{ color:'#94A3B8',fontSize:12,margin:'6px 0 0',fontWeight:700 }}>Complete previous lessons to unlock</p>
                  </div>
                )}
              </motion.div>
            </>
          );
        })()}
      </AnimatePresence>

      {/* ══ ASK AI FAB ══════════════════════════════════════════════════ */}
      <motion.button
        initial={{ scale:0 }} animate={{ scale:1 }} transition={{ delay:0.6,type:'spring',stiffness:300,damping:20 }}
        onClick={() => window.dispatchEvent(new CustomEvent('open-side-chatbot'))}
        style={{ position:'fixed',right:16,bottom:80,zIndex:220,width:54,height:54,borderRadius:'50%',background:'linear-gradient(135deg,#EC4899,#7C3AED)',border:'1.5px solid rgba(255,255,255,0.4)',boxShadow:'0 8px 24px rgba(236,72,153,0.5)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:2,cursor:'pointer' }}
        className="sm:hidden"
        aria-label="Ask AI"
      >
        <Sparkles size={17} color="white"/>
        <span style={{ fontSize:8,fontWeight:900,color:'#fff',letterSpacing:0.5 }}>Ask AI</span>
      </motion.button>

      {/* ══ SIDEBAR ═════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              onClick={() => setSidebarOpen(false)}
              style={{ position:'fixed',inset:0,zIndex:250,background:'rgba(0,0,0,0.55)',backdropFilter:'blur(3px)' }}/>
            <motion.aside initial={{ x:'-100%' }} animate={{ x:0 }} exit={{ x:'-100%' }} transition={{ type:'spring',damping:25,stiffness:280 }}
              style={{ position:'fixed',left:0,top:0,bottom:0,zIndex:260,width:272,background: palette.drawerBg, borderRight:`1px solid ${palette.drawerBorder}`,overflowY:'auto',padding:16 }}>
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20 }}>
                <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                  <img src="/white-removebg-preview1.png" alt="Logo" style={{ width:30,height:30,objectFit:'contain' }}/>
                  <span style={{ fontWeight:900,color: palette.drawerText,fontSize:17 }}>Fluenzy AI</span>
                </div>
                <button onClick={() => setSidebarOpen(false)} style={{ background:'none',border:'none',cursor:'pointer',padding:4 }}>
                  <X size={20} color={palette.drawerText}/>
                </button>
              </div>
              {SIDEBAR_SECTIONS.map(sec=>(
                <div key={sec.title} style={{ marginBottom:20 }}>
                  <p style={{ fontSize:9,fontWeight:900,color: palette.navInactive,textTransform:'uppercase',letterSpacing:2,padding:'0 8px',marginBottom:6 }}>{sec.title}</p>
                  {sec.items.map(item=>(
                    <Link key={item.label} href={item.href} onClick={() => setSidebarOpen(false)}
                      style={{ display:'flex',alignItems:'center',gap:10,padding:'9px 10px',borderRadius:12,textDecoration:'none', background: item.href==='/train/hr' ? 'rgba(124,58,237,0.25)':'transparent',marginBottom:2,border: item.href==='/train/hr' ? '1px solid rgba(124,58,237,0.4)':'1px solid transparent' }}>
                      <item.icon size={15} color={item.href==='/train/hr' ? palette.navActive : palette.navInactive}/>
                      <span style={{ fontSize:12,fontWeight:700,color: item.href==='/train/hr' ? palette.navActive : palette.drawerText }}>{item.label}</span>
                    </Link>
                  ))}
                </div>
              ))}
              <div style={{ paddingTop:12,borderTop:`1px solid ${palette.drawerBorder}` }}>
                <button
                  onClick={() => { setSidebarOpen(false); resetProgress(); }}
                  style={{ display:'flex',alignItems:'center',gap:10,width:'100%',padding:'10px 12px',borderRadius:12,background:'rgba(239,68,68,0.12)',border:'1px solid rgba(239,68,68,0.3)',color:'#EF4444',fontSize:12,fontWeight:800,cursor:'pointer' }}
                >
                  <X size={15} color="#EF4444"/>
                  Reset Game Progress 🔄
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ══ BOTTOM NAV ══════════════════════════════════════════════════ */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-[220] sm:hidden flex items-end justify-around"
        style={{
          height: '64px',
          paddingBottom: 'env(safe-area-inset-bottom, 4px)',
        }}
      >
        {/* Downward concave scoop SVG background */}
        <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
          <svg
            viewBox="0 0 375 64"
            preserveAspectRatio="none"
            className="w-full h-full"
            style={{
              filter: activeThemeKey === 'light' || activeThemeKey === 'parchment'
                ? 'drop-shadow(0px -4px 12px rgba(0,0,0,0.08))'
                : 'drop-shadow(0px -4px 16px rgba(0,0,0,0.3))',
            }}
          >
            <path
              d="M 0,0 L 132,0 C 152,0 160,24 187.5,24 C 215,24 223,0 243,0 L 375,0 L 375,64 L 0,64 Z"
              fill={palette.navBg}
              stroke={palette.navBorder}
              strokeWidth="1"
            />
          </svg>
        </div>

        {/* Tab Items */}
        <div className="relative z-10 flex items-center justify-around w-full h-full pt-1 px-1">
          {TABS.map((tab) => {
            const isHome = tab.label === 'Home';
            const isCurrentPage = tab.label === 'Practice';
            const activeColor = activeThemeKey === 'light' || activeThemeKey === 'parchment' ? '#7C3AED' : palette.navActive;
            const inactiveIconColor = activeThemeKey === 'light' || activeThemeKey === 'parchment' ? '#475569' : palette.navInactive;
            const inactiveTextColor = activeThemeKey === 'light' || activeThemeKey === 'parchment' ? '#334155' : palette.navInactive;

            const iconColor = isCurrentPage && !isHome ? tab.tabColor : (isHome ? activeColor : inactiveIconColor);
            const textColor = isCurrentPage && !isHome ? tab.tabColor : (isHome ? activeColor : inactiveTextColor);
            const Icon = tab.icon;

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
                  <Icon size={22} style={{ color: iconColor, stroke: iconColor }} />
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
    </div>
  );
}
