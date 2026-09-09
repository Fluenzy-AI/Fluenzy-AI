"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useTheme, ThemeName } from "@/contexts/ThemeContext";
import {
  Menu, Bell, Home, Link2, BarChart3, User,
  Sun, Moon, Leaf, Coffee, Terminal, Sparkles, X, LogOut,
  BookMarked, History, Code, GraduationCap, Users, Building2,
  Radio, Trophy, UserSearch, FileCheck, UserCheck, BookOpen,
  Target, Brain,
} from "lucide-react";

const THEME_OPTIONS: { value: ThemeName; label: string; icon: typeof Moon }[] = [
  { value: "light",     label: "Light",     icon: Sun      },
  { value: "dark",      label: "Dark",      icon: Moon     },
  { value: "midnight",  label: "Night",     icon: Moon     },
  { value: "forest",    label: "Forest",    icon: Leaf     },
  { value: "parchment", label: "Parchment", icon: Coffee   },
  { value: "codeterm",  label: "Code",      icon: Terminal },
];

const TABS = [
  { label: "Quick Links", icon: Link2,     href: "/train",     tabColor: "#8B5CF6" },
  { label: "Practice",    icon: Target,    href: "/train/hr",  tabColor: "#10B981" },
  { label: "Home",        icon: Home,      href: "/train",     tabColor: "#7C3AED" },
  { label: "Analytics",   icon: BarChart3, href: "/analytics", tabColor: "#F97316" },
  { label: "Profile",     icon: User,      href: "/profile",   tabColor: "#0EA5E9" },
];

const SIDEBAR_SECTIONS = [
  {
    title: "MAIN",
    items: [
      { label: "Dashboard",        icon: Home,          href: "/train"               },
      { label: "HR Interview",     icon: UserCheck,     href: "/train/hr"            },
      { label: "Technical",        icon: Code,          href: "/train/technical"     },
      { label: "GD Coach",         icon: GraduationCap, href: "/train/gd-coach"     },
      { label: "GD Agent",         icon: Users,         href: "/train/gd-agent"     },
      { label: "Company Tracks",   icon: Building2,     href: "/train/company"      },
      { label: "Live GD",          icon: Radio,         href: "/train/live"         },
      { label: "Competitions",     icon: Trophy,        href: "/train/competitions" },
      { label: "English Learning", icon: BookOpen,      href: "/train/english"      },
      { label: "Vocabulary",       icon: BookMarked,    href: "/train/vocabulary"   },
      { label: "PromptIQ",         icon: Brain,         href: "/train/promptiq"     },
    ],
  },
  {
    title: "JOB & CAREER",
    items: [
      { label: "AI Job Search",    icon: UserSearch, href: "/train/job-search"   },
      { label: "My Applications",  icon: FileCheck,  href: "/train/applications" },
      { label: "Resume ATS",       icon: Target,     href: "/ats"                },
    ],
  },
  {
    title: "ACCOUNT",
    items: [
      { label: "Analytics", icon: BarChart3, href: "/analytics" },
      { label: "History",   icon: History,   href: "/history"   },
      { label: "Profile",   icon: User,      href: "/profile"   },
      { label: "Billing",   icon: Sparkles,  href: "/billing"   },
    ],
  },
];

const ACCENT:    Record<string,string> = { light:"#5A2D82",parchment:"#5A2D82",dark:"#7C3AED",midnight:"#7C3AED",forest:"#F59E0B",codeterm:"#CC4125" };
const CARD_BG:   Record<string,string> = { light:"#F8FAFC",parchment:"#FFFFFF",dark:"#161B2E",midnight:"rgba(15,39,68,0.9)",forest:"rgba(17,28,20,0.9)",codeterm:"#141414" };
const PAGE_BG:   Record<string,string> = { light:"#FFFFFF",parchment:"hsl(42 18% 93%)",dark:"#0D0F1A",midnight:"#0a1929",forest:"#0b140e",codeterm:"#0D0D0D" };
const TEXT_HEX:  Record<string,string> = { light:"#0F0B2E",parchment:"#212529",dark:"#F1F5F9",midnight:"#F1F5F9",forest:"#e8e4d9",codeterm:"#F0EDE8" };
const MUTED_HEX: Record<string,string> = { light:"#6B7280",parchment:"#6C757D",dark:"#94A3B8",midnight:"#94A3B8",forest:"#9aad8e",codeterm:"#888580" };
const BORDER_HEX:Record<string,string> = { light:"#E5E7EB",parchment:"#E9ECEF",dark:"rgba(255,255,255,0.08)",midnight:"rgba(255,255,255,0.08)",forest:"rgba(180,120,30,0.2)",codeterm:"rgba(204,65,37,0.25)" };

interface MobileNavShellProps {
  children: React.ReactNode;
  activeHref?: string;
}

