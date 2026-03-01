"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Sparkles,
  Play,
  ArrowRight,
  CheckCircle,
  Mic,
  Brain,
  Users,
  Code,
  Briefcase,
  TrendingUp,
  Star,
  Zap,
  Shield,
  ChevronDown,
} from "lucide-react";

/* ─── data ─────────────────────────────────────────────────── */
const features = [
  { icon: Mic,       label: "HR Interview Coach",    color: "from-orange-500 to-amber-500" },
  { icon: Code,      label: "Technical Mastery",     color: "from-emerald-500 to-cyan-500" },
  { icon: Users,     label: "GD Agent",              color: "from-violet-500 to-pink-500"  },
  { icon: Briefcase, label: "Company Tracks",        color: "from-blue-500 to-cyan-500"    },
  { icon: Brain,     label: "AI Interviewer",        color: "from-purple-500 to-blue-500"  },
  { icon: TrendingUp,label: "Performance Analytics", color: "from-cyan-500 to-indigo-500"  },
];

const stats = [
  { value: "95%", label: "Accuracy Rate"       },
  { value: "24/7", label: "Always Available"   },
  { value: "50+",  label: "Behavioral Metrics" },
  { value: "<200ms", label: "Instant Feedback" },
];

const benefits = [
  "AI-powered mock interviews",
  "Real-time behavioral analytics",
  "Group discussion simulation",
  "Company-specific preparation",
  "Resume-aware questions",
  "STAR method coaching",
];

/* ─── Floating orbs (CSS-only, no heavy blur on mobile) ─── */
const Orb = ({ className }: { className: string }) => (
  <div className={`pointer-events-none absolute rounded-full opacity-20 ${className}`} />
);

