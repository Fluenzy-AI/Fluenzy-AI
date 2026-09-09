"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, Briefcase, Check, ChevronDown, FilePlus, LogIn, Menu, ShieldCheck, Users } from "lucide-react";
import { useState } from "react";
import { ThemeName, useTheme } from "@/contexts/ThemeContext";

type PortalType = "company" | "college";

const themes: { value: ThemeName; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "midnight", label: "Night" },
  { value: "forest", label: "Forest" },
  { value: "parchment", label: "Parchment" },
  { value: "codeterm", label: "Code" },
];

const palettes = {
  light: { page: "#F8F7FF", card: "#FFFFFF", border: "#E5E0FF", text: "#1E1B3A", muted: "#6B7280", accent: "#5B21E6", accentSoft: "rgba(91,33,230,.10)", button: "linear-gradient(135deg,#5B21E6,#7C3AED)" },
  dark: { page: "#080d19", card: "#101827", border: "rgba(255,255,255,.10)", text: "#F8FAFC", muted: "#94A3B8", accent: "#60A5FA", accentSoft: "rgba(96,165,250,.12)", button: "linear-gradient(135deg,#06B6D4,#2563EB)" },
  midnight: { page: "#0a1929", card: "#0f2744", border: "rgba(255,255,255,.12)", text: "#F8FAFC", muted: "#9FB1C5", accent: "#7DD3FC", accentSoft: "rgba(125,211,252,.12)", button: "linear-gradient(135deg,#0284C7,#2563EB)" },
  forest: { page: "#0b140e", card: "#111c14", border: "rgba(245,158,11,.25)", text: "#E8E4D9", muted: "#9AAD8E", accent: "#FBBF24", accentSoft: "rgba(245,158,11,.12)", button: "linear-gradient(135deg,#B7791F,#D97706)" },
  parchment: { page: "#F4F1EA", card: "#FCFBF8", border: "#E6E2D8", text: "#1C1917", muted: "#57534E", accent: "#DC2626", accentSoft: "rgba(220,38,38,.09)", button: "linear-gradient(135deg,#DC2626,#B91C1C)" },
  codeterm: { page: "#0D0D0D", card: "#141414", border: "rgba(204,65,37,.30)", text: "#F0EDE8", muted: "#888580", accent: "#F05A3C", accentSoft: "rgba(204,65,37,.12)", button: "linear-gradient(135deg,#CC4125,#9F2D1B)" },
} satisfies Record<ThemeName, { page: string; card: string; border: string; text: string; muted: string; accent: string; accentSoft: string; button: string }>;

const copy = {
  company: {
    eyebrow: "Company partner portal",
    title: "Move from open roles to",
    highlight: "great hires, faster.",
    description: "Partner with Fluenzy AI to source talent, evaluate candidates, and build a stronger hiring pipeline.",
    checks: ["AI-assisted screening", "Partner hiring workflows", "Decision-ready insights"],
    login: "Company login",
    loginDescription: "Manage your hiring pipeline, interview sessions, and team.",
    loginButton: "Continue to company login",
    signup: "Apply as a company partner",
    signupButton: "Become a partner",
    signupNote: "Partner with Fluenzy AI to hire better talent",
    loginHref: "/company/login",
    signupHref: "/company/signup",
    otherHref: "/college-portal",
    otherLabel: "For Colleges",
    section: "A better hiring workflow",
    sectionTitle: "Every hiring decision, backed by signal.",
  },
  college: {
    eyebrow: "College partner portal",
    title: "The operating system for",
    highlight: "placement success.",
    description: "Manage student readiness, AI-powered practice, and measurable campus outcomes in one secure workspace.",
    checks: ["Domain-verified access", "Student readiness", "Dedicated onboarding"],
    login: "College Admin login",
    loginDescription: "Sign in to your institution workspace and keep students moving forward.",
    loginButton: "Continue to admin login",
    signup: "Apply for partnership",
    signupButton: "Become a partner",
    signupNote: "Approval within 1–2 business days · Free to apply",
    loginHref: "/college/login",
    signupHref: "/college/signup",
    otherHref: "/company-portal",
    otherLabel: "For Companies",
    section: "Everything in one place",
    sectionTitle: "Built for the way institutions work.",
  },
} as const;

const portalStats = {
  company: [
    ["500+", "Companies hiring"],
    ["10K+", "Jobs posted"],
    ["50K+", "Candidates placed"],
    ["4.8★", "Company rating"],
  ],
  college: [
    ["200+", "Partner institutions"],
    ["50K+", "Students trained"],
    ["91%", "Placement rate"],
    ["4.9★", "Admin rating"],
  ],
} as const;

