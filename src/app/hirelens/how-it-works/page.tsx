"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Mic,
  Camera,
  Eye,
  Check,
  ChevronRight,
  Play,
  Bluetooth,
  Settings,
  Sparkles,
  Brain,
  BarChart3,
  FileCheck,
  Users,
  Shield,
  Mail,
  Trophy,
  Filter,
  ArrowRight,
  MonitorSmartphone,
  MessageSquare,
  UserCheck,
  TrendingUp,
  Globe,
  History,
} from "lucide-react";

/* ─────────────────────────────────────────────
   REUSABLE COMPONENTS
   ───────────────────────────────────────────── */

// Animated score gauge (reused from main HireLens page pattern)
function ScoreGauge({
  score,
  label,
  color,
  delay = 0,
}: {
  score: number;
  label: string;
  color: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  return (
    <div ref={ref} className="flex flex-col items-center">
      <div className="relative w-20 h-20">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="40"
            cy="40"
            r="34"
            stroke="#1E293B"
            strokeWidth="6"
            fill="none"
          />
          <motion.circle
            cx="40"
            cy="40"
            r="34"
            stroke={color}
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={213.6}
            initial={{ strokeDashoffset: 213.6 }}
            animate={
              isInView
                ? { strokeDashoffset: 213.6 - (213.6 * score) / 100 }
                : {}
            }
            transition={{ duration: 1.5, delay, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-white">{score}</span>
        </div>
      </div>
      <span className="text-xs text-slate-400 mt-1.5">{label}</span>
    </div>
  );
}

// Timeline step — desktop horizontal
function TimelineStepDesktop({
  number,
  title,
  description,
  icon: Icon,
  index,
  isLast,
}: {
  number: string;
  title: string;
  description: string;
  icon: React.ElementType;
  index: number;
  isLast: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="flex flex-col items-center text-center relative"
    >
      {/* Connector line */}
      {!isLast && (
        <div className="absolute top-6 left-1/2 w-full h-0.5 bg-gradient-to-r from-blue-500/60 to-purple-500/60 z-0" />
      )}

      {/* Number circle */}
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mb-4 relative z-10 shadow-[0_0_20px_rgba(99,102,241,0.3)]">
        <span className="text-white font-bold text-sm">{number}</span>
      </div>

      <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-blue-400" />
      </div>
      <h4 className="font-semibold text-white mb-1 text-sm">{title}</h4>
      <p className="text-xs text-slate-400 max-w-[150px] leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}

// Timeline step — mobile vertical
function TimelineStepMobile({
  number,
  title,
  description,
  icon: Icon,
  index,
  isLast,
}: {
  number: string;
  title: string;
  description: string;
  icon: React.ElementType;
  index: number;
  isLast: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className="flex gap-4 relative"
    >
      {/* Vertical line */}
      <div className="flex flex-col items-center">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(99,102,241,0.3)] z-10">
          <span className="text-white font-bold text-sm">{number}</span>
        </div>
        {!isLast && (
          <div className="w-0.5 flex-1 bg-gradient-to-b from-blue-500/60 to-purple-500/30 mt-2" />
        )}
      </div>

      {/* Content */}
      <div className="pb-8">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="w-4 h-4 text-blue-400" />
          <h4 className="font-semibold text-white">{title}</h4>
        </div>
        <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}

// AI measurement card (3-column section)
function MeasurementCard({
  icon: Icon,
  emoji,
  title,
  features,
  accentColor,
  index,
}: {
  icon: React.ElementType;
  emoji: string;
  title: string;
  features: string[];
  accentColor: string;
  index: number;
}) {
  const colorClasses: Record<string, string> = {
    blue: "from-blue-500/20 to-blue-500/5 border-blue-500/30 hover:border-blue-500/60 hover:shadow-blue-500/20",
    purple:
      "from-purple-500/20 to-purple-500/5 border-purple-500/30 hover:border-purple-500/60 hover:shadow-purple-500/20",
    cyan: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/30 hover:border-cyan-500/60 hover:shadow-cyan-500/20",
  };

  const checkColors: Record<string, string> = {
    blue: "text-blue-400",
    purple: "text-purple-400",
    cyan: "text-cyan-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.15, duration: 0.5 }}
      className={`p-6 rounded-2xl bg-gradient-to-b ${colorClasses[accentColor]} 
                  border transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}
    >
      <div className="text-4xl mb-4">{emoji}</div>
      <h3 className="text-xl font-semibold text-white mb-4">{title}</h3>
      <ul className="space-y-3">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
            <Check
              className={`w-4 h-4 mt-0.5 flex-shrink-0 ${checkColors[accentColor]}`}
            />
            {feature}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   MAIN PAGE
   ───────────────────────────────────────────── */

export default function HowItWorksPage() {
  // 7-step timeline data
  const timelineSteps = [
    {
      number: "01",
      title: "Setup",
      description:
        "HR admin links the device to their org account, loads the candidate's profile and the job role before the interview starts.",
      icon: Settings,
    },
    {
      number: "02",
      title: "Pairing",
      description:
        "Device connects to the HR laptop and dashboard via Bluetooth 5.2 — a one-tap pairing that takes seconds.",
      icon: Bluetooth,
    },
    {
      number: "03",
      title: "Capture",
      description:
        "Device is worn as a collar or placed on the table. HR clicks \"Start\" — no further device interaction needed from the candidate.",
      icon: Play,
    },
    {
      number: "04",
      title: "Live AI Analysis",
      description:
        "While the candidate speaks naturally, HireLens transcribes and evaluates speech, watches eye contact and posture, and checks answers against the role's requirements — all in real time on the HR dashboard.",
      icon: Brain,
    },
    {
      number: "05",
      title: "Smart Prompting",
      description:
        "If the AI detects a weak or off-target answer, it surfaces a follow-up question on the HR screen. HR can use it or ask their own — the AI assists, it doesn't run the interview.",
      icon: Sparkles,
    },
    {
      number: "06",
      title: "Scoring",
      description:
        "Four live sub-scores (Communication, Technical, Confidence, Behavioral) combine into one Composite Score — a single number that represents overall candidate fit — with a Hire / Review / Reject recommendation.",
      icon: BarChart3,
    },
    {
      number: "07",
      title: "Report & Ranking",
      description:
        "Session ends, a full PDF report auto-generates, and the candidate is added to a role-specific ranked leaderboard alongside every other applicant for that role.",
      icon: FileCheck,
    },
  ];

  // AI measurement data
  const measurements = [
    {
      icon: Mic,
      emoji: "🗣️",
      title: "Voice Intelligence",
      features: [
        "Speech-to-Text transcription (Whisper ASR)",
        "Tone & Sentiment Analysis",
        "Confidence Scoring (0–100)",
        "Filler Word Detection (Uh, Um, Like…)",
        "Speaking Pace tracker (words per minute)",
      ],
      accentColor: "blue",
    },
    {
      icon: Eye,
      emoji: "👁️",
      title: "Vision Intelligence",
      features: [
        "Eye Contact Detection (%)",
        "Posture & Body Language analysis",
        "Facial Expression Recognition",
        "Micro-expression Analysis",
        "Engagement Level Scoring",
      ],
      accentColor: "purple",
    },
    {
      icon: MessageSquare,
      emoji: "📝",
      title: "Answer Evaluation",
      features: [
        "Technical Keyword & Accuracy Match",
        "STAR Format Detection",
        "Answer Depth Analysis",
        "Contradiction Detection across answers",
        "Communication Clarity Score",
      ],
      accentColor: "cyan",
    },
  ];

  return (
    <main className="min-h-screen bg-[#0A0F1E] overflow-x-hidden scroll-smooth">
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 1 — HERO
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative min-h-[70vh] flex items-center py-20 lg:py-28">
        {/* Background glows */}
        <div className="absolute right-0 top-1/3 w-[500px] h-[500px] bg-blue-500/15 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute left-0 bottom-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              {/* Breadcrumb */}
              <Link
                href="/hirelens"
                className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-blue-400 transition-colors"
              >
                ← Back to HireLens
              </Link>

              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-500/30 bg-blue-500/10">
                <span className="text-blue-400">✦</span>
                <span className="text-sm text-blue-300">
                  How HireLens Works
                </span>
              </div>

              {/* Headline */}
              <h1
                className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight"
                style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}
              >
                Conduct interviews naturally.
                <br />
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Let AI do the rest.
                </span>
              </h1>

              {/* Body */}
              <p className="text-lg text-slate-400 max-w-lg leading-relaxed">
                Wear it. Conduct interviews naturally while HireLens captures
                the conversation in real time. Your HR dashboard continuously
                receives AI-powered insights, live scoring, follow-up question
                suggestions, and candidate evaluation.
              </p>

              {/* Clarification line */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
                <MonitorSmartphone className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <p className="text-sm text-slate-300">
                  <strong className="text-white">Candidates need nothing.</strong>{" "}
                  They just talk naturally.{" "}
                  <strong className="text-white">HR keeps their screen open</strong>{" "}
                  — that&apos;s where the magic happens.
                </p>
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  href="/hirelens#pricing"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold hover:opacity-90 transition-opacity"
                >
                  Pre-Order — ₹24,999
                  <ChevronRight className="w-5 h-5" />
                </Link>
                <button className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-white/30 text-white font-semibold hover:bg-white/10 transition-colors">
                  <Play className="w-5 h-5" />
                  Watch Demo
                </button>
              </div>
            </motion.div>

            {/* Right — Device image */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-blue-500/20 blur-[80px] rounded-full" />
              <Image
                src="/Fluenzy%20AI%20HireLens/HireLens4.jpg"
                alt="HireLens Device — AI Interview Intelligence"
                width={600}
                height={600}
                className="relative rounded-3xl"
                priority
              />

              {/* Floating card: HR Dashboard indicator */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute top-6 -right-2 lg:right-6 p-4 rounded-xl bg-[#0F172A]/90 backdrop-blur border border-[#1E293B] shadow-xl"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">📊</span>
                  <span className="text-sm text-slate-300">HR Dashboard</span>
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                </div>
                <div className="text-sm">
                  <span className="text-slate-400">Live Score: </span>
                  <span className="text-white font-semibold">82</span>
                  <span className="text-green-400 ml-1">/ HIRE</span>
                </div>
              </motion.div>

              {/* Floating card: Candidate side */}
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute bottom-6 -left-2 lg:left-6 p-4 rounded-xl bg-[#0F172A]/90 backdrop-blur border border-[#1E293B] shadow-xl"
              >
                <div className="flex items-center gap-2 mb-1">
                  <UserCheck className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-slate-300">
                    Candidate — No device needed
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-slate-300">
                    Just talks naturally
                  </span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 2 — THE PROBLEM
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative p-8 sm:p-10 rounded-2xl bg-gradient-to-br from-[#0F172A] to-[#0F172A]/80 
                       border border-orange-500/20 shadow-[0_0_30px_rgba(249,115,22,0.05)]"
          >
            {/* Accent stripe */}
            <div className="absolute left-0 top-6 bottom-6 w-1 bg-gradient-to-b from-orange-500 to-amber-500 rounded-r-full" />

            <div className="pl-4">
              <span className="text-sm uppercase tracking-widest text-orange-400 mb-4 block">
                The Problem
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                Manual interviews don&apos;t scale.
              </h2>
              <p className="text-slate-400 leading-relaxed text-lg">
                Manually interviewing hundreds of candidates for one role
                doesn&apos;t scale. Every interviewer has different standards, fatigue
                sets in by candidate #20, and there&apos;s no structured way to compare
                candidate #12 against candidate #312. You end up trusting gut
                feelings instead of data.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 3 — HOW IT WORKS (7-STEP TIMELINE)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="py-24 lg:py-32 bg-[#0F172A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-sm uppercase tracking-widest text-blue-400 mb-4 block">
              The Full Workflow
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Interview Intelligence in 7 Steps.
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              From setup to final hiring decision — here&apos;s exactly what happens,
              step by step.
            </p>
          </motion.div>

          {/* Desktop: horizontal stepper */}
          <div className="hidden lg:grid lg:grid-cols-7 gap-4">
            {timelineSteps.map((step, i) => (
              <TimelineStepDesktop
                key={i}
                {...step}
                index={i}
                isLast={i === timelineSteps.length - 1}
              />
            ))}
          </div>

          {/* Mobile: vertical stepper */}
          <div className="lg:hidden">
            {timelineSteps.map((step, i) => (
              <TimelineStepMobile
                key={i}
                {...step}
                index={i}
                isLast={i === timelineSteps.length - 1}
              />
            ))}
          </div>

          {/* Key insight callout */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 p-6 rounded-2xl bg-blue-500/5 border border-blue-500/20 text-center max-w-3xl mx-auto"
          >
            <p className="text-slate-300 leading-relaxed">
              <strong className="text-white">Throughout the entire process</strong>,
              the candidate simply has a natural conversation. They don&apos;t see
              scores, don&apos;t interact with any device, and don&apos;t need to install
              anything. All AI insights appear exclusively on the{" "}
              <strong className="text-blue-400">HR&apos;s dashboard screen</strong>.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 4 — FROM 400 TO TOP 10
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="py-24 lg:py-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl 
                       bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-blue-500/5 
                       border-2 border-blue-500/30 
                       shadow-[0_0_60px_rgba(59,130,246,0.15)] 
                       p-8 sm:p-12 lg:p-16"
          >
            {/* Background accent */}
            <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute -left-20 -bottom-20 w-60 h-60 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />

            <div className="relative z-10">
              <span className="text-sm uppercase tracking-widest text-blue-400 mb-4 block">
                Enterprise Scale
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
                From 400 Applicants
                <br />
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  to Your Top 10.
                </span>
              </h2>

              <p className="text-lg text-slate-300 max-w-2xl mb-10 leading-relaxed">
                Every candidate for a role is scored on the identical rubric —
                same questions, same evaluation criteria, same AI. No
                interviewer bias, no fatigue drift, no inconsistency. HR can
                sort the entire applicant pool by Composite Score and instantly
                surface the top N candidates.
              </p>

              {/* Funnel visual */}
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-10">
                {/* Step 1 */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0 }}
                  className="flex flex-col items-center p-6 rounded-2xl bg-[#0A0F1E]/80 border border-[#1E293B] min-w-[140px]"
                >
                  <Users className="w-8 h-8 text-slate-400 mb-2" />
                  <div className="text-3xl font-bold text-white">400</div>
                  <div className="text-sm text-slate-400">Candidates</div>
                </motion.div>

                {/* Arrow */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  <ArrowRight className="w-6 h-6 text-blue-500 rotate-90 sm:rotate-0" />
                </motion.div>

                {/* Step 2 */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-col items-center p-6 rounded-2xl bg-blue-500/10 border border-blue-500/30 min-w-[140px]"
                >
                  <Filter className="w-8 h-8 text-blue-400 mb-2" />
                  <div className="text-lg font-semibold text-white">
                    Composite Score
                  </div>
                  <div className="text-sm text-slate-400">
                    Ranked by AI
                  </div>
                </motion.div>

                {/* Arrow */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                >
                  <ArrowRight className="w-6 h-6 text-purple-500 rotate-90 sm:rotate-0" />
                </motion.div>

                {/* Step 3 */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-col items-center p-6 rounded-2xl bg-gradient-to-br from-green-500/15 to-emerald-500/5 border border-green-500/30 min-w-[140px]"
                >
                  <Trophy className="w-8 h-8 text-green-400 mb-2" />
                  <div className="text-3xl font-bold text-white">10</div>
                  <div className="text-sm text-slate-400">
                    Top Candidates
                  </div>
                </motion.div>
              </div>

              {/* Before / After */}
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="p-5 rounded-xl bg-red-500/5 border border-red-500/20">
                  <div className="text-sm font-semibold text-red-400 mb-2">
                    ❌ Without HireLens
                  </div>
                  <p className="text-sm text-slate-400">
                    Manually cross-reference hundreds of interview notes, rely on
                    memory and gut feeling, inconsistent evaluation across
                    interviewers, weeks of deliberation.
                  </p>
                </div>
                <div className="p-5 rounded-xl bg-green-500/5 border border-green-500/20">
                  <div className="text-sm font-semibold text-green-400 mb-2">
                    ✅ With HireLens
                  </div>
                  <p className="text-sm text-slate-400">
                    Every candidate scored identically, leaderboard sorts
                    automatically, top performers surface instantly — no bias, no
                    fatigue, no guesswork.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 5 — FULL HISTORY IN ONE VIEW
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="py-24 lg:py-32 bg-[#0F172A]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-sm uppercase tracking-widest text-blue-400 mb-4 block">
              Beyond the Interview
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white">
              More Than One Interview — Full History, in One View.
            </h2>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: description */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <p className="text-lg text-slate-300 leading-relaxed">
                For any candidate who has previously used the Fluenzy AI platform
                to practice mock interviews, HR also sees their{" "}
                <strong className="text-white">public profile</strong>,{" "}
                <strong className="text-white">past practice scores</strong>, and{" "}
                <strong className="text-white">global ranking</strong> — right
                alongside the live HireLens session data.
              </p>
              <p className="text-slate-400 leading-relaxed">
                This gives a longitudinal view of the candidate, not just a
                single interview snapshot. You can see how much they&apos;ve
                practiced, how they&apos;ve improved over time, and how they compare
                globally — before and during the live interview.
              </p>

              {/* Feature list */}
              <div className="space-y-3 pt-2">
                {[
                  {
                    icon: Globe,
                    text: "Public profile with practice history",
                  },
                  {
                    icon: TrendingUp,
                    text: "Practice scores and improvement trends",
                  },
                  {
                    icon: Trophy,
                    text: "Global ranking against all platform users",
                  },
                  {
                    icon: History,
                    text: "Previous practice session reports",
                  },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-4 h-4 text-blue-400" />
                    </div>
                    <span className="text-slate-300 text-sm">{item.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right: mock profile card */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="p-6 rounded-2xl bg-[#0F172A] border border-[#1E293B] shadow-xl">
                {/* Profile header */}
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[#1E293B]">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">A</span>
                  </div>
                  <div>
                    <div className="text-white font-semibold">
                      Candidate Profile
                    </div>
                    <div className="text-sm text-slate-400">
                      fluenzyai.app/u/username
                    </div>
                  </div>
                  <div className="ml-auto px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30">
                    <span className="text-xs text-green-400 font-medium">
                      Active
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    { label: "Practice Sessions", value: "47" },
                    { label: "Avg. Score", value: "78" },
                    { label: "Global Rank", value: "#342" },
                  ].map((stat, i) => (
                    <div
                      key={i}
                      className="text-center p-3 rounded-xl bg-[#0A0F1E] border border-[#1E293B]"
                    >
                      <div className="text-xl font-bold text-white">
                        {stat.value}
                      </div>
                      <div className="text-xs text-slate-400">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Score gauges */}
                <div className="flex justify-around mb-6">
                  <ScoreGauge
                    score={82}
                    label="Communication"
                    color="#3B82F6"
                    delay={0}
                  />
                  <ScoreGauge
                    score={74}
                    label="Technical"
                    color="#7C3AED"
                    delay={0.2}
                  />
                  <ScoreGauge
                    score={68}
                    label="Confidence"
                    color="#F97316"
                    delay={0.4}
                  />
                </div>

                {/* Links */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/15 text-sm">
                    <Globe className="w-4 h-4 text-blue-400" />
                    <span className="text-slate-300">View Public Profile</span>
                    <ChevronRight className="w-4 h-4 text-slate-500 ml-auto" />
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/15 text-sm">
                    <History className="w-4 h-4 text-blue-400" />
                    <span className="text-slate-300">
                      View Practice Reports
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-500 ml-auto" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 6 — FAIR BY DESIGN
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-sm uppercase tracking-widest text-blue-400 mb-4 block">
              Transparency & Trust
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white">
              Fair by Design.
            </h2>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: visual */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="p-8 rounded-2xl bg-[#0F172A] border border-[#1E293B]">
                {/* Email preview mock */}
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#1E293B]">
                  <Mail className="w-6 h-6 text-blue-400" />
                  <div>
                    <div className="text-white font-semibold text-sm">
                      Evaluation Report — Product Manager Role
                    </div>
                    <div className="text-xs text-slate-400">
                      From: hr@company.com → candidate@email.com
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  {[
                    {
                      label: "Communication",
                      score: 82,
                      color: "bg-blue-500",
                    },
                    { label: "Technical", score: 74, color: "bg-purple-500" },
                    {
                      label: "Confidence",
                      score: 87,
                      color: "bg-orange-500",
                    },
                    {
                      label: "Behavioral",
                      score: 79,
                      color: "bg-green-500",
                    },
                  ].map((item, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">{item.label}</span>
                        <span className="text-white font-medium">
                          {item.score}/100
                        </span>
                      </div>
                      <div className="h-2 bg-[#1E293B] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${item.score}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: i * 0.15 }}
                          className={`h-full ${item.color} rounded-full`}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-center p-4 rounded-xl bg-[#0A0F1E] border border-[#1E293B]">
                  <div className="text-3xl font-bold text-white">80.5</div>
                  <div className="text-sm text-slate-400">
                    Composite Score / 100
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right: copy */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h3 className="text-3xl font-bold text-white">
                Candidates deserve to know
                <br />
                <span className="text-blue-400">why.</span>
              </h3>

              <p className="text-lg text-slate-300 leading-relaxed">
                HR can send each candidate their own full evaluation report
                directly from the HR dashboard — the same detailed report HR
                sees, including every scored section.
              </p>

              <p className="text-slate-400 leading-relaxed">
                No candidate is left wondering why they weren&apos;t selected. If they
                want to know, HR can share the exact evaluation with them —
                scored, structured, and transparent.
              </p>

              <div className="flex items-start gap-4 p-5 rounded-xl bg-amber-500/5 border border-amber-500/20">
                <Shield className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-white mb-1">
                    HR-triggered, not automatic
                  </h4>
                  <p className="text-sm text-slate-400">
                    Sharing the report is entirely at the HR team&apos;s discretion.
                    They choose whether and when to send it — it&apos;s never sent
                    automatically.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-5 rounded-xl bg-blue-500/5 border border-blue-500/20">
                <Mail className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-white mb-1">
                    One-click email delivery
                  </h4>
                  <p className="text-sm text-slate-400">
                    Send the evaluation report to any candidate directly from
                    the dashboard via email — no manual PDF export or attachment
                    needed.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 7 — WHAT THE AI MEASURES
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="py-24 lg:py-32 bg-[#0F172A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-sm uppercase tracking-widest text-blue-400 mb-4 block">
              AI Engine
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              What the AI Actually Measures.
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Three intelligence layers run simultaneously during every
              interview, all feeding into your HR dashboard in real time.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {measurements.map((card, i) => (
              <MeasurementCard key={i} {...card} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 8 — HUMAN IN CONTROL
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="py-20 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center p-8 sm:p-12 rounded-2xl bg-[#0F172A] border border-[#1E293B]"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-blue-400" />
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Human in Control. Always.
            </h2>

            <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-6 leading-relaxed">
              AI recommendations are{" "}
              <strong className="text-white">advisory only</strong>. HireLens
              never auto-hires or auto-rejects anyone. Every hiring decision is
              made by a real person — the AI gives you data-backed suggestions,
              you make the final call.
            </p>

            <div className="grid sm:grid-cols-3 gap-4 mt-8">
              {[
                {
                  icon: "✅",
                  title: "HIRE",
                  desc: "Score ≥ 75, no critical flags",
                  color:
                    "border-green-500/30 bg-green-500/10 text-green-400",
                },
                {
                  icon: "⚠️",
                  title: "REVIEW",
                  desc: "Score 55–74 or 1 flag",
                  color:
                    "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
                },
                {
                  icon: "❌",
                  title: "REJECT",
                  desc: "Score < 55 or multiple flags",
                  color: "border-red-500/30 bg-red-500/10 text-red-400",
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`p-4 rounded-xl border ${item.color}`}
                >
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <div className="font-semibold text-white text-sm">
                    {item.title}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {item.desc}
                  </div>
                </motion.div>
              ))}
            </div>

            <p className="text-sm text-slate-500 italic mt-8">
              AI recommendations are advisory only. All final hiring decisions
              remain with humans.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 9 — FINAL CTA
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative py-24 lg:py-32 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <Image
            src="/Fluenzy%20AI%20HireLens/HireLens1.jpg"
            alt="HireLens background"
            fill
            className="object-cover opacity-15"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F1E] via-[#0A0F1E]/80 to-[#0A0F1E]" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
          >
            See HireLens in
            <br />
            <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              Your Next Hiring Round.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto"
          >
            Be among the first organizations to deploy AI-powered interview
            intelligence. Transform how you evaluate, compare, and hire
            candidates at scale.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <Link
              href="/hirelens#pricing"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold hover:opacity-90 transition-opacity"
            >
              Pre-Order HireLens
            </Link>
            <button className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-white/30 text-white font-semibold hover:bg-white/10 transition-colors">
              Book a Demo
            </button>
          </motion.div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm text-slate-400">
            <a
              href="mailto:enterprise@fluenzy.ai"
              className="hover:text-white transition-colors"
            >
              Enterprise inquiries: enterprise@fluenzy.ai
            </a>
            <span className="hidden sm:inline">·</span>
            <a
              href="mailto:developers@fluenzy.ai"
              className="hover:text-white transition-colors"
            >
              Developer API: developers@fluenzy.ai
            </a>
          </div>
        </div>
      </section>

      {/* Global styles */}
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap");

        body {
          font-family: "DM Sans", sans-serif;
        }
      `}</style>
    </main>
  );
}
