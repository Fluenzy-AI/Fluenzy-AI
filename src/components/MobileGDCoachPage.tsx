'use client';

// ═══════════════════════════════════════════════════════════════════════════════
// Mobile GD Coach Page
// Reuses the exact design system, 3D Candy-Crush map, theme palettes,
// sticky top header, drawer, and bottom navigation bar from MobileHRPage
// ═══════════════════════════════════════════════════════════════════════════════

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import NotificationBell from '@/components/NotificationBell';
import {
  Menu, Home, Link2, BarChart3, User, Target, Sparkles, X,
  Trophy, Lock, CheckCircle2, PlayCircle, Star, Map,
  GraduationCap, Crown, Sun, Moon, Leaf, Coffee, Terminal,
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

/* ── Logo helper matching MobileHRPage ── */
const LogoContainer = () => (
  <div className="flex items-center justify-center shrink-0">
    <img
      src="/white-removebg-preview1.png"
      alt="Fluenzy AI Logo"
      className="w-9 h-9 object-contain filter drop-shadow-sm active:scale-95 transition-transform"
    />
  </div>
);

/* ── Theme icon helper matching MobileHRPage ── */
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
  { label: 'Practice', icon: Target, href: '/train/gd-coach', tabColor: '#10B981' },
  { label: 'Home', icon: Home, href: '/train', tabColor: '#7C3AED' },
  { label: 'Analytics', icon: BarChart3, href: '/analytics', tabColor: '#F97316' },
  { label: 'Profile', icon: User, href: '/profile', tabColor: '#0EA5E9' },
];

interface GDLevel {
  id: string; num: number; title: string;
  track: 'beginner' | 'intermediate' | 'advanced';
  cx: number; cy: number;
  signText?: string; signDir?: 'left' | 'right';
  char?: 'hero' | 'ghost' | 'skull' | 'devil' | 'crown';
}

const LEVELS: GDLevel[] = [
  { id:'gd24', num:24, title:'Role Training: Leader Participant', track:'advanced', cx:52, cy:80, char:'crown', signText:'Master the GD Leadership Standard!', signDir:'right' },
  { id:'gd23', num:23, title:'Role Training: Summarizer', track:'advanced', cx:30, cy:175, char:'crown' },
  { id:'gd22', num:22, title:'Role Training: Moderator', track:'advanced', cx:68, cy:270 },
  { id:'gd21', num:21, title:'High-Impact Summary', track:'advanced', cx:78, cy:365 },
  { id:'gd20', num:20, title:'Steering Discussion Back to Topic', track:'advanced', cx:52, cy:460 },
  { id:'gd19', num:19, title:'Managing Aggressive Participants', track:'advanced', cx:28, cy:555, char:'devil', signText:'Advanced Tactical Steering!', signDir:'left' },
  { id:'gd18', num:18, title:'Bringing Silent Members In', track:'advanced', cx:50, cy:650 },
  { id:'gd17', num:17, title:'Controlling the GD Flow', track:'advanced', cx:72, cy:745 },

  { id:'gd16', num:16, title:'Role Training: Challenger (Polite)', track:'intermediate', cx:52, cy:870 },
  { id:'gd15', num:15, title:'Role Training: Analyzer', track:'intermediate', cx:28, cy:965 },
  { id:'gd14', num:14, title:'Role Training: Information Provider', track:'intermediate', cx:50, cy:1060, char:'ghost' },
  { id:'gd13', num:13, title:'Maintaining Flow in Discussion', track:'intermediate', cx:72, cy:1155, signText:'Intermediate GD Mastery!', signDir:'left' },
  { id:'gd12', num:12, title:'Handling Interruptions', track:'intermediate', cx:52, cy:1250 },
  { id:'gd11', num:11, title:'Agreeing & Disagreeing Professionally', track:'intermediate', cx:28, cy:1345 },
  { id:'gd10', num:10, title:'Giving Examples & Facts', track:'intermediate', cx:50, cy:1440, signText:'Data & Structure Wins GDs!', signDir:'right' },
  { id:'gd9',  num:9,  title:'Structuring Your Points', track:'intermediate', cx:72, cy:1535 },

  { id:'gd8',  num:8,  title:'Role Training: Listener', track:'beginner', cx:52, cy:1660, char:'skull' },
  { id:'gd7',  num:7,  title:'Role Training: Supporter', track:'beginner', cx:28, cy:1755 },
  { id:'gd6',  num:6,  title:'Role Training: Initiator (Basic)', track:'beginner', cx:50, cy:1850, signText:'Learn Core GD Roles!', signDir:'left' },
  { id:'gd5',  num:5,  title:'Common Beginner Mistakes', track:'beginner', cx:72, cy:1945 },
  { id:'gd4',  num:4,  title:'How to Speak for the First Time', track:'beginner', cx:52, cy:2040 },
  { id:'gd3',  num:3,  title:'How to Enter a GD', track:'beginner', cx:28, cy:2135 },
  { id:'gd2',  num:2,  title:'GD Rules & Evaluation Criteria', track:'beginner', cx:50, cy:2230 },
  { id:'gd1',  num:1,  title:'What is a Group Discussion', track:'beginner', cx:26, cy:2325, signText:'Start Your GD Journey Today! ❤️', signDir:'left' },
];

