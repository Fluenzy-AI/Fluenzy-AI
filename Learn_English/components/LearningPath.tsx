import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  MessageSquare,
  UserPlus,
  Code,
  Building2,
  Briefcase,
  ArrowRight,
  ShieldCheck,
  Users,
  Lock,
  CheckCircle,
  Sparkles,
  GraduationCap,
  BookA,
  PhoneCall
} from 'lucide-react';
import { ModuleType } from '../types';

const ModuleCard = ({ type, title, description, icon: Icon, color, delay, isAdvanced, canUse, remaining, isLocked, planName, limit, isFeatured }: any) => {
  const router = useRouter();

  const handleUpgrade = () => {
    router.push('/billing');
  };

  const handleStart = () => {
    if (isLocked) return;

    try {
      if (type === ModuleType.ENGLISH_LEARNING) {
        router.push('/train/english');
      } else if (type === ModuleType.HR_INTERVIEW) {
        router.push('/train/hr');
      } else if (type === ModuleType.COMPANY_WISE_HR) {
        router.push('/train/company');
      } else if (type === ModuleType.GD_DISCUSSION) {
        router.push('/train/gd');
      } else if (type === ModuleType.GD_COACH) {
        router.push('/train/gd-coach');
      } else if (type === ModuleType.CONVERSATION_PRACTICE) {
        router.push(`/train/session/${type}`);
      } else if (type === ModuleType.TECH_INTERVIEW) {
        router.push('/train/technical');
      } else if (type === ModuleType.FULL_MOCK) {
        router.push('/train/mock');
      } else if (type === ModuleType.VOCABULARY_BOOSTER) {
        router.push('/train/vocabulary');
      } else if (type === ModuleType.CORPORATE_VOICE) {
        router.push('/train/corporate-voice');
      } else {
        router.push(`/train/session/${type}`);
      }
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback navigation
      window.location.href = '/train';
    }
  };

  return (
    <div
      onClick={handleStart}
      className={`group relative min-h-[280px] bg-gradient-to-br ${isFeatured ? 'from-rose-900/30 via-slate-900/80 to-orange-900/30 border-rose-500/40' : 'from-slate-800/80 to-slate-900/80 border-slate-700/50'} backdrop-blur-lg p-6 rounded-3xl border shadow-xl ${isLocked ? 'opacity-60 cursor-not-allowed' : isFeatured ? 'hover:shadow-2xl hover:shadow-rose-500/20 hover:border-rose-500/50 hover:scale-[1.02] cursor-pointer' : 'hover:shadow-2xl hover:shadow-purple-500/10 hover:border-purple-500/30 hover:scale-[1.02] cursor-pointer'} transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 fill-mode-both ${delay}`}
    >
      {isFeatured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-rose-500 to-orange-500 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-lg">
          <Sparkles size={12} />
          AI Powered
        </div>
      )}
      <div className="relative mb-6">
        <div className={`w-16 h-16 rounded-2xl ${isFeatured ? 'bg-gradient-to-br from-rose-500 to-orange-500' : `bg-gradient-to-br ${color}`} flex items-center justify-center shadow-lg ${!isLocked && 'group-hover:shadow-xl transition-all duration-300 group-hover:scale-110'}`}>
          {isLocked ? <Lock size={32} className="text-white" /> : <Icon size={32} className="text-white" />}
        </div>
        <div className={`absolute -inset-2 ${isFeatured ? 'bg-gradient-to-br from-rose-500 to-orange-500' : `bg-gradient-to-br ${color}`} opacity-20 blur-lg rounded-2xl ${!isLocked && 'group-hover:opacity-30'} transition-opacity duration-300`} />
      </div>

      <h3 className="text-xl font-black text-white mb-3 flex items-center gap-2">
        {title}
        {isAdvanced && <ShieldCheck size={20} className="text-blue-400" />}
        {title === 'GD Agent' && <CheckCircle size={20} className="text-blue-400" />}
      </h3>
      <p className="text-slate-300 text-sm leading-relaxed mb-6 line-clamp-2">{description}</p>

      <div className="flex items-center justify-between mt-auto">
        <div className={`font-bold text-sm ${isLocked ? 'text-red-400 cursor-pointer hover:text-red-300' : isFeatured ? 'text-rose-400 group-hover:text-rose-300' : 'text-purple-400 group-hover:text-purple-300'} transition-colors`} onClick={isLocked ? handleUpgrade : undefined}>
          {isLocked ? 'Free limit reached. Upgrade to continue.' : isFeatured ? 'Generate Guide →' : 'Start Training →'}
          {!isLocked && <ArrowRight size={16} className="ml-2 inline group-hover:translate-x-1 transition-transform" />}
        </div>
        <div className="text-right">
          <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
            {planName ? `${planName} uses` : 'Free uses'}
          </div>
          <div className={`text-sm font-black ${isLocked ? 'text-red-400' : remaining === 'Unlimited' || remaining === '∞' ? 'text-green-400' : 'text-white'}`}>
            {remaining === 'Unlimited' || remaining === '∞' ? '∞' : `${remaining ?? 0} / ${limit || 3}`}
          </div>
        </div>
      </div>

      <div className="absolute top-4 right-4">
        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-widest shadow-sm ${isLocked ? 'bg-red-900/50 text-red-300 border border-red-700/50' : isFeatured ? 'bg-rose-900/50 text-rose-300 border border-rose-700/50' : isAdvanced ? 'bg-blue-900/50 text-blue-300 border border-blue-700/50' : 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/50'}`}>
          {isLocked ? 'Locked' : isFeatured ? 'New' : isAdvanced ? 'Advanced' : 'Available'}
        </span>
      </div>
    </div>
  );
};

