import type { Metadata } from "next";
import Link from "next/link";
import { Building2, LogIn, FilePlus, Users, BarChart3, Briefcase, ShieldCheck, ArrowRight, Check } from "lucide-react";
import PortalMobileView from "@/components/PortalMobileView";

export const metadata: Metadata = {
  title: "Company Portal - AI-Powered Recruitment & Hiring | FluenzyAI",
  description: "Post jobs, manage candidate applications, conduct automated AI screening, and access real-time hiring analytics on FluenzyAI Company Portal.",
};

const STATS = [
  { value: "500+", label: "Companies Hiring" },
  { value: "10K+", label: "Jobs Posted" },
  { value: "50K+", label: "Candidates Placed" },
  { value: "4.8★", label: "Company Rating" },
];

const FEATURES = [
  {
    icon: Briefcase,
    title: "Job Posting & Application Pipeline",
    description: "Publish job listings with automated skill tags, custom questions, and real-time candidate applicant tracking.",
  },
  {
    icon: Users,
    title: "AI Candidate Database Access",
    description: "Search and filter top candidates evaluated on real interview performance scores and communication metrics.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Hiring Analytics",
    description: "Track conversion funnels, interview completion rates, and benchmark candidates against FAANG standards.",
  },
  {
    icon: ShieldCheck,
    title: "Automated AI Screening & Reports",
    description: "Get detailed transcripts, behavioral scores, and automated feedback summaries for every candidate.",
  },
];

export default function CompanyPortalPage() {
  return (
    <>
    <main className="hidden min-[641px]:block min-h-screen bg-[#080d19] text-white">
      <div className="relative isolate overflow-hidden">
        <div className="pointer-events-none absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-cyan-600/15 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-0 h-[28rem] w-[28rem] rounded-full bg-violet-500/10 blur-3xl" />
        <header className="relative z-10 border-b border-white/10 bg-[#0b1222]/80 backdrop-blur-xl">
          <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-purple-400/20 bg-slate-900/90 shadow-lg shadow-purple-900/20">
                <img src="/white-removebg-preview1.png" alt="Fluenzy AI" className="h-8 w-auto object-contain" />
              </div>
              <span className="text-xl font-black tracking-tight">
                <span className="bg-gradient-to-r from-purple-300 via-indigo-300 to-purple-300 bg-clip-text text-transparent">Fluenzy AI</span>
                <span className="ml-2 hidden text-sm font-medium text-slate-500 sm:inline">for company partners</span>
              </span>
            </Link>
            <nav aria-label="Main navigation" className="hidden items-center gap-2 lg:flex">
              <Link href="/" className="rounded-full px-3 py-2 text-xs font-semibold text-slate-400 transition hover:bg-white/5 hover:text-white">Home</Link>
              <Link href="/college-portal" className="rounded-full px-3 py-2 text-xs font-semibold text-slate-400 transition hover:bg-white/5 hover:text-white">For Colleges</Link>
              <Link href="/pricing" className="rounded-full px-3 py-2 text-xs font-semibold text-slate-400 transition hover:bg-white/5 hover:text-white">Pricing</Link>
              <Link href="/hirelens" className="rounded-full px-3 py-2 text-xs font-semibold text-slate-400 transition hover:bg-white/5 hover:text-white">HireLens</Link>
              <Link href="/blog" className="rounded-full px-3 py-2 text-xs font-semibold text-slate-400 transition hover:bg-white/5 hover:text-white">Blog</Link>
            </nav>
            <div className="flex items-center gap-2">
              <Link href="/company/login" className="hidden rounded-full border border-white/15 px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-300 transition hover:border-white/30 hover:bg-white/5 hover:text-white sm:inline-flex">Login</Link>
              <Link href="/company/signup" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:from-cyan-400 hover:to-blue-500">
                <Building2 className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Become a partner</span><span className="sm:hidden">Partner</span>
              </Link>
            </div>
          </div>
        </header>
        <section className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-8 sm:px-8 lg:grid-cols-[1fr_440px] lg:gap-20 lg:px-10 lg:pb-20 lg:pt-14">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-300"><Briefcase className="h-3.5 w-3.5" /> Company partner portal</div>
            <h1 className="max-w-3xl text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">Move from open roles to{" "}<span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-violet-300 bg-clip-text text-transparent">great hires, faster.</span></h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">Partner with Fluenzy AI to source talent, evaluate candidates, and build a stronger hiring pipeline.</p>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-300">{["AI-assisted screening", "Partner hiring workflows", "Decision-ready insights"].map((item) => <span key={item} className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" />{item}</span>)}</div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-[#101827]/95 p-6 shadow-2xl shadow-black/30 ring-1 ring-cyan-400/10 sm:p-8">
            <div className="mb-7"><div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/25"><LogIn className="h-5 w-5" /></div><p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">Secure access</p><h2 className="mt-2 text-2xl font-bold tracking-tight">Company login</h2><p className="mt-2 text-sm leading-6 text-slate-400">Sign in to manage your hiring pipeline, interview sessions, and team.</p></div>
            <Link href="/company/login" className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-600/20 transition hover:from-cyan-400 hover:to-blue-500">Continue to company login <ArrowRight className="h-4 w-4" /></Link>
            <div className="my-6 flex items-center gap-3 text-[11px] uppercase tracking-widest text-slate-600"><div className="h-px flex-1 bg-white/10" />New partner?<div className="h-px flex-1 bg-white/10" /></div>
            <Link href="/company/signup" className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.03] py-3.5 text-sm font-semibold text-slate-200 transition hover:border-cyan-400/50 hover:bg-cyan-500/10"><FilePlus className="h-4 w-4 text-cyan-300" /> Apply as a company partner</Link>
            <p className="mt-4 text-center text-xs text-slate-500">Partner with Fluenzy AI to hire better talent</p>
          </div>
        </section>
      </div>
      <div className="mx-auto max-w-7xl space-y-14 px-5 pb-20 sm:px-8 lg:px-10">
        <div className="grid grid-cols-2 border-y border-white/10 py-6 md:grid-cols-4">{STATS.map((s) => <div key={s.label} className="border-white/10 px-4 text-center first:border-0 md:border-l"><p className="text-2xl font-black sm:text-3xl">{s.value}</p><p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">{s.label}</p></div>)}</div>
        <section><div className="mb-8 max-w-xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">A better hiring workflow</p><h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Every hiring decision, backed by signal.</h2></div><div className="grid grid-cols-1 gap-4 md:grid-cols-2">{FEATURES.map((f) => <div key={f.title} className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:-translate-y-0.5 hover:border-cyan-400/30 hover:bg-cyan-500/[0.06]"><div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300"><f.icon className="h-5 w-5" /></div><h3 className="text-lg font-bold">{f.title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{f.description}</p></div>)}</div></section>
        <div className="flex flex-col items-start justify-between gap-5 rounded-2xl border border-cyan-400/20 bg-gradient-to-r from-cyan-500/10 to-blue-500/5 p-6 sm:flex-row sm:items-center sm:p-8"><div><p className="text-lg font-bold">Ready to build a stronger hiring engine?</p><p className="mt-1 text-sm text-slate-400">Bring your team, candidates, and decisions into one intelligent workspace.</p></div><Link href="/company/signup" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:bg-cyan-50">Get started free <ArrowRight className="h-4 w-4" /></Link></div>
      </div>
    </main>
    <PortalMobileView type="company" />
    </>
  );
}
