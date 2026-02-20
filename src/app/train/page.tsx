'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
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

interface PlanInfo {
  plan: string;
  planName: string;
  price: number;
  isUnlimited: boolean;
}

interface UsageData {
  canUse: Record<string, boolean>;
  remaining: Record<string, number | string>;
  limit: Record<string, number>;
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
}

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
    sessions: 5,
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
    sessions: 3,
  },
  {
    type: 'gd',
    title: 'GD Agent',
    description: 'Live Group Discussions with multiple AI participants',
    icon: Target,
    color: 'text-purple-400',
    gradient: 'from-purple-500 to-indigo-500',
    href: '/train/gd',
    badge: 'AI',
    isLocked: false,
    sessions: 5,
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
    sessions: 5,
  },
  {
    type: 'company',
    title: 'Company Tracks',
    description: 'Prepare for FAANG, Startups, or MNCs with curated company HR rounds',
    icon: Building2,
    color: 'text-amber-400',
    gradient: 'from-amber-500 to-orange-500',
    href: '/train/company',
    badge: 'Premium',
    isLocked: false,
    sessions: 3,
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
    sessions: '∞',
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
    sessions: 10,
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
    sessions: '∞',
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
    sessions: '∞',
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
    sessions: '∞',
  },
];

export default function TrainPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);

  const currentTheme = themeConfig[resolvedTheme] || themeConfig.dark;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchData = async () => {
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
        console.error('Error fetching data:', error);
      }
    };

    if (session?.user) {
      fetchData();
    }
  }, [session]);

  const getUpdatedModules = () => {
    if (!usageData) return modules;
    
    return modules.map(mod => {
      const key = mod.type;
      const canUse = usageData.canUse[key] ?? true;
      const remaining = usageData.remaining[key] ?? (planInfo?.isUnlimited ? '∞' : 3);
      const isLocked = !canUse && remaining !== 'Unlimited' && remaining !== '∞';
      
      return {
        ...mod,
        isLocked,
        sessions: remaining,
      };
    });
  };

  const updatedModules = getUpdatedModules();

  if (status === 'loading') {
    return (
      <div className={`min-h-screen ${currentTheme.background} flex items-center justify-center`}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
          <p className={currentTheme.textMuted}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Hero Section - Premium SaaS Style */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        {/* Background Glow Effect */}
        <div className="relative">
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-gradient-to-br from-[#5B6CFF]/20 to-[#8B5CF6]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-gradient-to-tl from-[#22D3EE]/10 to-transparent rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10">
            <h1 className={`text-3xl md:text-4xl lg:text-5xl font-black ${currentTheme.text} mb-4`}>
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5B6CFF] to-[#8B5CF6]">{session.user.name?.split(' ')[0]}</span> 👋
            </h1>
            <p className={`text-lg md:text-xl ${currentTheme.textMuted} max-w-2xl mb-8`}>
              Master your interview skills with AI-powered practice sessions. Choose a module below to begin your journey.
            </p>
            
            <Button
              asChild
              className="bg-gradient-to-r from-[#5B6CFF] to-[#8B5CF6] hover:from-[#4B5CE8] hover:to-[#7B4CE6] text-white font-semibold px-8 py-4 rounded-xl shadow-lg shadow-[#5B6CFF]/25 hover:shadow-[#5B6CFF]/40 transition-all duration-200 hover:-translate-y-0.5"
            >
              <Link href="/train/hr">
                <Sparkles className="mr-2" size={20} />
                Start Practice
              </Link>
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
                rounded-2xl p-6 transition-all duration-200
                ${mod.isLocked 
                  ? 'opacity-60' 
                  : 'hover:border-[#5B6CFF]/30 hover:shadow-lg hover:shadow-[#5B6CFF]/10 hover:-translate-y-1 cursor-pointer'
                }
              `}
              {...(mod.isLocked ? {} : { onClick: () => router.push(mod.href), role: 'button', tabIndex: 0, onKeyDown: (e) => e.key === 'Enter' && router.push(mod.href) })}
            >
              {/* Gradient Background Effect */}
              <div className={`absolute -right-20 -top-20 w-40 h-40 bg-gradient-to-br ${mod.gradient} opacity-0 group-hover:opacity-10 blur-3xl transition-opacity duration-500`} />

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
                <h3 className={`text-lg font-bold ${currentTheme.text} mb-2 group-hover:text-[#5B6CFF] transition-colors`}>
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
                      {mod.sessions} {mod.sessions === 1 ? 'session' : 'sessions'}
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

      {/* CTA Section */}
      {planInfo && planInfo.plan === 'Free' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${currentTheme.cardBg} border border-[#5B6CFF]/30 rounded-2xl p-6 bg-gradient-to-r from-[#5B6CFF]/10 to-[#8B5CF6]/10`}
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
  );
}
