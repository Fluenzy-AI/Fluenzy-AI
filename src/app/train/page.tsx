'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import MobileTrainPage from '@/components/MobileTrainPage';
import {
  BookOpen,
  MessageSquare,
  UserPlus,
  Code,
  Building2,
  Briefcase,
  ArrowRight,
  Sparkles,
  GraduationCap,
  BookMarked,
  Phone,
  Lock,
  Target,
  Zap,
  Brain,
  Heart,
  BarChart3,
  Flame,
  Clock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Video,
  Users,
  Bot
} from 'lucide-react';
import { useTheme, themeConfig } from '@/contexts/ThemeContext';

// ===== 3D Vector Graphic Illustrations for Cards =====

const Robot3DGraphic = () => (
  <svg width="84" height="66" viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g filter="drop-shadow(0px 8px 12px rgba(229, 107, 45, 0.25))">
      {/* Robot Body */}
      <rect x="25" y="38" width="50" height="32" rx="14" fill="url(#paint_robot_body)" />
      {/* Robot Head */}
      <rect x="28" y="14" width="44" height="28" rx="12" fill="url(#paint_robot_head)" />
      {/* Ears */}
      <circle cx="23" cy="28" r="4" fill="#E28647" />
      <circle cx="77" cy="28" r="4" fill="#E28647" />
      {/* Visor Screen */}
      <rect x="34" y="19" width="32" height="18" rx="7" fill="#1C1815" />
      {/* Eyes */}
      <circle cx="43" cy="28" r="3.5" fill="#52D7FF" />
      <circle cx="57" cy="28" r="3.5" fill="#52D7FF" />
      {/* Antenna */}
      <path d="M50 14 V8" stroke="#F4A261" strokeWidth="3" strokeLinecap="round" />
      <circle cx="50" cy="6" r="3" fill="#F4A261" />
      {/* Speech Bubble */}
      <rect x="68" y="2" width="26" height="18" rx="6" fill="#F4A261" />
      <circle cx="75" cy="11" r="1.5" fill="#FFFFFF" />
      <circle cx="81" cy="11" r="1.5" fill="#FFFFFF" />
      <circle cx="87" cy="11" r="1.5" fill="#FFFFFF" />
    </g>
    <defs>
      <linearGradient id="paint_robot_body" x1="25" y1="38" x2="75" y2="70" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F8D4B0" />
        <stop offset="1" stopColor="#E29D62" />
      </linearGradient>
      <linearGradient id="paint_robot_head" x1="28" y1="14" x2="72" y2="42" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FFE0C2" />
        <stop offset="1" stopColor="#F3B37C" />
      </linearGradient>
    </defs>
  </svg>
);

const Armchair3DGraphic = () => (
  <svg width="84" height="66" viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g filter="drop-shadow(0px 8px 12px rgba(229, 57, 53, 0.2))">
      {/* Armchair Backrest */}
      <rect x="25" y="12" width="50" height="42" rx="14" fill="url(#pink_backrest)" />
      {/* Seat Cushion */}
      <rect x="20" y="42" width="60" height="18" rx="8" fill="url(#pink_seat)" />
      {/* Armrests */}
      <rect x="15" y="32" width="14" height="24" rx="7" fill="url(#pink_arm)" />
      <rect x="71" y="32" width="14" height="24" rx="7" fill="url(#pink_arm)" />
      {/* Legs */}
      <path d="M26 60 L22 72" stroke="#B06579" strokeWidth="4" strokeLinecap="round" />
      <path d="M74 60 L78 72" stroke="#B06579" strokeWidth="4" strokeLinecap="round" />
      {/* Speech Bubble */}
      <rect x="58" y="2" width="30" height="20" rx="7" fill="#FF7B9C" />
      <circle cx="67" cy="12" r="2" fill="#FFFFFF" />
      <circle cx="73" cy="12" r="2" fill="#FFFFFF" />
      <circle cx="79" cy="12" r="2" fill="#FFFFFF" />
    </g>
    <defs>
      <linearGradient id="pink_backrest" x1="25" y1="12" x2="75" y2="54" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FFA6BC" />
        <stop offset="1" stopColor="#E85D80" />
      </linearGradient>
      <linearGradient id="pink_seat" x1="20" y1="42" x2="80" y2="60" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FFB8C9" />
        <stop offset="1" stopColor="#EF6C8F" />
      </linearGradient>
      <linearGradient id="pink_arm" x1="15" y1="32" x2="29" y2="56" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FF9EB4" />
        <stop offset="1" stopColor="#E05377" />
      </linearGradient>
    </defs>
  </svg>
);

