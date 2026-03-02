"use client";

import React, { useState, useRef } from "react";
import {
  Download, Loader2, History, ArrowLeft, ArrowRight,
  ChevronDown, AlertTriangle, CheckCircle2, Copy, Check, Circle,
  Star, Target, Building2, BookOpen, MessageSquare, Code2, Briefcase,
  Languages, Zap, ListChecks, Video, X,
} from "lucide-react";
import Link from "next/link";

const CopyBtn = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
      className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
    >
      {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
    </button>
  );
};

const SECTIONS = [
  { id: "prep",      label: "Prep",       icon: Target,       color: "bg-sky-500",     textColor: "text-sky-400"     },
  { id: "star",      label: "STAR",       icon: Star,         color: "bg-amber-500",   textColor: "text-amber-400"   },
  { id: "intro",     label: "Intro",      icon: MessageSquare,color: "bg-violet-500",  textColor: "text-violet-400"  },
  { id: "hr",        label: "HR Q&A",     icon: BookOpen,     color: "bg-rose-500",    textColor: "text-rose-400"    },
  { id: "tech",      label: "Technical",  icon: Code2,        color: "bg-cyan-500",    textColor: "text-cyan-400"    },
  { id: "company",   label: "Company",    icon: Building2,    color: "bg-orange-500",  textColor: "text-orange-400"  },
  { id: "comms",     label: "Comms",      icon: Languages,    color: "bg-pink-500",    textColor: "text-pink-400"    },
  { id: "memory",    label: "Cheat",      icon: Zap,          color: "bg-yellow-500",  textColor: "text-yellow-400"  },
  { id: "checklist", label: "Checklist",  icon: ListChecks,   color: "bg-emerald-500", textColor: "text-emerald-400" },
  { id: "mock",      label: "Mock",       icon: Video,        color: "bg-indigo-500",  textColor: "text-indigo-400"  },
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

export default function MobileInterviewGuide({
  guide, targetRole, targetCompany, communicationLevel,
  pdfLoading, downloadPDF, onNewRoadmap,
}: Props) {
  const [activeSection, setActiveSection] = useState("prep");
  const [expandedHr, setExpandedHr] = useState<Set<number>>(new Set());
  const [expandedTech, setExpandedTech] = useState<Set<string>>(new Set());
  const [techLevel, setTechLevel] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [introTab, setIntroTab] = useState<"30" | "60" | "90">("30");
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  const [checklist, setChecklist] = useState<Set<number>>(new Set());
  const tabBarRef = useRef<HTMLDivElement>(null);

  const checklistItems: string[] = guide.section7_cheatSheet?.finalChecklist || [];
  const checklistPct = checklistItems.length ? Math.round((checklist.size / checklistItems.length) * 100) : 0;

  const introTabs = [
    { key: "30" as const, label: "30 sec", val: guide.section2_introduction?.short30sec },
    { key: "60" as const, label: "60 sec", val: guide.section2_introduction?.medium60sec },
    { key: "90" as const, label: "90 sec", val: guide.section2_introduction?.long90sec },
  ].filter(t => !!t.val);

  const techItems = (guide.section4_technicalQuestions?.[techLevel] || []) as any[];
  const currentIdx = SECTIONS.findIndex(s => s.id === activeSection);
  const current = SECTIONS[currentIdx];

  const goNext = () => { if (currentIdx < SECTIONS.length - 1) setActiveSection(SECTIONS[currentIdx + 1].id); };
  const goPrev = () => { if (currentIdx > 0) setActiveSection(SECTIONS[currentIdx - 1].id); };

  // ── Section content renderer ──────────────────────────────────
  const renderContent = () => {
    switch (activeSection) {
      // ─ PREPARATION ─
      case "prep":
        return (
          <div className="space-y-4 w-full min-w-0">
            {guide.section1_preparation?.oneDayBefore && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 overflow-hidden">
                <p className="text-xs font-black uppercase tracking-wider text-sky-400 mb-3">24 Hours Before</p>
        <ul className="space-y-2.5 w-full">
                  {guide.section1_preparation.oneDayBefore.map((item: string, i: number) => (
                    <li key={i} className="flex gap-2.5 text-sm text-slate-300 leading-relaxed w-full min-w-0">
                      <Circle size={7} className="text-sky-400 mt-2 flex-shrink-0" /><span className="flex-1 min-w-0 break-words">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {guide.section1_preparation?.oneHourBefore && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 overflow-hidden">
                <p className="text-xs font-black uppercase tracking-wider text-cyan-400 mb-3">1 Hour Before</p>
        <ul className="space-y-2.5 w-full">
                  {guide.section1_preparation.oneHourBefore.map((item: string, i: number) => (
                    <li key={i} className="flex gap-2.5 text-sm text-slate-300 leading-relaxed w-full min-w-0">
                      <Circle size={7} className="text-cyan-400 mt-2 flex-shrink-0" /><span className="flex-1 min-w-0 break-words">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {guide.section1_preparation?.commonMistakes && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 overflow-hidden">
                <p className="text-xs font-black uppercase tracking-wider text-red-400 mb-3 flex items-center gap-1.5">
                  <AlertTriangle size={12} /> Common Mistakes to Avoid
                </p>
        <ul className="space-y-2.5 w-full">
                  {guide.section1_preparation.commonMistakes.map((item: string, i: number) => (
                    <li key={i} className="flex gap-2.5 text-sm text-red-200 leading-relaxed w-full min-w-0">
                      <span className="text-red-400 flex-shrink-0">✗</span><span className="flex-1 min-w-0 break-words">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {guide.section1_preparation?.duringInterview && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 overflow-hidden">
                <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">During Interview</p>
                <div className="space-y-3">
                  {Object.entries(guide.section1_preparation.duringInterview).map(([k, v]) => (
                    <div key={k} className="rounded-xl border border-white/10 bg-white/[0.04] p-3 overflow-hidden">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">{k.replace(/([A-Z])/g, ' $1')}</p>
                      <p className="text-sm text-slate-300 break-words">{v as string}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      // ─ STAR ─
      case "star":
        return (
          <div className="space-y-3">
            {guide.section1_preparation?.starMethod && Object.entries(guide.section1_preparation.starMethod).map(([key, val], idx) => {
              const letters = ["S","T","A","R"];
              const colors = ["bg-sky-500","bg-amber-500","bg-emerald-500","bg-rose-500"];
              return (
                <div key={key} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex gap-3 overflow-hidden">
                  <div className={`w-10 h-10 rounded-xl ${colors[idx]} flex items-center justify-center text-white font-black text-lg flex-shrink-0`}>
                    {letters[idx]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">{key}</p>
                    <p className="text-sm text-slate-300 leading-relaxed break-words">{val as string}</p>
                  </div>
                </div>
              );
            })}
          </div>
        );

      // ─ INTRO ─
      case "intro":
        return (
          <div className="space-y-4">
            <div className="flex gap-2">
              {introTabs.map(t => (
                <button key={t.key} onClick={() => setIntroTab(t.key)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${introTab === t.key ? "bg-violet-500 text-white shadow-lg shadow-violet-500/30" : "bg-white/5 border border-white/10 text-slate-400"}`}>
                  {t.label}
                </button>
              ))}
            </div>
              <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4 overflow-hidden">
              <div className="flex justify-end mb-2">
                <CopyBtn text={introTabs.find(t => t.key === introTab)?.val || ""} />
              </div>
              <p className="text-sm text-slate-200 leading-relaxed break-words">{introTabs.find(t => t.key === introTab)?.val}</p>
            </div>
            {guide.section2_introduction?.tips?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-black uppercase tracking-wider text-violet-400">Delivery Tips</p>
                {guide.section2_introduction.tips.map((tip: string, i: number) => (
                  <div key={i} className="flex gap-2 text-sm text-slate-300 rounded-xl bg-white/[0.03] border border-white/10 p-3 leading-relaxed">
                    <span className="text-violet-400 font-bold flex-shrink-0">{i+1}.</span>{tip}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      // ─ HR QUESTIONS ─
      case "hr":
        return (
          <div className="space-y-2.5">
            {guide.section3_hrQuestions?.questions?.map((q: any, i: number) => {
              const isOpen = expandedHr.has(i);
              return (
                <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
                  <button onClick={() => setExpandedHr(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; })}
                    className="w-full flex items-center justify-between gap-2 p-4 text-left active:bg-white/5">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</span>
                      <p className="text-sm font-semibold text-white leading-snug">{q.question}</p>
                    </div>
                    <ChevronDown size={16} className={`text-slate-500 flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isOpen && (
                    <div className="border-t border-white/10 p-4 space-y-3">
                      <div className="flex items-start gap-2">
                        <p className="text-sm text-slate-300 leading-relaxed flex-1 min-w-0 break-words">{q.answer}</p>
                        <CopyBtn text={q.answer} />
                      </div>
                      {q.tips && <p className="text-xs text-cyan-200 rounded-xl bg-cyan-500/10 border border-cyan-500/20 p-3 break-words">{q.tips}</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );

      // ─ TECHNICAL ─
      case "tech":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {(["beginner","intermediate","advanced"] as const).map(lv => (
                <button key={lv} onClick={() => setTechLevel(lv)}
                  className={`capitalize py-2.5 rounded-xl text-[11px] font-bold border transition-all ${techLevel === lv ? "bg-cyan-500 text-white border-cyan-500" : "bg-white/5 border-white/10 text-slate-400"}`}>
                  {lv.slice(0,4)}
                </button>
              ))}
            </div>
            <div className="space-y-2.5">
              {techItems.map((q: any, i: number) => {
                const key = `${techLevel}-${i}`;
                const isOpen = expandedTech.has(key);
                return (
                  <div key={key} className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
                    <button onClick={() => setExpandedTech(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; })}
                      className="w-full flex items-center justify-between gap-2 p-4 text-left active:bg-white/5">
                      <p className="text-sm font-semibold text-white flex-1 text-left">{q.question}</p>
                      <ChevronDown size={16} className={`text-slate-500 flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isOpen && (
                      <div className="border-t border-white/10 p-4 flex gap-2">
                        <p className="text-sm text-slate-300 leading-relaxed flex-1 min-w-0 break-words">{q.answer}</p>
                        <CopyBtn text={q.answer} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );

      // ─ COMPANY FIT ─
      case "company":
        return (
          <div className="space-y-3">
            {[
              { key: "whyThisCompany",   label: "Why This Company",   border: "border-orange-500/20", bg: "bg-orange-500/5", textC: "text-orange-300" },
              { key: "cultureFit",       label: "Culture Fit",         border: "border-amber-500/20",  bg: "bg-amber-500/5",  textC: "text-amber-300" },
              { key: "roleExpectations", label: "Role Expectations",   border: "border-sky-500/20",    bg: "bg-sky-500/5",    textC: "text-sky-300" },
              { key: "valueAddition",    label: "Value Addition",      border: "border-emerald-500/20",bg: "bg-emerald-500/5",textC: "text-emerald-300" },
            ].filter(x => guide.section5_companySpecific?.[x.key]).map(x => (
              <div key={x.key} className={`rounded-2xl border ${x.border} ${x.bg} p-4 overflow-hidden`}>
                <div className="flex items-center justify-between mb-2">
                  <p className={`text-xs font-black uppercase tracking-wider ${x.textC}`}>{x.label}</p>
                  <CopyBtn text={guide.section5_companySpecific[x.key]} />
                </div>
                <p className="text-sm text-slate-300 leading-relaxed break-words">{guide.section5_companySpecific[x.key]}</p>
              </div>
            ))}
          </div>
        );

      // ─ COMMUNICATION ─
      case "comms":
        return (
          <div className="space-y-4">
            {guide.section6_communication?.betterReplacements?.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">Filler → Better Alternative</p>
                <div className="space-y-2.5">
                  {guide.section6_communication.betterReplacements.map((item: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="flex-1 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs text-center line-through">
                        {item.avoid || guide.section6_communication.fillerWordsToAvoid?.[i] || "—"}
                      </span>
                      <ArrowRight size={14} className="text-slate-600 flex-shrink-0" />
                      <span className="flex-1 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs text-center">
                        {item.useInstead}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {guide.section6_communication?.powerPhrases?.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs font-black uppercase tracking-wider text-pink-400 mb-4">Power Phrases <span className="text-slate-500 font-normal">(tap to copy)</span></p>
                <div className="space-y-2.5">
                  {guide.section6_communication.powerPhrases.map((ph: string, i: number) => (
                    <button key={i} onClick={() => navigator.clipboard.writeText(ph)}
                      className="w-full text-left text-sm text-slate-200 rounded-xl border border-pink-500/20 bg-pink-500/5 p-3.5 active:bg-pink-500/15 transition-colors leading-relaxed">
                      "{ph}"
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      // ─ CHEAT SHEET ─
      case "memory":
        return (
          <div className="space-y-3">
            {(guide.section7_cheatSheet?.keyLinesToMemorize as string[] || []).map((line, i) => {
              const isFlipped = flipped.has(i);
              return (
                <button key={i}
                  onClick={() => setFlipped(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; })}
                  className={`w-full rounded-2xl border text-left p-4 transition-all active:scale-[0.98] ${isFlipped ? "border-amber-400/30 bg-amber-500/10" : "border-white/10 bg-white/[0.03]"}`}>
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
        );

      // ─ CHECKLIST ─
      case "checklist":
        return (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">{checklist.size}/{checklistItems.length} done</span>
                <span className="font-bold text-emerald-400">{checklistPct}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500" style={{ width: `${checklistPct}%` }} />
              </div>
            </div>
            <div className="space-y-2.5">
              {checklistItems.map((item, i) => {
                const done = checklist.has(i);
                return (
                  <button key={i}
                    onClick={() => setChecklist(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; })}
                    className={`w-full flex items-start gap-3 p-4 rounded-2xl border text-left text-sm transition-all ${done ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-100" : "border-white/10 bg-white/[0.02] text-slate-300"}`}>
                    <span className={`mt-0.5 w-5 h-5 rounded-md border flex-shrink-0 flex items-center justify-center ${done ? "bg-emerald-500 border-emerald-400" : "border-slate-500"}`}>
                      {done && <Check size={11} className="text-white" />}
                    </span>
                    {item}
                  </button>
                );
              })}
            </div>
          </div>
        );

      // ─ MOCK INTERVIEW ─
      case "mock":
        if (!guide.section8_mockInterview) {
          return (
            <div className="text-center py-12 text-slate-500">
              <Video size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Mock interview data not available for this guide.</p>
            </div>
          );
        }
        return (
          <div className="space-y-3">
            {Object.entries(guide.section8_mockInterview)
              .filter(([k]) => k !== "title")
              .map(([key, value]) => (
                <div key={key} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs font-black uppercase tracking-wider text-indigo-400 mb-3">{key.replace(/([A-Z])/g, ' $1')}</p>
                  {Array.isArray(value) ? (
                    <ul className="space-y-2.5">
                      {(value as any[]).map((item, i) => (
                        <li key={i} className="flex gap-2.5 text-sm text-slate-300 leading-relaxed">
                          <Circle size={7} className="text-indigo-400 mt-2 flex-shrink-0" />
                          <span className="flex-1 min-w-0 break-words">{typeof item === "string" ? item : item.question || item.tip || JSON.stringify(item)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-300 leading-relaxed break-words">{String(value)}</p>
                  )}
                </div>
              ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#090e1a] text-slate-200 flex flex-col">

      {/* ── STICKY TOP BAR ────────────────────────────── */}
      <div className="sticky top-0 z-30 border-b border-white/10 bg-[#090e1a]/90 backdrop-blur-xl px-4 py-3 w-full overflow-x-hidden">
        <div className="flex items-center gap-3">
          <button onClick={onNewRoadmap}
            className="w-9 h-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-slate-400 hover:text-white active:scale-95 transition-all flex-shrink-0">
            <ArrowLeft size={17} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white text-sm truncate">{targetRole || "Interview Guide"}</p>
            <p className="text-xs text-slate-500 truncate">{targetCompany}</p>
          </div>
          <Link href="/interview-guide/history">
            <button className="w-9 h-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-slate-400 hover:text-white active:scale-95 transition-all">
              <History size={16} />
            </button>
          </Link>
          <button onClick={downloadPDF} disabled={pdfLoading}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white disabled:opacity-50 active:scale-95 transition-all">
            {pdfLoading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          </button>
        </div>

        {/* Section tab scroll */}
        <div ref={tabBarRef} className="mt-3 flex gap-2 overflow-x-auto scrollbar-none pb-0.5">
          {SECTIONS.map(s => {
            const active = s.id === activeSection;
            return (
              <button key={s.id} onClick={() => setActiveSection(s.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                  active
                    ? `${s.color} text-white border-transparent shadow-lg`
                    : "border-transparent text-slate-500 bg-white/5 hover:text-slate-300"
                }`}>
                <s.icon size={12} />
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── SECTION HEADER ───────────────────────────── */}
      <div className="px-4 pt-5 pb-3 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-2xl ${current?.color || "bg-slate-700"} flex items-center justify-center flex-shrink-0`}>
          {current && <current.icon size={20} className="text-white" />}
        </div>
        <div>
          <h1 className="text-xl font-black text-white">{current?.label}</h1>
          <p className="text-xs text-slate-500">{Math.round(((currentIdx + 1) / SECTIONS.length) * 100)}% of guide · Section {currentIdx + 1}/{SECTIONS.length}</p>
        </div>
      </div>

      {/* ── CONTENT ─────────────────────────────────── */}
      <div className="flex-1 px-4 pb-32 overflow-x-hidden w-full min-w-0">
        {renderContent()}
      </div>

      {/* ── BOTTOM NAV BAR ───────────────────────────── */}
      <div className="sticky bottom-0 z-30 border-t border-white/10 bg-[#090e1a]/95 backdrop-blur-xl px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={goPrev} disabled={currentIdx === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm font-semibold text-slate-300 disabled:opacity-30 active:scale-95 transition-all flex-shrink-0">
            <ArrowLeft size={14} /> Prev
          </button>
          <div className="flex-1 flex justify-center gap-1">
            {SECTIONS.map((s, i) => (
              <button key={s.id} onClick={() => setActiveSection(s.id)}
                className={`rounded-full flex-shrink-0 transition-all ${i === currentIdx ? `w-6 h-2 ${s.color}` : "w-2 h-2 bg-white/20"}`} />
            ))}
          </div>
          <button onClick={goNext} disabled={currentIdx === SECTIONS.length - 1}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm font-semibold text-slate-300 disabled:opacity-30 active:scale-95 transition-all flex-shrink-0">
            Next <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