const MAP_H = 2500;

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

/* ── 3D Candy Crush Map SVG ── */
function WorldSVG({ palette }: { palette: ThemePalette }) {
  return (
    <svg
      viewBox={`0 0 375 ${MAP_H}`}
      width="375" height={MAP_H}
      xmlns="http://www.w3.org/2000/svg"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, width: '100%', height: MAP_H }}
    >
      <defs>
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

      {/* Sky */}
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

      {/* Mountains */}
      <path d="M 200,260 L 290,60 L 375,260 Z" fill="url(#gMtn1)"/>
      <path d="M 260,260 L 340,100 L 375,220 L 375,260 Z" fill={palette.mtn2[1]} opacity="0.7"/>
      <path d="M 0,300 L 80,120 L 170,300 Z" fill="url(#gMtn2)" opacity="0.6"/>

      {/* Castle */}
      <g transform="translate(240,55)">
        <rect x="10" y="35" width="48" height="60" rx="2" fill="url(#gCastle)" filter="url(#fShadow)"/>
        {[10,18,26,34,42,50].map(x=>(
          <rect key={x} x={x} y="28" width="6" height="10" rx="1" fill={palette.tower[0]}/>
        ))}
        <rect x="24" y="72" width="20" height="23" rx="10" fill={palette.mtn2[1]}/>
        <rect x="-2"  y="45" width="16" height="50" rx="2" fill="url(#gTower)"/>
        <rect x="54"  y="45" width="16" height="50" rx="2" fill="url(#gTower)"/>
        <path d="M -8,45 L 6,22 L 20,45 Z"  fill={palette.tower[1]}/>
        <path d="M 48,45 L 62,22 L 76,45 Z" fill={palette.tower[1]}/>
        <path d="M 4,35 L 34,5 L 64,35 Z"   fill={palette.castle[1]}/>
        <text x="34" y="22" fontSize="10" textAnchor="middle" fill="#FCD34D">★</text>
      </g>

      {/* Rolling Hills */}
      <path d="M 0,300 Q 80,220 190,280 Q 280,330 375,270 L 375,2500 L 0,2500 Z" fill="url(#gHill1)"/>
      <path d="M 0,540 Q 100,460 220,520 Q 310,565 375,490 L 375,2500 L 0,2500 Z" fill="url(#gHill2)"/>
      <path d="M 0,820 Q 120,740 240,810 Q 320,850 375,790 L 375,2500 L 0,2500 Z" fill="url(#gHill3)"/>
      <path d="M 0,1150 Q 130,1070 250,1130 Q 330,1165 375,1110 L 375,2500 L 0,2500 Z" fill="url(#gHill4)"/>
      <path d="M 0,1480 Q 110,1400 230,1460 Q 320,1500 375,1440 L 375,2500 L 0,2500 Z" fill="url(#gHill1)"/>
      <path d="M 0,1850 Q 120,1780 240,1830 Q 330,1870 375,1810 L 375,2500 L 0,2500 Z" fill="url(#gHill2)"/>

      {/* River */}
      <path
        d="M 320,130 Q 240,260 290,500 Q 320,650 180,780 Q 60,900 140,1100 Q 200,1250 100,1450 Q 30,1600 110,1850 Q 180,2100 100,2400 L 160,2400 Q 240,2120 160,1860 Q 90,1620 160,1480 Q 240,1290 155,1120 Q 65,930 185,800 Q 310,670 280,510 Q 225,270 305,145 Z"
        fill="url(#gRiver)" opacity="0.85"
      />

      {/* Path Shadow */}
      <path
        d={`M ${LEVELS.map(l=>`${l.cx*3.75},${l.cy+28}`).join(' L ')}`}
        fill="none" stroke={palette.pathShadow} strokeWidth="24"
        strokeLinecap="round" strokeLinejoin="round" opacity="0.5"
      />
      {/* Path Trail */}
      <path
        d={`M ${LEVELS.map(l=>`${l.cx*3.75},${l.cy+28}`).join(' L ')}`}
        fill="none" stroke="url(#gPath)" strokeWidth="16"
        strokeLinecap="round" strokeLinejoin="round"
        filter="url(#fGlow)"
      />
      {/* Dashes */}
      <path
        d={`M ${LEVELS.map(l=>`${l.cx*3.75},${l.cy+28}`).join(' L ')}`}
        fill="none" stroke="white" strokeWidth="3"
        strokeDasharray="10 8" strokeLinecap="round" opacity="0.9"
      />
    </svg>
  );
}