const Group3DGraphic = () => (
  <svg width="84" height="66" viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g filter="drop-shadow(0px 8px 12px rgba(16, 185, 129, 0.25))">
      {/* Left Pawn */}
      <circle cx="30" cy="28" r="11" fill="url(#green_head)" />
      <path d="M15 62 C15 45 45 45 45 62 Z" fill="url(#green_body)" />
      
      {/* Right Pawn */}
      <circle cx="70" cy="28" r="11" fill="url(#green_head)" />
      <path d="M55 62 C55 45 85 45 85 62 Z" fill="url(#green_body)" />

      {/* Center Front Pawn */}
      <circle cx="50" cy="20" r="13" fill="url(#green_head_front)" />
      <path d="M30 68 C30 46 70 46 70 68 Z" fill="url(#green_body_front)" />
    </g>
    <defs>
      <linearGradient id="green_head" x1="30" y1="17" x2="30" y2="39" gradientUnits="userSpaceOnUse">
        <stop stopColor="#6EE7B7" />
        <stop offset="1" stopColor="#10B981" />
      </linearGradient>
      <linearGradient id="green_body" x1="30" y1="45" x2="30" y2="62" gradientUnits="userSpaceOnUse">
        <stop stopColor="#34D399" />
        <stop offset="1" stopColor="#059669" />
      </linearGradient>
      <linearGradient id="green_head_front" x1="50" y1="7" x2="50" y2="33" gradientUnits="userSpaceOnUse">
        <stop stopColor="#A7F3D0" />
        <stop offset="1" stopColor="#10B981" />
      </linearGradient>
      <linearGradient id="green_body_front" x1="50" y1="46" x2="50" y2="68" gradientUnits="userSpaceOnUse">
        <stop stopColor="#34D399" />
        <stop offset="1" stopColor="#047857" />
      </linearGradient>
    </defs>
  </svg>
);

const Technical3DGraphic = () => (
  <svg width="84" height="66" viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g filter="drop-shadow(0px 8px 12px rgba(139, 92, 246, 0.25))">
      {/* Laptop Screen */}
      <rect x="25" y="14" width="50" height="34" rx="7" fill="url(#purple_screen)" />
      <rect x="29" y="18" width="42" height="26" rx="4" fill="#18132B" />
      {/* Code Brackets on Screen */}
      <text x="35" y="36" fill="#A78BFA" fontSize="16" fontFamily="monospace" fontWeight="bold">&lt;/&gt;</text>
      
      {/* Laptop Base */}
      <path d="M16 50 H84 L78 60 H22 Z" fill="url(#purple_base)" />
      <rect x="42" y="52" width="16" height="3" rx="1.5" fill="#6D28D9" />

      {/* Floating Code Cubes */}
      <rect x="6" y="44" width="12" height="12" rx="3" fill="#A78BFA" opacity="0.9" />
      <rect x="80" y="38" width="14" height="14" rx="4" fill="#C4B5FD" opacity="0.9" />
    </g>
    <defs>
      <linearGradient id="purple_screen" x1="25" y1="14" x2="75" y2="48" gradientUnits="userSpaceOnUse">
        <stop stopColor="#8B5CF6" />
        <stop offset="1" stopColor="#5B21B6" />
      </linearGradient>
      <linearGradient id="purple_base" x1="16" y1="50" x2="84" y2="60" gradientUnits="userSpaceOnUse">
        <stop stopColor="#7C3AED" />
        <stop offset="1" stopColor="#4C1D95" />
      </linearGradient>
    </defs>
  </svg>
);

