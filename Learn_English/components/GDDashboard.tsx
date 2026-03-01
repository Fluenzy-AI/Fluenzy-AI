
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Users, 
  Target, 
  Building2, 
  Zap, 
  ArrowRight,
  ShieldCheck,
  PlusCircle,
  Cpu,
  Globe,
  MessageSquare,
  Sparkles,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { ModuleType, GDRole } from '../types';

const COMPANIES = [
  { id: 'google', name: 'Google' },
  { id: 'amazon', name: 'Amazon' },
  { id: 'microsoft', name: 'Microsoft' },
  { id: 'meta', name: 'Meta' },
  { id: 'apple', name: 'Apple' },
  { id: 'netflix', name: 'Netflix' },
];

const GD_ROLES = [
  { 
    id: GDRole.INITIATOR, 
    title: 'Initiator (Starter)', 
    desc: 'GD ki shuruaat karta hai. Topic ka short intro aur definition deta hai.', 
    color: 'bg-blue-500'
  },
  { 
    id: GDRole.INFO_PROVIDER, 
    title: 'Information Provider', 
    desc: 'Facts, data, aur real-life examples laata hai. Bolna kam, points solid.', 
    color: 'bg-indigo-500'
  },
  { 
    id: GDRole.ANALYZER, 
    title: 'Analyzer', 
    desc: 'Topic ko deep me le jaata hai. Pros-cons aur logic dikhata hai.', 
    color: 'bg-emerald-500'
  },
  { 
    id: GDRole.MODERATOR, 
    title: 'Moderator / Facilitator', 
    desc: 'Sabko chance dena, fight shant karna, topic track par rakhna.', 
    color: 'bg-amber-500'
  },
  { 
    id: GDRole.SUPPORTER, 
    title: 'Supporter', 
    desc: 'Building on others points. Shows team spirit and active listening.', 
    color: 'bg-sky-500'
  },
  { 
    id: GDRole.CHALLENGER, 
    title: 'Challenger (Disagreer)', 
    desc: 'Respectfully opposite view rakhta hai. Politeness is key.', 
    color: 'bg-rose-500'
  },
  { 
    id: GDRole.CONCLUDER, 
    title: 'Summarizer / Concluder', 
    desc: 'End me GD ka balanced summary aur final take deta hai.', 
    color: 'bg-purple-500'
  }
];

