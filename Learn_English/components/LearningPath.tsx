import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
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

const PathModuleCard = ({ index, type, title, description, icon: Icon, color, delay, isAdvanced, canUse, remaining, isLocked, planName, limit, isLast }: any) => {
  const router = useRouter();

  const handleStart = () => {
    if (isLocked) return;
    const pathMap: Record<string, string> = {
      [ModuleType.ENGLISH_LEARNING]: '/train/english',
      [ModuleType.HR_INTERVIEW]: '/train/hr',
      [ModuleType.GD_COACH]: '/train/gd-coach',
      [ModuleType.GD_DISCUSSION]: '/train/gd',
      [ModuleType.TECH_INTERVIEW]: '/train/technical',
      [ModuleType.COMPANY_WISE_HR]: '/train/company',
    };
    router.push(pathMap[type] || `/train/session/${type}`);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="relative flex items-center group"
    >
      {/* Step Indicator Sidebar (Desktop) */}
      <div className="absolute left-[-80px] top-0 bottom-0 w-20 hidden lg:flex flex-col items-center">
        <div className={`w-12 h-12 rounded-2xl bg-slate-900 border-2 ${isLocked ? 'border-slate-800' : 'border-purple-500/50 group-hover:border-purple-500'} flex flex-col items-center justify-center transition-all duration-500 z-20 shadow-2xl overflow-hidden group`}>
          <span className={`text-[10px] font-black uppercase tracking-tighter ${isLocked ? 'text-slate-600' : 'text-purple-400'}`}>Step</span>
          <span className={`text-lg font-black leading-none ${isLocked ? 'text-slate-700' : 'text-white'}`}>{index + 1}</span>
          
          {/* Internal Pulse for Active Step */}
          {!isLocked && (
            <div className="absolute inset-0 bg-purple-500/5 animate-pulse" />
          )}
        </div>
        
        {!isLast && (
          <div className="relative flex-grow w-1 my-4">
             {/* Base line */}
             <div className="absolute inset-0 bg-slate-800 rounded-full" />
             {/* Animated gradient line */}
             <motion.div 
               initial={{ height: 0 }}
               whileInView={{ height: '100%' }}
               viewport={{ once: true }}
               transition={{ duration: 1, delay: index * 0.2 }}
               className="absolute inset-0 bg-gradient-to-b from-purple-500 to-transparent rounded-full shadow-[0_0_15px_rgba(168,85,247,0.4)]"
             />
          </div>
        )}
      </div>

      <motion.div
        whileHover={{ scale: 1.01, y: -4 }}
        onClick={handleStart}
        className={`flex-grow bg-slate-900/40 backdrop-blur-2xl rounded-[2.5rem] p-6 lg:p-8 border ${isLocked ? 'border-white/5 opacity-60' : 'border-white/10 hover:border-purple-500/30'} transition-all duration-500 shadow-2xl cursor-pointer relative overflow-hidden group/card`}
      >
        {/* Background Mesh Glow */}
        {!isLocked && (
          <div className={`absolute -right-24 -top-24 w-64 h-64 bg-gradient-to-br ${color} opacity-0 group-hover/card:opacity-10 blur-[80px] transition-opacity duration-700`} />
        )}

        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 relative z-10">
          <div className="relative">
            <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${color} flex items-center justify-center shadow-2xl relative z-10 group-hover/card:scale-110 group-hover/card:rotate-3 transition-transform duration-500`}>
               <Icon size={40} className="text-white drop-shadow-lg" />
            </div>
            {/* Icon shadow glow */}
            <div className={`absolute -inset-4 bg-gradient-to-br ${color} opacity-20 blur-2xl rounded-full group-hover/card:opacity-40 transition-opacity`} />
          </div>

          <div className="flex-grow">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-2xl font-black text-white tracking-tight">{title}</h3>
              {isAdvanced && (
                 <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-widest border border-amber-500/20">Pro</span>
              )}
            </div>
            
            <p className="text-slate-400 text-base leading-relaxed mb-4 max-w-2xl line-clamp-2 lg:line-clamp-none">{description}</p>
            
            <div className="flex flex-wrap items-center gap-4">
              <div className={`flex items-center gap-2 px-4 py-1.5 rounded-xl ${isLocked ? 'bg-red-500/10 border border-red-500/20' : 'bg-green-500/10 border border-green-500/20'} transition-colors`}>
                <div className={`w-2 h-2 rounded-full ${isLocked ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`} />
                <span className={`text-[11px] font-bold uppercase tracking-widest ${isLocked ? 'text-red-400' : 'text-green-400'}`}>
                  {isLocked ? 'Locked' : 'Available'}
                </span>
              </div>

              <div className="flex items-center gap-2 bg-white/5 border border-white/5 px-4 py-1.5 rounded-xl">
                 <Sparkles size={12} className="text-purple-400" />
                 <span className="text-[11px] text-slate-300 font-black uppercase tracking-widest">
                   {remaining === 'Unlimited' || remaining === '∞' ? 'Unlimited' : `${remaining ?? 0} / ${limit || 3}`} Sessions
                 </span>
              </div>
            </div>
          </div>

          <div className="hidden md:flex flex-col items-center gap-2">
            <div className={`w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover/card:bg-purple-600 group-hover/card:border-purple-500 transition-all duration-300`}>
              <ArrowRight className="text-slate-400 group-hover/card:text-white group-hover/card:translate-x-1 transition-all" />
            </div>
          </div>
        </div>

        {/* Decorative corner element */}
        <div className="absolute top-0 right-0 p-2 opacity-10">
          <Icon size={120} className="text-white transform translate-x-1/3 -translate-y-1/3 rotate-12" />
        </div>
      </motion.div>
    </motion.div>
  );
};

const SidebarModuleCard = ({ type, title, icon: Icon, color, isLocked, handleStart }: any) => (
  <motion.div
    whileHover={{ x: 5, scale: 1.02 }}
    onClick={handleStart}
    className={`p-4 rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-white/5 flex items-center gap-4 cursor-pointer hover:bg-white/10 hover:border-white/20 transition-all mb-3 relative overflow-hidden group/side ${isLocked ? 'opacity-50' : ''}`}
  >
    {/* Left Accent Bar */}
    <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${color} opacity-50 group-hover/side:opacity-100 transition-opacity`} />
    
    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0 shadow-lg relative z-10`}>
      <Icon size={20} className="text-white" />
    </div>
    <div className="flex-grow min-w-0 relative z-10">
      <h4 className="text-sm font-bold text-white truncate group-hover/side:text-purple-400 transition-colors">{title}</h4>
      <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black">Bonus Track</span>
    </div>
    {isLocked ? <Lock size={12} className="text-slate-600" /> : <ArrowRight size={14} className="text-slate-700 group-hover/side:text-purple-500 transition-colors" />}
  </motion.div>
);

const LearningPath: React.FC<{ ctaInfo?: any }> = ({ ctaInfo }) => {
  const [usageData, setUsageData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'practice' | 'learning'>('practice');
  const router = useRouter();

  useEffect(() => {
    // Check for tab in URL
    const searchParams = new URLSearchParams(window.location.search);
    const tab = searchParams.get('tab');
    if (tab === 'learning' || tab === 'practice') {
      setActiveTab(tab);
    }
  }, []);

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
    if (!usageData) return { canUse: true, remaining: '...', isLocked: false };
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

  const allModules = [
    {
      type: ModuleType.ENGLISH_LEARNING,
      title: 'English Learning',
      description: 'Master professional English with real-time grammar feedback.',
      icon: BookOpen,
      color: 'from-blue-500 to-indigo-500',
      isPrimary: true,
      ...getModuleUsage(ModuleType.ENGLISH_LEARNING)
    },
    {
      type: ModuleType.HR_INTERVIEW,
      title: 'HR Interview Coach',
      description: 'Ace behavioral questions with seasoned HR simulation.',
      icon: UserPlus,
      color: 'from-pink-500 to-rose-500',
      isPrimary: true,
      ...getModuleUsage(ModuleType.HR_INTERVIEW)
    },
    {
      type: ModuleType.GD_COACH,
      title: 'GD Coach',
      description: 'Step-by-step training from beginner to advanced GD leader.',
      icon: GraduationCap,
      color: 'from-teal-500 to-emerald-500',
      isPrimary: true,
      ...getModuleUsage(ModuleType.GD_COACH)
    },
    {
      type: ModuleType.GD_DISCUSSION,
      title: 'GD Agent',
      description: 'Live Group Discussions with multiple AI participants.',
      icon: Users,
      color: 'from-purple-500 to-indigo-500',
      isPrimary: true,
      ...getModuleUsage(ModuleType.GD_DISCUSSION)
    },
    {
      type: ModuleType.TECH_INTERVIEW,
      title: 'Technical Mastery',
      description: 'Deep-dive into role-based conceptual and logic rounds.',
      icon: Code,
      color: 'from-emerald-500 to-teal-500',
      isPrimary: true,
      ...getModuleUsage(ModuleType.TECH_INTERVIEW)
    },
    {
      type: ModuleType.CONVERSATION_PRACTICE,
      title: 'Daily Conversation',
      icon: MessageSquare,
      color: 'from-sky-500 to-blue-500',
      isPrimary: false,
      ...getModuleUsage(ModuleType.CONVERSATION_PRACTICE)
    },
    {
      type: ModuleType.COMPANY_WISE_HR,
      title: 'Company Tracks',
      description: 'Prepare for FAANG, Startups, or MNCs with curated company HR rounds.',
      icon: Building2,
      color: 'from-amber-500 to-orange-500',
      isPrimary: true,
      ...getModuleUsage(ModuleType.COMPANY_WISE_HR)
    },
    {
      type: ModuleType.VOCABULARY_BOOSTER,
      title: 'Vocabulary Booster',
      icon: BookA,
      color: 'from-orange-500 to-red-500',
      isPrimary: false,
      ...getModuleUsage(ModuleType.VOCABULARY_BOOSTER)
    },
    {
      type: ModuleType.CORPORATE_VOICE,
      title: 'Voice Practice',
      icon: PhoneCall,
      color: 'from-cyan-500 to-blue-500',
      isPrimary: false,
    },
  ];

  const practiceModules = allModules.filter(m => [
    ModuleType.HR_INTERVIEW,
    ModuleType.GD_COACH,
    ModuleType.GD_DISCUSSION,
    ModuleType.TECH_INTERVIEW,
    ModuleType.COMPANY_WISE_HR
  ].includes(m.type));

  const learningModules = allModules.filter(m => ![
    ModuleType.HR_INTERVIEW,
    ModuleType.GD_COACH,
    ModuleType.GD_DISCUSSION,
    ModuleType.TECH_INTERVIEW,
    ModuleType.COMPANY_WISE_HR
  ].includes(m.type));

  const currentModules = activeTab === 'practice' ? practiceModules : learningModules;
  const secondaryModules = activeTab === 'practice' ? learningModules : practiceModules;

  const handleStart = (m: any) => {
    if (m.isLocked) return;
    const pathMap: Record<string, string> = {
      [ModuleType.ENGLISH_LEARNING]: '/train/english',
      [ModuleType.HR_INTERVIEW]: '/train/hr',
      [ModuleType.GD_COACH]: '/train/gd-coach',
      [ModuleType.GD_DISCUSSION]: '/train/gd',
      [ModuleType.TECH_INTERVIEW]: '/train/technical',
      [ModuleType.COMPANY_WISE_HR]: '/train/company',
      [ModuleType.VOCABULARY_BOOSTER]: '/train/vocabulary',
      [ModuleType.CORPORATE_VOICE]: '/train/corporate-voice',
    };
    router.push(pathMap[m.type] || `/train/session/${m.type}`);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-[1400px] mx-auto px-4 lg:px-8">
      {/* Main Path - Modules */}
      <div className="flex-grow order-1 lg:order-1">
        {/* Tab Switcher */}
        <div className="flex items-center p-1.5 bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-2xl w-fit mb-6">
          <button
            onClick={() => setActiveTab('practice')}
            className={`px-8 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'practice' ? 'bg-purple-600 text-white shadow-xl shadow-purple-900/20' : 'text-slate-500 hover:text-white'}`}
          >
            Practice
          </button>
          <button
            onClick={() => setActiveTab('learning')}
            className={`px-8 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'learning' ? 'bg-purple-600 text-white shadow-xl shadow-purple-900/20' : 'text-slate-500 hover:text-white'}`}
          >
            Learning
          </button>
        </div>

        <div className="mb-4 relative">
           <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 mb-3">
              <div className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400">
                {activeTab === 'practice' ? 'Professional Edge' : 'Skill Mastery'} Route
              </span>
           </div>
           
           <h2 className="text-5xl lg:text-7xl font-black text-white mb-3 tracking-tighter leading-none">
             {activeTab === 'practice' ? 'Practice' : 'Learning'} <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Zone</span>
           </h2>
           <p className="text-slate-400 text-lg lg:text-xl leading-relaxed max-w-2xl">
             {activeTab === 'practice' 
               ? 'Simulate real-world scenarios with our specialized AI coaches.' 
               : 'Build your foundation with core communication and vocabulary modules.'}
           </p>

           {/* Decorative background element */}
           <div className="absolute -top-10 -right-10 w-64 h-64 bg-purple-500/5 blur-[100px] -z-10 rounded-full" />
        </div>
        
        <div className="space-y-6 lg:ml-[60px]">
          {currentModules.map((m, index) => (
            <PathModuleCard 
              key={m.type} 
              index={index}
              {...m} 
              isLast={index === currentModules.length - 1}
              limit={usageData?.limit}
              planName={usageData?.planName}
            />
          ))}
        </div>
      </div>

      {/* Sidebar - Secondary Modules (Now on Right for Desktop) */}
      <div className="w-full lg:w-[350px] flex-shrink-0 order-2 lg:order-2">
        <div className="sticky top-20">
          <div className="mb-4">
             <h3 className="text-2xl font-black text-white mb-2">Bonus Tracks</h3>
             <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Supplemental Training</p>
          </div>
          <div className="space-y-4">
            {secondaryModules.map((m) => (
              <SidebarModuleCard 
                key={m.type} 
                {...m} 
                handleStart={() => handleStart(m)}
              />
            ))}
          </div>

          {ctaInfo && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-8 p-6 rounded-[2rem] bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-purple-500/30 shadow-2xl backdrop-blur-xl group/cta"
            >
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30 group-hover/cta:scale-110 transition-transform">
                    <ctaInfo.icon size={24} className="text-purple-400" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-white">{ctaInfo.text}</h4>
                    <p className="text-xs text-slate-400">{ctaInfo.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => router.push(ctaInfo.href)}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-xs font-black transition-all shadow-xl shadow-purple-900/40 hover:shadow-purple-900/60 active:scale-95"
                >
                  {ctaInfo.text}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LearningPath;