/* ─── Accordion FAQ item ─────────────────────────────────── */
const Faq = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/10">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between py-4 text-left text-sm font-semibold text-white"
      >
        {q}
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-purple-400 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <p className="pb-4 text-xs leading-relaxed text-slate-400">{a}</p>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════ */
const MobileLandingPage = () => {
  return (
    <div className="relative overflow-x-hidden bg-slate-950 text-white">
      {/* ── HERO ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-purple-950 to-slate-950 px-5 pb-14 pt-24">
        <Orb className="left-[-60px] top-[-60px] h-56 w-56 bg-purple-500" />
        <Orb className="right-[-40px] top-[40%] h-44 w-44 bg-blue-500" />

        {/* badge */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-900/40 px-4 py-2 text-xs font-semibold text-purple-200"
        >
          <Sparkles className="h-3.5 w-3.5 text-purple-400" />
          AI-Powered Interview Training
        </motion.div>

        {/* headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="mb-4 text-[2.1rem] font-extrabold leading-[1.1] tracking-tight"
        >
          Train Smarter.{" "}
          <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Crack FAANG
          </span>{" "}
          Interviews with&nbsp;AI.
        </motion.h1>

        {/* sub */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8 text-sm leading-relaxed text-slate-400"
        >
          AI Interviewer · HR + Technical + GD Training · Real-Time Behavioral
          Analytics · Performance Intelligence
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col gap-3"
        >
          <Link
            href="/login"
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-purple-500/25 active:scale-[0.97]"
          >
            <Play className="h-4 w-4" />
            Start Training Free
          </Link>
          <Link
            href="#features"
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-purple-500/30 bg-white/5 px-6 py-3 text-sm font-semibold text-purple-200 active:scale-[0.97]"
          >
            Explore Features
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>

        {/* trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500"
        >
          {["No credit card needed", "Free to start", "Instant access"].map(
            (t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                {t}
              </span>
            )
          )}
        </motion.div>
      </section>

      {/* ── STATS BAR ──────────────────────────────────────── */}
      <section className="bg-slate-900/80 px-5 py-8">
        <div className="grid grid-cols-2 gap-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center"
            >
              <div className="text-2xl font-extrabold text-white">{s.value}</div>
              <div className="mt-1 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FEATURES GRID ──────────────────────────────────── */}
      <section id="features" className="px-5 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-7 text-center"
        >
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-cyan-400">
            Core Training Ecosystem
          </p>
          <h2 className="text-2xl font-extrabold leading-tight text-white">
            Everything You Need to{" "}
            <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Get Hired
            </span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 gap-3">
          {features.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.06 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              <div
                className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${f.color} shadow-md`}
              >
                <f.icon className="h-5 w-5 text-white" />
              </div>
              <p className="text-xs font-semibold leading-snug text-white">
                {f.label}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── BENEFITS LIST ──────────────────────────────────── */}
      <section className="bg-gradient-to-b from-slate-900 to-slate-950 px-5 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-6 text-center"
        >
          <h2 className="text-2xl font-extrabold text-white">
            Why{" "}
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Fluenzy AI?
            </span>
          </h2>
        </motion.div>

        <div className="space-y-3">
          {benefits.map((b, i) => (
            <motion.div
              key={b}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-500/20">
                <CheckCircle className="h-3.5 w-3.5 text-purple-400" />
              </div>
              <span className="text-sm text-slate-200">{b}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── TRUST / COMPANIES ──────────────────────────────── */}
      <section className="px-5 py-10 text-center">
        <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">
          Candidates from top companies trust Fluenzy AI
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          {["Google", "Amazon", "Microsoft", "Meta", "Netflix", "Apple"].map(
            (c) => (
              <span
                key={c}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-400"
              >
                {c}
              </span>
            )
          )}
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────── */}
      <section className="bg-slate-900/60 px-5 py-12">
        <motion.h2
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 text-center text-2xl font-extrabold text-white"
        >
          How It{" "}
          <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Works
          </span>
        </motion.h2>

        <div className="space-y-4">
          {[
            { step: "01", title: "Sign Up Free",       desc: "Create your account in seconds — no credit card required."    },
            { step: "02", title: "Choose Your Track",  desc: "HR, Technical, GD, English, or Company-specific preparation." },
            { step: "03", title: "Train with AI",      desc: "Practice with a realistic AI interviewer that adapts to you."  },
            { step: "04", title: "Get Instant Feedback", desc: "Receive detailed analytics and actionable improvement tips."  },
          ].map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.06 }}
              className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 text-sm font-black text-white">
                {item.step}
              </div>
              <div>
                <p className="text-sm font-bold text-white">{item.title}</p>
                <p className="mt-0.5 text-xs text-slate-400">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── PRICING TEASER ─────────────────────────────────── */}
      <section className="px-5 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-3xl border border-purple-500/30 bg-gradient-to-br from-purple-900/30 to-blue-900/30 p-6 text-center"
        >
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-yellow-300">
            <Star className="h-3 w-3" />
            Most Popular
          </div>
          <h3 className="mt-3 text-xl font-extrabold text-white">
            Start Free · Upgrade Anytime
          </h3>
          <p className="mt-2 text-sm text-slate-400">
            Free plan includes 3 sessions/month. Upgrade for unlimited access.
          </p>
          <div className="mt-5 flex flex-col gap-3">
            <Link
              href="/login"
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-purple-500/25 active:scale-[0.97]"
            >
              <Zap className="h-4 w-4" />
              Get Started Free
            </Link>
            <Link
              href="/pricing"
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-300 active:scale-[0.97]"
            >
              View All Plans
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────── */}
      <section className="bg-slate-900/60 px-5 pb-12 pt-10">
        <motion.h2
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-6 text-center text-2xl font-extrabold text-white"
        >
          FAQs
        </motion.h2>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-5">
          <Faq
            q="Is Fluenzy AI free to use?"
            a="Yes! The free plan gives you 3 interview sessions per month. No credit card required to get started."
          />
          <Faq
            q="What types of interviews can I practice?"
            a="HR behavioural, technical (DSA + system design), group discussions, company-specific tracks, and English fluency."
          />
          <Faq
            q="How does the AI feedback work?"
            a="Our AI analyses your voice, response quality, confidence, grammar, and pace in real time — giving you a detailed scorecard after every session."
          />
          <Faq
            q="Does it work on mobile?"
            a="Absolutely. Fluenzy AI is fully optimised for Android and iOS browsers — no app download needed."
          />
        </div>
      </section>

      {/* ── FINAL CTA ──────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 to-purple-950/40 px-5 pb-16 pt-12 text-center">
        <Orb className="left-[-40px] bottom-0 h-48 w-48 bg-purple-500" />
        <Orb className="right-[-30px] top-0 h-36 w-36 bg-blue-500" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative z-10"
        >
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
            <Shield className="h-3 w-3" />
            Trusted · Secure · Private
          </div>
          <h2 className="mt-3 text-2xl font-extrabold leading-snug text-white">
            Your AI Interview Intelligence System Starts Here.
          </h2>
          <p className="mt-3 text-sm text-slate-400">
            Join thousands of candidates cracking FAANG interviews with Fluenzy AI.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="/login"
              className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-purple-500/30 active:scale-[0.97]"
            >
              <Play className="h-4 w-4" />
              Start Training — It's Free
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── College CTA ── */}
      <section className="mx-4 mb-8 rounded-3xl bg-gradient-to-br from-[#0d1330] to-[#0f1840] border border-indigo-500/20 p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">For Colleges & Universities</p>
            <p className="text-slate-400 text-xs">Manage student training from one dashboard</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 mt-4">
          <Link
            href="/college/login"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm"
          >
            College Admin Sign In
          </Link>
          <Link
            href="/college/signup"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-white/[0.05] border border-indigo-500/30 text-slate-300 font-semibold text-sm"
          >
            Apply for Partnership
          </Link>
        </div>
      </section>
    </div>
  );
};

export default MobileLandingPage;
