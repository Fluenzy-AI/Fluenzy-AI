"use client";
import React from "react";
import { motion } from "framer-motion";
import { Activity, Eye, Gauge, Sparkles, Building2, TrendingUp } from "lucide-react";
import Card3D from "@/components/ui/Card3D";

const coreMetrics = [
  { label: "Overall Score", value: 92 },
  { label: "Communication", value: 89 },
  { label: "Confidence", value: 86 },
  { label: "Grammar", value: 91 },
  { label: "Speaking Pace", value: 84 },
  { label: "Body Language", value: 81 },
  { label: "Stress Level", value: 38 },
  { label: "Engagement %", value: 93 },
  { label: "Eye Contact %", value: 88 },
  { label: "Posture %", value: 85 },
];

const predictive = [
  { label: "Interview Readiness", value: "91%" },
  { label: "Hire Probability", value: "78%" },
  { label: "Risk Level", value: "Low-Medium" },
  { label: "Confidence Reliability", value: "87%" },
];

const AnalyticsIntelligence = () => {
  return (
    <section className="relative overflow-hidden bg-slate-950 py-20 md:py-24">
      <div className="absolute -left-10 top-10 h-80 w-80 rounded-full bg-cyan-500/8 blur-3xl" />
      <div className="absolute -right-10 bottom-10 h-80 w-80 rounded-full bg-purple-500/8 blur-3xl" />

      <div className="container relative z-10 mx-auto px-4 md:px-8 xl:px-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-10 text-center md:mb-14"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-cyan-200">
            <Activity className="h-4 w-4" />
            Real-Time Analytics OS
          </div>
          <h2 className="fluid-h2 font-bold text-white">
            Behavioral Intelligence + Performance Strategy
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {coreMetrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.04 }}
              className="glass rounded-xl border border-white/10 p-4"
            >
              <div className="mb-1 text-xs uppercase tracking-wide text-slate-400">{metric.label}</div>
              <div className="mb-3 text-2xl font-bold text-white">{metric.value}%</div>
              <div className="h-1.5 w-full rounded-full bg-slate-700">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${Math.min(metric.value, 100)}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: index * 0.05 }}
                  className="h-1.5 rounded-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400"
                />
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass rounded-2xl border border-white/10 p-5 lg:col-span-2"
          >
            <h3 className="mb-4 text-lg font-semibold text-white">Confidence vs Accuracy Quadrant</h3>
            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              {["Ideal Zone", "Overconfidence", "Self-Doubt", "Weak Zone"].map((zone, i) => (
                <div
                  key={zone}
                  className={`rounded-xl border p-4 ${
                    i === 0
                      ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
                      : "border-slate-600/40 bg-slate-800/50 text-slate-300"
                  }`}
                >
                  {zone}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass rounded-2xl border border-white/10 p-5"
          >
            <h3 className="mb-4 text-lg font-semibold text-white">Weakest Skill Risk Impact</h3>
            <div className="space-y-3 text-sm text-slate-300">
              <div className="flex items-center justify-between">
                <span>Body Language</span>
                <span className="text-amber-300">High</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Stress Regulation</span>
                <span className="text-orange-300">Critical</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Response Pace</span>
                <span className="text-cyan-300">Medium</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Interactive Visual Graphs Grid */}
        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Card 1: Filler Word Frequency Detection */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="glass rounded-xl border border-white/10 p-5"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Gauge className="h-4 w-4 text-cyan-300" />
                <span>Filler Word Frequency Detection</span>
              </div>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                Low Risk (1.8/min)
              </span>
            </div>

            <div className="rounded-xl border border-slate-700/60 bg-slate-900/80 p-4">
              <div className="mb-3 flex items-end justify-between gap-2 h-20 px-2">
                {[
                  { word: '"Um"', count: 4, height: "40%", color: "from-amber-500 to-orange-500" },
                  { word: '"Like"', count: 7, height: "70%", color: "from-purple-500 to-indigo-500" },
                  { word: '"You know"', count: 2, height: "25%", color: "from-blue-500 to-cyan-500" },
                  { word: '"Basically"', count: 3, height: "35%", color: "from-emerald-500 to-teal-500" },
                  { word: '"Actually"', count: 1, height: "15%", color: "from-rose-500 to-pink-500" },
                ].map((item) => (
                  <div key={item.word} className="flex flex-1 flex-col items-center gap-1 group">
                    <span className="text-[10px] font-bold text-slate-300 opacity-80 group-hover:opacity-100">{item.count}</span>
                    <div className="w-full rounded-t-md bg-slate-800 h-16 flex items-end p-0.5">
                      <motion.div
                        initial={{ height: 0 }}
                        whileInView={{ height: item.height }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className={`w-full rounded-t bg-gradient-to-t ${item.color}`}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 truncate max-w-full font-medium">{item.word}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-slate-800 pt-2 text-[11px] text-slate-400">
                <span>Total Fillers: <strong className="text-white">17 words</strong></span>
                <span className="text-emerald-400 font-semibold">↓ 64% reduction this week</span>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Accuracy vs Speed Graph */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.06 }}
            className="glass rounded-xl border border-white/10 p-5"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Eye className="h-4 w-4 text-purple-300" />
                <span>Accuracy vs Speed Graph</span>
              </div>
              <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 text-[11px] font-bold text-purple-300">
                Optimal Zone (94% / 22s)
              </span>
            </div>

            <div className="rounded-xl border border-slate-700/60 bg-slate-900/80 p-4">
              <div className="relative h-20 w-full">
                <svg className="h-full w-full overflow-visible" viewBox="0 0 300 70" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="accuracyGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#a855f7" stopOpacity="0.8" />
                      <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.9" />
                    </linearGradient>
                  </defs>
                  <line x1="0" y1="15" x2="300" y2="15" stroke="#334155" strokeDasharray="3 3" strokeWidth="1" />
                  <line x1="0" y1="40" x2="300" y2="40" stroke="#334155" strokeDasharray="3 3" strokeWidth="1" />
                  <line x1="0" y1="60" x2="300" y2="60" stroke="#334155" strokeDasharray="3 3" strokeWidth="1" />

                  <motion.path
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2 }}
                    d="M 10 58 Q 75 50 130 28 T 290 12"
                    fill="none"
                    stroke="url(#accuracyGradient)"
                    strokeWidth="3"
                  />

                  <circle cx="10" cy="58" r="3.5" fill="#a855f7" />
                  <circle cx="75" cy="50" r="3.5" fill="#8b5cf6" />
                  <circle cx="130" cy="28" r="3.5" fill="#3b82f6" />
                  <circle cx="210" cy="18" r="3.5" fill="#06b6d4" />
                  <circle cx="290" cy="12" r="5" fill="#22c55e" stroke="#ffffff" strokeWidth="2" />
                </svg>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-slate-800 pt-2 text-[11px] text-slate-400">
                <span>Slow Pace (45s)</span>
                <span className="text-purple-300 font-semibold">Target Speed (20-25s)</span>
                <span>Fast Pace (10s)</span>
              </div>
            </div>
          </motion.div>

          {/* Card 3: Practice vs Improvement Curve */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.12 }}
            className="glass rounded-xl border border-white/10 p-5"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <TrendingUp className="h-4 w-4 text-emerald-300" />
                <span>Practice vs Improvement Curve</span>
              </div>
              <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-[11px] font-bold text-cyan-300">
                +32% Growth
              </span>
            </div>

            <div className="rounded-xl border border-slate-700/60 bg-slate-900/80 p-4">
              <div className="relative h-20 w-full">
                <svg className="h-full w-full overflow-visible" viewBox="0 0 300 70" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>

                  <motion.path
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    d="M 0 60 Q 75 52 150 30 T 300 8 L 300 70 L 0 70 Z"
                    fill="url(#areaGradient)"
                  />

                  <motion.path
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2 }}
                    d="M 0 60 Q 75 52 150 30 T 300 8"
                    fill="none"
                    stroke="url(#lineGrad)"
                    strokeWidth="3"
                  />

                  <circle cx="75" cy="52" r="3.5" fill="#3b82f6" />
                  <circle cx="150" cy="30" r="3.5" fill="#06b6d4" />
                  <circle cx="225" cy="16" r="3.5" fill="#06b6d4" />
                  <circle cx="300" cy="8" r="4.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="2" />
                </svg>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-slate-800 pt-2 text-[11px] text-slate-400">
                <span>1 Session (62%)</span>
                <span>10 Sessions (78%)</span>
                <span className="text-cyan-300 font-bold">25 Sessions (94%)</span>
              </div>
            </div>
          </motion.div>

          {/* Card 4: Company-wise Readiness Chart */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.18 }}
            className="glass rounded-xl border border-white/10 p-5"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Building2 className="h-4 w-4 text-amber-300" />
                <span>Company-wise Readiness Chart</span>
              </div>
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold text-amber-300">
                Top Match: Microsoft
              </span>
            </div>

            <div className="rounded-xl border border-slate-700/60 bg-slate-900/80 p-3.5 space-y-2">
              {[
                { company: "Microsoft", score: 95, color: "from-blue-500 to-cyan-400", badge: "Ready" },
                { company: "Google", score: 92, color: "from-red-500 via-amber-500 to-emerald-400", badge: "Ready" },
                { company: "Amazon", score: 88, color: "from-amber-500 to-orange-500", badge: "Strong" },
                { company: "Meta", score: 84, color: "from-blue-600 to-indigo-500", badge: "Good" },
              ].map((item) => (
                <div key={item.company} className="space-y-0.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">{item.company}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase text-slate-400">{item.badge}</span>
                      <span className="font-bold text-white">{item.score}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-800">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${item.score}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.7 }}
                      className={`h-1.5 rounded-full bg-gradient-to-r ${item.color}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {predictive.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.04 }}
              className="rounded-xl border border-purple-400/20 bg-gradient-to-br from-purple-900/20 to-blue-900/20 p-4"
            >
              <div className="mb-1 text-xs uppercase tracking-wide text-slate-400">{item.label}</div>
              <div className="text-xl font-bold text-white">{item.value}</div>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 flex w-full items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-xs text-blue-200 sm:inline-flex sm:w-auto">
          <Sparkles className="h-4 w-4" />
          <span className="break-words">
            Predictive metrics are updated from live interview behaviors and scoring trends.
          </span>
        </div>

        {/* Live Behavioral Analytics Screenshots Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <Card3D depth={35} glowColor="rgba(6, 182, 212, 0.4)">
            <div className="relative rounded-2xl overflow-hidden border border-purple-500/30 shadow-2xl bg-slate-900/70 p-2 group">
              <img
                src="/image/BEHAVIORALMETRICS1.png"
                alt="Live AI Video & Behavioral Metrics"
                className="w-full h-auto object-cover rounded-xl transition-transform duration-500 group-hover:scale-[1.02]"
              />
              <div className="p-3 text-center">
                <p className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Live Video & Behavioral Analysis</p>
                <p className="text-[11px] text-slate-400 mt-1">Real-time eye contact, posture, confidence & stress scoring</p>
              </div>
            </div>
          </Card3D>

          <Card3D depth={35} glowColor="rgba(168, 85, 247, 0.4)">
            <div className="relative rounded-2xl overflow-hidden border border-purple-500/30 shadow-2xl bg-slate-900/70 p-2 group">
              <img
                src="/image/BEHAVIORALMETRICS2.png"
                alt="Speech Tone & Emotion Tracking"
                className="w-full h-auto object-cover rounded-xl transition-transform duration-500 group-hover:scale-[1.02]"
              />
              <div className="p-3 text-center">
                <p className="text-xs font-bold text-purple-300 uppercase tracking-wider">Speech & Tone Intelligence</p>
                <p className="text-[11px] text-slate-400 mt-1">Vocal pace, clarity breakdown & emotional regulation AI</p>
              </div>
            </div>
          </Card3D>

          <Card3D depth={35} glowColor="rgba(59, 130, 246, 0.4)">
            <div className="relative rounded-2xl overflow-hidden border border-purple-500/30 shadow-2xl bg-slate-900/70 p-2 group">
              <img
                src="/image/OverallPerformance1.png"
                alt="Candidate Overall Performance Scorecard"
                className="w-full h-auto object-cover rounded-xl transition-transform duration-500 group-hover:scale-[1.02]"
              />
              <div className="p-3 text-center">
                <p className="text-xs font-bold text-blue-300 uppercase tracking-wider">Overall Performance Scorecard</p>
                <p className="text-[11px] text-slate-400 mt-1">Comprehensive FAANG-readiness summary & benchmark report</p>
              </div>
            </div>
          </Card3D>
        </motion.div>
      </div>
    </section>
  );
};

export default AnalyticsIntelligence;