const Daily3DGraphic = () => (
  <svg width="84" height="66" viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g filter="drop-shadow(0px 8px 12px rgba(14, 165, 233, 0.25))">
      {/* Chat Bubble 1 (left) */}
      <rect x="8" y="20" width="46" height="26" rx="10" fill="url(#sky_bubble1)" />
      <polygon points="18,46 10,56 30,46" fill="url(#sky_bubble1)" />
      {/* Dots inside bubble 1 */}
      <circle cx="22" cy="33" r="3" fill="white" opacity="0.9" />
      <circle cx="31" cy="33" r="3" fill="white" opacity="0.9" />
      <circle cx="40" cy="33" r="3" fill="white" opacity="0.9" />
      {/* Chat Bubble 2 (right) */}
      <rect x="46" y="6" width="44" height="24" rx="9" fill="url(#sky_bubble2)" />
      <polygon points="80,30 90,38 72,30" fill="url(#sky_bubble2)" />
      {/* Dots inside bubble 2 */}
      <circle cx="58" cy="18" r="2.5" fill="white" opacity="0.9" />
      <circle cx="68" cy="18" r="2.5" fill="white" opacity="0.9" />
      <circle cx="78" cy="18" r="2.5" fill="white" opacity="0.9" />
      {/* Microphone base */}
      <rect x="40" y="54" width="20" height="18" rx="6" fill="url(#sky_mic)" />
      <circle cx="50" cy="54" r="8" fill="url(#sky_mic_head)" />
      <path d="M42 62 Q50 70 58 62" stroke="#0EA5E9" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </g>
    <defs>
      <linearGradient id="sky_bubble1" x1="8" y1="20" x2="54" y2="46" gradientUnits="userSpaceOnUse">
        <stop stopColor="#38BDF8" /><stop offset="1" stopColor="#0284C7" />
      </linearGradient>
      <linearGradient id="sky_bubble2" x1="46" y1="6" x2="90" y2="30" gradientUnits="userSpaceOnUse">
        <stop stopColor="#7DD3FC" /><stop offset="1" stopColor="#0EA5E9" />
      </linearGradient>
      <linearGradient id="sky_mic" x1="40" y1="54" x2="60" y2="72" gradientUnits="userSpaceOnUse">
        <stop stopColor="#38BDF8" /><stop offset="1" stopColor="#0369A1" />
      </linearGradient>
      <linearGradient id="sky_mic_head" x1="42" y1="46" x2="58" y2="62" gradientUnits="userSpaceOnUse">
        <stop stopColor="#7DD3FC" /><stop offset="1" stopColor="#0284C7" />
      </linearGradient>
    </defs>
  </svg>
);

const LatestTopics3DGraphic = () => (
  <svg width="84" height="66" viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g filter="drop-shadow(0px 8px 12px rgba(132, 204, 22, 0.25))">
      {/* Lightning bolt big */}
      <path d="M54 4 L30 44 H50 L46 76 L78 32 H56 Z" fill="url(#lime_bolt)" />
      {/* Small spark top-left */}
      <path d="M12 22 L8 32 H16 L14 40 L24 28 H16 Z" fill="#BEF264" opacity="0.9" />
      {/* Star sparkle */}
      <circle cx="82" cy="14" r="5" fill="#D9F99D" />
      <path d="M82 8 V20 M76 14 H88 M78 10 L86 18 M78 18 L86 10" stroke="#84CC16" strokeWidth="1.5" strokeLinecap="round" />
    </g>
    <defs>
      <linearGradient id="lime_bolt" x1="30" y1="4" x2="78" y2="76" gradientUnits="userSpaceOnUse">
        <stop stopColor="#BEF264" /><stop offset="1" stopColor="#65A30D" />
      </linearGradient>
    </defs>
  </svg>
);

const English3DGraphic = () => (
  <svg width="84" height="66" viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g filter="drop-shadow(0px 8px 12px rgba(59, 130, 246, 0.25))">
      {/* Open Book */}
      <path d="M50 14 Q32 10 14 16 L14 64 Q32 58 50 62 Z" fill="url(#blue_book_left)" />
      <path d="M50 14 Q68 10 86 16 L86 64 Q68 58 50 62 Z" fill="url(#blue_book_right)" />
      {/* Spine */}
      <rect x="48" y="14" width="4" height="48" rx="2" fill="#1D4ED8" />
      {/* Lines on left page */}
      <line x1="22" y1="28" x2="44" y2="25" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <line x1="22" y1="36" x2="44" y2="33" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <line x1="22" y1="44" x2="44" y2="41" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      {/* Lines on right page */}
      <line x1="56" y1="25" x2="78" y2="28" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <line x1="56" y1="33" x2="78" y2="36" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <line x1="56" y1="41" x2="78" y2="44" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      {/* Floating "A" */}
      <text x="64" y="8" fill="#93C5FD" fontSize="14" fontWeight="bold" fontFamily="serif">A</text>
    </g>
    <defs>
      <linearGradient id="blue_book_left" x1="14" y1="14" x2="50" y2="64" gradientUnits="userSpaceOnUse">
        <stop stopColor="#60A5FA" /><stop offset="1" stopColor="#1D4ED8" />
      </linearGradient>
      <linearGradient id="blue_book_right" x1="50" y1="14" x2="86" y2="64" gradientUnits="userSpaceOnUse">
        <stop stopColor="#93C5FD" /><stop offset="1" stopColor="#2563EB" />
      </linearGradient>
    </defs>
  </svg>
);

