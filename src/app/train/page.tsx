'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
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
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme, themeConfig } from '@/contexts/ThemeContext';

// ===== CRITICAL FIX: Module Classifications =====
// Unlimited modules that should NOT show session counts (no limit enforced)
const UNLIMITED_MODULES = new Set([
  'vocabulary',
  'latestTopics',
  'latest_topics',
  'gdPrivate',  // GD Private - unlimited
  'gdRandom',   // GD Random - unlimited
]);
// LIMITED modules (show real remaining count): hr, gdCoach, technical, company, daily, english, corporateVoice

// Module key mapping: UI key → API key
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
  color: string;
  gradient: string;
  href: string;
  badge?: string;
  isLocked: boolean;
  sessions: number | string;
  isUnlimited?: boolean;
}

// Default modules - NO HARDCODED session values, will be fetched from API
const modules: Module[] = [
  {
    type: 'hr',
    title: 'HR Interview',
    description: 'Practice behavioral questions with AI-powered HR simulations',
    icon: UserPlus,
    color: 'text-pink-400',
    gradient: 'from-pink-500 to-rose-500',
    href: '/train/hr',
    badge: 'Popular',
    isLocked: false,
    sessions: '-', // Will be updated from API
  },
  {
    type: 'gd-coach',
    title: 'GD Coach',
    description: 'Step-by-step training from beginner to advanced GD leader',
    icon: GraduationCap,
    color: 'text-teal-400',
    gradient: 'from-teal-500 to-emerald-500',
    href: '/train/gd-coach',
    badge: 'Pro',
    isLocked: false,
    sessions: '-', // Will be updated from API
  },
  {
    type: 'gd',
    title: 'GD Agent',
    description: 'Live Group Discussions with multiple AI participants',
    icon: Target,
    color: 'text-purple-400',
    gradient: 'from-purple-500 to-indigo-500',
    href: '/train/gd-agent',
    badge: 'AI',
    isLocked: false,
    sessions: '-', // Will be updated from API (AI Agents is LIMITED)
  },
  {
    type: 'technical',
    title: 'Technical Mastery',
    description: 'Deep-dive into role-based conceptual and logic rounds',
    icon: Code,
    color: 'text-emerald-400',
    gradient: 'from-emerald-500 to-teal-500',
    href: '/train/technical',
    badge: 'Advanced',
    isLocked: false,
    sessions: '-', // Will be updated from API
  },
  {
    type: 'company',
    title: 'Company Tracks',
    description: 'Prepare for FAANG, Startups, or MNCs with curated company HR rounds',
    icon: Building2,
    color: 'text-red-500',
    gradient: 'from-red-500 to-rose-600',
    href: '/train/company',
    badge: '🔥 HOT TRACK',
    isLocked: false,
    sessions: '-', // Will be updated from API
  },
  {
    type: 'daily',
    title: 'Daily Conversation',
    description: 'Practice everyday English with AI conversation partner',
    icon: MessageSquare,
    color: 'text-sky-400',
    gradient: 'from-sky-500 to-blue-500',
    href: '/train/daily',
    isLocked: false,
    sessions: '-', // Will be updated from API (Daily is LIMITED)
  },
  {
    type: 'latest-topics',
    title: 'Latest Topics',
    description: 'Stay updated with latest company-specific interview topics',
    icon: Zap,
    color: 'text-lime-400',
    gradient: 'from-lime-500 to-green-500',
    href: '/train/latest-topics',
    isLocked: false,
    sessions: 'Unlimited', // Will be confirmed from API
  },
  {
    type: 'english',
    title: 'English Learning',
    description: 'Master professional English with real-time grammar feedback',
    icon: BookOpen,
    color: 'text-blue-400',
    gradient: 'from-blue-500 to-indigo-500',
    href: '/train/english',
    isLocked: false,
    sessions: '-', // Will be updated from API (English is LIMITED)
  },
  {
    type: 'vocabulary',
    title: 'Vocabulary Booster',
    description: 'Expand your professional vocabulary with curated word lists',
    icon: BookMarked,
    color: 'text-orange-400',
    gradient: 'from-orange-500 to-red-500',
    href: '/train/vocabulary',
    isLocked: false,
    sessions: 'Unlimited', // Will be confirmed from API
  },
  {
    type: 'corporate-voice',
    title: 'Voice Practice',
    description: 'Improve pronunciation and speaking style for corporate settings',
    icon: Phone,
    color: 'text-cyan-400',
    gradient: 'from-cyan-500 to-blue-500',
    href: '/train/corporate-voice',
    isLocked: false,
    sessions: '-', // Will be updated from API (Voice Practice is LIMITED)
  },
];

