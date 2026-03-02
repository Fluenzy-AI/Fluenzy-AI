"use client";

import React, { useState } from "react";
import {
  Download, Loader2, History, ArrowRight, Printer, Calendar,
  ChevronDown, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2, Circle, Copy, Check,
  Star, Target, Building2, BookOpen, MessageSquare, Code2, Briefcase,
  Languages, FileText, Zap, ListChecks, Video,
} from "lucide-react";
import Link from "next/link";

const BoldText = ({ text, className }: { text: string; className?: string }) => {
  const lines = String(text).split('\n');
  return (
    <p className={className}>
      {lines.map((line, li) => {
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
          <React.Fragment key={li}>
            {parts.map((part, pi) =>
              pi % 2 === 1
                ? <strong key={pi} className="text-white font-semibold">{part}</strong>
                : part
            )}
            {li < lines.length - 1 && <br />}
          </React.Fragment>
        );
      })}
    </p>
  );
};

interface CopyBtnProps { text: string }
const CopyBtn = ({ text }: CopyBtnProps) => {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
      className="flex-shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
      title="Copy"
    >
      {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
    </button>
  );
};

const SECTION_NAV = [
  { id: "prep",     label: "Preparation",      icon: Target,       color: "text-sky-400" },
  { id: "star",     label: "STAR Method",       icon: Star,         color: "text-amber-400" },
  { id: "intro",    label: "Introduction",      icon: MessageSquare,color: "text-violet-400" },
  { id: "hr",       label: "HR Questions",      icon: BookOpen,     color: "text-rose-400" },
  { id: "tech",     label: "Technical",         icon: Code2,        color: "text-cyan-400" },
  { id: "company",  label: "Company Fit",       icon: Building2,    color: "text-orange-400" },
  { id: "comms",    label: "Communication",     icon: Languages,    color: "text-pink-400" },
  { id: "memory",   label: "Cheat Sheet",       icon: Zap,          color: "text-yellow-400" },
  { id: "checklist",label: "Final Checklist",   icon: ListChecks,   color: "text-emerald-400" },
  { id: "mock",     label: "Mock Interview",    icon: Video,        color: "text-indigo-400" },
];

interface Props {
  guide: any;
  targetRole: string;
  targetCompany: string;
  communicationLevel: string;
  pdfLoading: boolean;
  downloadPDF: () => void;
  onNewRoadmap: () => void;
  lastPracticedAt: string;
}