export default function MobileNavShell({ children, activeHref }: MobileNavShellProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { setTheme, resolvedTheme } = useTheme();
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [themeMenuOpen,setThemeMenuOpen]= useState(false);

  const t         = resolvedTheme as string;
  const isLight   = t==="light"||t==="parchment";
  const accentHex = ACCENT[t]   ??"#7C3AED";
  const cardBgHex = CARD_BG[t]  ??"#161B2E";
  const pageBgHex = PAGE_BG[t]  ??"#0D0F1A";
  const textHex   = TEXT_HEX[t] ??"#F1F5F9";
  const mutedHex  = MUTED_HEX[t]??"#94A3B8";
  const borderHex = BORDER_HEX[t]??"rgba(255,255,255,0.08)";
  const firstName = session?.user?.name?.split(" ")[0]||"there";
  const avatarUrl = session?.user?.image;
  const cur = activeHref??pathname;

  const ThemeIcon = () => {
    const ic=isLight?"#1C1917":"#F8FAFC";
    const m: Record<ThemeName,React.ReactNode>={
      light:<Sun size={18} style={{color:ic,stroke:ic}}/>,
      dark:<Moon size={18} style={{color:ic,stroke:ic}}/>,
      midnight:<Sparkles size={18} style={{color:ic,stroke:ic}}/>,
      forest:<Leaf size={18} style={{color:ic,stroke:ic}}/>,
      parchment:<Coffee size={18} style={{color:ic,stroke:ic}}/>,
      codeterm:<Terminal size={18} style={{color:ic,stroke:ic}}/>,
    };
    return <>{m[resolvedTheme]??m.dark}</>;
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col sm:hidden" style={{background:pageBgHex}}>

      {/* TOP HEADER */}
      <header className="flex items-center justify-between px-4 shrink-0"
        style={{height:"56px",background:isLight?pageBgHex:cardBgHex,borderBottom:isLight?"none":`1px solid ${borderHex}`,boxShadow:isLight?"none":"0 1px 6px rgba(0,0,0,0.12)"}}>
        <div className="flex items-center gap-2.5">
          <button onClick={()=>setSidebarOpen(true)} className="flex items-center justify-center w-9 h-9 rounded-xl active:opacity-70" aria-label="Menu">
            <Menu size={22} style={{color:textHex}}/>
          </button>
          <div className="flex items-center justify-center shrink-0">
            <img src="/white-removebg-preview1.png" alt="Fluenzy AI" className="w-9 h-9 object-contain"/>
          </div>
          <span className="text-base font-black tracking-tight"
            style={{background:"linear-gradient(90deg,#7C3AED,#C084FC)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
            Fluenzy AI
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button onClick={()=>setThemeMenuOpen(o=>!o)}
              className="flex items-center justify-center w-9 h-9 rounded-xl active:opacity-70"
              style={{background:isLight?"rgba(0,0,0,0.04)":"rgba(255,255,255,0.06)",border:`1px solid ${borderHex}`}} aria-label="Theme">
              <ThemeIcon/>
            </button>
            <AnimatePresence>
              {themeMenuOpen&&(
                <motion.div initial={{opacity:0,scale:0.92,y:-4}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.92,y:-4}} transition={{duration:0.15}}
                  className="absolute right-0 top-11 z-50 w-36 rounded-2xl py-1.5 shadow-2xl"
                  style={{background:cardBgHex,border:`1px solid ${borderHex}`}}>
                  {THEME_OPTIONS.map(({value,label,icon:Icon})=>(
                    <button key={value} onClick={()=>{setTheme(value);setThemeMenuOpen(false);}}
                      className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm active:opacity-70"
                      style={{color:resolvedTheme===value?accentHex:textHex,fontWeight:resolvedTheme===value?700:400,background:resolvedTheme===value?`${accentHex}14`:"transparent"}}>
                      <Icon size={14}/> {label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="relative">
            <button className="flex items-center justify-center w-9 h-9 rounded-xl active:opacity-70"
              style={{background:isLight?"rgba(0,0,0,0.04)":"rgba(255,255,255,0.06)",border:`1px solid ${borderHex}`}} aria-label="Notifications">
              <Bell size={18} style={{color:textHex}}/>
            </button>
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-purple-600 text-[9px] font-black text-white">3</span>
          </div>
          <button onClick={()=>router.push("/profile")}
            className="w-9 h-9 rounded-xl overflow-hidden border-2 flex items-center justify-center active:opacity-80"
            style={{borderColor:"#C4B5FD",background:"linear-gradient(135deg,#7C3AED,#4F46E5)"}} aria-label="Profile">
            {avatarUrl
              ?<img src={avatarUrl} alt={firstName} className="w-full h-full object-cover" referrerPolicy="no-referrer"/>
              :<span className="text-white font-black text-sm">{firstName[0]?.toUpperCase()}</span>}
          </button>
        </div>
      </header>

      {/* SCROLLABLE BODY */}
      <div className="flex-1 overflow-y-auto" style={{paddingBottom:"80px"}}>
        {children}
      </div>

      {/* ASK AI FAB */}
      <motion.button initial={{scale:0,opacity:0}} animate={{scale:1,opacity:1}} transition={{delay:0.5,type:"spring",stiffness:300,damping:20}}
        onClick={() => window.dispatchEvent(new CustomEvent('open-side-chatbot'))}
        className="fixed right-5 z-[210] sm:hidden w-14 h-14 rounded-full flex flex-col items-center justify-center gap-0.5 active:scale-95 shadow-xl"
        style={{bottom:"80px",background:"linear-gradient(135deg,#7C3AED 0%,#4F46E5 100%)",boxShadow:"0 8px 24px rgba(124,58,237,0.45)",border:"1.5px solid rgba(255,255,255,0.3)"}}>
        <Sparkles size={18} className="text-white"/>
        <span className="text-[9px] font-black text-white leading-none">Ask AI</span>
      </motion.button>

      {/* BOTTOM TAB BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-[205] sm:hidden" style={{height:"64px"}}>
        <svg viewBox="0 0 390 64" fill="none" preserveAspectRatio="none" className="absolute inset-0 w-full h-full"
          style={{filter:"drop-shadow(0 -2px 12px rgba(0,0,0,0.3))"}}>
          <path d="M0 20 Q80 20 130 20 Q155 20 160 0 Q165 -14 195 -14 Q225 -14 230 0 Q235 20 260 20 Q310 20 390 20 L390 64 L0 64 Z"
            fill={isLight?"#FFFFFF":cardBgHex} stroke={borderHex} strokeWidth="1"/>
        </svg>
        <div className="relative flex h-full items-end pb-2 justify-around px-1">
          {TABS.map((tab,idx)=>{
            const isHome=idx===2;
            const isActive=cur===tab.href||(tab.href!=="/train"&&cur.startsWith(tab.href));
            const Icon=tab.icon;
            if(isHome) return(
              <Link key={tab.label} href={tab.href} className="flex flex-col items-center justify-center relative" style={{marginBottom:"18px"}}>
                <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
                  style={{background:"linear-gradient(135deg,#7C3AED,#4F46E5)",boxShadow:"0 4px 16px rgba(124,58,237,0.5)"}}>
                  <Home size={24} className="text-white"/>
                </div>
              </Link>
            );
            return(
              <Link key={tab.label} href={tab.href} className="flex flex-col items-center gap-0.5 min-w-[52px] py-1">
                <Icon size={20} style={{color:isActive?tab.tabColor:mutedHex,strokeWidth:isActive?2.5:1.8}}/>
                <span className="text-[9px] font-semibold" style={{color:isActive?tab.tabColor:mutedHex}}>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* SIDEBAR DRAWER */}
      <AnimatePresence>
        {sidebarOpen&&(
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="fixed inset-0 z-[220] sm:hidden bg-black/60 backdrop-blur-sm"
              onClick={()=>setSidebarOpen(false)}/>
            <motion.div initial={{x:"-100%"}} animate={{x:0}} exit={{x:"-100%"}}
              transition={{type:"spring",stiffness:320,damping:32}}
              className="fixed left-0 top-0 bottom-0 z-[230] sm:hidden w-72 flex flex-col overflow-y-auto"
              style={{background:cardBgHex,borderRight:`1px solid ${borderHex}`}}>
              <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{borderBottom:`1px solid ${borderHex}`}}>
                <div className="flex items-center gap-2.5">
                  <img src="/white-removebg-preview1.png" alt="logo" className="w-8 h-8 object-contain"/>
                  <span className="font-black text-base"
                    style={{background:"linear-gradient(90deg,#7C3AED,#C084FC)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
                    Fluenzy AI
                  </span>
                </div>
                <button onClick={()=>setSidebarOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center active:opacity-70"
                  style={{background:"rgba(255,255,255,0.06)"}}>
                  <X size={18} style={{color:textHex}}/>
                </button>
              </div>
              <div className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
                {SIDEBAR_SECTIONS.map(section=>(
                  <div key={section.title}>
                    <p className="text-[10px] font-black tracking-[0.18em] px-2 mb-2" style={{color:mutedHex}}>{section.title}</p>
                    <div className="space-y-0.5">
                      {section.items.map(item=>{
                        const active=cur===item.href;
                        return(
                          <Link key={item.href} href={item.href} onClick={()=>setSidebarOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl active:opacity-70"
                            style={{background:active?`${accentHex}18`:"transparent",color:active?accentHex:textHex,fontWeight:active?700:400}}>
                            <item.icon size={16} style={{color:active?accentHex:mutedHex}}/>
                            <span className="text-sm">{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-3 py-4 shrink-0" style={{borderTop:`1px solid ${borderHex}`}}>
                <button onClick={()=>signOut({callbackUrl:"/"})}
                  className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl active:opacity-70" style={{color:"#EF4444"}}>
                  <LogOut size={16} style={{color:"#EF4444"}}/>
                  <span className="text-sm font-semibold">Sign Out</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
