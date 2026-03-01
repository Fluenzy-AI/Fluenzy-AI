'use client';

import { useState, useEffect } from 'react';
import { useRouter as useNavRouter } from 'next/navigation';
import { useSession as useAuthSession } from 'next-auth/react';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Bot,
  ArrowRight,
  ArrowLeft,
  Clock,
  Brain,
  Target,
  TrendingUp,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

interface UsageData {
  remaining: Record<string, number | string>;
  canUse: Record<string, boolean>;
  isUnlimited: Record<string, boolean>;
}

export default function GDSelectionPage() {
  const router = useNavRouter();
  const { data: session } = useAuthSession();
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === 'light';
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsageData = async () => {
      try {
        if (!session?.user) return;
        setIsLoading(true);
        const response = await fetch('/api/training-usage');
        if (response.ok) setUsageData(await response.json());
      } catch (error) {
        console.error('[GD_PAGE] Error fetching usage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user) {
      fetchUsageData();
      const handleUsageUpdate = () => fetchUsageData();
      window.addEventListener('usage-updated', handleUsageUpdate);
      return () => window.removeEventListener('usage-updated', handleUsageUpdate);
    }
  }, [session]);

  const sessionBadge = () => {
    if (isLoading) return <Loader2 className="w-4 h-4 animate-spin text-slate-400" />;
    if (usageData?.isUnlimited?.['gd']) return <span className="text-emerald-400 font-bold">Unlimited Sessions</span>;
    const rem = usageData?.remaining?.['gd'];
    if (rem !== undefined) return <span className={Number(rem) === 0 ? 'text-red-400 font-bold' : 'text-white font-bold'}>{rem} {Number(rem) === 1 ? 'session' : 'sessions'} left</span>;
    return null;
  };

  return (
    <div className={`min-h-screen ${isLight ? 'bg-slate-50 text-slate-900' : 'bg-slate-900 text-white'}`}>
      <div className="max-w-xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-6">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-3 border ${isLight ? 'bg-green-50 text-green-600 border-green-200' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
            <Bot size={12} />
            GD Agent &mdash; Solo Practice
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-2 leading-tight">
            Practice GD with{' '}
            <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
              AI Agents
            </span>
          </h1>
          <p className={`text-sm leading-relaxed ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Simulated Group Discussion with AI participants &mdash; anytime, no waiting.
          </p>
        </div>

        {/* Main Card */}
        <div className={`rounded-2xl overflow-hidden border mb-5 ${isLight ? 'border-slate-200 bg-white' : 'border-slate-700/50 bg-slate-800/60'}`}>

          {/* Green top band */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-white font-bold text-sm leading-tight">AI Agents GD</div>
                <div className="text-green-100/80 text-xs">Solo Practice</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-green-100/70 uppercase tracking-widest leading-tight">Sessions</div>
              <div className="text-sm font-bold leading-tight">{sessionBadge()}</div>
            </div>
          </div>

          {/* Body */}
          <div className="p-4">
            <p className={`text-sm leading-relaxed mb-4 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Join a simulated GD with AI agents — each with a unique persona, assigned role, and argumentation style. Get real-time feedback and a post-session report.
            </p>

            {/* Feature chips */}
            <div className="flex flex-wrap gap-2 mb-5">
              {[
                { icon: Brain, text: 'Unique AI Personas' },
                { icon: Target, text: 'Assigned Roles' },
                { icon: TrendingUp, text: 'Live Feedback' },
                { icon: Clock, text: '24/7 Available' },
                { icon: CheckCircle2, text: 'Performance Report' },
              ].map((f, i) => (
                <span key={i} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${isLight ? 'bg-green-50 text-green-700 border-green-200' : 'bg-green-500/10 text-green-300 border-green-500/20'}`}>
                  <f.icon className="w-3 h-3" />
                  {f.text}
                </span>
              ))}
            </div>

            <Link
              href="/train/gd/ai"
              className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:brightness-110 text-white font-bold py-3 px-6 rounded-xl transition-all active:scale-95 shadow-lg shadow-green-500/20 text-sm"
            >
              <Bot className="w-4 h-4" />
              Start GD Session
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Back */}
        <div className="text-center">
          <Link href="/train" className={`inline-flex items-center gap-1.5 text-sm font-medium transition-colors ${isLight ? 'text-slate-400 hover:text-slate-700' : 'text-slate-500 hover:text-white'}`}>
            <ArrowLeft className="w-4 h-4" />
            Back to Training
          </Link>
        </div>

      </div>
    </div>
  );
}
