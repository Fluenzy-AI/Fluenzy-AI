'use client';

import Link from 'next/link';
import { useTheme, themeConfig } from '@/contexts/ThemeContext';
import {
  Users,
  Lock,
  Shuffle,
  ArrowLeft,
  Mic,
  Briefcase,
  Code2,
  Radio,
  ArrowRight,
} from 'lucide-react';

export default function InterviewLandingPage() {
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === 'parchment';
  const t = themeConfig[resolvedTheme] ?? themeConfig['dark'];

  const cards = [
    {
      id: 'live',
      title: 'Live Interview',
      subtitle: 'Random Matching – 1:1',
      description:
        'Get matched 1:1 with a real person. Choose your type and role — HR ↔ Candidate or Engineering Manager ↔ Candidate.',
      icon: Shuffle,
      badge: 'Live',
      badgeColor: 'bg-green-500/20 text-green-400 border-green-500/30',
      gradient: 'from-green-500 to-emerald-600',
      href: '/train/interview/live',
      tags: ['PI Interview', 'Technical Interview', '1:1 Strict'],
    },
    {
      id: 'private',
      title: 'Private Interview',
      subtitle: 'Invite-Based – Many to Many',
      description:
        'Host a structured interview room. Invite HRs, Managers, and Candidates. Full moderator controls.',
      icon: Lock,
      badge: 'Invite-Only',
      badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      gradient: 'from-purple-500 to-indigo-600',
      href: '/train/interview/private',
      tags: ['Host Control', 'Raise Hand', 'Multi-participant'],
    },
  ];

  const featureIcons = [
    { icon: Mic, label: 'Voice & Video' },
    { icon: Code2, label: 'Technical Mode' },
    { icon: Briefcase, label: 'PI Mode' },
    { icon: Users, label: 'Role-Based' },
  ];

  return (
    <div className={`min-h-screen ${t.background}`}>
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Badge */}
        <div
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-3 border ${
            isLight
              ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
              : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
          }`}
        >
          <Radio size={12} />
          Live Interview Simulation
        </div>

        <h1 className={`text-2xl sm:text-3xl font-extrabold mb-2 ${t.text}`}>
          Live Interview Modes
        </h1>
        <p className={`text-sm mb-8 ${t.textMuted}`}>
          Practice real interviews with real people — choose your mode below.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-2 mb-10">
          {featureIcons.map(({ icon: Icon, label }) => (
            <span
              key={label}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                isLight
                  ? 'bg-slate-100 text-slate-600 border-slate-200'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              <Icon size={11} />
              {label}
            </span>
          ))}
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.id}
                href={card.href}
                className={`group relative flex flex-col rounded-2xl border p-6 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl ${
                  isLight
                    ? 'bg-white border-slate-200 hover:border-indigo-300'
                    : 'bg-slate-800/60 border-slate-700/50 hover:border-indigo-500/50'
                }`}
              >
                {/* Badge */}
                <span
                  className={`absolute top-4 right-4 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${card.badgeColor}`}
                >
                  {card.badge}
                </span>

                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-4`}
                >
                  <Icon size={22} className="text-white" />
                </div>

                <h2 className={`text-lg font-bold mb-0.5 ${t.text}`}>{card.title}</h2>
                <p className={`text-xs font-medium mb-2 ${isLight ? 'text-indigo-500' : 'text-indigo-400'}`}>
                  {card.subtitle}
                </p>
                <p className={`text-sm mb-4 leading-relaxed ${t.textMuted}`}>{card.description}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {card.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        isLight ? 'bg-slate-100 text-slate-500' : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div
                  className={`flex items-center gap-1 text-sm font-semibold mt-auto ${
                    isLight ? 'text-indigo-600' : 'text-indigo-400'
                  }`}
                >
                  Start
                  <ArrowRight
                    size={15}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Back */}
        <Link
          href="/train/live"
          className={`inline-flex items-center gap-2 text-sm ${t.textMuted} hover:text-indigo-400 transition-colors`}
        >
          <ArrowLeft size={14} />
          Back to Live Modes
        </Link>
      </div>
    </div>
  );
}