const GDDashboard: React.FC = () => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState({
    size: 5,
    company: 'Google',
    intensity: 'Moderate',
    topicMode: 'Company-Based',
    customTopic: '',
    role: GDRole.INITIATOR
  });

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const startGD = () => {
    router.push(`/train/session/${ModuleType.GD_DISCUSSION}?config=${encodeURIComponent(JSON.stringify({
      ...config,
      lessonTitle: `GD Session: ${config.topicMode} as ${config.role}`,
      difficulty: config.intensity
    }))}`);
  };

  return (
    <div className="max-w-5xl mx-auto px-3 py-4 md:px-4 md:py-8 space-y-4 md:space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        {step > 1 ? (
          <button
            onClick={prevStep}
            className="flex items-center gap-2 text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors"
          >
            <ArrowLeft size={16} />
            Previous Step
          </button>
        ) : <div />}
        <div className="flex gap-1.5 md:gap-2">
          {[1, 2, 3, 4, 5].map(s => (
            <div key={s} className={`h-1.5 w-8 md:w-16 rounded-full transition-all duration-500 ${step >= s ? 'bg-purple-600' : 'bg-slate-100'}`}></div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl md:rounded-[4rem] border border-slate-100 shadow-2xl overflow-hidden flex flex-col relative">
        {/* Step 1: Discussion Size */}
        {step === 1 && (
          <div className="p-4 md:p-8 lg:p-16 space-y-6 md:space-y-12 flex-1 animate-in slide-in-from-right-4 duration-500">
            <div className="text-center space-y-2 md:space-y-4">
              <h2 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight">Discussion Size</h2>
              <p className="text-slate-500 font-medium text-sm md:text-lg">Choose total participants. HR Manager is extra.</p>
            </div>
            
            <div className="grid grid-cols-5 gap-2 md:gap-6 mx-auto w-full max-w-2xl">
               {[3, 4, 5, 6, 8].map(sz => (
                 <button 
                    key={sz}
                    onClick={() => setConfig({ ...config, size: sz })}
                    className={`group flex flex-col items-center justify-center gap-2 md:gap-4 py-4 md:py-8 rounded-2xl md:rounded-[2.5rem] border-2 transition-all duration-300 ${
                      config.size === sz ? 'border-purple-600 bg-purple-50 shadow-xl shadow-purple-100 scale-105' : 'border-slate-100 bg-white hover:border-slate-200'
                    }`}
                 >
                    <div className={`transition-all duration-300 ${config.size === sz ? 'text-purple-600 scale-110' : 'text-slate-200'}`}>
                      <Users size={24} className="md:w-10 md:h-10" />
                    </div>
                    <div className="text-center">
                      <p className="text-xl md:text-4xl font-black text-slate-900 leading-none">{sz}</p>
                      <p className="hidden md:block text-[11px] font-black uppercase text-slate-400 tracking-widest mt-2">Team</p>
                    </div>
                 </button>
               ))}
            </div>

            <div className="bg-blue-50/50 px-4 py-3 md:p-8 rounded-2xl md:rounded-3xl flex items-center gap-3 md:gap-6 max-w-2xl mx-auto border border-blue-100/30">
               <div className="w-8 h-8 md:w-12 md:h-12 bg-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-xl shrink-0">
                  <Target size={16} className="md:w-6 md:h-6" />
               </div>
               <p className="text-sm md:text-base text-blue-900/70 font-bold">
                 You + {config.size - 1} AI agents + 1 HR Moderator.
               </p>
            </div>

            <div className="flex justify-center pt-2 md:pt-8">
               <button onClick={nextStep} className="group bg-slate-900 text-white px-8 py-4 md:px-20 md:py-6 rounded-2xl md:rounded-[2.5rem] font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-xl flex items-center gap-3">
                 Continue <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
               </button>
            </div>
          </div>
        )}

        {/* Step 2: Environment */}
        {step === 2 && (
          <div className="p-4 md:p-8 lg:p-16 space-y-6 md:space-y-12 flex-1 animate-in slide-in-from-right-4 duration-500">
             <div className="text-center space-y-2 md:space-y-4">
              <h2 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight">Environment</h2>
              <p className="text-slate-500 font-medium text-sm md:text-lg">Simulate top MNC culture and discussion style.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-16 max-w-3xl mx-auto items-end">
               <div className="space-y-4">
                  <label className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] px-2">Target Company</label>
                  <div className="relative">
                    <Building2 className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <select 
                      value={config.company}
                      onChange={(e) => setConfig({ ...config, company: e.target.value })}
                      className="w-full bg-slate-50 border-0 rounded-[2rem] pl-16 pr-8 py-6 font-black text-slate-800 focus:ring-4 focus:ring-purple-100 outline-none transition-all appearance-none cursor-pointer"
                    >
                      {COMPANIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
               </div>
               <div className="space-y-4">
                  <label className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] px-2">GD Intensity</label>
                  <div className="bg-slate-50 p-2 rounded-[2rem] flex gap-2">
                     {['Calm', 'Moderate', 'Aggressive'].map(int => (
                       <button 
                         key={int}
                         onClick={() => setConfig({ ...config, intensity: int })}
                         className={`flex-1 py-4 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest transition-all ${
                           config.intensity === int ? 'bg-purple-600 text-white shadow-xl shadow-purple-100' : 'text-slate-400 hover:bg-white hover:shadow-sm'
                         }`}
                       >
                         {int}
                       </button>
                     ))}
                  </div>
               </div>
            </div>

            <div className="flex justify-center pt-4 md:pt-12">
               <button onClick={nextStep} className="group bg-slate-900 text-white px-8 py-4 md:px-20 md:py-6 rounded-2xl md:rounded-[2.5rem] font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-xl flex items-center gap-3">
                 Topic Config <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
               </button>
            </div>
          </div>
        )}

        {/* Step 3: Topic Configuration */}
        {step === 3 && (
          <div className="p-4 md:p-8 lg:p-16 space-y-6 md:space-y-12 flex-1 animate-in slide-in-from-right-4 duration-500">
             <div className="text-center space-y-2 md:space-y-4">
              <h2 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight">Topic Configuration</h2>
              <p className="text-slate-500 font-medium text-sm md:text-lg">How should the HR Manager pick the topic?</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 max-w-4xl mx-auto">
               {[
                 { id: 'Company-Based', icon: Building2, desc: 'Known round topics from target MNC.', color: 'text-blue-500 bg-blue-50' },
                 { id: 'Random-Based', icon: Globe, desc: 'AI chooses current affairs topic.', color: 'text-emerald-500 bg-emerald-50' },
                 { id: 'Custom-Based', icon: PlusCircle, desc: 'Provide your own specific topic.', color: 'text-amber-500 bg-amber-50' }
               ].map(m => (
                 <button 
                    key={m.id}
                    onClick={() => setConfig({ ...config, topicMode: m.id })}
                    className={`p-5 md:p-10 rounded-2xl md:rounded-[3rem] border-2 flex flex-row md:flex-col items-center md:text-center gap-4 md:gap-6 transition-all duration-300 ${
                      config.topicMode === m.id ? 'border-purple-600 bg-purple-50 shadow-xl scale-[1.02]' : 'border-slate-100 bg-white hover:border-slate-200'
                    }`}
                 >
                    <div className={`p-3 md:p-6 rounded-xl md:rounded-[1.5rem] shrink-0 transition-all duration-300 ${config.topicMode === m.id ? 'bg-purple-600 text-white shadow-xl' : m.color}`}>
                       <m.icon size={20} className="md:w-8 md:h-8" />
                    </div>
                    <div className="text-left md:text-center">
                      <p className="font-black text-slate-900 text-base md:text-xl leading-tight">{m.id}</p>
                      <p className="text-xs text-slate-400 font-bold leading-relaxed mt-1 md:mt-2 md:uppercase md:tracking-widest">{m.desc}</p>
                    </div>
                 </button>
               ))}
            </div>

            {config.topicMode === 'Custom-Based' && (
              <div className="max-w-xl mx-auto animate-in zoom-in-95 duration-500">
                 <div className="relative">
                   <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                   <input 
                     placeholder="Enter discussion topic..."
                     className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl md:rounded-[2rem] pl-10 md:pl-16 pr-4 py-3 md:py-6 font-bold text-slate-800 outline-none focus:border-purple-300 transition-all shadow-sm text-sm md:text-base"
                     value={config.customTopic}
                     onChange={(e) => setConfig({ ...config, customTopic: e.target.value })}
                   />
                 </div>
              </div>
            )}

            <div className="flex justify-center pt-2 md:pt-8">
               <button 
                 onClick={nextStep} 
                 disabled={config.topicMode === 'Custom-Based' && !config.customTopic}
                 className={`group bg-slate-900 text-white px-8 py-4 md:px-20 md:py-6 rounded-2xl md:rounded-[2.5rem] font-black uppercase tracking-widest text-xs shadow-xl transition-all flex items-center gap-3 ${
                   config.topicMode === 'Custom-Based' && !config.customTopic ? 'opacity-30 cursor-not-allowed' : 'hover:bg-black'
                 }`}
               >
                 Role Selection <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
               </button>
            </div>
          </div>
        )}

        {/* NEW Step 4: Role Selection */}
        {step === 4 && (
          <div className="p-4 md:p-8 lg:p-16 space-y-6 md:space-y-10 flex-1 animate-in slide-in-from-right-4 duration-500 overflow-y-auto scrollbar-hide">
            <div className="text-center space-y-2 md:space-y-4">
              <h2 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight">Your Targeted Role</h2>
              <p className="text-slate-500 font-medium text-sm md:text-lg">Select which role you want to master in this GD.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 max-w-5xl mx-auto">
              {GD_ROLES.map(role => (
                <button 
                  key={role.id}
                  onClick={() => setConfig({ ...config, role: role.id })}
                  className={`p-4 md:p-8 rounded-xl md:rounded-[2.5rem] border-2 flex flex-row md:flex-col items-center md:items-start text-left gap-3 md:gap-4 transition-all duration-300 ${
                    config.role === role.id ? 'border-purple-600 bg-purple-50 shadow-lg scale-[1.02]' : 'border-slate-100 bg-white hover:border-slate-200 shadow-sm'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${role.color}`}>
                    {config.role === role.id ? <CheckCircle2 size={24} /> : <Sparkles size={24} />}
                  </div>
                  <div>
                    <p className="font-black text-slate-900 text-lg leading-tight">{role.title}</p>
                    <p className="text-xs text-slate-500 font-bold mt-2 leading-relaxed">{role.desc}</p>
                  </div>
                </button>
              ))}
            </div>

                  <div className="max-w-4xl mx-auto mt-4 md:mt-12 bg-rose-50 p-4 md:p-8 rounded-2xl md:rounded-[2.5rem] border border-rose-100">
               <div className="flex items-center gap-3 text-rose-600 mb-3 md:mb-4">
                  <AlertTriangle size={20} />
                  <h4 className="font-black uppercase tracking-widest text-xs md:text-sm">Roles to Avoid (Negative)</h4>
               </div>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                  {[
                    { title: 'Aggressor', desc: 'Chillana, dominate karna.' },
                    { title: 'Silent Spectator', desc: 'Bilkul nahi bolna.' },
                    { title: 'Distractor', desc: 'Topic se bhatakana.' },
                    { title: 'Over-smart', desc: 'Fake data, zyada gyaan.' }
                  ].map((neg, i) => (
                    <div key={i} className="space-y-1">
                      <p className="text-xs font-black text-rose-900">{neg.title}</p>
                      <p className="text-[10px] text-rose-800/70 font-bold leading-tight">{neg.desc}</p>
                    </div>
                  ))}
               </div>
            </div>

            <div className="flex justify-center pt-4 md:pt-10">
               <button onClick={nextStep} className="group bg-slate-900 text-white px-8 py-4 md:px-20 md:py-6 rounded-2xl md:rounded-[2.5rem] font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-xl flex items-center gap-3">
                 Mission Briefing <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
               </button>
            </div>
          </div>
        )}

        {/* Step 5: Mission Briefing */}
        {step === 5 && (
          <div className="p-4 md:p-8 lg:p-16 space-y-6 md:space-y-12 flex-1 animate-in slide-in-from-right-4 duration-500">
             <div className="text-center space-y-2 md:space-y-4">
              <h2 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight">Mission Briefing</h2>
              <p className="text-slate-500 font-medium text-sm md:text-lg">Prepare for the {config.size}-way simulation.</p>
            </div>

            <div className="max-w-2xl mx-auto bg-slate-50 p-5 md:p-12 rounded-2xl md:rounded-[3.5rem] border border-slate-100 space-y-6 md:space-y-10 shadow-inner">
               <div className="grid grid-cols-2 gap-x-6 gap-y-6 md:gap-x-12 md:gap-y-10">
                  <div className="space-y-2">
                     <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Track</p>
                     <p className="font-black text-slate-900 text-lg flex items-center gap-3"><Building2 size={20} className="text-purple-600" /> {config.company} Round</p>
                  </div>
                  <div className="space-y-2">
                     <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Intensity</p>
                     <p className="font-black text-slate-900 text-lg flex items-center gap-3"><Cpu size={20} className="text-purple-600" /> {config.intensity} Style</p>
                  </div>
                  <div className="space-y-2">
                     <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Participants</p>
                     <p className="font-black text-slate-900 text-lg flex items-center gap-3"><Users size={20} className="text-purple-600" /> {config.size} Total</p>
                  </div>
                  <div className="space-y-2">
                     <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Your Role</p>
                     <p className="font-black text-slate-900 text-lg flex items-center gap-3"><ShieldCheck size={20} className="text-purple-600" /> {config.role}</p>
                  </div>
               </div>
               
               <div className="p-4 md:p-8 bg-white rounded-xl md:rounded-[2rem] border border-slate-200 text-xs md:text-sm text-slate-500 leading-relaxed font-bold italic shadow-sm relative overflow-hidden">
                 <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-purple-600"></div>
                 "HR Manager will start the session. You must speak ONLY in English. Jump in during pauses or interject politely."
               </div>
            </div>

            <div className="flex justify-center pt-2 md:pt-8">
               <button 
                 onClick={startGD}
                 className="bg-purple-600 text-white px-10 py-4 md:px-24 md:py-7 rounded-2xl md:rounded-[2.5rem] font-black uppercase tracking-[0.15em] md:tracking-[0.3em] text-sm shadow-xl shadow-purple-200 hover:bg-purple-700 transition-all active:scale-95"
               >
                 Launch GD Room
               </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-slate-900 rounded-2xl md:rounded-[4rem] p-5 md:p-16 text-white relative overflow-hidden shadow-2xl border border-white/5">
         <div className="relative z-10 space-y-3 md:space-y-6">
            <div className="flex items-center gap-2 bg-white/10 w-fit px-3 py-1.5 rounded-full border border-white/10">
               <Zap size={14} className="text-amber-400 fill-amber-400" />
               <span className="text-[10px] font-black uppercase tracking-widest">Live Concurrency Sync Ready</span>
            </div>
            <h3 className="text-xl md:text-4xl font-black tracking-tight leading-tight">Multi-Speaker AI Architecture</h3>
            <p className="text-slate-400 max-w-xl font-medium text-sm md:text-lg leading-relaxed">Our AI engine handles distinct candidate personalities while HR Moderator evaluates your leadership and communication in real-time.</p>
         </div>
         <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
      </div>
    </div>
  );
};

export default GDDashboard;