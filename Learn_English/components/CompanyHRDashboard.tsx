
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  ArrowLeft, 
  Briefcase, 
  TrendingUp, 
  FileText, 
  ArrowRight,
  Upload,
  CheckCircle2,
  Cpu,
  Link as LinkIcon,
  Plus,
  UserCheck,
  Code2
} from 'lucide-react';
import { ModuleType } from '../types';
import { useTheme } from '../../src/contexts/ThemeContext';

const COMPANIES = [
  { id: 'google', name: 'Google', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg' },
  { id: 'amazon', name: 'Amazon', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg' },
  { id: 'microsoft', name: 'Microsoft', logo: 'https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg' },
  { id: 'meta', name: 'Meta', logo: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg' },
  { id: 'apple', name: 'Apple', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg' },
  { id: 'netflix', name: 'Netflix', logo: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg' },
];

const CompanyHRDashboard: React.FC = () => {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === 'light';
  const [step, setStep] = useState(1);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [selection, setSelection] = useState({
    company: '',
    companyLogo: '',
    customCompany: '',
    customLogoUrl: '',
    role: 'Software Engineer',
    customRole: '',
    experience: 'Fresher',
    difficulty: 'Intermediate',
    roundType: '', // 'PI' or 'Technical'
    resumeText: '',
    fileName: ''
  });

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const startInterview = () => {
    const company = selection.company === 'custom' ? selection.customCompany : selection.company;
    const companyLogo = selection.company === 'custom' ? selection.customLogoUrl : selection.companyLogo;
    const role = selection.role === 'custom' ? selection.customRole : selection.role;
    router.push(`/train/session/${ModuleType.COMPANY_WISE_HR}?company=${encodeURIComponent(company)}&companyLogo=${encodeURIComponent(companyLogo)}&role=${encodeURIComponent(role)}&experience=${encodeURIComponent(selection.experience)}&difficulty=${encodeURIComponent(selection.difficulty)}&roundType=${encodeURIComponent(selection.roundType)}&resumeText=${encodeURIComponent(selection.resumeText)}&isCompanyWise=true`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelection({ ...selection, fileName: file.name });
      setSelection(prev => ({ ...prev, resumeText: `Resume content for ${file.name}. Simulated extraction of skills and projects...` }));
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex-1 flex items-start justify-center w-full max-w-5xl mx-auto">
        <div className="w-full space-y-6 animate-in fade-in duration-500">
          {/* Progress Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <button
              onClick={() => step > 1 ? prevStep() : router.push('/train')}
              className="flex items-center gap-2 text-muted-foreground font-bold text-sm hover:text-foreground transition-colors"
            >
              <ArrowLeft size={16} />
              {step > 1 ? 'Previous Step' : 'Back to Modules'}
            </button>
            <div className="flex gap-2 w-full sm:w-auto">
              {[1, 2, 3, 4, 5].map(s => (
                <div key={s} className={`h-1.5 flex-1 sm:flex-none sm:w-12 rounded-full transition-all ${step >= s ? 'bg-primary' : 'bg-border'}`}></div>
              ))}
            </div>
          </div>

          {/* Main Card */}
          <div className="bg-card/95 backdrop-blur-xl rounded-3xl sm:rounded-[3rem] border border-border shadow-2xl min-h-[500px] flex flex-col">
        {/* Step 1: Company */}
        {step === 1 && (
          <div className="p-6 sm:p-10 lg:p-12 space-y-8 lg:space-y-10 flex-1 animate-in slide-in-from-right-4 duration-300">
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-card-foreground tracking-tight">Select Target Company</h2>
              <p className="text-muted-foreground font-medium text-sm sm:text-base">Choose a company or add a custom one to unlock its specific HR culture.</p>
            </div>
            
            {!showCustomForm ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {COMPANIES.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { 
                      setSelection({ ...selection, company: c.name, companyLogo: c.logo }); 
                      nextStep(); 
                    } }
                    className={`p-8 rounded-3xl border-2 transition-all flex flex-col items-center justify-center gap-4 hover:shadow-lg hover:-translate-y-0.5 ${
                      selection.company === c.name ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10' : 'border-border bg-background/60 hover:border-primary/30'
                    }`}
                  >
                    <img src={c.logo} alt={c.name} className="h-8 object-contain" />
                    <span className="font-bold text-card-foreground">{c.name}</span>
                  </button>
                ))}
                <button 
                  onClick={() => setShowCustomForm(true)}
                  className="p-8 rounded-3xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-4 hover:border-primary/40 hover:bg-primary/5 transition-all group"
                >
                  <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center text-muted-foreground group-hover:bg-primary/15 group-hover:text-primary transition-all">
                    <Plus size={24} />
                  </div>
                  <span className="font-bold text-muted-foreground group-hover:text-primary transition-colors">Add Custom Company</span>
                </button>
              </div>
            ) : (
              <div className="max-w-md mx-auto space-y-6 animate-in zoom-in-95 duration-300">
                <div className="bg-muted/60 p-8 rounded-[2.5rem] border border-border space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-2">Company Name</label>
                    <div className="relative">
                      <div className="absolute top-4 left-4 text-muted-foreground"><Building2 size={18} /></div>
                      <input 
                        placeholder="e.g. Acme Corp"
                        className="w-full bg-card border border-border rounded-2xl px-6 py-4 pl-12 font-bold text-card-foreground outline-none focus:ring-2 focus:ring-primary transition-all"
                        value={selection.customCompany}
                        onChange={(e) => setSelection({ ...selection, customCompany: e.target.value })}
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-2">Logo URL (Optional)</label>
                    <div className="relative">
                      <div className="absolute top-4 left-4 text-muted-foreground"><LinkIcon size={18} /></div>
                      <input 
                        placeholder="https://example.com/logo.png"
                        className="w-full bg-card border border-border rounded-2xl px-6 py-4 pl-12 font-bold text-card-foreground outline-none focus:ring-2 focus:ring-primary transition-all"
                        value={selection.customLogoUrl}
                        onChange={(e) => setSelection({ ...selection, customLogoUrl: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setShowCustomForm(false)}
                      className="flex-1 py-4 font-bold text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => {
                        if(selection.customCompany.trim()) {
                          setSelection({ ...selection, company: 'custom' });
                          nextStep();
                        }
                      }}
                      disabled={!selection.customCompany.trim()}
                      className={`flex-[2] bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 transition-all ${
                        !selection.customCompany.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-110'
                      }`}
                    >
                      Use Custom Company
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Position */}
        {step === 2 && (
          <div className="p-6 sm:p-10 lg:p-12 space-y-8 lg:space-y-10 flex-1 animate-in slide-in-from-right-4 duration-300">
             <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-card-foreground tracking-tight">Position & Level</h2>
              <p className="text-muted-foreground font-medium text-sm sm:text-base">Which role and experience level are you aiming for at <b className="text-card-foreground">{selection.company === 'custom' ? selection.customCompany : selection.company}</b>?</p>
            </div>
            <div className="space-y-8 max-w-lg mx-auto">
               <div className="space-y-3">
                  <label className="text-sm font-black uppercase text-muted-foreground tracking-widest px-2">Job Role</label>
                  <select 
                    value={selection.role}
                    onChange={(e) => setSelection({ ...selection, role: e.target.value })}
                    className="w-full bg-muted/70 border border-border rounded-2xl px-6 py-4 font-bold text-card-foreground focus:ring-2 focus:ring-primary transition-all outline-none"
                  >
                    <option>Software Engineer</option>
                    <option>Data Analyst</option>
                    <option>Data Scientist</option>
                    <option>Product Manager</option>
                    <option>Full Stack Developer</option>
                    <option value="custom">Custom Role...</option>
                  </select>
                  {selection.role === 'custom' && (
                    <input 
                      placeholder="Enter job role..."
                      className="w-full mt-2 bg-muted/70 border border-border rounded-2xl px-6 py-4 font-bold text-card-foreground outline-none focus:ring-2 focus:ring-primary"
                      onChange={(e) => setSelection({ ...selection, customRole: e.target.value })}
                    />
                  )}
               </div>
               <div className="space-y-3">
                  <label className="text-sm font-black uppercase text-muted-foreground tracking-widest px-2">Experience Level</label>
                  <div className="grid grid-cols-2 gap-4">
                    {['Intern', 'Fresher', 'Experienced', 'Managerial'].map(lvl => (
                      <button 
                        key={lvl}
                        onClick={() => setSelection({ ...selection, experience: lvl })}
                        className={`py-4 rounded-2xl font-bold transition-all border-2 ${
                          selection.experience === lvl ? 'border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'border-border bg-muted/50 text-card-foreground hover:border-primary/30'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
               </div>
            </div>
            <div className="flex justify-center pt-8">
               <button onClick={nextStep} className="bg-foreground text-background px-12 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 hover:opacity-90 transition-all">
                  Continue <ArrowRight size={16} />
               </button>
            </div>
          </div>
        )}

        {/* Step 3: Difficulty */}
        {step === 3 && (
          <div className="p-6 sm:p-10 lg:p-12 space-y-8 lg:space-y-10 flex-1 animate-in slide-in-from-right-4 duration-300">
             <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-card-foreground tracking-tight">Interview Intensity</h2>
              <p className="text-muted-foreground font-medium text-sm sm:text-base">Adjust the difficulty of your HR simulation.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
               {[
                 { id: 'Beginner', icon: Briefcase, desc: 'Common HR questions, gentle pacing.' },
                 { id: 'Intermediate', icon: TrendingUp, desc: 'Situational & cultural fit rounds.' },
                 { id: 'Advanced', icon: Cpu, desc: 'High pressure, deep follow-ups.' }
               ].map(d => {
                 const isSelected = selection.difficulty === d.id;
                 return (
                 <button 
                   key={d.id}
                   onClick={() => setSelection({ ...selection, difficulty: d.id })}
                   className={`p-6 rounded-3xl border-2 flex flex-col items-center text-center gap-4 transition-all ${
                     isLight
                       ? isSelected
                         ? 'border-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-200/60'
                         : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md'
                       : isSelected
                         ? 'border-primary bg-primary/10 shadow-md shadow-primary/10'
                         : 'border-border bg-background/50 hover:border-primary/30'
                   }`}
                 >
                   <div className={`p-3 rounded-2xl ${
                     isLight
                       ? isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500'
                       : isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                   }`}>
                      <d.icon size={24} />
                   </div>
                   <div>
                     <p className={`font-black uppercase tracking-widest text-[10px] mb-1 ${
                       isLight ? (isSelected ? 'text-indigo-700' : 'text-slate-700') : 'text-card-foreground'
                     }`}>{d.id}</p>
                     <p className={`text-xs font-medium ${
                       isLight ? 'text-slate-500' : 'text-muted-foreground'
                     }`}>{d.desc}</p>
                   </div>
                   {isSelected && isLight && (
                     <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
                       <CheckCircle2 size={12} className="text-white" />
                     </div>
                   )}
                 </button>
                 );
               })}
            </div>
            <div className="flex justify-center pt-10">
               <button onClick={nextStep} className="bg-foreground text-background px-12 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 hover:opacity-90 transition-all">
                  Almost Done <ArrowRight size={16} />
               </button>
            </div>
          </div>
        )}

        {/* Step 4: Round Selection (New Step) */}
        {step === 4 && (
          <div className="p-6 sm:p-10 lg:p-12 space-y-8 lg:space-y-10 flex-1 animate-in slide-in-from-right-4 duration-300">
             <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-card-foreground tracking-tight">Select Interview Round</h2>
              <p className="text-muted-foreground font-medium text-sm sm:text-base">Which specific round would you like to practice today?</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
               {[
                 { 
                   id: 'PI', 
                   title: 'Personal Interview (PI)', 
                   icon: UserCheck, 
                   desc: 'Focus on personality, culture fit, motivation, and leadership. Behavioral & situational questions.' 
                 },
                 { 
                   id: 'Technical', 
                   title: 'Technical Interview', 
                   icon: Code2, 
                   desc: 'Focus on role-specific knowledge, project deep-dives, and problem-solving scenarios.' 
                 }
               ].map(r => (
                 <button 
                   key={r.id}
                   onClick={() => { setSelection({ ...selection, roundType: r.id }); nextStep(); }}
                   className={`p-10 rounded-[2.5rem] border-2 flex flex-col items-center text-center gap-6 transition-all group ${
                     selection.roundType === r.id ? 'border-primary bg-primary/10 shadow-xl shadow-primary/10' : 'border-border bg-background/60 hover:border-primary/30 hover:shadow-lg'
                   }`}
                 >
                   <div className={`p-5 rounded-[1.5rem] transition-all group-hover:scale-110 ${selection.roundType === r.id ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-muted text-muted-foreground'}`}>
                      <r.icon size={32} />
                   </div>
                   <div className="space-y-2">
                     <p className="font-black text-card-foreground text-lg leading-tight">{r.title}</p>
                     <p className="text-sm text-muted-foreground font-medium leading-relaxed">{r.desc}</p>
                   </div>
                   <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                     selection.roundType === r.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
                   }`}>
                     {selection.roundType === r.id && <CheckCircle2 size={16} />}
                   </div>
                 </button>
               ))}
            </div>
          </div>
        )}

        {/* Step 5: Resume */}
        {step === 5 && (
          <div className="p-6 sm:p-10 lg:p-12 space-y-8 lg:space-y-10 flex-1 animate-in slide-in-from-right-4 duration-300">
             <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-card-foreground tracking-tight">Personalize via Resume</h2>
              <p className="text-muted-foreground font-medium text-sm sm:text-base">Upload or paste resume content for role-specific questions.</p>
            </div>
            <div className="max-w-xl mx-auto space-y-6">
               <div className="relative group">
                  <input 
                    type="file" 
                    className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.txt"
                  />
                  <div className={`p-10 border-2 border-dashed rounded-3xl flex flex-col items-center gap-4 transition-all ${
                    selection.fileName ? 'border-emerald-500/70 bg-emerald-500/10' : 'border-border bg-muted/60 group-hover:border-primary/40'
                  }`}>
                    {selection.fileName ? <CheckCircle2 size={48} className="text-emerald-500" /> : <Upload size={48} className="text-muted-foreground" />}
                    <div className="text-center">
                       <p className="font-bold text-card-foreground">{selection.fileName || 'Click to upload PDF / DOC'}</p>
                       <p className="text-xs text-muted-foreground font-medium mt-1">AI will extract projects & skills automatically.</p>
                    </div>
                  </div>
               </div>
               <div className="relative">
                  <div className="absolute top-4 left-4 text-muted-foreground"><FileText size={18} /></div>
                  <textarea 
                    placeholder="Or paste resume summary/text here..."
                    className="w-full h-32 bg-muted/70 border border-border rounded-3xl p-6 pl-12 font-medium text-sm text-card-foreground outline-none focus:ring-2 focus:ring-primary"
                    onChange={(e) => setSelection({ ...selection, resumeText: e.target.value })}
                  />
               </div>
            </div>
            <div className="flex justify-center pt-6">
               <button 
                 onClick={startInterview}
                 className="bg-primary text-primary-foreground px-20 py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-primary/25 hover:brightness-110 transition-all transform hover:scale-105"
               >
                 Launch Real-Time Interview
               </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-br from-primary/85 to-secondary/85 rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-10 text-white flex items-center justify-between shadow-2xl overflow-hidden relative">
         <div className="relative z-10 space-y-2">
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
               <p className="text-[10px] font-black uppercase tracking-widest text-white/70">Live Simulation Status</p>
            </div>
            <h3 className="text-xl sm:text-2xl font-black">AI HR Engine Primed</h3>
            <p className="text-white/85 text-sm max-w-md">Our model has ingested 10,000+ real interview patterns from {selection.company === 'custom' ? selection.customCompany : selection.company} to ensure the highest fidelity round.</p>
         </div>
         <div className="opacity-10 absolute right-[-20px] top-[-20px] rotate-12 hidden sm:block">
            <Building2 size={240} />
         </div>
      </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyHRDashboard;
