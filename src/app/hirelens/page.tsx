"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Mic,
  Camera,
  Cpu,
  Wifi,
  Battery,
  Zap,
  HardDrive,
  Scale,
  Lock,
  Shield,
  Eye,
  FileText,
  Check,
  ChevronRight,
  Play,
  Bluetooth,
  Settings,
  Sparkles,
  Brain,
  BarChart3,
  FileCheck,
  Clock,
  Users,
  Building2,
  Mail,
} from "lucide-react";

// Animated score gauge component
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
      <div className="relative w-24 h-24">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r="40"
            stroke="#1E293B"
            strokeWidth="8"
            fill="none"
          />
          <motion.circle
            cx="48"
            cy="48"
            r="40"
            stroke={color}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={251.2}
            initial={{ strokeDashoffset: 251.2 }}
            animate={isInView ? { strokeDashoffset: 251.2 - (251.2 * score) / 100 } : {}}
            transition={{ duration: 1.5, delay, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-white">{score}</span>
        </div>
      </div>
      <span className="text-sm text-slate-400 mt-2">{label}</span>
    </div>
  );
}

// Workflow step component
function WorkflowStep({
  number,
  title,
  description,
  icon: Icon,
  index,
}: {
  number: string;
  title: string;
  description: string;
  icon: React.ElementType;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.12, duration: 0.5 }}
      className="flex flex-col items-center text-center relative"
    >
      {/* Connector line (hidden on first and mobile) */}
      {index > 0 && (
        <div className="hidden lg:block absolute -left-1/2 top-6 w-full h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 -z-10" />
      )}
      
      {/* Number circle */}
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mb-4 relative z-10">
        <span className="text-white font-bold">{number}</span>
      </div>
      
      <Icon className="w-6 h-6 text-blue-400 mb-2" />
      <h4 className="font-semibold text-white mb-1">{title}</h4>
      <p className="text-sm text-slate-400 max-w-[140px]">{description}</p>
    </motion.div>
  );
}

// Spec row component
function SpecRow({
  icon: Icon,
  name,
  value,
  index,
}: {
  icon: React.ElementType;
  name: string;
  value: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className="flex items-center gap-4 py-4 border-b border-[#1E293B] last:border-0 
                 hover:bg-blue-500/5 px-3 -mx-3 transition-colors cursor-default"
    >
      <Icon className="w-5 h-5 text-blue-400 flex-shrink-0" />
      <span className="text-slate-400 w-28 flex-shrink-0">{name}</span>
      <span className="text-white">{value}</span>
    </motion.div>
  );
}

