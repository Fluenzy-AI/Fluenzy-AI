'use client';

import { useEffect, useState, type ElementType } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useTheme, themeConfig } from '@/contexts/ThemeContext';
import {
  Lock,
  Shuffle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Radio,
  UserCheck,
  Users,
} from 'lucide-react';

interface CardDef {
  id: string;
  title: string;
  description: string;
  icon: ElementType;
  gradient: string;
  badge: string;
  href: string;
  moduleKey: string;
}

interface ThemeSlice {
  background: string;
  cardBg: string;
  cardBorder: string;
  text: string;
  textMuted: string;
}

function CardLink({
  card,
  currentTheme,
  isLight,
  sessionLabel,
}: {
  card: CardDef;
  currentTheme: ThemeSlice;
  isLight: boolean;
  sessionLabel: (key: string) => string;
}) {
  return (
    <Link
      href={card.href}
      className={`
        group relative ${currentTheme.cardBg} border ${currentTheme.cardBorder}
        rounded-2xl p-6 transition-all duration-300 block cursor-pointer
        ${isLight
          ? 'shadow-sm ring-1 ring-black/5 hover:border-indigo-200 hover:shadow-2xl hover:shadow-indigo-400/20 hover:-translate-y-1'
          : 'hover:border-[#5B6CFF]/30 hover:shadow-lg hover:shadow-[#5B6CFF]/10 hover:-translate-y-1'
        }
      `}
    >
      <div className={`absolute -right-20 -top-20 w-40 h-40 bg-gradient-to-br ${card.gradient} blur-3xl transition-opacity duration-500 ${ isLight ? 'opacity-0 group-hover:opacity-20' : 'opacity-0 group-hover:opacity-10'}`} />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg`}>
            <card.icon size={22} className="text-white" />
          </div>
          <span className={`px-2 py-1 rounded-md bg-gradient-to-r ${card.gradient} text-white text-xs font-semibold`}>
            {card.badge}
          </span>
        </div>
        <h3 className={`text-lg font-bold ${currentTheme.text} mb-2 ${ isLight ? 'group-hover:text-indigo-600' : 'group-hover:text-[#5B6CFF]'} transition-colors`}>
          {card.title}
        </h3>
        <p className={`text-sm ${currentTheme.textMuted} mb-4 leading-relaxed`}>
          {card.description}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-[#22D3EE]" />
            <span className={`text-sm ${currentTheme.textMuted}`}>{sessionLabel(card.moduleKey)}</span>
          </div>
          <span className={`flex items-center gap-1 text-sm font-semibold ${isLight ? 'text-indigo-600' : 'text-[#5B6CFF]'} transition-colors`}>
            Start <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
          </span>
        </div>
      </div>
    </Link>
  );
}

interface UsageData {
  remaining: Record<string, number | string>;
  canUse: Record<string, boolean>;
  isUnlimited: Record<string, boolean>;
}

export default function LiveGDPage() {
  const { data: session } = useSession();
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === 'light';
  const currentTheme = themeConfig[resolvedTheme] ?? themeConfig['dark'];
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) return;
    fetch('/api/training-usage')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setUsageData(d); })
      .finally(() => setLoading(false));
  }, [session]);

  const sessionLabel = (key: string) => {
    if (loading) return 'Loading...';
    if (usageData?.isUnlimited?.[key]) return 'Unlimited';
    const rem = usageData?.remaining?.[key];
    if (rem !== undefined) return `${rem} ${Number(rem) === 1 ? 'session' : 'sessions'}`;
    return '—';
  };

  const gdCards = [
    {
      id: 'private-gd',
      title: 'Private GD',
      description: 'Create a private room and invite friends or classmates via a unique link.',
      icon: Lock,
      gradient: 'from-purple-500 to-pink-500',
      badge: 'Invite-Only',
      href: '/train/gd/private',
      moduleKey: 'gd',
    },
    {
      id: 'random-gd',
      title: 'Random GD Matching',
      description: 'Get matched with random participants by topic and difficulty level.',
      icon: Shuffle,
      gradient: 'from-blue-500 to-cyan-500',
      badge: 'Live',
      href: '/train/live-gd',
      moduleKey: 'gd',
    },
  ];

  const interviewCards = [
    {
      id: 'live-interview',
      title: 'Live Interview',
      description: 'Get matched 1:1 instantly. Choose PI (HR ↔ Candidate) or Technical (Eng. Manager ↔ Candidate).',
      icon: UserCheck,
      gradient: 'from-green-500 to-emerald-500',
      badge: 'Live',
      href: '/train/interview/live',
      moduleKey: 'interview',
    },
    {
      id: 'private-interview',
      title: 'Private Interview',
      description: 'Host a structured interview room and invite specific people via a link. Full moderator controls.',
      icon: Users,
      gradient: 'from-indigo-500 to-violet-500',
      badge: 'Invite-Only',
      href: '/train/interview/private',
      moduleKey: 'interview',
    },
  ];

  return (
    <div className={`min-h-screen ${currentTheme.background}`}>
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">

        {/* Page title */}
        <div className="mb-8">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-3 border ${isLight ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'}`}>
            <Radio size={12} />
            Live Practice
          </div>
          <h1 className={`text-2xl sm:text-3xl font-extrabold ${currentTheme.text}`}>Live Practice Modes</h1>
          <p className={`text-sm mt-1 ${currentTheme.textMuted}`}>Practice with real participants — choose GD or Interview mode below.</p>
        </div>

        {/* ── Group Discussion ───────────────────────────── */}
        <div className="mb-2">
          <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
            Group Discussion
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gdCards.map((card) => (
              <CardLink key={card.id} card={card} currentTheme={currentTheme} isLight={isLight} sessionLabel={sessionLabel} />
            ))}
          </div>
        </div>

        <div className={`my-6 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`} />

        {/* ── Interview ─────────────────────────────────── */}
        <div>
          <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
            Interview
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {interviewCards.map((card) => (
              <CardLink key={card.id} card={card} currentTheme={currentTheme} isLight={isLight} sessionLabel={sessionLabel} />
            ))}
          </div>
        </div>

        {/* Back */}
        <div className="mt-8 text-center">
          <Link href="/train" className={`inline-flex items-center gap-1.5 text-sm font-medium transition-colors ${isLight ? 'text-slate-400 hover:text-slate-700' : 'text-slate-500 hover:text-white'}`}>
            <ArrowLeft className="w-4 h-4" />
            Back to Training
          </Link>
        </div>

      </div>
    </div>
  );
}