const LearningPath: React.FC = () => {
  const [usageData, setUsageData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const response = await fetch('/api/training-usage');
        if (response.ok) {
          const data = await response.json();
          setUsageData(data);
        }
      } catch (error) {
        console.error('Failed to fetch usage data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsage();
  }, []);

  const getModuleUsage = (type: ModuleType) => {
    if (!usageData) return { canUse: true, remaining: 'Loading...', isLocked: false };

    const moduleMap: Record<string, string> = {
      [ModuleType.ENGLISH_LEARNING]: 'english',
      [ModuleType.CONVERSATION_PRACTICE]: 'daily',
      [ModuleType.HR_INTERVIEW]: 'hr',
      [ModuleType.TECH_INTERVIEW]: 'technical',
      [ModuleType.COMPANY_WISE_HR]: 'company',
      [ModuleType.FULL_MOCK]: 'mock',
      [ModuleType.GD_DISCUSSION]: 'gd',
      [ModuleType.GD_COACH]: 'gd',
      [ModuleType.VOCABULARY_BOOSTER]: 'vocabulary',
      [ModuleType.CORPORATE_VOICE]: 'corporateVoice',
    };

    const key = moduleMap[type];
    if (!key) return { canUse: true, remaining: 'N/A', isLocked: false };

    const canUse = usageData.canUse[key];
    const remaining = usageData.remaining[key];
    const isLocked = !canUse && remaining !== 'Unlimited';

    return { canUse, remaining, isLocked };
  };

  const modules = [
    {
      type: ModuleType.ENGLISH_LEARNING,
      title: 'English Learning',
      description: 'Master fluency with personalized daily conversations and real-time grammar feedback.',
      icon: BookOpen,
      color: 'bg-indigo-500',
      delay: 'delay-0',
      ...getModuleUsage(ModuleType.ENGLISH_LEARNING),
      planName: usageData?.planName,
      limit: usageData?.limit
    },
    {
      type: ModuleType.CONVERSATION_PRACTICE,
      title: 'Daily Conversation',
      description: 'Practice real-life office scenarios, small talk, and collaborative professional communication.',
      icon: MessageSquare,
      color: 'bg-sky-500',
      delay: 'delay-100',
      ...getModuleUsage(ModuleType.CONVERSATION_PRACTICE),
      planName: usageData?.planName,
      limit: usageData?.limit
    },
    {
      type: ModuleType.HR_INTERVIEW,
      title: 'HR Interview Coach',
      description: 'Ace behavioral questions and soft skills assessment with seasoned HR simulation.',
      icon: UserPlus,
      color: 'bg-pink-500',
      delay: 'delay-200',
      ...getModuleUsage(ModuleType.HR_INTERVIEW),
      planName: usageData?.planName,
      limit: usageData?.limit
    },
    {
      type: ModuleType.TECH_INTERVIEW,
      title: 'Technical Mastery',
      description: 'Deep-dive into role-based technical conceptual rounds and logic assessments.',
      icon: Code,
      color: 'bg-emerald-500',
      delay: 'delay-300',
      ...getModuleUsage(ModuleType.TECH_INTERVIEW),
      planName: usageData?.planName,
      limit: usageData?.limit
    },
    {
      type: ModuleType.COMPANY_WISE_HR,
      title: 'Company Tracks',
      description: 'Prepare for FAANG, Startups, or MNCs with specific curated company HR rounds.',
      icon: Building2,
      color: 'bg-amber-500',
      delay: 'delay-400',
      isAdvanced: true,
      ...getModuleUsage(ModuleType.COMPANY_WISE_HR),
      planName: usageData?.planName,
      limit: usageData?.limit
    },
    {
      type: ModuleType.GD_DISCUSSION,
      title: 'GD Agent',
      description: 'Practice real Group Discussions with AI participants. Choose teams, roles, and get evaluated.',
      icon: Users,
      color: 'bg-purple-500',
      delay: 'delay-500',
      ...getModuleUsage(ModuleType.GD_DISCUSSION),
      planName: usageData?.planName,
      limit: usageData?.limit
    },
    {
      type: ModuleType.GD_COACH,
      title: 'GD Coach',
      description: 'Step-by-step GD training from beginner to advanced. Learn roles, strategies, and leadership skills.',
      icon: GraduationCap,
      color: 'bg-teal-500',
      delay: 'delay-600',
      ...getModuleUsage(ModuleType.GD_COACH),
      planName: usageData?.planName,
      limit: usageData?.limit
    },
    {
      type: ModuleType.VOCABULARY_BOOSTER,
      title: 'Vocabulary Booster',
      description: 'Build interview-ready vocabulary. Learn power words, replacements, and professional phrases.',
      icon: BookA,
      color: 'bg-orange-500',
      delay: 'delay-700',
      ...getModuleUsage(ModuleType.VOCABULARY_BOOSTER),
      planName: usageData?.planName,
      limit: usageData?.limit
    },
    {
      type: ModuleType.CORPORATE_VOICE,
      title: 'Voice Practice',
      description: 'Advanced company voice assessment. Read aloud, listen & repeat, comprehension, and live conversation.',
      icon: PhoneCall,
      color: 'bg-cyan-500',
      delay: 'delay-800',
      isAdvanced: true,
      ...getModuleUsage(ModuleType.CORPORATE_VOICE),
      planName: usageData?.planName,
      limit: usageData?.limit
    },
  ];

  return (
    <div className="space-y-6 md:space-y-8 pb-8">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight">Select Training Module</h1>
        <p className="text-slate-300 mt-2 text-base md:text-lg leading-relaxed">Choose where you want to focus today. Your AI coach is ready.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((m) => (
          <ModuleCard key={m.type} {...m} />
        ))}
      </div>
    </div>
  );
};

export default LearningPath;