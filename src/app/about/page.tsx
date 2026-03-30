"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  Sparkles,
  Target,
  Users,
  BarChart3,
  Brain,
  MessageSquare,
  FileText,
  GraduationCap,
  Code2,
  Building2,
  Handshake,
  Building,
  Check,
  ArrowRight,
} from "lucide-react";

// Note: Metadata must be in a separate layout.tsx file for client components
// Create src/app/about/layout.tsx with metadata export

// Animated counter component
function AnimatedCounter({
  value,
  suffix = "",
  duration = 2,
}: {
  value: string;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [displayValue, setDisplayValue] = useState("0");

  useEffect(() => {
    if (!isInView) return;

    if (value === "∞") {
      setDisplayValue("∞");
      return;
    }

    const numericValue = parseInt(value.replace(/\D/g, ""));
    if (isNaN(numericValue)) {
      setDisplayValue(value);
      return;
    }

    let start = 0;
    const end = numericValue;
    const incrementTime = (duration * 1000) / end;

    const timer = setInterval(() => {
      start += Math.ceil(end / 50);
      if (start >= end) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(start.toString());
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [isInView, value, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {displayValue}
      {suffix}
    </span>
  );
}

// Word-by-word animation component
function AnimatedTitle({ text, highlightWord }: { text: string; highlightWord: string }) {
  const words = text.split(" ");

  return (
    <span className="inline">
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.5, ease: "easeOut" }}
          className={`inline-block mr-[0.25em] ${
            word === highlightWord
              ? "bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent"
              : ""
          }`}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

// Problem card component
function ProblemCard({
  icon: Icon,
  title,
  description,
  index,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="group relative p-6 rounded-2xl bg-[#0F172A] border border-[#1E293B] 
                 hover:border-purple-500/50 transition-all duration-300
                 hover:shadow-[0_0_30px_rgba(124,58,237,0.2)]"
    >
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 
                      flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2 font-syne">{title}</h3>
      <p className="text-slate-400 leading-relaxed">{description}</p>
    </motion.div>
  );
}

// Feature row component
function FeatureRow({
  title,
  description,
  tags,
  visual,
  reversed = false,
  index,
}: {
  title: string;
  description: string;
  tags: string[];
  visual: React.ReactNode;
  reversed?: boolean;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
      className={`flex flex-col ${reversed ? "lg:flex-row-reverse" : "lg:flex-row"} 
                  gap-8 lg:gap-16 items-center`}
    >
      {/* Text content */}
      <div className="flex-1 space-y-4">
        <h3 className="text-3xl lg:text-4xl font-bold text-white font-syne">{title}</h3>
        <p className="text-lg text-slate-400 leading-relaxed">{description}</p>
        <div className="flex flex-wrap gap-2 pt-2">
          {tags.map((tag, i) => (
            <span
              key={i}
              className="px-3 py-1 text-sm rounded-full bg-purple-500/10 text-purple-400 
                         border border-purple-500/20"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Visual */}
      <div className="flex-1 w-full">{visual}</div>
    </motion.div>
  );
}

// Interview Score Visual
function InterviewScoreVisual() {
  return (
    <div className="relative p-6 rounded-2xl bg-[#0F172A] border border-[#1E293B] shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <span className="text-sm text-slate-400">Interview Score</span>
        <span className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded">LIVE</span>
      </div>

      {/* Circular gauge */}
      <div className="flex justify-center mb-6">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="64" cy="64" r="56" stroke="#1E293B" strokeWidth="8" fill="none" />
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="url(#gradient)"
              strokeWidth="8"
              fill="none"
              strokeDasharray="352"
              strokeDashoffset="88"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#7C3AED" />
                <stop offset="100%" stopColor="#3B82F6" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-bold text-white font-syne">85</span>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Confidence", value: "92%" },
          { label: "Eye Contact", value: "78%" },
          { label: "Clarity", value: "88%" },
          { label: "STAR Method", value: "85%" },
        ].map((metric, i) => (
          <div key={i} className="bg-[#1E293B]/50 rounded-lg p-3">
            <div className="text-xs text-slate-400">{metric.label}</div>
            <div className="text-lg font-semibold text-white">{metric.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// GD Room Visual
function GDRoomVisual() {
  const messages = [
    { role: "Initiator", name: "Alex AI", message: "Let's start with the core argument...", color: "purple" },
    { role: "Challenger", name: "Maya AI", message: "I'd like to present a counter-view...", color: "blue" },
    { role: "Analyzer", name: "Sam AI", message: "Looking at the data, we can see...", color: "green" },
  ];

  return (
    <div className="space-y-3 p-4 rounded-2xl bg-[#0F172A] border border-[#1E293B]">
      {messages.map((msg, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.2 }}
          className="flex gap-3 items-start"
        >
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium
                        ${msg.color === "purple" ? "bg-purple-500" : msg.color === "blue" ? "bg-blue-500" : "bg-green-500"}`}
          >
            {msg.name.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-white font-medium text-sm">{msg.name}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full
                            ${msg.color === "purple" ? "bg-purple-500/20 text-purple-400" : msg.color === "blue" ? "bg-blue-500/20 text-blue-400" : "bg-green-500/20 text-green-400"}`}
              >
                {msg.role}
              </span>
            </div>
            <p className="text-slate-400 text-sm">{msg.message}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ATS Score Visual
function ATSScoreVisual() {
  const scores = [
    { label: "Keyword Match", value: 24, color: "from-red-500 to-orange-500" },
    { label: "Skills Alignment", value: 68, color: "from-yellow-500 to-green-500" },
    { label: "Experience Fit", value: 82, color: "from-green-500 to-emerald-500" },
    { label: "Education Match", value: 95, color: "from-emerald-500 to-cyan-500" },
  ];

  return (
    <div className="p-6 rounded-2xl bg-[#0F172A] border border-[#1E293B] space-y-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-400">ATS Compatibility Score</span>
        <span className="text-2xl font-bold text-white">67%</span>
      </div>
      {scores.map((score, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, width: 0 }}
          whileInView={{ opacity: 1, width: "100%" }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1, duration: 0.5 }}
        >
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-400">{score.label}</span>
            <span className="text-white font-medium">{score.value}%</span>
          </div>
          <div className="h-2 bg-[#1E293B] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${score.value}%` }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + i * 0.1, duration: 0.8, ease: "easeOut" }}
              className={`h-full rounded-full bg-gradient-to-r ${score.color}`}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Timeline item component
function TimelineItem({
  date,
  title,
  status,
  isVision = false,
  index,
}: {
  date: string;
  title: string;
  status: string;
  isVision?: boolean;
  index: number;
}) {
  const isLeft = index % 2 === 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: isLeft ? -30 : 30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.15, duration: 0.5 }}
      className={`flex items-center gap-4 ${isLeft ? "flex-row" : "flex-row-reverse"} 
                  relative`}
    >
      {/* Content */}
      <div className={`flex-1 ${isLeft ? "text-right" : "text-left"}`}>
        <div
          className={`inline-block p-5 rounded-xl ${
            isVision
              ? "bg-gradient-to-br from-purple-500/20 to-blue-500/20 border-2 border-purple-500/50 shadow-[0_0_30px_rgba(124,58,237,0.3)]"
              : "bg-[#0F172A] border border-[#1E293B]"
          }`}
        >
          <div className={`text-sm ${isVision ? "text-purple-400" : "text-slate-500"} mb-1`}>
            {date}
          </div>
          <div className={`font-semibold ${isVision ? "text-xl text-white" : "text-white"} mb-2`}>
            {title}
          </div>
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              status === "VISION"
                ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white"
                : status === "UPCOMING"
                  ? "bg-green-500/20 text-green-400"
                  : status === "PLANNED"
                    ? "bg-blue-500/20 text-blue-400"
                    : "bg-slate-500/20 text-slate-400"
            }`}
          >
            {status}
          </span>
        </div>
      </div>

      {/* Center dot */}
      <div className="relative z-10">
        <div
          className={`w-4 h-4 rounded-full ${
            isVision
              ? "bg-gradient-to-r from-purple-500 to-blue-500 animate-pulse"
              : "bg-purple-500"
          }`}
        />
      </div>

      {/* Spacer */}
      <div className="flex-1" />
    </motion.div>
  );
}

// User card component
function UserCard({
  icon: Icon,
  title,
  description,
  index,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="group flex-shrink-0 w-64 p-6 rounded-2xl bg-[#0F172A] border border-[#1E293B]
                 hover:-translate-y-2 transition-all duration-300
                 hover:border-purple-500/30 hover:shadow-lg"
    >
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 
                      flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        <Icon className="w-7 h-7 text-purple-400" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2 font-syne">{title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
    </motion.div>
  );
}

export default function AboutPage() {
  const problems = [
    {
      icon: Target,
      title: "Subjective Feedback",
      description:
        "Human feedback varies by mood, bias, and inconsistency. You deserve objective truth.",
    },
    {
      icon: BarChart3,
      title: "ATS Blindness",
      description:
        "Talented people are filtered out by machines before any human sees their skills.",
    },
    {
      icon: Brain,
      title: "Non-Data Driven",
      description:
        "Candidates never know why they seem nervous or where their eye contact fails.",
    },
    {
      icon: Users,
      title: "Unscalable Coaching",
      description:
        "Mock interviews with humans can't scale to millions of students preparing simultaneously.",
    },
  ];

  const timeline = [
    { date: "Q3 2026", title: "Mobile App (iOS/Android)", status: "UPCOMING" },
    { date: "Q4 2026", title: "Live Human Mentor Interviews", status: "PLANNED" },
    { date: "Q1 2027", title: "VR Office Simulation", status: "RESEARCH" },
    { date: "2030", title: "Fluenzy Report = Global Hiring Standard", status: "VISION", isVision: true },
  ];

  const users = [
    {
      icon: GraduationCap,
      title: "Students",
      description: "Campus placement preparation. Beat the competition with data-driven practice.",
    },
    {
      icon: Code2,
      title: "Developers",
      description: "FAANG-level technical mastery. System design, DSA, and behavioral coaching.",
    },
    {
      icon: Building2,
      title: "Universities",
      description: "Placement analytics portal for TPOs. Track every student's readiness score.",
    },
    {
      icon: Handshake,
      title: "HR Teams",
      description: "AI-powered candidate screening. Watch confidence highlights, not full recordings.",
    },
    {
      icon: Building,
      title: "Enterprises",
      description: "Internal skill-mapping and training automation at scale.",
    },
  ];

  return (
    <main className="min-h-screen bg-[#0A0F1E] overflow-x-hidden">
      {/* Noise texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03] z-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* SECTION 1: HERO */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20">
        {/* Animated gradient background */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 50, 0],
              y: [0, 30, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px]"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              x: [0, -30, 0],
              y: [0, -50, 0],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px]"
          />
        </div>

        <div className="relative z-10 text-center max-w-5xl mx-auto">
          {/* Overline badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-purple-500/30 
                       bg-purple-500/10 text-purple-400 text-sm uppercase tracking-widest mb-8"
          >
            <Sparkles className="w-4 h-4" />
            Our Story
          </motion.div>

          {/* H1 */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold text-white leading-tight mb-8 font-syne">
            <AnimatedTitle text="We're Building the Future of Career Readiness." highlightWord="Future" />
          </h1>

          {/* Body */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed"
          >
            Fluenzy AI was born from a simple observation: 80% of talented candidates fail not
            because they lack skills — but because they were never trained to communicate them. We're
            here to fix that. Forever.
          </motion.p>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <ChevronDown className="w-8 h-8 text-slate-500" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 2: MISSION STATEMENT */}
      <section className="relative py-24 lg:py-32 bg-[#0F172A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-12 lg:gap-16 items-center">
            {/* Left: Quote */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-3 relative pl-6 border-l-4 border-gradient-to-b from-purple-500 to-blue-500"
              style={{
                borderImage: "linear-gradient(to bottom, #7C3AED, #3B82F6) 1",
              }}
            >
              <span className="text-sm uppercase tracking-widest text-purple-400 mb-4 block">
                Our Mission
              </span>
              <blockquote className="text-2xl sm:text-3xl lg:text-4xl text-white font-syne leading-snug">
                "To give every job-seeker on Earth an AI-powered Career Operating System — that
                analyzes, trains, and certifies their competencies with absolute objectivity."
              </blockquote>
            </motion.div>

            {/* Right: Stats */}
            <div className="lg:col-span-2 space-y-8">
              {[
                { value: "80", suffix: "%", desc: "of candidates fail at communication, not skills" },
                { value: "5", suffix: " Years", desc: "to make Fluenzy report a hiring standard" },
                { value: "∞", suffix: "", desc: "candidates we aim to empower" },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.5 }}
                  className="text-center lg:text-left"
                >
                  <div className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent font-syne">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </div>
                  <p className="text-slate-400 mt-1">{stat.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: THE PROBLEM */}
      <section className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-sm uppercase tracking-widest text-purple-400 mb-4 block">
              The Problem
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white font-syne">
              Hiring Was Broken. We Fixed It.
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-6">
            {problems.map((problem, i) => (
              <ProblemCard key={i} {...problem} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: WHAT WE'VE BUILT */}
      <section className="py-24 lg:py-32 bg-[#0F172A]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <span className="text-sm uppercase tracking-widest text-purple-400 mb-4 block">
              The Platform
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white font-syne">
              One Ecosystem. Infinite Readiness.
            </h2>
          </motion.div>

          <div className="space-y-24">
            <FeatureRow
              title="AI Virtual Interviewer"
              description="A multimodal AI agent that conducts live Technical and HR rounds — analyzing your voice, eye contact, posture, and answers in real-time."
              tags={["Live Analysis", "STAR Method", "Body Language AI"]}
              visual={<InterviewScoreVisual />}
              index={0}
            />

            <FeatureRow
              title="Neural GD Room"
              description="Multi-agent Group Discussion simulation with 4-8 AI personas — Initiator, Challenger, Analyzer. Train under real discussion pressure."
              tags={["4-8 AI Agents", "Pressure Training", "Live Scoring"]}
              visual={<GDRoomVisual />}
              reversed
              index={1}
            />

            <FeatureRow
              title="ATS Scoring Engine"
              description="Upload your resume. Our AI parses 50+ data points in under 2 seconds and tells you exactly why you're being filtered out — and how to fix it."
              tags={["50+ Data Points", "<2s Analysis", "Gap Detection"]}
              visual={<ATSScoreVisual />}
              index={2}
            />
          </div>
        </div>
      </section>

      {/* SECTION 5: TIMELINE */}
      <section className="py-24 lg:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <span className="text-sm uppercase tracking-widest text-purple-400 mb-4 block">
              The Roadmap
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white font-syne">
              Where We're Going.
            </h2>
          </motion.div>

          <div className="relative">
            {/* Timeline line */}
            <div
              className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 bg-gradient-to-b from-purple-500 via-blue-500 to-purple-500/20"
            />

            <div className="space-y-12">
              {timeline.map((item, i) => (
                <TimelineItem key={i} {...item} index={i} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: WHO WE SERVE */}
      <section className="py-24 lg:py-32 bg-[#0F172A]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-sm uppercase tracking-widest text-purple-400 mb-4 block">
              Who We Serve
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white font-syne">
              Built for Every Stage of the Journey.
            </h2>
          </motion.div>

          <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide lg:grid lg:grid-cols-5 lg:overflow-visible">
            {users.map((user, i) => (
              <UserCard key={i} {...user} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 7: CTA */}
      <section className="relative py-24 lg:py-32 overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-gradient-to-br from-purple-900/50 via-[#0A0F1E] to-blue-900/50"
            style={{
              animation: "gradient-shift 10s ease infinite",
            }}
          />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white font-syne leading-tight mb-6"
          >
            Your Dream Job Doesn't Wait.
            <br />
            <span className="bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
              Neither Should Your Preparation.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto"
          >
            Join thousands of candidates already training with AI-powered precision. It's free to
            start.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-10"
          >
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full 
                         bg-white text-[#0A0F1E] font-semibold hover:bg-slate-100 transition-colors"
            >
              Start Training Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/train"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full 
                         border border-white/30 text-white font-semibold hover:bg-white/10 transition-colors"
            >
              Explore Platform
            </Link>
          </motion.div>

          {/* Trust signals */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-6 text-sm text-slate-400"
          >
            {[
              "No credit card required",
              "Free forever plan available",
              "Used by 50+ colleges",
            ].map((signal, i) => (
              <div key={i} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                <span>{signal}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#1E293B] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-500">
          © 2026 Fluenzy AI · 
          <Link href="/privacy" className="hover:text-slate-300 mx-2">Privacy Policy</Link> · 
          <Link href="/terms" className="hover:text-slate-300 mx-2">Terms</Link> · 
          <a href="mailto:enterprise@fluenzy.ai" className="hover:text-slate-300 mx-2">
            enterprise@fluenzy.ai
          </a>
        </div>
      </footer>

      {/* Global styles for animations */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
        
        .font-syne {
          font-family: 'Syne', sans-serif;
        }
        
        body {
          font-family: 'DM Sans', sans-serif;
        }
        
        @keyframes gradient-shift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </main>
  );
}