const Vocab3DGraphic = () => (
  <svg width="84" height="66" viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g filter="drop-shadow(0px 8px 12px rgba(249, 115, 22, 0.25))">
      {/* Stack of cards */}
      <rect x="18" y="34" width="64" height="36" rx="8" fill="url(#orange_card3)" />
      <rect x="14" y="24" width="64" height="36" rx="8" fill="url(#orange_card2)" />
      <rect x="10" y="14" width="64" height="36" rx="8" fill="url(#orange_card1)" />
      {/* Word on top card */}
      <text x="22" y="30" fill="white" fontSize="10" fontWeight="bold" fontFamily="monospace">Vocab</text>
      <text x="22" y="42" fill="#FFD8A8" fontSize="8" fontFamily="sans-serif">noun · growth</text>
      {/* Star badge */}
      <circle cx="82" cy="18" r="9" fill="#FED7AA" />
      <text x="77" y="22" fill="#EA580C" fontSize="11" fontWeight="bold">★</text>
    </g>
    <defs>
      <linearGradient id="orange_card1" x1="10" y1="14" x2="74" y2="50" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FB923C" /><stop offset="1" stopColor="#C2410C" />
      </linearGradient>
      <linearGradient id="orange_card2" x1="14" y1="24" x2="78" y2="60" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FDBA74" /><stop offset="1" stopColor="#EA580C" />
      </linearGradient>
      <linearGradient id="orange_card3" x1="18" y1="34" x2="82" y2="70" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FED7AA" /><stop offset="1" stopColor="#F97316" />
      </linearGradient>
    </defs>
  </svg>
);

const Voice3DGraphic = () => (
  <svg width="84" height="66" viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g filter="drop-shadow(0px 8px 12px rgba(6, 182, 212, 0.25))">
      {/* Microphone body */}
      <rect x="38" y="8" width="24" height="36" rx="12" fill="url(#cyan_mic_body)" />
      {/* Mic grille lines */}
      <line x1="38" y1="22" x2="62" y2="22" stroke="white" strokeWidth="1.5" opacity="0.4" />
      <line x1="38" y1="28" x2="62" y2="28" stroke="white" strokeWidth="1.5" opacity="0.4" />
      <line x1="38" y1="34" x2="62" y2="34" stroke="white" strokeWidth="1.5" opacity="0.4" />
      {/* Mic stand arm */}
      <path d="M50 44 Q50 58 50 62" stroke="#0891B2" strokeWidth="4" strokeLinecap="round" />
      <path d="M34 62 H66" stroke="#0891B2" strokeWidth="4" strokeLinecap="round" />
      {/* Sound waves left */}
      <path d="M28 20 Q22 26 22 32 Q22 38 28 44" stroke="#67E8F9" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M18 14 Q8 26 8 32 Q8 38 18 50" stroke="#A5F3FC" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.7" />
      {/* Sound waves right */}
      <path d="M72 20 Q78 26 78 32 Q78 38 72 44" stroke="#67E8F9" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M82 14 Q92 26 92 32 Q92 38 82 50" stroke="#A5F3FC" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.7" />
    </g>
    <defs>
      <linearGradient id="cyan_mic_body" x1="38" y1="8" x2="62" y2="44" gradientUnits="userSpaceOnUse">
        <stop stopColor="#67E8F9" /><stop offset="1" stopColor="#0891B2" />
      </linearGradient>
    </defs>
  </svg>
);

const PromptIQ3DGraphic = () => (
  <svg width="84" height="66" viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g filter="drop-shadow(0px 8px 12px rgba(139, 92, 246, 0.25))">
      {/* Brain silhouette */}
      <path d="M50 10 C34 10 22 20 22 34 C22 44 28 50 36 54 L36 66 L64 66 L64 54 C72 50 78 44 78 34 C78 20 66 10 50 10 Z" fill="url(#violet_brain)" />
      {/* Brain fold lines */}
      <path d="M38 28 Q44 22 50 28 Q56 22 62 28" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.5" />
      <path d="M32 38 Q36 34 40 38" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.5" />
      <path d="M60 38 Q64 34 68 38" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.5" />
      {/* Lightning in brain */}
      <path d="M52 20 L44 36 H52 L48 52 L62 32 H52 Z" fill="#E9D5FF" opacity="0.9" />
      {/* Floating sparkles */}
      <circle cx="20" cy="18" r="4" fill="#C4B5FD" opacity="0.8" />
      <circle cx="82" cy="16" r="5" fill="#DDD6FE" opacity="0.8" />
      <circle cx="88" cy="52" r="3" fill="#A78BFA" opacity="0.7" />
    </g>
    <defs>
      <linearGradient id="violet_brain" x1="22" y1="10" x2="78" y2="66" gradientUnits="userSpaceOnUse">
        <stop stopColor="#A78BFA" /><stop offset="1" stopColor="#5B21B6" />
      </linearGradient>
    </defs>
  </svg>
);

