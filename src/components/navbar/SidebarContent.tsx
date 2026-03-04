"use client";

import React from "react";
import Link from "next/link";
import {
  History as HistoryIcon,
  LayoutDashboard,
  Gift,
  Zap,
  ChevronRight,
  Target,
  GraduationCap,
  ShieldCheck,
} from "lucide-react";

interface SidebarContentProps {
  session: any;
  pathname: string;
}

const SidebarContent: React.FC<SidebarContentProps> = ({ session, pathname }) => {
  return (
    <div className="flex flex-col h-full">
      {/* Sidebar Header (Visible on Desktop) */}
      <div className="p-3 border-b border-white/5 hidden md:flex items-center space-x-3 bg-slate-900/50">
        <Link href="/" className="flex items-center space-x-3">
          <img src="/image/fluenzyAI.jpeg" alt="Logo" className="h-8 w-auto rounded-lg" />
          <span className="text-xl font-black bg-gradient-primary !bg-clip-text text-transparent">Fluenzy AI</span>
        </Link>
      </div>

      <div className="flex flex-col py-2 flex-grow overflow-y-auto">
        <h2 className="mb-2 px-4 text-xs font-black uppercase tracking-[0.2em] text-slate-500">Navigation</h2>
        <div className="space-y-1">
          {session?.user ? (
            <>
              <div className="space-y-1 mb-2">
                <Link 
                  href="/train" 
                  className={`flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all ${pathname.startsWith('/train') ? 'bg-purple-500/10 text-white' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
                >
                  <Target className={`mr-3 h-4 w-4 ${pathname.startsWith('/train') ? 'text-purple-400' : 'text-slate-500'}`} />
                  Train Now
                </Link>
                <div className="ml-6 space-y-1 border-l border-white/5 pl-4 pb-2">
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-2 mt-2">Practice</h3>
                   <Link href="/train/hr" className={`flex items-center text-xs py-1 transition-colors ${pathname === '/train/hr' ? 'text-purple-400 font-bold' : 'text-slate-400 hover:text-white'}`}>
                     <ChevronRight className="h-3 w-3 mr-2 opacity-50" /> HR Interview Coach
                   </Link>
                   <Link href="/train/gd-coach" className={`flex items-center text-xs py-1 transition-colors ${pathname === '/train/gd-coach' ? 'text-teal-400 font-bold' : 'text-slate-400 hover:text-white'}`}>
                     <ChevronRight className="h-3 w-3 mr-2 opacity-50" /> GD Coach
                   </Link>
                   <Link href="/train/gd" className={`flex items-center text-xs py-1 transition-colors ${pathname === '/train/gd' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-white'}`}>
                     <ChevronRight className="h-3 w-3 mr-2 opacity-50" /> GD Agent
                   </Link>
                   <Link href="/train/technical" className={`flex items-center text-xs py-1 transition-colors ${pathname === '/train/technical' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'}`}>
                     <ChevronRight className="h-3 w-3 mr-2 opacity-50" /> Technical Mastery
                   </Link>
                   <Link href="/train/company" className={`flex items-center text-xs py-1 transition-colors ${pathname === '/train/company' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-white'}`}>
                     <ChevronRight className="h-3 w-3 mr-2 opacity-50" /> Company Track
                   </Link>
                   <Link href="/train/daily" className={`flex items-center text-xs py-1 transition-colors ${pathname === '/train/daily' ? 'text-sky-400 font-bold' : 'text-slate-400 hover:text-white'}`}>
                     <ChevronRight className="h-3 w-3 mr-2 opacity-50" /> Daily Conversation
                   </Link>
                   <Link href="/train/latest-topics" className={`flex items-center text-xs py-1 transition-colors ${pathname === '/train/latest-topics' ? 'text-lime-400 font-bold' : 'text-slate-400 hover:text-white'}`}>
                     <ChevronRight className="h-3 w-3 mr-2 opacity-50" /> Latest Company Topics
                   </Link>

                   <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-2 mt-4">Learning</h3>
                   <Link href="/train/english" className={`flex items-center text-xs py-1 transition-colors ${pathname === '/train/english' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-white'}`}>
                     <ChevronRight className="h-3 w-3 mr-2 opacity-50" /> Essential Modules
                   </Link>
                   <Link href="/train/vocabulary" className={`flex items-center text-xs py-1 transition-colors ${pathname === '/train/vocabulary' ? 'text-orange-400 font-bold' : 'text-slate-400 hover:text-white'}`}>
                     <ChevronRight className="h-3 w-3 mr-2 opacity-50" /> Vocabulary Booster
                   </Link>
                   <Link href="/train/corporate-voice" className={`flex items-center text-xs py-1 transition-colors ${pathname === '/train/corporate-voice' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-white'}`}>
                     <ChevronRight className="h-3 w-3 mr-2 opacity-50" /> Voice Practice
                   </Link>
                </div>
              </div>

              <Link href="/interview-guide" className={`flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all ${pathname.startsWith('/interview-guide') ? 'bg-purple-500/10 text-white' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}>
                <GraduationCap className={`mr-3 h-4 w-4 ${pathname.startsWith('/interview-guide') ? 'text-blue-400' : 'text-slate-500'}`} />
                Interview Guide
              </Link>
              <Link href="/ats" className={`flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all ${pathname.startsWith('/ats') ? 'bg-purple-500/10 text-white' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}>
                <ShieldCheck className={`mr-3 h-4 w-4 ${pathname.startsWith('/ats') ? 'text-violet-400' : 'text-slate-500'}`} />
                Advanced ATS System
              </Link>
              <Link href="/history" className={`flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all ${pathname === '/history' ? 'bg-purple-500/10 text-white' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}>
                <HistoryIcon className={`mr-3 h-4 w-4 ${pathname === '/history' ? 'text-amber-400' : 'text-slate-500'}`} />
                History
              </Link>
              <Link href="/analytics" className={`flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all ${pathname.startsWith('/analytics') ? 'bg-purple-500/10 text-white' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}>
                <LayoutDashboard className={`mr-3 h-4 w-4 ${pathname.startsWith('/analytics') ? 'text-emerald-400' : 'text-slate-500'}`} />
                Analytics Dashboard
              </Link>
              <Link href="/features" className={`flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all ${pathname === '/features' ? 'bg-purple-500/10 text-white' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}>
                <Zap className={`mr-3 h-4 w-4 ${pathname === '/features' ? 'text-orange-400' : 'text-slate-500'}`} />
                Features
              </Link>
              <Link href="/pricing" className={`flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all ${pathname === '/pricing' ? 'bg-purple-500/10 text-white' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}>
                <Gift className={`mr-3 h-4 w-4 ${pathname === '/pricing' ? 'text-pink-400' : 'text-slate-500'}`} />
                Pricing
              </Link>

              <div className="mt-6">
                <h2 className="mb-2 px-4 text-xs font-black uppercase tracking-[0.2em] text-slate-500">Support</h2>
                <Link href="/blog" className={`flex items-center px-4 py-2 text-xs font-bold rounded-xl transition-all ${pathname.startsWith('/blog') ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                  Blog
                </Link>
                <Link href="/contact" className={`flex items-center px-4 py-2 text-xs font-bold rounded-xl transition-all ${pathname === '/contact' ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                  Contact Us
                </Link>
              </div>

              <div className="mt-4">
                <h2 className="mb-2 px-4 text-xs font-black uppercase tracking-[0.2em] text-slate-500">Legal</h2>
                <Link href="/terms-and-conditions" className="flex items-center px-4 py-1 text-[10px] font-bold text-slate-500 hover:text-slate-300 transition-all">
                  Terms & Conditions
                </Link>
                <Link href="/privacy-policy" className="flex items-center px-4 py-1 text-[10px] font-bold text-slate-500 hover:text-slate-300 transition-all">
                  Privacy Policy
                </Link>
              </div>
            </>
          ) : (
            <>
              <Link href="/" className={`flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all ${pathname === '/' ? 'text-white bg-white/5' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}>
                Home
              </Link>
              <Link href="/features" className={`flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all ${pathname === '/features' ? 'text-white bg-white/5' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}>
                Features
              </Link>
              <Link href="/pricing" className={`flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all ${pathname === '/pricing' ? 'text-white bg-white/5' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}>
                Pricing
              </Link>
              <Link href="/blog" className={`flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all ${pathname.startsWith('/blog') ? 'text-white bg-white/5' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}>
                Blog
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SidebarContent;
