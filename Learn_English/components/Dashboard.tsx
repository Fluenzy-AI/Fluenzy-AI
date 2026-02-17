
import React, { useState } from 'react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
// Fix: Added missing icon imports MessageSquare and Mic2 from lucide-react to resolve "Cannot find name" errors on lines 135 and 152
import { 
  Trophy, 
  Target, 
  Award,
  ChevronRight,
  Clock,
  Mail,
  User,
  Zap,
  CheckCircle2,
  TrendingUp,
  BrainCircuit,
  Microscope,
  Cpu,
  X,
  Calendar,
  Briefcase,
  History,
  FileText,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  BarChart3,
  Timer,
  BookOpen,
  MessageSquare,
  Mic2
} from 'lucide-react';
import { UserProfile, SessionRecord } from '../types';

const data = [
  { name: 'Mon', score: 65, vocab: 40 },
  { name: 'Tue', score: 70, vocab: 45 },
  { name: 'Wed', score: 68, vocab: 50 },
  { name: 'Thu', score: 75, vocab: 55 },
  { name: 'Fri', score: 82, vocab: 65 },
  { name: 'Sat', score: 80, vocab: 70 },
  { name: 'Sun', score: 88, vocab: 75 },
];

const SessionDetailModal = ({ session, onClose }: { session: SessionRecord, onClose: () => void }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        {/* Modal Header */}
        <div className="px-10 py-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 text-white rounded-2xl">
              <History size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Full Session Analysis</h2>
              <p className="text-slate-500 font-medium text-sm flex items-center gap-2">
                <Calendar size={14} /> {session.date} • {session.type.replace(/_/g, ' ')}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-200 rounded-full transition-all">
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-10 space-y-12 scrollbar-hide">
          
          {/* 1. Overview & Result Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="col-span-1 md:col-span-2 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Company & Role</p>
                    <p className="font-bold text-slate-900">{session.company || 'Global Learning'}</p>
                    <p className="text-sm text-slate-500 font-medium">{session.role || 'Career Development'}</p>
                 </div>
                 <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Session Info</p>
                    <p className="font-bold text-slate-900">{session.type.replace(/_/g, ' ')}</p>
                    <p className="text-sm text-slate-500 font-medium">Duration: ~15 mins</p>
                 </div>
              </div>
              <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white flex items-center justify-between shadow-xl shadow-blue-100 relative overflow-hidden">
                 <div className="relative z-10">
                    <h3 className="text-4xl font-black tracking-tight">{session.score}%</h3>
                    <p className="text-blue-100 font-bold uppercase tracking-widest text-xs mt-1">Final Performance Score</p>
                 </div>
                 <div className="relative z-10 text-right">
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest bg-white ${
                      session.resultStatus === 'Selected' ? 'text-emerald-600' : session.resultStatus === 'Rejected' ? 'text-rose-600' : 'text-amber-600'
                    }`}>
                       {session.resultStatus || 'N/A'}
                    </div>
                    <p className="text-blue-100 font-medium text-xs mt-2">Status Decision</p>
                 </div>
                 <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
              </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white space-y-6">
               <h3 className="font-black uppercase tracking-widest text-xs text-blue-400">Behavioral Analytics</h3>
               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-300">
                      <Timer size={14} /> Response Speed
                    </div>
                    <span className="text-sm font-black text-white">Ideal</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-300">
                      <BarChart3 size={14} /> Avg. Answer Length
                    </div>
                    <span className="text-sm font-black text-white">2.4 mins</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-300">
                      <Briefcase size={14} /> Industry Fit
                    </div>
                    <span className="text-sm font-black text-emerald-400">HIGH</span>
                  </div>
               </div>
            </div>
          </div>

          {/* 2. Conversation Timeline & Q&A */}
          <div className="space-y-8">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-slate-100 rounded-xl text-slate-600"><MessageSquare size={18} /></div>
               <h3 className="text-xl font-black text-slate-900">Step-by-Step Performance Log</h3>
            </div>
            
            <div className="space-y-8">
              {(session.qaPairs && session.qaPairs.length > 0) ? session.qaPairs.map((qa, idx) => (
                <div key={idx} className="bg-white border border-slate-100 rounded-[3rem] overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-8 bg-slate-50 border-b border-slate-100 flex items-start gap-4">
                    <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">{idx + 1}</div>
                    <div>
                      <p className="font-black text-slate-800 text-lg leading-tight">{qa.question}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">AI INTERROGATION</p>
                    </div>
                  </div>
                  <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-4">
                       <div className="flex items-center gap-2 text-blue-600 font-black uppercase text-[10px] tracking-widest">
                          <Mic2 size={12} /> Your Verbal Response
                       </div>
                       <p className="text-sm text-slate-600 leading-relaxed font-medium bg-slate-50/50 p-6 rounded-2xl border border-slate-50">
                          "{qa.answer}"
                       </p>
                    </div>
                    <div className="space-y-4">
                       <div className="flex items-center gap-2 text-emerald-600 font-black uppercase text-[10px] tracking-widest">
                          <CheckCircle2 size={12} /> Ideal HR Response
                       </div>
                       <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100">
                          <p className="text-sm text-emerald-900 font-bold leading-relaxed">
                            {qa.ideal}
                          </p>
                          <div className="mt-4 pt-4 border-t border-emerald-100/50">
                             <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mb-1">Coach Insight</p>
                             <p className="text-xs text-emerald-800/80 font-medium">This answer emphasizes high ownership and cross-functional leadership, which is what {session.company || 'top employers'} look for.</p>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="p-10 border-2 border-dashed border-slate-100 rounded-[2.5rem] text-center">
                   <p className="text-slate-400 font-medium italic">No step-by-step logs available for this session type.</p>
                </div>
              )}
            </div>
          </div>

          {/* 3. Mistakes & Action Plan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="bg-rose-50 p-10 rounded-[3rem] border border-rose-100 space-y-6">
                <div className="flex items-center gap-3 text-rose-600">
                   <AlertCircle size={24} />
                   <h3 className="text-xl font-black">Identified Gaps</h3>
                </div>
                <div className="space-y-4">
                   <div className="flex gap-4">
                      <div className="p-1 rounded bg-rose-200 text-rose-600 h-fit mt-1"><X size={12} /></div>
                      <div>
                         <p className="text-sm font-black text-rose-900">Sentence Structuring</p>
                         <p className="text-xs text-rose-800/70 font-medium mt-1">Occasional use of fillers like 'um' and 'actually' during technical explanation.</p>
                      </div>
                   </div>
                   <div className="flex gap-4">
                      <div className="p-1 rounded bg-rose-200 text-rose-600 h-fit mt-1"><X size={12} /></div>
                      <div>
                         <p className="text-sm font-black text-rose-900">Resume Depth</p>
                         <p className="text-xs text-rose-800/70 font-medium mt-1">Failed to quantify results for the migration project mentioned in section 2.</p>
                      </div>
                   </div>
                </div>
             </div>

             <div className="bg-emerald-50 p-10 rounded-[3rem] border border-emerald-100 space-y-6">
                <div className="flex items-center gap-3 text-emerald-600">
                   <ThumbsUp size={24} />
                   <h3 className="text-xl font-black">Actionable Roadmap</h3>
                </div>
                <div className="space-y-4">
                   <div className="flex gap-4">
                      <div className="p-1 rounded bg-emerald-200 text-emerald-600 h-fit mt-1"><ChevronRight size={12} /></div>
                      <div>
                         <p className="text-sm font-black text-emerald-900">Review English Lesson B4</p>
                         <p className="text-xs text-emerald-800/70 font-medium mt-1">Focus on advanced sentence connectors to reduce filler usage.</p>
                      </div>
                   </div>
                   <div className="flex gap-4">
                      <div className="p-1 rounded bg-emerald-200 text-emerald-600 h-fit mt-1"><ChevronRight size={12} /></div>
                      <div>
                         <p className="text-sm font-black text-emerald-900">Practice STAR Method</p>
                         <p className="text-xs text-emerald-800/70 font-medium mt-1">Use the STAR module to refine your 'difficult challenge' answer.</p>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-10 py-8 bg-white border-t border-slate-100 flex justify-end gap-4">
           <button 
             onClick={onClose}
             className="px-8 py-4 font-black uppercase text-[10px] tracking-widest text-slate-500 hover:text-slate-900 transition-colors"
           >
             Close Report
           </button>
           <button className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">
             Retry This Topic
           </button>
        </div>
      </div>
    </div>
  );
};

const ScoreCard = ({ title, value, label, icon: Icon, color, suffix = "%" }: any) => (
  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between">
    <div className="flex items-start justify-between">
      <div className={`p-3 rounded-2xl ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}>
        <Icon size={24} />
      </div>
      <div className="bg-slate-50 px-3 py-1 rounded-full">
        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Metric</span>
      </div>
    </div>
    <div className="mt-6">
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-black text-slate-900">{value}</span>
        <span className="text-slate-400 font-bold">{suffix}</span>
      </div>
      <h3 className="text-slate-500 text-sm font-semibold mt-1">{title}</h3>
    </div>
    <div className="mt-4 flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color.replace('bg-', 'bg-')}`} style={{ width: `${value}%` }}></div>
      </div>
      <span className="text-[10px] font-bold text-slate-400">{label}</span>
    </div>
  </div>
);

const ActivityItem: React.FC<{ record: SessionRecord; onClick: () => void }> = ({ record, onClick }) => (
  <div 
    onClick={onClick}
    className="flex items-center justify-between py-4 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors px-4 rounded-2xl group cursor-pointer"
  >
    <div className="flex items-center gap-4">
      <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
        <Clock size={18} />
      </div>
      <div>
        <h4 className="font-bold text-slate-800 text-sm truncate max-w-[150px]">{record.topic || record.type.replace(/_/g, ' ')}</h4>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{record.date}</p>
      </div>
    </div>
    <div className="flex items-center gap-6">
      <div className="text-right">
        <p className="text-sm font-black text-slate-900">{record.score}%</p>
        <p className={`text-[10px] uppercase tracking-widest font-black ${
          record.resultStatus === 'Selected' ? 'text-emerald-500' : 'text-slate-400'
        }`}>
          {record.resultStatus || 'Complete'}
        </p>
      </div>
      <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
    </div>
  </div>
);

const Dashboard: React.FC<{ user: UserProfile; isAnalyticsView?: boolean }> = ({ user, isAnalyticsView }) => {
  const [selectedSession, setSelectedSession] = useState<SessionRecord | null>(null);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {selectedSession && (
        <SessionDetailModal 
          session={selectedSession} 
          onClose={() => setSelectedSession(null)} 
        />
      )}

      {/* Header & User Identity */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-blue-600 to-indigo-600 p-0.5 shadow-xl shadow-blue-100">
            <div className="w-full h-full bg-white rounded-[1.4rem] flex items-center justify-center overflow-hidden">
               {user.picture ? (
                 <img 
                   src={user.picture} 
                   alt={user.name} 
                   className="w-full h-full object-cover" 
                   referrerPolicy="no-referrer"
                 />
               ) : (
                 <User className="text-blue-600" size={32} />
               )}
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Welcome back, {user.name.split(' ')[0]} 👋</h1>
            <div className="flex items-center gap-4 mt-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold bg-slate-100 px-3 py-1 rounded-full">
                <Mail size={12} className="text-slate-400" />
                {user.email}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-blue-600 font-bold bg-blue-50 px-3 py-1 rounded-full">
                <Target size={12} />
                {user.careerGoal}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-100 px-5 py-2.5 rounded-2xl flex items-center gap-3 shadow-sm">
            <div className="bg-amber-100 p-2 rounded-xl text-amber-600">
              <Trophy size={18} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">Status</p>
              <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Interview Ready</p>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <div className="md:col-span-1 lg:col-span-1 bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[2.5rem] text-white shadow-2xl flex flex-col justify-between">
           <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Profile Summary</p>
              <h2 className="text-2xl font-black mb-6">Your Track</h2>
              <div className="space-y-4">
                 <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target Role</p>
                    <p className="text-sm font-bold">{user.jobRole}</p>
                 </div>
                 <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Experience</p>
                    <p className="text-sm font-bold">{user.experienceLevel}</p>
                 </div>
                 <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">English Level</p>
                    <p className="text-sm font-bold flex items-center gap-2">
                       {user.proficiency}
                       <CheckCircle2 size={14} className="text-emerald-400" />
                    </p>
                 </div>
              </div>
           </div>
           <button className="mt-8 bg-blue-600 hover:bg-blue-700 w-full py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all flex items-center justify-center gap-2">
              Update Profile
              <ChevronRight size={14} />
           </button>
        </div>

        {/* Dynamic Performance Metrics */}
        <ScoreCard 
          title="English Speaking" 
          value={user.scores.englishSpeaking} 
          label="Fluent" 
          icon={Award} 
          color="bg-indigo-500" 
        />
        <ScoreCard 
          title="Grammar Accuracy" 
          value={user.scores.grammarAccuracy} 
          label="Good" 
          icon={TrendingUp} 
          color="bg-emerald-500" 
        />
        <ScoreCard 
          title="HR Readiness" 
          value={user.scores.hrInterview} 
          label="Needs Work" 
          icon={Target} 
          color="bg-pink-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Analytics Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8">
             <div className="flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100">
                <BrainCircuit size={14} className="text-blue-600" />
                <span className="text-[10px] font-black uppercase text-blue-700">AI Trends</span>
             </div>
          </div>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-black text-slate-900">Performance Over Time</h2>
              <p className="text-sm text-slate-500 font-medium">Tracking Confidence and Vocabulary growth</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', fontSize: '12px', padding: '12px' }}
                />
                <Area type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorScore)" />
                <Area type="monotone" dataKey="vocab" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Session History Section */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-slate-900">Session History</h2>
            <div className="p-2 bg-slate-50 rounded-xl text-slate-400">
               <Microscope size={18} />
            </div>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto pr-2 scrollbar-hide max-h-[400px]">
            {user.history.length > 0 ? (
              user.history.map((record) => (
                <ActivityItem key={record.id} record={record} onClick={() => setSelectedSession(record)} />
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-100 rounded-[2rem]">
                 <div className="bg-slate-50 p-4 rounded-full mb-4">
                    <Clock size={32} className="text-slate-200" />
                 </div>
                 <p className="text-slate-400 text-sm font-bold">No sessions yet. Start training!</p>
              </div>
            )}
          </div>
          <button className="w-full mt-8 py-4 border-2 border-slate-100 text-slate-600 font-bold rounded-[1.5rem] hover:bg-slate-50 transition-all text-xs tracking-widest uppercase">
            View Deep Analysis
          </button>
        </div>
      </div>

      {/* Final Detailed Scores Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
         <div className="bg-white p-6 rounded-[2rem] border border-slate-100 text-center">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">Technical Core</p>
            <p className="text-2xl font-black text-slate-900">{user.scores.technicalInterview}%</p>
         </div>
         <div className="bg-white p-6 rounded-[2rem] border border-slate-100 text-center">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">Pronunciation</p>
            <p className="text-2xl font-black text-slate-900">{user.scores.pronunciation}%</p>
         </div>
         <div className="bg-white p-6 rounded-[2rem] border border-slate-100 text-center">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">Self Confidence</p>
            <p className="text-2xl font-black text-slate-900">{user.scores.confidence}%</p>
         </div>
         <div className="bg-white p-6 rounded-[2rem] border border-slate-100 text-center">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">Overall Rank</p>
            <p className="text-2xl font-black text-blue-600 tracking-tighter">ELITE</p>
         </div>
      </div>
    </div>
  );
};

export default Dashboard;