// ===== Module Classifications =====
const UNLIMITED_MODULES = new Set([
  'vocabulary',
  'latestTopics',
  'latest_topics',
  'gdPrivate',
  'gdRandom',
  'live-red-heart',
]);

const MODULE_KEY_MAP: Record<string, string> = {
  'hr': 'hr',
  'gd-coach': 'gdCoach',
  'gd': 'gd',
  'technical': 'technical',
  'company': 'company',
  'daily': 'daily',
  'latest-topics': 'latestTopics',
  'english': 'english',
  'vocabulary': 'vocabulary',
  'corporate-voice': 'corporateVoice',
  'promptiq': 'promptiq',
};

interface PlanInfo {
  plan: string;
  planName: string;
  price: number;
  isUnlimited: boolean;
}

interface AutoApplyStatus {
  enabled: boolean;
  count: number;
  limit: number;
  canAutoApply: boolean;
}

interface UsageData {
  canUse: Record<string, boolean>;
  remaining: Record<string, number | string>;
  limit: Record<string, number>;
  isUnlimited?: Record<string, boolean>;
}

interface Module {
  type: string;
  title: string;
  description: string;
  icon: typeof BookOpen;
  graphic?: React.FC;
  color: string;
  gradient: string;
  bgGlow: string;
  accentBg: string;
  href: string;
  badge?: string;
  isLocked: boolean;
  sessions: number | string;
  isUnlimited?: boolean;
}

const modules: Module[] = [
  {
    type: 'gd',
    title: 'AI Interview',
    description: 'Practice with AI interview simulations and get detailed feedback.',
    icon: Bot,
    graphic: Robot3DGraphic,
    color: 'text-amber-500',
    gradient: 'from-amber-500 to-orange-500',
    bgGlow: 'from-amber-500/10 via-orange-500/5 to-transparent',
    accentBg: 'bg-amber-500/15',
    href: '/train/gd-agent',
    badge: 'Popular',
    isLocked: false,
    sessions: '-',
  },
  {
    type: 'hr',
    title: 'HR Interview',
    description: 'Practice common HR questions with AI.',
    icon: UserPlus,
    graphic: Armchair3DGraphic,
    color: 'text-pink-500',
    gradient: 'from-pink-500 to-rose-500',
    bgGlow: 'from-pink-500/10 via-rose-500/5 to-transparent',
    accentBg: 'bg-pink-500/15',
    href: '/train/hr',
    isLocked: false,
    sessions: '-',
  },
  {
    type: 'gd-coach',
    title: 'Group Discussion',
    description: 'Join AI-powered GD simulations and improve your communication skills.',
    icon: Users,
    graphic: Group3DGraphic,
    color: 'text-emerald-500',
    gradient: 'from-emerald-500 to-teal-500',
    bgGlow: 'from-emerald-500/10 via-teal-500/5 to-transparent',
    accentBg: 'bg-emerald-500/15',
    href: '/train/gd-coach',
    isLocked: false,
    sessions: '-',
  },
  {
    type: 'technical',
    title: 'Technical Interview',
    description: 'Practice coding and technical concepts with role-based rounds.',
    icon: Code,
    graphic: Technical3DGraphic,
    color: 'text-indigo-500',
    gradient: 'from-indigo-500 to-purple-500',
    bgGlow: 'from-indigo-500/10 via-purple-500/5 to-transparent',
    accentBg: 'bg-indigo-500/15',
    href: '/train/technical',
    isLocked: false,
    sessions: '-',
  },
  {
    type: 'daily',
    title: 'Daily Conversation',
    description: 'Practice everyday English with AI conversation partner.',
    icon: MessageSquare,
    graphic: Daily3DGraphic,
    color: 'text-sky-500',
    gradient: 'from-sky-500 to-blue-500',
    bgGlow: 'from-sky-500/10 via-blue-500/5 to-transparent',
    accentBg: 'bg-sky-500/15',
    href: '/train/daily',
    isLocked: false,
    sessions: '-',
  },
  {
    type: 'latest-topics',
    title: 'Latest Topics',
    description: 'Stay updated with latest company-specific interview topics.',
    icon: Zap,
    graphic: LatestTopics3DGraphic,
    color: 'text-lime-500',
    gradient: 'from-lime-500 to-green-500',
    bgGlow: 'from-lime-500/10 via-green-500/5 to-transparent',
    accentBg: 'bg-lime-500/15',
    href: '/train/latest-topics',
    isLocked: false,
    sessions: 'Unlimited',
    isUnlimited: true,
  },
  {
    type: 'english',
    title: 'English Learning',
    description: 'Master professional English with real-time grammar feedback.',
    icon: BookOpen,
    graphic: English3DGraphic,
    color: 'text-blue-500',
    gradient: 'from-blue-500 to-cyan-500',
    bgGlow: 'from-blue-500/10 via-cyan-500/5 to-transparent',
    accentBg: 'bg-blue-500/15',
    href: '/train/english',
    isLocked: false,
    sessions: '-',
  },
  {
    type: 'vocabulary',
    title: 'Vocabulary Booster',
    description: 'Expand your professional vocabulary with curated word lists.',
    icon: BookMarked,
    graphic: Vocab3DGraphic,
    color: 'text-orange-500',
    gradient: 'from-orange-500 to-amber-500',
    bgGlow: 'from-orange-500/10 via-amber-500/5 to-transparent',
    accentBg: 'bg-orange-500/15',
    href: '/train/vocabulary',
    isLocked: false,
    sessions: 'Unlimited',
    isUnlimited: true,
  },
  {
    type: 'corporate-voice',
    title: 'Voice Practice',
    description: 'Improve pronunciation and speaking style for corporate settings.',
    icon: Phone,
    graphic: Voice3DGraphic,
    color: 'text-cyan-500',
    gradient: 'from-cyan-500 to-teal-500',
    bgGlow: 'from-cyan-500/10 via-teal-500/5 to-transparent',
    accentBg: 'bg-cyan-500/15',
    href: '/train/corporate-voice',
    isLocked: false,
    sessions: '-',
  },
  {
    type: 'promptiq',
    title: 'PromptIQ',
    description: 'AI Prompt Intelligence & Optimization — analyze, score, and perfect prompts.',
    icon: Brain,
    graphic: PromptIQ3DGraphic,
    color: 'text-violet-500',
    gradient: 'from-violet-500 to-purple-600',
    bgGlow: 'from-violet-500/10 via-purple-500/5 to-transparent',
    accentBg: 'bg-violet-500/15',
    href: '/train/promptiq',
    badge: 'NEW',
    isLocked: false,
    sessions: '-',
  },
];