export default function TrainPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);
  const [autoApplyStatus, setAutoApplyStatus] = useState<AutoApplyStatus | null>(null);

  const currentTheme = themeConfig[resolvedTheme] || themeConfig.dark;

  // ===== CRITICAL FIX: Fetch usage data correctly =====
  // ===== SAFE TIMESTAMP HELPER =====
  const getLastUpdateMs = useCallback((): number => {
    try {
      const raw = localStorage.getItem('usage-updated');
      if (!raw) return 0;
      const parsed = Number(raw);
      if (Number.isNaN(parsed) || parsed <= 0) {
        console.warn('[TRAIN_PAGE_TIMESTAMP] Corrupt usage-updated value, treating as stale:', raw);
        return 0;
      }
      return parsed;
    } catch {
      return 0;
    }
  }, []);

  const fetchUsageData = useCallback(async () => {
    try {
      console.log('[TRAIN_PAGE_FETCH_START] Fetching usage data from /api/training-usage');

      const [usageRes, planRes, autoApplyRes] = await Promise.all([
        fetch('/api/training-usage'),
        fetch('/api/user-plan'),
        fetch('/api/candidates/preferences').catch(() => null),
      ]);

      if (usageRes.ok) {
        const data = await usageRes.json();
        console.log('[TRAIN_PAGE_FETCH_SUCCESS] Usage data received:', {
          gdCoach: data.remaining?.gdCoach,
          gd: data.remaining?.gd,
          hr: data.remaining?.hr,
          remaining: data.remaining,
          isUnlimited: data.isUnlimited
        });
        setUsageData(data);
        // Persist fetch timestamp for staleness checks on next mount
        try {
          localStorage.setItem('usage-updated', String(Date.now()));
        } catch { /* localStorage unavailable */ }
      } else {
        console.warn('[TRAIN_PAGE_FETCH_FAILED] Usage fetch failed:', usageRes.status);
      }

      if (planRes.ok) {
        const data = await planRes.json();
        console.log('[TRAIN_PAGE_PLAN_FETCHED] Plan data:', data.planName);
        setPlanInfo(data);
      } else {
        console.warn('[TRAIN_PAGE_PLAN_FAILED] Plan fetch failed:', planRes.status);
      }

      // Fetch auto-apply status (might not be a candidate user)
      if (autoApplyRes && autoApplyRes.ok) {
        const data = await autoApplyRes.json();
        if (data.preferences) {
          setAutoApplyStatus({
            enabled: data.preferences.autoApplyEnabled,
            count: data.preferences.autoApplyCount || 0,
            limit: data.preferences.monthlyLimit || 0,
            canAutoApply: data.canAutoApply,
          });
        }
      }
    } catch (error) {
      console.error('[TRAIN_PAGE_FETCH_ERROR] Error fetching data:', error);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      console.log('[TRAIN_PAGE_LOAD] Session detected, checking for recent updates');
      
      // Check staleness with safe timestamp parsing
      const lastUpdateMs = getLastUpdateMs();
      if (lastUpdateMs > 0) {
        const timeDiff = Date.now() - lastUpdateMs;
        console.log(`[TRAIN_PAGE_RECENT_UPDATE_CHECK] Last update: ${timeDiff}ms ago`);
      } else {
        console.log('[TRAIN_PAGE_NO_RECENT_UPDATE] No valid usage-updated timestamp in localStorage');
      }
      
      // Single initial fetch (no duplicate calls)
      fetchUsageData();
      
      // Listen for usage updates from other sources (same tab)
      const handleUsageUpdate = (event: Event) => {
        let moduleInfo = 'unknown';
        if (event instanceof CustomEvent) {
          moduleInfo = event.detail?.module || 'unknown';
          console.log('[TRAIN_PAGE_EVENT_RECEIVED] Usage update event received:', {
            module: event.detail?.module,
            timestamp: event.detail?.timestamp,
            lessonsCompleted: event.detail?.lessonsCompleted
          });
        } else {
          console.log('[TRAIN_PAGE_EVENT_RECEIVED] Generic usage-updated event received');
        }
        
        console.log(`[TRAIN_PAGE_REFETCH_TRIGGERED] Module (${moduleInfo}) session completed, refetching usage data...`);
        fetchUsageData();
      };
      
      window.addEventListener('usage-updated', handleUsageUpdate);
      console.log('[TRAIN_PAGE_LISTENER_ATTACHED] Event listener attached for usage-updated');
      
      return () => {
        window.removeEventListener('usage-updated', handleUsageUpdate);
        console.log('[TRAIN_PAGE_LISTENER_REMOVED] Event listener removed');
      };
    }
  }, [session, fetchUsageData, getLastUpdateMs]);

  const getUpdatedModules = () => {
    console.log('[TRAIN_PAGE_GET_MODULES_START] usageData:', usageData ? 'loaded' : 'null');
    
    return modules.map(mod => {
      // Get the correct API key for this module
      const apiKey = MODULE_KEY_MAP[mod.type] || mod.type;
      
      // Check if this is an unlimited module
      const isUnlimitedModule = UNLIMITED_MODULES.has(apiKey);
      
      // If no API data yet, show loading state for limited modules only
      if (!usageData) {
        const result = {
          ...mod,
          sessions: isUnlimitedModule ? 'Unlimited' : '-',
          isUnlimited: isUnlimitedModule,
          isLocked: false, // Don't lock until we have data
        };
        if (mod.type === 'gd-coach') {
          console.log('[TRAIN_PAGE_GDCOACH_LOADING] GD Coach in loading state:', result.sessions);
        }
        return result;
      }

      // Get usage info from API response
      const canUse = usageData.canUse?.[apiKey] ?? true;
      const remaining = usageData.remaining?.[apiKey];
      const isApiUnlimited = usageData.isUnlimited?.[apiKey] ?? isUnlimitedModule;
      
      // Determine lock status
      const isLocked = !canUse && remaining !== 'Unlimited' && remaining !== '∞' && remaining !== undefined;
      
      // Determine session display
      let sessionDisplay: number | string;
      if (isUnlimitedModule || isApiUnlimited) {
        sessionDisplay = 'Unlimited';
      } else if (remaining === undefined) {
        sessionDisplay = '-'; // Loading
      } else {
        sessionDisplay = remaining;
      }

      if (mod.type === 'gd-coach') {
        console.log('[TRAIN_PAGE_GDCOACH_DATA]', {
          type: mod.type,
          apiKey: apiKey,
          remaining: remaining,
          isApiUnlimited: isApiUnlimited,
          isLocked: isLocked,
          sessionDisplay: sessionDisplay
        });
      }

      console.log(`[MODULE] ${mod.type} → apiKey: ${apiKey}, unlimited: ${isUnlimitedModule}, sessions: ${sessionDisplay}`);

      return {
        ...mod,
        isLocked,
        sessions: sessionDisplay,
        isUnlimited: isUnlimitedModule || isApiUnlimited,
      };
    });
  };

  const updatedModules = getUpdatedModules();



  return (
    <>
      <div className="p-4 md:p-6 lg:p-8 relative">
      {/* Light theme ambient background */}
      {resolvedTheme === 'parchment' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute -top-10 left-1/3 w-[450px] h-[450px] bg-gradient-to-br from-violet-100/90 via-indigo-50/70 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
          <div className="absolute top-20 -right-20 w-[380px] h-[380px] bg-gradient-to-tl from-sky-100/80 via-cyan-50/60 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }} />
          <div className="absolute bottom-0 left-0 w-[320px] h-[320px] bg-gradient-to-r from-purple-100/60 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '7s', animationDelay: '1s' }} />
        </div>
      )}
      {/* Hero Section - Apple Aesthetic */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        {/* Background Glow Effect */}
        <div className="relative">
          {resolvedTheme === 'parchment' ? (
            <>
              <div className="absolute -top-16 -left-8 w-80 h-80 bg-gradient-to-br from-red-200/50 to-rose-100/40 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '6s' }} />
              <div className="absolute top-0 right-4 w-64 h-64 bg-gradient-to-bl from-amber-100/60 to-rose-50/40 rounded-full blur-3xl pointer-events-none" />
            </>
          ) : (
            <>
              <div className="absolute -top-20 -left-20 w-96 h-96 bg-gradient-to-br from-purple-600/20 to-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-gradient-to-tl from-indigo-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
            </>
          )}
          
          <div className="relative z-10">
            <h1 className={`text-3xl md:text-4xl lg:text-5xl font-black ${currentTheme.text} mb-3 tracking-tight`}>
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-400 to-purple-300">{session?.user?.name ? session.user.name.split(' ')[0] : 'User'}</span> 👋
            </h1>
            <p className={`text-base md:text-lg ${currentTheme.textMuted} max-w-2xl mb-6`}>
              Master your interview skills with AI-powered practice sessions. Select a company or practice module below.
            </p>
            
            <div className="flex flex-wrap items-center gap-3">
              <Button
                asChild
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold px-8 py-4 rounded-full shadow-lg shadow-purple-600/25 hover:shadow-purple-600/40 transition-all duration-200 hover:-translate-y-0.5"
              >
                <Link href="/train/company">
                  <Building2 className="mr-2" size={18} />
                  Start Company Tracks
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-red-500/30 text-foreground font-semibold px-6 py-4 rounded-full hover:bg-red-500/10 transition-all"
              >
                <Link href="/train/hr">
                  <Sparkles className="mr-2 text-red-500" size={18} />
                  HR Practice
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Featured Apple-Style Spotlight Card for Company Tracks */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-10 relative overflow-hidden rounded-3xl border border-red-500/30 bg-gradient-to-r from-red-500/10 via-rose-500/5 to-amber-500/10 backdrop-blur-2xl p-6 md:p-8 shadow-xl shadow-red-500/5 group cursor-pointer"
        onClick={() => router.push('/train/company')}
      >
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-red-500/20 transition-all duration-500" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-500 text-xs font-extrabold tracking-wider uppercase">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              FEATURED TRACKS • APPLE & TECH LEADERS
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
              Prepare for Apple, FAANG & Top MNCs
            </h2>
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
              Curated company-wise interview simulations calibrated to the exact culture fit and technical bars of Apple, Google, Microsoft, Meta, Amazon, TCS & top tech firms.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {['🍏 Apple', '🔍 Google', '💻 Microsoft', '♾️ Meta', '📦 Amazon', '🏢 TCS'].map((company) => (
                <span key={company} className="px-3 py-1 rounded-xl bg-background/80 border border-border/70 text-xs font-bold text-foreground shadow-sm">
                  {company}
                </span>
              ))}
            </div>
          </div>
          <div className="shrink-0">
            <Button className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold px-7 py-3.5 rounded-full shadow-lg shadow-red-600/30 transition-all duration-300 group-hover:scale-105">
              <Building2 className="mr-2" size={18} />
              Explore Company Tracks →
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Module Cards Grid */}
      <div className="mb-8">
        <h2 className={`text-xl font-bold ${currentTheme.text} mb-4`}>Practice Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {updatedModules.map((mod, index) => (
            <motion.div
              key={mod.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`
                group relative ${currentTheme.cardBg} border ${currentTheme.cardBorder} 
                rounded-2xl p-6 transition-all duration-300
                ${resolvedTheme === 'parchment' ? 'shadow-sm ring-1 ring-black/5' : ''}
                ${mod.isLocked 
                  ? 'opacity-60' 
                  : resolvedTheme === 'parchment'
                    ? 'hover:border-indigo-200 hover:shadow-2xl hover:shadow-indigo-400/20 hover:-translate-y-2 hover:ring-indigo-100 cursor-pointer'
                    : 'hover:border-[#5B6CFF]/30 hover:shadow-lg hover:shadow-[#5B6CFF]/10 hover:-translate-y-1 cursor-pointer'
                }
              `}
              {...(mod.isLocked ? {} : { onClick: () => router.push(mod.href), role: 'button', tabIndex: 0, onKeyDown: (e) => e.key === 'Enter' && router.push(mod.href) })}
            >
              {/* Gradient Background Effect */}
              <div className={`absolute -right-20 -top-20 w-40 h-40 bg-gradient-to-br ${mod.gradient} blur-3xl transition-opacity duration-500 ${resolvedTheme === 'parchment' ? 'opacity-0 group-hover:opacity-30' : 'opacity-0 group-hover:opacity-10'}`} />

              <div className="relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${mod.gradient} flex items-center justify-center shadow-lg`}>
                    <mod.icon size={24} className="text-white" />
                  </div>
                  {mod.badge && (
                    <span className={`px-2 py-1 rounded-md bg-gradient-to-r ${mod.gradient} text-white text-xs font-semibold`}>
                      {mod.badge}
                    </span>
                  )}
                  {mod.isLocked && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-red-500/10 border border-red-500/20">
                      <Lock size={12} className="text-red-400" />
                      <span className="text-xs text-red-400">Locked</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <h3 className={`text-lg font-bold ${currentTheme.text} mb-2 transition-colors ${resolvedTheme === 'parchment' ? 'group-hover:text-indigo-600' : 'group-hover:text-[#5B6CFF]'}`}>
                  {mod.title}
                </h3>
                <p className={`text-sm ${currentTheme.textMuted} mb-4 line-clamp-2`}>
                  {mod.description}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-[#22D3EE]" />
                    <span className={`text-sm ${currentTheme.textMuted}`}>
                      {/* CRITICAL FIX: Show correct session info based on module type */}
                      {mod.isUnlimited ? (
                        'Unlimited'
                      ) : mod.sessions === '-' ? (
                        <span className="inline-block w-16 h-4 rounded bg-current opacity-10 animate-pulse" />
                      ) : (
                        <>
                          {mod.sessions} {mod.sessions === 1 ? 'session' : 'sessions'}
                        </>
                      )}
                    </span>
                  </div>
                  
                  {!mod.isLocked && (
                    <Link
                      href={mod.href}
                      className={`
                        flex items-center gap-1 text-sm font-semibold ${mod.color}
                        group-hover:translate-x-1 transition-transform
                      `}
                    >
                      Start
                      <ArrowRight size={16} />
                    </Link>
                  )}
                  
                  {mod.isLocked && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-500 z-20"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push('/billing');
                      }}
                    >
                      Upgrade
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Career Portal CTA Section */}
      {autoApplyStatus && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-8 ${currentTheme.cardBg} border ${
            autoApplyStatus.enabled && autoApplyStatus.canAutoApply
              ? resolvedTheme === 'parchment'
                ? 'border-emerald-200 shadow-lg shadow-emerald-100'
                : 'border-emerald-500/30'
              : resolvedTheme === 'parchment'
                ? 'border-purple-200 shadow-lg shadow-purple-100'
                : 'border-purple-500/30'
          } rounded-2xl p-6 bg-gradient-to-r ${
            autoApplyStatus.enabled && autoApplyStatus.canAutoApply
              ? resolvedTheme === 'parchment'
                ? 'from-emerald-50 to-teal-50'
                : 'from-emerald-500/10 to-teal-500/10'
              : resolvedTheme === 'parchment'
                ? 'from-purple-50 to-indigo-50'
                : 'from-purple-500/10 to-indigo-500/10'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                autoApplyStatus.enabled && autoApplyStatus.canAutoApply
                  ? 'from-emerald-500 to-teal-500'
                  : 'from-purple-500 to-indigo-500'
              } flex items-center justify-center`}>
                <Briefcase size={24} className="text-white" />
              </div>
              <div>
                {autoApplyStatus.enabled && autoApplyStatus.canAutoApply ? (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`text-lg font-bold ${currentTheme.text}`}>
                        Auto-Apply Active
                      </h3>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
                        <Zap size={12} />
                        {autoApplyStatus.count}/{autoApplyStatus.limit} used
                      </span>
                    </div>
                    <p className={`text-sm ${currentTheme.textMuted}`}>
                      Your profile is being matched with new jobs automatically. Browse available positions now!
                    </p>
                  </>
                ) : !autoApplyStatus.canAutoApply ? (
                  <>
                    <h3 className={`text-lg font-bold ${currentTheme.text} mb-1`}>
                      Unlock Auto-Apply
                    </h3>
                    <p className={`text-sm ${currentTheme.textMuted}`}>
                      Upgrade to Standard or Pro to automatically apply to matching jobs while you train
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className={`text-lg font-bold ${currentTheme.text} mb-1`}>
                      Enable Auto-Apply
                    </h3>
                    <p className={`text-sm ${currentTheme.textMuted}`}>
                      Set your job preferences and let our AI apply to matching positions for you
                    </p>
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => router.push('/jobs')}
                variant="outline"
                className={`${
                  resolvedTheme === 'parchment'
                    ? 'border-slate-300 hover:bg-slate-100'
                    : 'border-white/10 hover:bg-white/5'
                } font-medium`}
              >
                Browse Jobs
              </Button>
              {autoApplyStatus.canAutoApply ? (
                <Button
                  onClick={() => router.push('/train/auto-apply-setup')}
                  className={`bg-gradient-to-r ${
                    autoApplyStatus.enabled
                      ? 'from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600'
                      : 'from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600'
                  } text-white font-semibold`}
                >
                  {autoApplyStatus.enabled ? 'Manage Settings' : 'Enable Auto-Apply'}
                </Button>
              ) : (
                <Button
                  onClick={() => router.push('/pricing')}
                  className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-semibold"
                >
                  Upgrade Plan
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* CTA Section */}
      {planInfo && planInfo.plan === 'Free' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${currentTheme.cardBg} border ${resolvedTheme === 'parchment' ? 'border-indigo-200 shadow-lg shadow-indigo-100' : 'border-[#5B6CFF]/30'} rounded-2xl p-6 bg-gradient-to-r ${resolvedTheme === 'parchment' ? 'from-indigo-50 to-violet-50' : 'from-[#5B6CFF]/10 to-[#8B5CF6]/10'}`}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#5B6CFF] to-[#8B5CF6] flex items-center justify-center">
                <Sparkles size={24} className="text-white" />
              </div>
              <div>
                <h3 className={`text-lg font-bold ${currentTheme.text} mb-1`}>
                  Unlock Unlimited Practice
                </h3>
                <p className={`text-sm ${currentTheme.textMuted}`}>
                  Upgrade to Pro for unlimited sessions and advanced features
                </p>
              </div>
            </div>
            <Button
              onClick={() => router.push('/billing')}
              className="bg-gradient-to-r from-[#5B6CFF] to-[#8B5CF6] hover:from-[#4B5CE8] hover:to-[#7B4CE6] text-white font-semibold px-6"
            >
              Upgrade Now
            </Button>
          </div>
        </motion.div>
      )}
    </div>
    </>
  );
}