export default function PortalMobileView({ type }: { type: PortalType }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [themeOpen, setThemeOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const theme = palettes[resolvedTheme] ?? palettes.dark;
  const content = copy[type];
  const isLight = resolvedTheme === "light" || resolvedTheme === "parchment";

  return (
    <main className="min-[641px]:hidden" style={{ minHeight: "100vh", background: theme.page, color: theme.text }}>
      <header className="sticky top-0 z-20 border-b backdrop-blur-xl" style={{ background: `${theme.page}eF`, borderColor: theme.border }}>
        <div className="flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border" style={{ background: isLight ? theme.card : "#0c1424", borderColor: theme.border }}>
              <img src="/white-removebg-preview1.png" alt="Fluenzy AI" className="h-7 w-auto object-contain" />
            </span>
            <span className="truncate text-base font-black tracking-tight" style={{ color: theme.text }}>Fluenzy <span style={{ color: theme.accent }}>AI</span></span>
          </Link>
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <button type="button" onClick={() => setThemeOpen((open) => !open)} className="flex h-9 items-center gap-1 rounded-lg border px-2.5 text-[11px] font-bold" style={{ borderColor: theme.border, color: theme.text }} aria-expanded={themeOpen}>
                <span>{themes.find((item) => item.value === resolvedTheme)?.label}</span><ChevronDown className="h-3.5 w-3.5" />
              </button>
              {themeOpen && <div className="absolute right-0 top-11 z-30 w-36 overflow-hidden rounded-xl border p-1 shadow-xl" style={{ background: theme.card, borderColor: theme.border }}>
                {themes.map((item) => <button key={item.value} type="button" onClick={() => { setTheme(item.value); setThemeOpen(false); }} className="flex w-full rounded-lg px-3 py-2 text-left text-xs font-semibold" style={{ color: resolvedTheme === item.value ? theme.accent : theme.text, background: resolvedTheme === item.value ? theme.accentSoft : "transparent" }}>{item.label}</button>)}
              </div>}
            </div>
            <Link href={content.loginHref} className="hidden rounded-lg border px-3 py-2 text-xs font-bold sm:inline-flex" style={{ borderColor: theme.border, color: theme.text }}>Login</Link>
            <button type="button" onClick={() => setNavOpen((open) => !open)} className="rounded-lg p-2" style={{ color: theme.text }} aria-label={navOpen ? "Close navigation" : "Open navigation"} aria-expanded={navOpen}><Menu className="h-5 w-5" /></button>
          </div>
        </div>
      </header>
      {navOpen && <nav aria-label="Mobile navigation" className="border-b px-4 py-3" style={{ background: theme.card, borderColor: theme.border }}>
        <div className="grid gap-1 text-sm font-semibold">
          <Link href="/" onClick={() => setNavOpen(false)} className="rounded-lg px-3 py-2" style={{ color: theme.text }}>Home</Link>
          <Link href={content.otherHref} onClick={() => setNavOpen(false)} className="rounded-lg px-3 py-2" style={{ color: theme.text }}>{content.otherLabel}</Link>
          <Link href="/pricing" onClick={() => setNavOpen(false)} className="rounded-lg px-3 py-2" style={{ color: theme.text }}>Pricing</Link>
          <Link href="/hirelens" onClick={() => setNavOpen(false)} className="rounded-lg px-3 py-2" style={{ color: theme.text }}>HireLens</Link>
          <Link href="/blog" onClick={() => setNavOpen(false)} className="rounded-lg px-3 py-2" style={{ color: theme.text }}>Blog</Link>
          <Link href={content.loginHref} onClick={() => setNavOpen(false)} className="mt-1 rounded-lg px-3 py-2" style={{ color: theme.accent, background: theme.accentSoft }}>Login</Link>
        </div>
      </nav>}

      <div className="space-y-0 pb-10">
        <section className="relative overflow-hidden px-5 pb-12 pt-10" style={{ background: `linear-gradient(180deg, ${theme.page}, ${theme.accentSoft}, ${theme.page})` }}>
          <div className="pointer-events-none absolute -left-20 -top-16 h-52 w-52 rounded-full opacity-30 blur-3xl" style={{ background: theme.accent }} />
          <div className="relative">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: theme.accent, borderColor: `${theme.accent}50`, background: theme.accentSoft }}>{content.eyebrow}</div>
            <h1 className="mb-4 text-[1.85rem] font-extrabold leading-[1.15] tracking-tight" style={{ overflowWrap: "break-word" }}>{content.title} <span style={{ color: theme.accent }}>{content.highlight}</span></h1>
            <p className="mb-7 text-sm leading-relaxed" style={{ color: theme.muted }}>{content.description}</p>
            <div className="flex flex-col gap-3">
              <Link href={content.loginHref} className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-white shadow-lg active:scale-[.97]" style={{ background: theme.button }}>{content.loginButton}<ArrowRight className="h-4 w-4" /></Link>
              <Link href={content.signupHref} className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border px-6 py-3 text-sm font-semibold active:scale-[.97]" style={{ borderColor: `${theme.accent}50`, background: theme.accentSoft, color: theme.text }}>{content.signupButton}<FilePlus className="h-4 w-4" /></Link>
            </div>
            <div className="mt-7 flex flex-wrap justify-center gap-x-4 gap-y-2 text-[11px]" style={{ color: theme.muted }}>{content.checks.map((item) => <span key={item} className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-500" />{item}</span>)}</div>
          </div>
        </section>

        <section className="px-5 py-8" style={{ background: `${theme.card}99` }}>
          <div className="grid grid-cols-2 gap-3">
            {portalStats[type].map(([value, label]) => <div key={label} className="rounded-2xl border p-4 text-center" style={{ borderColor: theme.border, background: `${theme.card}cc` }}><div className="text-2xl font-extrabold">{value}</div><div className="mt-1 text-[10px] font-medium uppercase tracking-wide" style={{ color: theme.muted }}>{label}</div></div>)}
          </div>
        </section>

        <section className="px-5 py-12">
          <div className="mb-7 text-center"><p className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: theme.accent }}>{content.section}</p><h2 className="text-2xl font-extrabold leading-tight">{content.sectionTitle}</h2></div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Briefcase, label: type === "company" ? "Job pipeline" : "Student onboarding" },
              { icon: Users, label: type === "company" ? "Candidate intelligence" : "Learning paths" },
              { icon: BarChart3, label: "Real-time analytics" },
              { icon: ShieldCheck, label: "Secure reports" },
            ].map(({ icon: Icon, label }) => <div key={label} className="rounded-2xl border p-4" style={{ borderColor: theme.border, background: `${theme.card}cc` }}><div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl" style={{ color: theme.accent, background: theme.accentSoft }}><Icon className="h-5 w-5" /></div><p className="text-xs font-semibold leading-snug">{label}</p></div>)}
          </div>
        </section>

        <section className="mx-5 rounded-3xl border p-5 shadow-xl" style={{ background: theme.card, borderColor: theme.border }}>
          <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl" style={{ color: theme.accent, background: theme.accentSoft }}><LogIn className="h-5 w-5" /></div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: theme.accent }}>Secure access</p>
          <h2 className="mt-2 text-xl font-bold">{content.login}</h2>
          <p className="mt-2 text-sm leading-5" style={{ color: theme.muted }}>{content.loginDescription}</p>
          <Link href={content.loginHref} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-black" style={{ background: theme.button, color: "#fff" }}>{content.loginButton}<ArrowRight className="h-4 w-4" /></Link>
          <div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-widest" style={{ color: theme.muted }}><div className="h-px flex-1" style={{ background: theme.border }} />New here?<div className="h-px flex-1" style={{ background: theme.border }} /></div>
          <Link href={content.signupHref} className="flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3.5 text-sm font-bold" style={{ borderColor: theme.border, color: theme.text }}><FilePlus className="h-4 w-4" style={{ color: theme.accent }} />{content.signup}</Link>
          <p className="mt-3 text-center text-[11px]" style={{ color: theme.muted }}>{content.signupNote}</p>
        </section>

        <section className="px-5 py-12" style={{ background: `${theme.card}66` }}>
          <div className="mb-6 text-center"><h2 className="text-2xl font-extrabold">Why <span style={{ color: theme.accent }}>Fluenzy AI?</span></h2></div>
          <div className="grid gap-3">
            {content.checks.map((item, index) => <div key={item} className="rounded-xl border p-4" style={{ borderColor: theme.border, background: `${theme.card}99` }}><p className="text-sm font-bold">{String(index + 1).padStart(2, "0")} <span className="ml-2">{item}</span></p><p className="mt-1 text-xs leading-5" style={{ color: theme.muted }}>{type === "company" ? "Keep your hiring process focused, consistent, and measurable." : "Give every student a clear, data-informed path to placement readiness."}</p></div>)}
          </div>
        </section>
        <section className="relative overflow-hidden px-5 pb-6 pt-12 text-center">
          <p className="mb-3 inline-flex rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: theme.accent, borderColor: `${theme.accent}50`, background: theme.accentSoft }}>Trusted · Secure · Private</p>
          <h2 className="text-2xl font-extrabold">Ready to get started?</h2>
          <p className="mt-2 text-sm" style={{ color: theme.muted }}>{content.signupNote}</p>
          <Link href={content.otherHref} className="mt-6 flex items-center justify-center gap-2 rounded-2xl border py-3 text-sm font-bold" style={{ borderColor: theme.border, color: theme.accent }}>{content.otherLabel}<ArrowRight className="h-4 w-4" /></Link>
        </section>
      </div>
    </main>
  );
}