function useMobileBreakpoint() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

export default function TrainPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);

  const currentTheme = themeConfig[resolvedTheme] || themeConfig.dark;
  const isLightMode = resolvedTheme === 'parchment' || resolvedTheme === 'light';
  const isMobile = useMobileBreakpoint();

  const fetchUsageData = useCallback(async () => {
    try {
      const [usageRes, planRes] = await Promise.all([
        fetch('/api/training-usage'),
        fetch('/api/user-plan'),
      ]);

      if (usageRes.ok) {
        const data = await usageRes.json();
        setUsageData(data);
      }

      if (planRes.ok) {
        const data = await planRes.json();
        setPlanInfo(data);
      }
    } catch (error) {
      console.error('[TRAIN_PAGE] Error fetching data:', error);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetchUsageData();
      const handleUsageUpdate = () => fetchUsageData();
      window.addEventListener('usage-updated', handleUsageUpdate);
      return () => window.removeEventListener('usage-updated', handleUsageUpdate);
    }
  }, [session, fetchUsageData]);

  const getUpdatedModules = () => {
    return modules.map(mod => {
      const apiKey = MODULE_KEY_MAP[mod.type] || mod.type;
      const isUnlimitedModule = UNLIMITED_MODULES.has(apiKey);

      if (!usageData) {
        return {
          ...mod,
          sessions: isUnlimitedModule ? 'Unlimited' : '-',
          isUnlimited: isUnlimitedModule,
          isLocked: false,
        };
      }

      const canUse = usageData.canUse?.[apiKey] ?? true;
      const remaining = usageData.remaining?.[apiKey];
      const isApiUnlimited = usageData.isUnlimited?.[apiKey] ?? isUnlimitedModule;
      const isLocked = !canUse && remaining !== 'Unlimited' && remaining !== '∞' && remaining !== undefined;

      let sessionDisplay: number | string;
      if (isUnlimitedModule || isApiUnlimited) {
        sessionDisplay = 'Unlimited';
      } else if (remaining === undefined) {
        sessionDisplay = '-';
      } else {
        sessionDisplay = remaining;
      }

      return {
        ...mod,
        isLocked,
        sessions: sessionDisplay,
        isUnlimited: isUnlimitedModule || isApiUnlimited,
      };
    });
  };

  const updatedModules = getUpdatedModules();
  const userName = session?.user?.name ? session.user.name.split(' ')[0] : 'Achhuta';

  // Exact image URLs from public/trainImage
  const companyBannerSrc = isLightMode
    ? '/trainImage/Light%20Company%20Interview%20Practice%20Banner.png'
    : '/trainImage/Dark%20%20Company%20Interview%20Practice%20Banner.png';

  const heartsyncBannerSrc = isLightMode
    ? '/trainImage/Light%20HeartSync%20Live%20Practice%20Banner.png'
    : '/trainImage/Dark%20HeartSync%20Live%20Practice%20Interface.png';

  if (isMobile === null) return null;
  if (isMobile) return <MobileTrainPage />;

  return (
    <div className={`p-4 md:p-6 lg:p-8 relative min-h-screen ${currentTheme.background} ${currentTheme.text}`}>

      {/* ── Top Header Greeting Banner & Stats ── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5 ${currentTheme.greetingColor}`}>
            Hi {userName} 👋
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Let&apos;s Practice &amp;{' '}
            <span className={currentTheme.subheading}>
              Grow
            </span>
          </h1>
          <p className={`text-sm mt-1 max-w-xl ${currentTheme.bodyText}`}>
            Build your interview and communication skills with AI.
          </p>
        </div>

        {/* Right Stats Widget Box */}
        <div className={`flex items-center gap-4 p-3.5 px-5 rounded-2xl border shadow-xl ${currentTheme.statsBg} ${currentTheme.statsBorder}`}>
          <div className="flex items-center gap-3 pr-4 border-r border-slate-200/20">
            <div className={`p-2 rounded-xl ${isLightMode ? 'bg-[#F5E6DA] text-[#9A4E12]' : 'bg-orange-500/20 text-orange-400'}`}>
              <BarChart3 size={18} />
            </div>
            <div>
              <p className="text-sm font-extrabold leading-tight">12</p>
              <p className={`text-[11px] ${currentTheme.textMuted}`}>Sessions done</p>
            </div>
          </div>

          <div className="flex items-center gap-3 pr-4 border-r border-slate-200/20">
            <div className="p-2 rounded-xl bg-rose-500/15 text-rose-500">
              <Flame size={18} />
            </div>
            <div>
              <p className="text-sm font-extrabold leading-tight">5</p>
              <p className={`text-[11px] ${currentTheme.textMuted}`}>Day streak</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isLightMode ? 'bg-[#F5E6DA] text-[#9A4E12]' : 'bg-amber-500/20 text-amber-400'}`}>
              <Clock size={18} />
            </div>
            <div>
              <p className="text-sm font-extrabold leading-tight">8h 20m</p>
              <p className={`text-[11px] ${currentTheme.textMuted}`}>Total practice</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2 Featured Hero Cards ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">

        {/* Hero Card 1: Company Interview */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className={`relative overflow-hidden rounded-3xl p-7 border transition-all duration-300 flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-br ${currentTheme.heroBg1} ${currentTheme.heroBorder1} shadow-2xl`}
        >
          {/* Left Column: Text & CTA */}
          <div className="flex-1 w-full flex flex-col justify-between h-full z-10">
            <div>
              {/* Header Badge */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center shadow-md shadow-orange-500/20">
                  <Building2 size={20} className="text-white" />
                </div>
              </div>

              <h2 className={`text-2xl font-extrabold tracking-tight mb-2 ${currentTheme.heading}`}>
                Company Interview
              </h2>
              <p className={`text-xs mb-4 leading-relaxed ${currentTheme.bodyText}`}>
                Practice real company interview questions with AI or real people.
              </p>

              {/* Bullet Points */}
              <div className="space-y-2 mb-6">
                {[
                  'FAANG & Startups questions',
                  'Role-specific rounds',
                  'Real interview experience',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs font-semibold">
                    <div className="w-4 h-4 rounded-full bg-[#E56B2D] flex items-center justify-center text-white text-[10px] flex-shrink-0">
                      ✓
                    </div>
                    <span className={currentTheme.text}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action CTA Button */}
            <button
              onClick={() => router.push('/train/company')}
              className="py-3 px-6 rounded-xl bg-[#E56B2D] hover:bg-[#D45A1C] text-white font-extrabold text-xs shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 cursor-pointer w-full sm:w-auto"
            >
              <span>Start Practice</span>
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Right Column: High-Res Banner Image */}
          <div className="w-full md:w-1/2 flex items-center justify-center relative">
            <img
              src={companyBannerSrc}
              alt="Company Interview Practice Banner"
              className="w-full h-auto max-h-[220px] object-contain rounded-2xl drop-shadow-xl"
            />
          </div>
        </motion.div>

        {/* Hero Card 2: HeartSync */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`relative overflow-hidden rounded-3xl p-7 border transition-all duration-300 flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-br ${currentTheme.heroBg2} ${currentTheme.heroBorder2} shadow-2xl`}
        >
          {/* Left Column: Text & CTA */}
          <div className="flex-1 w-full flex flex-col justify-between h-full z-10">
            <div>
              {/* Header Badge */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-500 text-[11px] font-bold animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>LIVE NOW</span>
                </div>
              </div>

              <h2 className={`text-2xl font-extrabold tracking-tight mb-2 ${currentTheme.heading}`}>
                HeartSync
              </h2>
              <p className={`text-xs mb-4 leading-relaxed ${currentTheme.bodyText}`}>
                Live 1-on-1 video practice with AI or real people.
              </p>

              {/* Bullet Points */}
              <div className="space-y-2 mb-6">
                {[
                  'Real conversations',
                  'Instant feedback',
                  'Build confidence',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs font-semibold">
                    <div className="w-4 h-4 rounded-full bg-[#E53935] flex items-center justify-center text-white text-[10px] flex-shrink-0">
                      ✓
                    </div>
                    <span className={currentTheme.text}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action CTA Button */}
            <button
              onClick={() => router.push('/train/live-red-heart')}
              className="py-3 px-6 rounded-xl bg-[#E53935] hover:bg-[#D32F2F] text-white font-extrabold text-xs shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 cursor-pointer w-full sm:w-auto"
            >
              <span>Start Live Practice</span>
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Right Column: High-Res HeartSync Video Banner Image */}
          <div className="w-full md:w-1/2 flex items-center justify-center relative">
            <img
              src={heartsyncBannerSrc}
              alt="HeartSync Live Practice Banner"
              className="w-full h-auto max-h-[220px] object-contain rounded-2xl drop-shadow-xl"
            />
          </div>
        </motion.div>
      </div>

      {/* ── Choose a Practice Module Section ── */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className={`text-xl font-extrabold tracking-tight ${currentTheme.heading}`}>
              Choose a Practice Module
            </h2>
            <p className={`text-xs mt-0.5 ${currentTheme.textMuted}`}>
              Pick a module and start practicing in seconds.
            </p>
          </div>

          {/* Filter & Arrow Navigation Controls */}
          <div className="flex items-center gap-3">
            <button className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all shadow-sm ${currentTheme.filterBtn}`}>
              <span>Popular</span>
              <ChevronDown size={14} />
            </button>
            <div className="flex items-center gap-1">
              <button className={`p-1.5 rounded-xl border transition-colors ${currentTheme.navBtn}`}>
                <ChevronLeft size={16} />
              </button>
              <button className={`p-1.5 rounded-xl border transition-colors ${currentTheme.navBtn}`}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* 4-Column Module Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {updatedModules.map((mod, index) => (
            <motion.div
              key={mod.type}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className={`group relative rounded-2xl p-5 border transition-all duration-300 flex flex-col justify-between min-h-[220px] overflow-hidden shadow-lg hover:-translate-y-1.5 hover:shadow-2xl ${currentTheme.moduleCard} ${mod.isLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
              onClick={() => !mod.isLocked && router.push(mod.href)}
            >
              {/* Color Glow Overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${mod.bgGlow} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />

              <div className="relative z-10">
                {/* Header: Icon + Badge/Lock */}
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl ${mod.accentBg} flex items-center justify-center shadow-sm`}>
                    <mod.icon size={20} className={mod.color} />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {mod.badge && (
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r ${mod.gradient} text-white shadow-sm`}>
                        {mod.badge}
                      </span>
                    )}
                    {mod.isLocked ? (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 text-[10px] font-bold">
                        <Lock size={10} />
                        <span>Locked</span>
                      </div>
                    ) : (
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        mod.isUnlimited
                          ? 'bg-emerald-500/15 text-emerald-500'
                          : `${mod.accentBg} ${mod.color}`
                      }`}>
                        {mod.isUnlimited ? (
                          <><Sparkles size={9} /><span>∞ Unlimited</span></>
                        ) : (
                          <><Target size={9} /><span>{mod.sessions === '-' ? '— sessions' : `${mod.sessions} left`}</span></>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                <h3 className={`text-base font-extrabold tracking-tight mb-1 transition-colors ${currentTheme.heading} group-hover:${mod.color}`}>
                  {mod.title}
                </h3>
                <p className={`text-xs leading-relaxed line-clamp-2 ${currentTheme.bodyText}`}>
                  {mod.description}
                </p>
              </div>

              {/* 3D Illustration Graphic & Arrow Button */}
              <div className="relative z-10 flex items-end justify-between pt-3">
                <div className="opacity-90 group-hover:scale-105 transition-transform duration-300">
                  {mod.graphic && <mod.graphic />}
                </div>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-md ${currentTheme.moduleArrow}`}>
                  <ArrowRight size={16} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>

    </div>
  );
}