// AI Card component
function AICard({
  icon,
  title,
  features,
  accentColor,
  index,
}: {
  icon: string;
  title: string;
  features: string[];
  accentColor: string;
  index: number;
}) {
  const colorClasses: Record<string, string> = {
    blue: "from-blue-500/20 to-blue-500/5 border-blue-500/30 hover:border-blue-500/60 hover:shadow-blue-500/20",
    purple: "from-purple-500/20 to-purple-500/5 border-purple-500/30 hover:border-purple-500/60 hover:shadow-purple-500/20",
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
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-white mb-4">{title}</h3>
      <ul className="space-y-3">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
            <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${checkColors[accentColor]}`} />
            {feature}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

// Pricing card component
function PricingCard({
  title,
  price,
  period,
  subtitle,
  features,
  cta,
  href,
  highlighted = false,
  badge,
}: {
  title: string;
  price: string;
  period?: string;
  subtitle?: string;
  features: string[];
  cta: string;
  href?: string;
  highlighted?: boolean;
  badge?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`relative p-8 rounded-2xl transition-all duration-300 ${
        highlighted
          ? "bg-gradient-to-b from-blue-500/10 to-transparent border-2 border-blue-500/50 scale-105 shadow-[0_0_40px_rgba(59,130,246,0.2)]"
          : "bg-[#0F172A] border border-[#1E293B]"
      }`}
    >
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-4 py-1 text-xs font-semibold bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full">
            {badge}
          </span>
        </div>
      )}
      
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <div className="mb-4">
        <span className="text-4xl font-bold text-white">{price}</span>
        {period && <span className="text-slate-400 ml-1">{period}</span>}
      </div>
      {subtitle && <p className="text-sm text-slate-400 mb-6">{subtitle}</p>}
      
      <ul className="space-y-3 mb-8">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
            <Check className="w-4 h-4 mt-0.5 text-blue-400 flex-shrink-0" />
            {feature}
          </li>
        ))}
      </ul>
      
      <Link
        href={href || "#"}
        className={`block w-full py-3 rounded-xl text-center font-semibold transition-all ${
          highlighted
            ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:opacity-90"
            : "border border-slate-600 text-white hover:bg-slate-800"
        }`}
      >
        {cta}
      </Link>
    </motion.div>
  );
}

// Security tile component
function SecurityTile({
  icon,
  title,
  description,
  index,
}: {
  icon: string;
  title: string;
  description: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="flex items-start gap-4 p-4 rounded-xl bg-[#0F172A]/50 border border-[#1E293B] hover:border-blue-500/30 transition-colors"
    >
      <span className="text-2xl">{icon}</span>
      <div>
        <h4 className="font-semibold text-white mb-1">{title}</h4>
        <p className="text-sm text-slate-400">{description}</p>
      </div>
    </motion.div>
  );
}

export default function HireLensPage() {
  const workflowSteps = [
    { number: "01", title: "HR Setup", description: "Charge device, login, load candidate profile", icon: Settings },
    { number: "02", title: "BLE Pairing", description: "Device connects to laptop via Bluetooth 5.2", icon: Bluetooth },
    { number: "03", title: "Session Start", description: "Click Start — device begins capture", icon: Play },
    { number: "04", title: "Live Analysis", description: "AI processes voice + video in real-time", icon: Brain },
    { number: "05", title: "AI Questions", description: "Smart follow-ups appear after each answer", icon: Sparkles },
    { number: "06", title: "Session End", description: "AI generates full PDF report automatically", icon: FileCheck },
    { number: "07", title: "Decision", description: "Review report + recommendation. Hire smarter.", icon: Check },
  ];

  const specs = [
    { icon: Mic, name: "Microphone", value: "Omnidirectional MEMS · 20Hz–20kHz · SNR 65dB" },
    { icon: Camera, name: "Camera", value: "2MP · 1080p @ 30fps · 90° FOV · IR Capable" },
    { icon: Cpu, name: "Processor", value: "ARM Cortex-M7 Edge SoC" },
    { icon: Wifi, name: "Connectivity", value: "BLE 5.2 + 2.4GHz WiFi" },
    { icon: Battery, name: "Battery", value: "500mAh LiPo · ~6hr active use" },
    { icon: Zap, name: "Charging", value: "USB-C · Full charge in 90 min" },
    { icon: HardDrive, name: "Storage", value: "8GB onboard session backup" },
    { icon: Scale, name: "Weight", value: "< 28g" },
    { icon: Lock, name: "Encryption", value: "AES-256 at transmission" },
  ];

  const aiCards = [
    {
      icon: "🗣️",
      title: "Voice Intelligence",
      features: [
        "Speech-to-Text (Whisper ASR)",
        "Tone & Sentiment Analysis",
        "Confidence Scoring (0–100)",
        "Filler Word Detection (Uh, Um, Like)",
        "Speaking Pace (WPM tracker)",
      ],
      accentColor: "blue",
    },
    {
      icon: "👁️",
      title: "Vision Intelligence",
      features: [
        "Facial Expression Recognition",
        "Eye Contact Detection (%)",
        "Micro-expression Analysis",
        "Posture & Body Language",
        "Engagement Level Scoring",
      ],
      accentColor: "purple",
    },
    {
      icon: "📝",
      title: "NLP Answer Evaluation",
      features: [
        "STAR Format Detection",
        "Technical Keyword Match",
        "Answer Depth Analysis",
        "Contradiction Detection",
        "Communication Clarity Score",
      ],
      accentColor: "cyan",
    },
  ];

  const securityTiles = [
    { icon: "🔐", title: "AES-256 Encryption", description: "Device encrypts before transmitting" },
    { icon: "📋", title: "Consent-First", description: "Logged timestamp for every session" },
    { icon: "🗄️", title: "Configurable Retention", description: "30 / 90 / 180 day auto-deletion" },
    { icon: "🏢", title: "India Data Residency", description: "Mumbai servers available" },
    { icon: "👁️", title: "Zero Third-Party Sharing", description: "Your data stays yours" },
    { icon: "⚖️", title: "Quarterly Bias Audits", description: "Fair AI, verified regularly" },
  ];

  return (
    <main className="min-h-screen bg-[#0A0F1E] overflow-x-hidden scroll-smooth">
      {/* SECTION 1: HERO */}
      <section className="relative min-h-screen flex items-center py-20 lg:py-0">
        {/* Background glow */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[150px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            {/* Left Column */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              {/* Product badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-500/30 bg-blue-500/10">
                <span className="text-blue-400">✦</span>
                <span className="text-sm text-blue-300">NEW — Fluenzy AI Hardware</span>
              </div>
              
              {/* H1 */}
              <div>
                <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold text-white leading-none mb-4" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
                  HireLens.
                </h1>
                <p className="text-2xl sm:text-3xl lg:text-4xl text-slate-300 leading-tight">
                  The world's first AI-powered<br />
                  interview collar device.
                </p>
              </div>
              
              {/* Body */}
              <p className="text-lg text-slate-400 max-w-md">
                Wear it. Conduct interviews naturally while HireLens captures the conversation in real time. 
                Your HR dashboard continuously receives AI-powered insights, live scoring, follow-up question suggestions, and candidate evaluation.
              </p>
              
              {/* CTA row */}
              <div className="flex flex-wrap gap-4">
                <Link
                  href="#pricing"
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

              {/* How it works link */}
              <Link
                href="/hirelens/how-it-works"
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium group"
              >
                Learn how HireLens works, step by step
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              {/* Trust row */}
              <div className="flex flex-wrap gap-6 pt-4">
                {[
                  { icon: "🔵", text: "AES-256 Encrypted" },
                  { icon: "🔵", text: "<28g Weight" },
                  { icon: "🔵", text: "6hr Battery" },
                  { icon: "🔵", text: "Real-time AI" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-slate-400">
                    <span>{item.icon}</span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </motion.div>
            
            {/* Right Column - Device Image */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              {/* Device image */}
              <div className="relative transform rotate-3">
                <div className="absolute inset-0 bg-blue-500/30 blur-[60px] rounded-full" />
                <Image
                  src="/Fluenzy%20AI%20HireLens/HireLens4.jpg"
                  alt="HireLens Device"
                  width={600}
                  height={600}
                  className="relative rounded-3xl"
                  priority
                />
                
                {/* Floating annotation card 1 */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-8 -right-4 lg:right-8 p-4 rounded-xl bg-[#0F172A]/90 backdrop-blur border border-[#1E293B] shadow-xl"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🎙️</span>
                    <span className="text-sm text-slate-300">Capturing voice...</span>
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  </div>
                  <div className="text-sm">
                    <span className="text-slate-400">Confidence Score: </span>
                    <span className="text-white font-semibold">87</span>
                    <span className="text-green-400 ml-1">/ HIGH</span>
                  </div>
                </motion.div>
                
                {/* Floating annotation card 2 */}
                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute bottom-8 -left-4 lg:left-8 p-4 rounded-xl bg-[#0F172A]/90 backdrop-blur border border-[#1E293B] shadow-xl"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">👁️</span>
                    <span className="text-sm text-slate-300">Eye contact:</span>
                    <span className="text-white font-semibold">94%</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-400" />
                    <span className="text-slate-300">Posture: Open & Engaged</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECTION 2: PRODUCT IN ACTION */}
      <section className="py-24 lg:py-32 bg-[#0F172A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-sm uppercase tracking-widest text-blue-400 mb-4 block">
              See It In Action
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white">
              One Device. Total Interview Intelligence.
            </h2>
          </motion.div>
          
          {/* Image with overlay */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-2xl overflow-hidden border border-blue-500/20"
          >
            <Image
              src="/Fluenzy%20AI%20HireLens/HireLens2.jpg"
              alt="HireLens in use during interview"
              width={1400}
              height={800}
              className="w-full"
            />
            
            {/* Overlay card */}
            <div className="absolute bottom-4 right-4 sm:bottom-8 sm:right-8 p-4 sm:p-6 rounded-xl bg-[#0F172A]/95 backdrop-blur border border-[#1E293B] max-w-sm">
              <div className="text-xs text-slate-400 mb-3">
                Fluenzy AI HireLens • Live Interview — Product Manager
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Communication", score: 82, color: "#3B82F6" },
                  { label: "Technical", score: 74, color: "#7C3AED" },
                  { label: "Confidence", score: 87, color: "#F97316" },
                  { label: "Behavioral", score: 79, color: "#22C55E" },
                ].map((item, i) => (
                  <div key={i} className="text-center">
                    <div className="relative w-12 h-12 mx-auto mb-1">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="24" cy="24" r="20" stroke="#1E293B" strokeWidth="3" fill="none" />
                        <circle
                          cx="24"
                          cy="24"
                          r="20"
                          stroke={item.color}
                          strokeWidth="3"
                          fill="none"
                          strokeLinecap="round"
                          strokeDasharray={125.6}
                          strokeDashoffset={125.6 - (125.6 * item.score) / 100}
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                        {item.score}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
          
          {/* Stats bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {[
              { label: "2MP Camera", sub: "1080p@30fps" },
              { label: "6hr Battery", sub: "USB-C Fast" },
              { label: "AES-256", sub: "Encrypted" },
              { label: "Real-time", sub: "AI Scoring" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center p-4 border border-[#1E293B] rounded-xl"
              >
                <div className="text-lg font-semibold text-white font-mono">{stat.label}</div>
                <div className="text-sm text-slate-400">{stat.sub}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: HOW IT WORKS */}
      <section className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-sm uppercase tracking-widest text-blue-400 mb-4 block">
              The Workflow
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white">
              Interview Intelligence in 7 Steps.
            </h2>
          </motion.div>
          
          {/* Desktop: horizontal, Mobile: vertical */}
          <div className="hidden lg:grid lg:grid-cols-7 gap-4">
            {workflowSteps.map((step, i) => (
              <WorkflowStep key={i} {...step} index={i} />
            ))}
          </div>
          
          {/* Mobile: vertical layout */}
          <div className="lg:hidden space-y-8">
            {workflowSteps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">{step.number}</span>
                </div>
                <div>
                  <h4 className="font-semibold text-white">{step.title}</h4>
                  <p className="text-sm text-slate-400">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: DEVICE SPECS */}
      <section className="py-24 lg:py-32 bg-[#0F172A]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-sm uppercase tracking-widest text-blue-400 mb-4 block">
              Hardware Specs
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white">
              Engineered for the Interview Room.
            </h2>
          </motion.div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Image */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="group cursor-pointer"
            >
              <Image
                src="/Fluenzy%20AI%20HireLens/HireLens3.jpg"
                alt="HireLens close-up"
                width={600}
                height={600}
                className="rounded-2xl transition-transform duration-700 group-hover:scale-105"
              />
            </motion.div>
            
            {/* Right: Specs */}
            <div>
              {specs.map((spec, i) => (
                <SpecRow key={i} {...spec} index={i} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: AI INTELLIGENCE LAYERS */}
      <section className="py-24 lg:py-32">
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
            <h2 className="text-4xl sm:text-5xl font-bold text-white">
              Three AI Brains. One Real-Time Feed.
            </h2>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {aiCards.map((card, i) => (
              <AICard key={i} {...card} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6: SCORING SYSTEM */}
      <section className="py-24 lg:py-32 bg-[#0F172A]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Score visualization */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex flex-col items-center"
            >
              <div className="grid grid-cols-2 gap-8 mb-8">
                <ScoreGauge score={82} label="Communication" color="#3B82F6" delay={0} />
                <ScoreGauge score={74} label="Technical" color="#7C3AED" delay={0.2} />
                <ScoreGauge score={68} label="Confidence" color="#F97316" delay={0.4} />
                <ScoreGauge score={79} label="Behavioral" color="#22C55E" delay={0.6} />
              </div>
              <div className="text-center">
                <div className="text-6xl font-bold text-white">76</div>
                <div className="text-slate-400">/ 100 Composite Score</div>
              </div>
            </motion.div>
            
            {/* Right: Explanation */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <h3 className="text-3xl font-bold text-white">
                AI Makes the Recommendation.<br />You Make the Call.
              </h3>
              
              <div className="space-y-4">
                {[
                  { icon: "✅", title: "HIRE", desc: "Score ≥ 75, no critical flags", color: "green" },
                  { icon: "⚠️", title: "REVIEW", desc: "Score 55–74 or 1 behavioral flag", color: "yellow" },
                  { icon: "❌", title: "REJECT", desc: "Score < 55 or multiple flags", color: "red" },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-4 p-4 rounded-xl border ${
                      item.color === "green"
                        ? "border-green-500/30 bg-green-500/10"
                        : item.color === "yellow"
                          ? "border-yellow-500/30 bg-yellow-500/10"
                          : "border-red-500/30 bg-red-500/10"
                    }`}
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <h4 className="font-semibold text-white">{item.title}</h4>
                      <p className="text-sm text-slate-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <p className="text-sm text-slate-500 italic">
                AI recommendations are advisory only. All final hiring decisions remain with humans.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECTION 7: PRICING */}
      <section id="pricing" className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-sm uppercase tracking-widest text-blue-400 mb-4 block">
              Pricing
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white">
              Hardware Once. Intelligence Monthly.
            </h2>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8 items-start">
            <PricingCard
              title="Device"
              price="₹24,999"
              period="one-time"
              features={[
                "1× Collar Device",
                "USB-C cable + case",
                "30-day warranty",
                "Setup support",
                "Free firmware updates (1yr)",
              ]}
              cta="Pre-Order Device"
              href="#"
            />
            
            <PricingCard
              title="Pro Plan"
              price="₹4,999"
              period="/mo"
              subtitle="Per organization · Up to 5 devices"
              features={[
                "Unlimited sessions",
                "Real-time AI (all modules)",
                "HR Dashboard",
                "AI questions",
                "PDF reports",
                "ATS integration",
                "24/7 support",
              ]}
              cta="Start Free Trial"
              href="#"
              highlighted
              badge="MOST POPULAR"
            />
            
            <PricingCard
              title="Enterprise"
              price="Custom"
              features={[
                "5+ devices",
                "On-premise deployment",
                "White-labeling",
                "Volume pricing",
                "Dedicated account manager",
              ]}
              cta="Contact Sales"
              href="mailto:enterprise@fluenzy.ai"
            />
          </div>
        </div>
      </section>

      {/* SECTION 8: SECURITY & COMPLIANCE */}
      <section className="py-24 lg:py-32 bg-[#0F172A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-white">
              Built for Compliance from Day One.
            </h2>
          </motion.div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {securityTiles.map((tile, i) => (
              <SecurityTile key={i} {...tile} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 9: FINAL CTA */}
      <section className="relative py-24 lg:py-32 overflow-hidden">
        {/* Background image */}
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
            The Future of Hiring<br />
            <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              Is Already Here.
            </span>
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-400 mb-10"
          >
            Be among the first organizations to deploy AI-powered interview intelligence.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <Link
              href="#pricing"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold hover:opacity-90 transition-opacity"
            >
              Pre-Order HireLens
            </Link>
            <button className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-white/30 text-white font-semibold hover:bg-white/10 transition-colors">
              Download Spec Sheet
            </button>
          </motion.div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm text-slate-400">
            <a href="mailto:enterprise@fluenzy.ai" className="hover:text-white transition-colors">
              Enterprise inquiries: enterprise@fluenzy.ai
            </a>
            <span className="hidden sm:inline">·</span>
            <a href="mailto:developers@fluenzy.ai" className="hover:text-white transition-colors">
              Developer API: developers@fluenzy.ai
            </a>
          </div>
        </div>
      </section>

      {/* Global styles */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        
        body {
          font-family: 'DM Sans', sans-serif;
        }
      `}</style>
    </main>
  );
}
