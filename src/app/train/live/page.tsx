'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  Users,
  Shuffle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Globe,
  Lock,
  Shield,
  TrendingUp,
  Star,
  MessageSquare,
  Zap,
  Radio,
} from 'lucide-react';

interface UsageData {
  remaining: Record<string, number | string>;
  canUse: Record<string, boolean>;
  isUnlimited: Record<string, boolean>;
}

export default function LiveGDPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [usageData, setUsageData] = useState<UsageData | null>(null);

  useEffect(() => {
    const fetchUsage = async () => {
      if (!session?.user) return;
      try {
        const res = await fetch('/api/training-usage');
        if (res.ok) setUsageData(await res.json());
      } catch (e) {}
    };
    fetchUsage();
  }, [session]);

  const getSessionDisplay = (key: string) => {
    if (!usageData) return <span className="text-slate-400">—</span>;
    if (usageData.isUnlimited?.[key]) return <span className="text-emerald-400">Unlimited</span>;
    const rem = usageData.remaining?.[key];
    if (rem !== undefined)
      return <span className={Number(rem) === 0 ? 'text-red-400' : 'text-white'}>{rem} {Number(rem) === 1 ? 'session' : 'sessions'}</span>;
    return <span className="text-slate-400">—</span>;
  };

  const cards = [
    {
      id: 'private',
      title: 'Private GD',
      subtitle: 'Invite-Only Sessions',
      description: 'Create a private group discussion room and share a unique invite link with friends or classmates.',
      icon: Lock,
      gradient: 'from-purple-500 to-pink-500',
      gradientBg: 'from-purple-500/20 via-pink-500/20 to-purple-500/20',
      borderHover: 'hover:border-purple-500/50',
      shadowHover: 'hover:shadow-purple-500/10',
      textHover: 'group-hover:text-purple-300',
      checkColor: 'text-purple-400',
      features: [
        { icon: Shield, text: 'Generate unique room ID' },
        { icon: Users, text: 'Share private invite link' },
        { icon: Lock, text: 'Only invited users can join' },
      ],
      cta: 'Create / Join Private Room',
      ctaIcon: Users,
      href: '/train/gd/private',
      moduleKey: 'gd',
      statLabel: 'Sessions Available',
    },
    {
      id: 'random',
      title: 'Random Matching',
      subtitle: 'Live GD Sessions',
      description: 'Join a live discussion with random participants. Get matched based on your selected configuration.',
      icon: Shuffle,
      gradient: 'from-blue-500 to-cyan-500',
      gradientBg: 'from-blue-500/20 via-cyan-500/20 to-blue-500/20',
      borderHover: 'hover:border-blue-500/50',
      shadowHover: 'hover:shadow-blue-500/10',
      textHover: 'group-hover:text-blue-300',
      checkColor: 'text-blue-400',
      features: [
        { icon: Globe, text: 'Match with random participants' },
        { icon: Users, text: 'Choose participant count' },
        { icon: TrendingUp, text: 'Select topic difficulty' },
      ],
      cta: 'Start Live GD',
      ctaIcon: Globe,
      href: '/train/live-gd',
      moduleKey: 'gd',
      statLabel: 'Sessions Available',
      popular: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-400 px-5 py-2 rounded-full text-sm font-medium mb-6 border border-indigo-500/20">
            <Radio size={16} />
            <span>Live Group Discussion</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-5 leading-tight">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Live GD Modes
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto leading-relaxed">
            Practice live group discussions with real or AI participants. Choose your preferred mode below.
          </p>

          {/* Quick Stats */}
          <div className="flex items-center justify-center gap-8 mt-8">
            {[
              { icon: Users, label: 'Active Users', value: '1.2K+' },
              { icon: MessageSquare, label: 'Discussions', value: '5K+' },
              { icon: Star, label: 'Avg Rating', value: '4.8' },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1.5 text-white font-bold text-lg">
                  <stat.icon className="h-4 w-4 text-purple-400" />
                  {stat.value}
                </div>
                <span className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cards Grid — 2 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-3xl mx-auto">
          {cards.map((card) => (
            <div
              key={card.id}
              className={`group relative rounded-2xl transition-all duration-500 ${
                hoveredCard === card.id ? 'scale-[1.02] z-10' : hoveredCard ? 'scale-[0.98] opacity-80' : ''
              }`}
              onMouseEnter={() => setHoveredCard(card.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              {card.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                  <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-lg shadow-amber-500/30">
                    <Zap className="h-3 w-3" /> Most Popular
                  </span>
                </div>
              )}

              <div className={`relative bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 ${card.borderHover} transition-all duration-300 hover:shadow-xl ${card.shadowHover} overflow-hidden h-full flex flex-col`}>
                <div className={`absolute inset-0 bg-gradient-to-r ${card.gradientBg} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl`} />
                <div className={`absolute inset-0.5 bg-gradient-to-r ${card.gradient} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                <div className="absolute inset-[1px] bg-slate-800 rounded-2xl" />

                <div className="relative z-10 flex flex-col flex-1">
                  <div className="flex items-start justify-between mb-5">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      <card.icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500 font-medium">{card.statLabel}</div>
                      <div className="text-sm font-bold flex items-center gap-1 justify-end">
                        {getSessionDisplay(card.moduleKey)}
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <h2 className={`text-2xl font-bold text-white ${card.textHover} transition-colors`}>{card.title}</h2>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">{card.subtitle}</p>
                  </div>

                  <p className="text-gray-400 mb-6 leading-relaxed text-sm">{card.description}</p>

                  <ul className="space-y-2.5 mb-8 flex-1">
                    {card.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2.5">
                        <div className="w-5 h-5 rounded-md bg-white/5 flex items-center justify-center">
                          <feature.icon className={`w-3 h-3 ${card.checkColor}`} />
                        </div>
                        <span className="text-sm text-gray-300">{feature.text}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={card.href}
                    className={`w-full bg-gradient-to-r ${card.gradient} hover:brightness-110 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 group-hover:scale-[1.02] flex items-center justify-center gap-2 shadow-lg`}
                  >
                    <card.ctaIcon className="w-5 h-5" />
                    <span>{card.cta}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tips */}
        <div className="mt-14 bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6 md:p-8">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-400" />
            Quick Tips for GD Success
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { tip: 'Start with a strong opening statement that sets the tone', num: '01' },
              { tip: "Listen actively and build on others' points constructively", num: '02' },
              { tip: 'Use data and examples to support your arguments', num: '03' },
              { tip: 'Summarize key points if you get a chance to conclude', num: '04' },
            ].map((item, i) => (
              <div key={i} className="flex gap-3">
                <span className="text-2xl font-black text-slate-700">{item.num}</span>
                <p className="text-sm text-slate-400 leading-relaxed">{item.tip}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 text-center">
          <Link href="/train" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-medium">
            <ArrowLeft className="w-4 h-4" />
            Back to Training Modules
          </Link>
        </div>
      </div>
    </div>
  );
}