/* ── 3D Level Sphere ── */
function LevelNode({
  level, isCompleted, isActive, isUnlocked, onPress,
}: {
  level: GDLevel; isCompleted: boolean; isActive: boolean; isUnlocked: boolean;
  onPress: () => void;
}) {
  const col = isCompleted
    ? { bg:'#4ADE80', mid:'#16A34A', shadow:'rgba(22,163,74,0.55)', border:'#BBF7D0', ring:'' }
    : isActive
    ? { bg:'#38BDF8', mid:'#0284C7', shadow:'rgba(2,132,199,0.6)', border:'#FDE68A', ring:'ring-4 ring-cyan-400/40 ring-offset-1' }
    : isUnlocked
    ? { bg:'#60A5FA', mid:'#2563EB', shadow:'rgba(37,99,235,0.45)', border:'#BFDBFE', ring:'' }
    : { bg:'#94A3B8', mid:'#475569', shadow:'rgba(0,0,0,0.3)', border:'#CBD5E1', ring:'' };

  return (
    <motion.div
      whileHover={{ scale: isUnlocked ? 1.1 : 1 }}
      whileTap={{ scale: isUnlocked ? 0.92 : 0.96 }}
      onClick={onPress}
      className="relative flex flex-col items-center cursor-pointer select-none"
    >
      {isActive && (
        <span className="absolute inset-0 rounded-full bg-cyan-400/50 animate-ping" style={{ borderRadius:'50%' }}/>
      )}

      {(level.num === 23 || level.num === 24) && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
          <div className="w-7 h-7 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center shadow-lg">
            <Crown size={14} className="text-amber-900 fill-amber-900"/>
          </div>
        </div>
      )}

      <div
        className={`relative flex items-center justify-center ${col.ring}`}
        style={{
          width: 58, height: 58, borderRadius: '50%',
          background: `radial-gradient(circle at 36% 36%, ${col.bg}, ${col.mid})`,
          border: `3.5px solid ${col.border}`,
          boxShadow: `0 8px 20px ${col.shadow}, inset 0 -6px 10px rgba(0,0,0,0.3), inset 0 4px 8px rgba(255,255,255,0.6)`,
        }}
      >
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

function Character({ type }: { type: GDLevel['char'] }) {
  const emoji: Record<string, string> = { hero:'🗣️', ghost:'👻', skull:'💀', devil:'👹', crown:'👑' };
  return (
    <motion.div
      animate={type === 'ghost' ? { y:[0,-10,0], rotate:[-5,5,-5] } : { y:[0,-6,0] }}
      transition={{ repeat:Infinity, duration: type === 'ghost' ? 3 : 2.2, ease:'easeInOut' }}
      className="flex items-center justify-center"
      style={{
        width:44, height:44, borderRadius:'50%',
        background: type === 'skull' ? 'rgba(15,23,42,0.9)' : type === 'devil' ? 'rgba(127,29,29,0.7)' : 'rgba(255,255,255,0.2)',
        border: '1.5px solid rgba(255,255,255,0.4)',
        boxShadow:'0 6px 18px rgba(0,0,0,0.4)',
        fontSize: 22,
      }}
    >
      {emoji[type!] ?? ''}
    </motion.div>
  );
}

function TrackBanner({ track }: { track: GDLevel['track'] }) {
  const cfg = {
    beginner:     { label:'Beginner GD Track (1 – 8)',     sub:'Foundations & Role Basics',    grad:'linear-gradient(135deg,#059669,#065F46)', border:'#6EE7B7', icon:'🌱' },
    intermediate: { label:'Intermediate GD Track (9 – 16)', sub:'Structuring & Strategy',       grad:'linear-gradient(135deg,#0284C7,#1E3A8A)', border:'#7DD3FC', icon:'🔥' },
    advanced:     { label:'Advanced GD Track (17 – 24)',   sub:'Tactical Steering & Moderation',grad:'linear-gradient(135deg,#7C3AED,#BE185D)', border:'#DDD6FE', icon:'👑' },
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

export default function MobileGDCoachPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [selected, setSelected] = useState<GDLevel | null>(null);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [lockedToast, setLockedToast] = useState<string | null>(null);

  const activeThemeKey = (resolvedTheme || theme || 'dark') as ThemeName;
  const palette = THEME_PALETTES[activeThemeKey] || THEME_PALETTES.dark;

  const firstName = session?.user?.name?.split(' ')[0] ?? 'there';

  const fetchProgress = async () => {
    try {
      const r = await fetch('/api/gd-progress');
      if (r.ok) {
        const d = await r.json();
        if (d && typeof d === 'object') {
          setDone(d);
          try { localStorage.setItem('gdProgress', JSON.stringify(d)); } catch {}
          return;
        }
      }
    } catch (e) {
      console.error('Failed to load GD progress:', e);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, []);

  const isLevelCompleted = (num: number) => done[`gd${num}`] === true;

  const isLevelUnlocked = (num: number) => {
    if (num === 1) return true;
    return isLevelCompleted(num - 1);
  };

  const getActiveLevelNum = () => {
    for (let i = 1; i <= 24; i++) {
      if (!isLevelCompleted(i) && isLevelUnlocked(i)) return i;
    }
    return 24;
  };

  const activeLevelNum = getActiveLevelNum();

  useEffect(() => {
    if (scrollRef.current) {
      const nodeObj = LEVELS.find((l) => l.num === activeLevelNum);
      const targetY = nodeObj ? nodeObj.cy - 250 : MAP_H - 600;
      scrollRef.current.scrollTop = Math.max(0, targetY);
    }
  }, [activeLevelNum]);

  const handleLevelPress = (lvl: GDLevel) => {
    if (isLevelUnlocked(lvl.num)) {
      setSelected(lvl);
    } else {
      setLockedToast(`Complete Level ${lvl.num - 1} to unlock Level ${lvl.num}!`);
      setTimeout(() => setLockedToast(null), 2400);
    }
  };

  const handleStartPractice = () => {
    if (!selected) return;
    router.push(
      `/train/session?module=gd-coach&level=${selected.track}&topic=${encodeURIComponent(selected.title)}`
    );
  };

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden flex flex-col font-sans"
      style={{ backgroundColor: palette.sky[1] }}
    >
      {/* ── TOP HEADER ── */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-4 py-2.5 backdrop-blur-xl border-b transition-colors"
        style={{
          backgroundColor: palette.headerBg,
          borderColor: palette.headerBorder,
          color: palette.headerText,
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl transition-all"
            style={{ backgroundColor: palette.menuBtnBg, color: palette.headerIcon }}
          >
            <Menu size={20} />
          </button>

          <Link href="/train">
            <LogoContainer />
          </Link>

          <div className="flex flex-col">
            <span className="text-xs font-black tracking-tight" style={{ color: palette.headerText }}>
              Fluenzy AI
            </span>
            <span className="text-[10px] font-bold text-cyan-400">GD Coach</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setThemeOpen((p) => !p)}
              className="p-2 rounded-xl border flex items-center gap-1 transition-all"
              style={{
                backgroundColor: palette.menuBtnBg,
                borderColor: palette.headerBorder,
                color: palette.headerIcon,
              }}
            >
              <ThemeIcon activeTheme={activeThemeKey} color={palette.headerIcon} />
            </button>

            <AnimatePresence>
              {themeOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-40 rounded-2xl p-1.5 shadow-2xl border z-50"
                  style={{
                    backgroundColor: palette.themeMenuBg,
                    borderColor: palette.themeMenuBorder,
                  }}
                >
                  {THEME_OPTIONS.map((opt) => {
                    const active = opt.value === activeThemeKey;
                    const IconComp = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setTheme(opt.value);
                          setThemeOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left"
                        style={{
                          backgroundColor: active ? palette.themeMenuItemBg : 'transparent',
                          color: active ? palette.themeMenuItemText : palette.cardText,
                        }}
                      >
                        <IconComp size={15} />
                        {opt.label}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <NotificationBell />
        </div>
      </header>

      {/* ── SIDEBAR DRAWER ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />

            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed top-0 left-0 bottom-0 z-50 w-72 p-4 flex flex-col justify-between border-r shadow-2xl overflow-y-auto"
              style={{
                backgroundColor: palette.drawerBg,
                borderColor: palette.drawerBorder,
                color: palette.drawerText,
              }}
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-3">
                    <LogoContainer />
                    <div>
                      <h2 className="text-base font-black text-white">Fluenzy AI</h2>
                      <p className="text-xs text-slate-400">Navigation</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20"
                  >
                    <X size={18} />
                  </button>
                </div>

                <nav className="space-y-5">
                  {SIDEBAR_SECTIONS.map((sec) => (
                    <div key={sec.title} className="space-y-1.5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">
                        {sec.title}
                      </p>
                      {sec.items.map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                            item.href === '/train/gd-coach'
                              ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg'
                              : 'text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          <item.icon size={16} />
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  ))}
                </nav>
              </div>

              <div className="pt-4 border-t border-white/10">
                <p className="text-[10px] text-center text-slate-500 font-semibold">
                  Fluenzy AI Mobile Engine v2.4
                </p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── MAP CANVAS ── */}
      <div ref={scrollRef} className="flex-1 relative overflow-y-auto overflow-x-hidden scrollbar-none pb-24">
        <WorldSVG palette={palette} />

        {/* Track Banners */}
        <div style={{ position: 'absolute', top: 40, left: 16, right: 16, zIndex: 10 }}>
          <TrackBanner track="advanced" />
        </div>
        <div style={{ position: 'absolute', top: 820, left: 16, right: 16, zIndex: 10 }}>
          <TrackBanner track="intermediate" />
        </div>
        <div style={{ position: 'absolute', top: 1610, left: 16, right: 16, zIndex: 10 }}>
          <TrackBanner track="beginner" />
        </div>

        {/* Level Nodes */}
        {LEVELS.map((lvl) => {
          const comp = isLevelCompleted(lvl.num);
          const unl = isLevelUnlocked(lvl.num);
          const act = lvl.num === activeLevelNum;

          return (
            <div
              key={lvl.id}
              style={{
                position: 'absolute',
                top: lvl.cy,
                left: `${lvl.cx}%`,
                transform: 'translateX(-50%)',
                zIndex: 20,
              }}
            >
              <LevelNode
                level={lvl}
                isCompleted={comp}
                isActive={act}
                isUnlocked={unl}
                onPress={() => handleLevelPress(lvl)}
              />

              {lvl.signText && (
                <div
                  style={{
                    position: 'absolute',
                    top: -15,
                    left: lvl.signDir === 'right' ? 70 : -140,
                    zIndex: 25,
                  }}
                >
                  <WoodenSign text={lvl.signText} />
                </div>
              )}

              {lvl.char && (
                <div
                  style={{
                    position: 'absolute',
                    top: -48,
                    left: 10,
                    zIndex: 22,
                  }}
                >
                  <Character type={lvl.char} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Locked Toast Notification */}
      <AnimatePresence>
        {lockedToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 left-4 right-4 z-50 p-3.5 bg-slate-900/95 border border-amber-500/40 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center justify-between text-xs text-amber-200"
          >
            <div className="flex items-center gap-2">
              <Lock size={16} className="text-amber-400 shrink-0" />
              <span>{lockedToast}</span>
            </div>
            <button onClick={() => setLockedToast(null)}>
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Level Detail Modal */}
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="w-full max-w-lg rounded-3xl p-6 border shadow-2xl space-y-5"
              style={{
                backgroundColor: palette.cardBg,
                borderColor: palette.cardBorder,
                color: palette.cardText,
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center font-black text-xl shadow-lg">
                    {selected.num}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">{selected.title}</h3>
                    <p className="text-xs text-cyan-400 font-bold uppercase tracking-wider">
                      {selected.track} GD Track
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 bg-slate-950/40 p-4 rounded-2xl border border-white/10 text-xs leading-relaxed text-slate-300">
                <p className="font-semibold text-white">Lesson Goals:</p>
                <ul className="list-disc pl-4 space-y-1 text-slate-300">
                  <li>Master exact phrases and speaking templates for this GD round topic.</li>
                  <li>Learn structural techniques for entering, maintaining, or concluding GDs.</li>
                  <li>Receive real-time fluency scoring and AI-moderated feedback.</li>
                </ul>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setSelected(null)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-slate-300"
                >
                  Close
                </button>

                <Button
                  onClick={handleStartPractice}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-bold text-xs shadow-lg flex items-center gap-2"
                >
                  <PlayCircle size={16} />
                  Start GD Lesson
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══ BOTTOM NAV BAR ══════════════════════════════════════════════════ */}
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