export default function InterviewGuideDisplay({
  guide, targetRole, targetCompany, communicationLevel,
  pdfLoading, downloadPDF, onNewRoadmap, lastPracticedAt,
}: Props) {
  const [expandedHr, setExpandedHr] = useState<Set<number>>(new Set());
  const [expandedTech, setExpandedTech] = useState<Set<string>>(new Set());
  const [techLevel, setTechLevel] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [introTab, setIntroTab] = useState<"30" | "60" | "90">("30");
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  const [checklist, setChecklist] = useState<Set<number>>(new Set());
  const [activeNav, setActiveNav] = useState("prep");
  const [starIdx, setStarIdx] = useState(0);
  const [hrIdx, setHrIdx] = useState(0);

  const checklistItems: string[] = guide.section7_cheatSheet?.finalChecklist || [];
  const checklistPct = checklistItems.length ? Math.round((checklist.size / checklistItems.length) * 100) : 0;

  const introTabs = [
    { key: "30" as const, label: "30 sec", val: guide.section2_introduction?.short30sec },
    { key: "60" as const, label: "60 sec", val: guide.section2_introduction?.medium60sec },
    { key: "90" as const, label: "90 sec", val: guide.section2_introduction?.long90sec },
  ].filter(t => !!t.val);

  const techItems = (guide.section4_technicalQuestions?.[techLevel] || []) as any[];

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveNav(id);
  };

  // ---- shared card shell ----
  const Card = ({ id, icon: Icon, iconColor, title, subtitle, children }: {
    id: string; icon: any; iconColor: string; title: string; subtitle?: string; children: React.ReactNode;
  }) => (
    <section id={id} className="scroll-mt-6 rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/90 to-slate-900/60 shadow-xl backdrop-blur-xl p-5 md:p-7 space-y-5">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 border border-white/10`}>
          <Icon size={20} className={iconColor} />
        </div>
        <div>
          <h2 className="text-lg md:text-xl font-bold text-white leading-tight">{title}</h2>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );

  const infoCard = "rounded-xl border border-white/10 bg-white/[0.03] p-4";
  const listDot = "flex gap-2.5 items-start text-sm text-slate-300 leading-relaxed";

  return (
    <div className="min-h-screen bg-[#090e1a] text-slate-200">

      {/* ── TOP HEADER ─────────────────────────────────────── */}
      <div className="sticky top-0 z-30 border-b border-white/10 bg-[#090e1a]/90 backdrop-blur-xl px-4 py-3 md:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center flex-shrink-0">
              <Briefcase size={17} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-white text-sm leading-tight truncate max-w-[200px] md:max-w-xs">{targetRole || "Interview Guide"}</p>
              {targetCompany && <p className="text-xs text-slate-400 truncate">{targetCompany}</p>}
            </div>
            <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-300 border border-blue-500/20">
              {communicationLevel}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={onNewRoadmap}
              className="flex items-center gap-1.5 h-8 px-3 rounded-xl border border-white/10 bg-white/5 text-xs text-slate-300 hover:bg-white/10 transition-colors">
              <ArrowRight size={13} className="rotate-180" /> New
            </button>
            <Link href="/interview-guide/history">
              <button className="flex items-center gap-1.5 h-8 px-3 rounded-xl border border-white/10 bg-white/5 text-xs text-slate-300 hover:bg-white/10 transition-colors">
                <History size={13} /> History
              </button>
            </Link>
            <button onClick={() => window.print()}
              className="hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-xl border border-white/10 bg-white/5 text-xs text-slate-300 hover:bg-white/10 transition-colors">
              <Printer size={13} /> Print
            </button>
            <button onClick={downloadPDF} disabled={pdfLoading}
              className="flex items-center gap-1.5 h-8 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50 transition-opacity">
              {pdfLoading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
              <span className="hidden sm:inline">Export PDF</span>
            </button>
          </div>
        </div>

        {/* Section nav pills — horizontal scroll */}
        <div className="max-w-7xl mx-auto mt-3 flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
          {SECTION_NAV.map(s => (
            <button key={s.id} onClick={() => scrollTo(s.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all border ${
                activeNav === s.id
                  ? "bg-white/10 border-white/20 text-white"
                  : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/5"
              }`}>
              <s.icon size={12} className={activeNav === s.id ? s.color : ""} />
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── HERO STATS ─────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Checklist", value: `${checklist.size}/${checklistItems.length || 0}`, accent: "from-emerald-500 to-teal-500", icon: ListChecks },
            { label: "HR Questions", value: String(guide.section3_hrQuestions?.questions?.length || 0), accent: "from-rose-500 to-pink-500", icon: BookOpen },
            { label: "Tech Questions", value: String((techItems.length || 0) + (guide.section4_technicalQuestions?.intermediate?.length || 0) + (guide.section4_technicalQuestions?.advanced?.length || 0)), accent: "from-cyan-500 to-blue-500", icon: Code2 },
            { label: "Power Phrases", value: String(guide.section6_communication?.powerPhrases?.length || 0), accent: "from-violet-500 to-purple-500", icon: Zap },
          ].map(s => (
            <div key={s.label} className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-900/50 p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.accent} flex items-center justify-center flex-shrink-0`}>
                <s.icon size={18} className="text-white" />
              </div>
              <div>
                <p className="text-xl font-black text-white">{s.value}</p>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── MAIN CONTENT ───────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pb-16 space-y-5">

        {/* 1 — PREPARATION ─────────── */}
        {guide.section1_preparation && (
          <Card id="prep" icon={Target} iconColor="text-sky-400" title="Preparation Strategy" subtitle="Time-boxed action plan for interview day">
            <div className="grid md:grid-cols-2 gap-4">
              {guide.section1_preparation.oneDayBefore && (
                <div className={infoCard}>
                  <p className="text-xs font-bold uppercase tracking-wider text-sky-400 mb-3 flex items-center gap-1.5"><Calendar size={12} /> 24 Hours Before</p>
                  <ul className="space-y-2">
                    {guide.section1_preparation.oneDayBefore.map((item: string, i: number) => (
                      <li key={i} className={listDot}><Circle size={7} className="text-sky-400 mt-2 flex-shrink-0" />{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {guide.section1_preparation.oneHourBefore && (
                <div className={infoCard}>
                  <p className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-3 flex items-center gap-1.5"><Zap size={12} /> 1 Hour Before</p>
                  <ul className="space-y-2">
                    {guide.section1_preparation.oneHourBefore.map((item: string, i: number) => (
                      <li key={i} className={listDot}><Circle size={7} className="text-cyan-400 mt-2 flex-shrink-0" />{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {guide.section1_preparation.commonMistakes && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 md:col-span-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-red-400 mb-3 flex items-center gap-1.5"><AlertTriangle size={12} /> Common Mistakes to Avoid</p>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {guide.section1_preparation.commonMistakes.map((item: string, i: number) => (
                      <p key={i} className="text-sm text-red-200 flex gap-2"><span className="text-red-400 mt-0.5">✗</span>{item}</p>
                    ))}
                  </div>
                </div>
              )}
              {guide.section1_preparation.duringInterview && (
                <div className={`${infoCard} md:col-span-2`}>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">During Interview Tactics</p>
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(guide.section1_preparation.duringInterview).map(([k, v]) => (
                      <div key={k} className="rounded-lg bg-white/[0.04] border border-white/10 p-3">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">{k.replace(/([A-Z])/g,' $1')}</p>
                        <p className="text-sm text-slate-300">{v as string}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* 2 — STAR METHOD ─────────── */}
        {guide.section1_preparation?.starMethod && (
          <Card id="star" icon={Star} iconColor="text-amber-400" title="STAR Method Framework" subtitle="Structured approach to behavioral answers">
            <div className="flex flex-col gap-3">
              {Object.entries(guide.section1_preparation.starMethod).map(([key, val], idx) => {
                const letters = ["S","T","A","R"];
                const colors = ["from-sky-500 to-blue-500","from-amber-500 to-orange-500","from-emerald-500 to-teal-500","from-rose-500 to-pink-500"];
                return (
                  <div key={key} className="rounded-xl border border-white/10 bg-white/[0.03] p-5 flex flex-col gap-2">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors[idx]} flex items-center justify-center text-white font-black text-base`}>
                      {letters[idx]}
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{key}</p>
                    <p className="text-sm text-slate-300 leading-relaxed">{val as string}</p>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* 3 — INTRODUCTION ─────────── */}
        {guide.section2_introduction && (
          <Card id="intro" icon={MessageSquare} iconColor="text-violet-400" title="Personal Introduction" subtitle="Switch between 30 / 60 / 90 second scripts">
            <div className="flex gap-2 mb-4">
              {introTabs.map(t => (
                <button key={t.key} onClick={() => setIntroTab(t.key)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${introTab === t.key ? "bg-violet-500 text-white shadow-lg shadow-violet-500/30" : "bg-white/5 border border-white/10 text-slate-400 hover:text-white"}`}>
                  {t.label}
                </button>
              ))}
            </div>
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-5 relative">
              <CopyBtn text={introTabs.find(t => t.key === introTab)?.val || ""} />
              <BoldText text={introTabs.find(t => t.key === introTab)?.val || ""} className="text-sm text-slate-200 leading-relaxed pr-8" />
            </div>
            {guide.section2_introduction?.tips?.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-violet-400 mb-3">Delivery Tips</p>
                <div className="grid sm:grid-cols-2 gap-2">
                  {guide.section2_introduction.tips.map((tip: string, i: number) => (
                    <div key={i} className="flex gap-2 text-sm text-slate-300 rounded-lg bg-white/[0.03] border border-white/10 p-3">
                      <span className="text-violet-400 font-bold flex-shrink-0">{i+1}.</span>{tip}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* 4 — HR QUESTIONS ─────────── */}
        {guide.section3_hrQuestions?.questions?.length > 0 && (
          <Card id="hr" icon={BookOpen} iconColor="text-rose-400" title="HR Questions" subtitle={`${guide.section3_hrQuestions.questions.length} questions with model answers`}>
            <div className="flex flex-col gap-3">
              {guide.section3_hrQuestions.questions.map((q: any, i: number) => {
                const open = expandedHr.has(i);
                return (
                  <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
                    <button onClick={() => setExpandedHr(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; })}
                      className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-white/5 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-black flex items-center justify-center flex-shrink-0">{i+1}</span>
                          <p className="text-sm font-semibold text-white leading-snug">{q.question}</p>
                        </div>
                      </div>
                      <ChevronDown size={15} className={`text-slate-500 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
                    </button>
                    {open && (
                      <div className="border-t border-white/10 p-4 space-y-3">
                        <div className="flex items-start gap-2">
                          <BoldText text={q.answer} className="text-sm text-slate-300 leading-relaxed flex-1" />
                          <CopyBtn text={q.answer} />
                        </div>
                        {q.tips && <p className="text-xs text-cyan-200 rounded-lg bg-cyan-500/10 border border-cyan-500/20 p-3">{q.tips}</p>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* 5 — TECHNICAL ─────────── */}
        {guide.section4_technicalQuestions && (
          <Card id="tech" icon={Code2} iconColor="text-cyan-400" title="Technical Questions" subtitle="Filter by proficiency level">
            <div className="flex gap-2 flex-wrap mb-4">
              {(["beginner","intermediate","advanced"] as const).map(lv => (
                <button key={lv} onClick={() => setTechLevel(lv)}
                  className={`capitalize px-4 py-1.5 rounded-xl text-xs font-bold border transition-all ${techLevel === lv ? "bg-cyan-500 text-white border-cyan-500 shadow-lg shadow-cyan-500/30" : "bg-white/5 border-white/10 text-slate-400 hover:text-white"}`}>
                  {lv} ({(guide.section4_technicalQuestions[lv] || []).length})
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-3">
              {techItems.map((q: any, i: number) => {
                const key = `${techLevel}-${i}`;
                const isOpen = expandedTech.has(key);
                return (
                  <div key={key} className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
                    <button onClick={() => setExpandedTech(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; })}
                      className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-white/5 transition-colors">
                      <p className="text-sm font-semibold text-white text-left">{q.question}</p>
                      <ChevronDown size={15} className={`text-slate-500 flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isOpen && (
                      <div className="border-t border-white/10 p-4 flex gap-2">
                        <BoldText text={q.answer} className="text-sm text-slate-300 leading-relaxed flex-1" />
                        <CopyBtn text={q.answer} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* 6 — COMPANY FIT ─────────── */}
        {guide.section5_companySpecific && (
          <Card id="company" icon={Building2} iconColor="text-orange-400" title="Company Fit" subtitle="Tailored narratives for this organisation">
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { key: "whyThisCompany",   label: "Why This Company", accent: "border-orange-500/20 bg-orange-500/5", badge: "text-orange-300" },
                { key: "cultureFit",       label: "Culture Integration", accent: "border-amber-500/20 bg-amber-500/5", badge: "text-amber-300" },
                { key: "roleExpectations", label: "Role Expectations",   accent: "border-sky-500/20 bg-sky-500/5",    badge: "text-sky-300" },
                { key: "valueAddition",    label: "Value Addition",      accent: "border-emerald-500/20 bg-emerald-500/5", badge: "text-emerald-300" },
              ].filter(x => guide.section5_companySpecific[x.key]).map(x => (
                <div key={x.key} className={`rounded-xl border ${x.accent} p-4 flex flex-col gap-3`}>
                  <div className="flex items-center justify-between">
                    <p className={`text-xs font-black uppercase tracking-wider ${x.badge}`}>{x.label}</p>
                    <CopyBtn text={guide.section5_companySpecific[x.key]} />
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">{guide.section5_companySpecific[x.key]}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* 7 — COMMUNICATION ─────────── */}
        {guide.section6_communication && (
          <Card id="comms" icon={Languages} iconColor="text-pink-400" title="Communication Upgrade" subtitle="Eliminate fillers, level-up vocabulary">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Avoid vs Use */}
              {(guide.section6_communication.fillerWordsToAvoid?.length > 0 || guide.section6_communication.betterReplacements?.length > 0) && (
                <div className={infoCard}>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Filler → Replacement</p>
                  <div className="space-y-2">
                    {(guide.section6_communication.betterReplacements || []).map((item: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-medium line-through flex-1">{item.avoid || guide.section6_communication.fillerWordsToAvoid?.[i] || "—"}</span>
                        <ArrowRight size={12} className="text-slate-500 flex-shrink-0" />
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium flex-1">{item.useInstead}</span>
                      </div>
                    ))}
                    {/* Standalone avoid words */}
                    {(guide.section6_communication.betterReplacements?.length === 0) && (guide.section6_communication.fillerWordsToAvoid || []).map((w: string, i: number) => (
                      <span key={i} className="inline-block px-2.5 py-1 m-0.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs">{w}</span>
                    ))}
                  </div>
                </div>
              )}
              {/* Power phrases */}
              {guide.section6_communication.powerPhrases?.length > 0 && (
                <div className={infoCard}>
                  <p className="text-xs font-bold uppercase tracking-wider text-pink-400 mb-4">Power Phrases <span className="text-slate-500 font-normal">(tap to copy)</span></p>
                  <div className="space-y-2">
                    {guide.section6_communication.powerPhrases.map((ph: string, i: number) => (
                      <button key={i} onClick={() => navigator.clipboard.writeText(ph)}
                        className="w-full text-left text-sm text-slate-200 rounded-xl border border-pink-500/20 bg-pink-500/5 p-3 hover:bg-pink-500/10 transition-colors leading-relaxed">
                        "{ph}"
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* 8 — CHEAT SHEET ─────────── */}
        {guide.section7_cheatSheet && (
          <Card id="memory" icon={Zap} iconColor="text-yellow-400" title="Cheat Sheet" subtitle="Key lines to memorise — tap a card to flip">
            {guide.section7_cheatSheet.keyLinesToMemorize?.length > 0 && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(guide.section7_cheatSheet.keyLinesToMemorize as string[]).map((line, i) => {
                  const isFlipped = flipped.has(i);
                  return (
                    <button key={i} onClick={() => setFlipped(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; })}
                      className="min-h-[110px] rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 text-left hover:bg-yellow-500/10 transition-all">
                      {!isFlipped ? (
                        <>
                          <p className="text-[10px] font-black uppercase tracking-wider text-yellow-500 mb-2">📌 Line {i + 1}</p>
                          <p className="text-sm text-white leading-relaxed">{line}</p>
                        </>
                      ) : (
                        <>
                          <p className="text-[10px] font-black uppercase tracking-wider text-amber-400 mb-2">💡 Why It Works</p>
                          <p className="text-sm text-amber-200 leading-relaxed">Reinforces confidence and clarity under interview pressure.</p>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </Card>
        )}

        {/* 9 — FINAL CHECKLIST ─────────── */}
        {checklistItems.length > 0 && (
          <Card id="checklist" icon={ListChecks} iconColor="text-emerald-400" title="Final Checklist" subtitle="Interactive readiness tracker">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">{checklist.size} of {checklistItems.length} completed</span>
              <span className="text-sm font-bold text-emerald-400">{checklistPct}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/10 mb-5 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500" style={{ width: `${checklistPct}%` }} />
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {checklistItems.map((item, i) => {
                const done = checklist.has(i);
                return (
                  <button key={i} onClick={() => setChecklist(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; })}
                    className={`flex items-start gap-3 p-3 rounded-xl border text-left text-sm transition-all ${done ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-100" : "border-white/10 bg-white/[0.02] text-slate-300 hover:bg-white/[0.05]"}`}>
                    <span className={`mt-0.5 w-4 h-4 rounded-md border flex-shrink-0 flex items-center justify-center ${done ? "bg-emerald-500 border-emerald-400" : "border-slate-500"}`}>
                      {done && <Check size={10} className="text-white" />}
                    </span>
                    {item}
                  </button>
                );
              })}
            </div>
          </Card>
        )}

        {/* 10 — MOCK INTERVIEW / SECTION 8 ─────────── */}
        {guide.section8_mockInterview && (
          <Card id="mock" icon={Video} iconColor="text-indigo-400" title="Mock Interview" subtitle="Practice scenarios and strategies">
            <div className="grid md:grid-cols-2 gap-4">
              {Object.entries(guide.section8_mockInterview)
                .filter(([k]) => k !== "title")
                .map(([key, value]) => (
                  <div key={key} className={infoCard}>
                    <p className="text-xs font-black uppercase tracking-wider text-indigo-400 mb-3">{key.replace(/([A-Z])/g,' $1')}</p>
                    {Array.isArray(value) ? (
                      <ul className="space-y-2">
                        {(value as any[]).map((item, i) => (
                          <li key={i} className={listDot}>
                            <Circle size={7} className="text-indigo-400 mt-2 flex-shrink-0" />
                            {typeof item === "string" ? item : item.question || item.tip || JSON.stringify(item)}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <BoldText text={String(value)} className="text-sm text-slate-300 leading-relaxed" />
                    )}
                  </div>
                ))}
            </div>
          </Card>
        )}

        {/* Footer */}
        <div className="pt-4 pb-8 text-center">
          <p className="text-xs text-slate-600">Fluenzy AI · Interview Strategy Engine · {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}
