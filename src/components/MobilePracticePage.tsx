'use client';

// ═══════════════════════════════════════════════════════════════════════════════
// Mobile Practice Page - Updated 2x2 Grid with Enhanced 3D Icons
// Adjusted to match the user's updated 3D illustration icons and card padding
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Users,
  MessageSquare,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { useTheme, themeConfig } from '@/contexts/ThemeContext';
import MobileNavShell from '@/components/MobileNavShell';

interface PracticeCardItem {
  id: string;
  title: string;
  description: string;
  imageSrc: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  startText: string;
  gradientBg: string;
  borderColor: string;
  accentColor: string;
  glowColor: string;
}

const PRACTICE_CARDS: PracticeCardItem[] = [
  {
    id: 'interview-coach',
    title: 'Interview Coach',
    description: 'Practice technical, HR and behavioral interviews with AI.',
    imageSrc: '/images/practice/interview_coach.png',
    href: '/practice/interview-coach',
    icon: BarChart3,
    startText: 'Start Practice',
    gradientBg: 'from-[#1E113A] via-[#160B2C] to-[#100720]',
    borderColor: 'border-purple-500/40 hover:border-purple-400',
    accentColor: '#A78BFA',
    glowColor: 'rgba(167, 139, 250, 0.25)',
  },
  {
    id: 'gd-coach',
    title: 'GD Coach',
    description: 'Practice group discussions with AI participants.',
    imageSrc: '/images/practice/gd_coach.png',
    href: '/practice/gd-coach',
    icon: Users,
    startText: 'Start Practice',
    gradientBg: 'from-[#0B1E38] via-[#07162A] to-[#040E1D]',
    borderColor: 'border-cyan-500/40 hover:border-cyan-400',
    accentColor: '#38BDF8',
    glowColor: 'rgba(56, 189, 248, 0.25)',
  },
  {
    id: 'english-coach',
    title: 'English Coach',
    description: 'Improve your spoken English, pronunciation and fluency.',
    imageSrc: '/images/practice/english_coach.png',
    href: '/practice/english-coach',
    icon: MessageSquare,
    startText: 'Start Practice',
    gradientBg: 'from-[#07241B] via-[#051A13] to-[#03110C]',
    borderColor: 'border-emerald-500/40 hover:border-emerald-400',
    accentColor: '#34D399',
    glowColor: 'rgba(52, 211, 153, 0.25)',
  },
  {
    id: 'vocab-booster',
    title: 'Vocabulary Booster',
    description: 'Learn new words, meanings and usage with AI exercises.',
    imageSrc: '/images/practice/vocab_booster.png',
    href: '/practice/vocabulary-booster',
    icon: BookOpen,
    startText: 'Start Practice',
    gradientBg: 'from-[#2B1907] via-[#1F1204] to-[#130B02]',
    borderColor: 'border-amber-500/40 hover:border-amber-400',
    accentColor: '#FBBF24',
    glowColor: 'rgba(251, 191, 36, 0.25)',
  },
];

export default function MobilePracticePage() {
  const { resolvedTheme } = useTheme();
  const currentTheme = themeConfig[resolvedTheme] || themeConfig.dark;
  const isLight = resolvedTheme === 'parchment' || resolvedTheme === 'light';

  return (
    <MobileNavShell activeHref="/train/practice">
      <div className="px-3.5 pt-3 pb-24 w-full max-w-md mx-auto space-y-4">
        {/* ── Page Header ── */}
        <div className="space-y-0.5">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 opacity-90">
            PRACTICE
          </p>
          <h1 className={`text-xl font-extrabold tracking-tight ${currentTheme.text} flex items-center gap-1.5`}>
            <span>Let's Practice</span>
            <span className="text-amber-400 text-lg drop-shadow">⚡</span>
          </h1>
          <p className={`text-[11px] ${currentTheme.textMuted} leading-relaxed`}>
            Improve your communication, reasoning and language skills with AI-powered coaches.
          </p>
        </div>

        {/* ── 2x2 Grid Container (Matching Screenshot Inset 3D Banners) ── */}
        <div className="grid grid-cols-2 gap-3.5 w-full">
          {PRACTICE_CARDS.map((card, idx) => {
            const IconComponent = card.icon;
            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: idx * 0.06 }}
                whileTap={{ scale: 0.96 }}
                className="h-full"
              >
                <Link
                  href={card.href}
                  className={`group relative flex flex-col justify-between w-full h-full rounded-[22px] border ${card.borderColor} bg-gradient-to-b ${card.gradientBg} shadow-2xl overflow-hidden transition-all duration-300 p-3`}
                  style={{
                    boxShadow: `0 8px 24px -8px ${card.glowColor}`,
                  }}
                >
                  {/* Top 3D Inset Banner */}
                  <div className="relative w-full h-36 rounded-[16px] overflow-hidden mb-2.5 bg-black/50 border border-white/10 shrink-0 shadow-inner">
                    <img
                      src={card.imageSrc}
                      alt={card.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1 flex-1">
                    <h2 className="text-xs sm:text-sm font-extrabold text-white tracking-tight group-hover:text-purple-200 transition-colors leading-tight">
                      {card.title}
                    </h2>
                    <p className="text-[10px] text-slate-300/85 leading-snug line-clamp-2">
                      {card.description}
                    </p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </MobileNavShell>
  );
}
