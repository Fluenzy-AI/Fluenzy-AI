"use client";
import React from "react";
import { motion } from "framer-motion";
import { Activity, Eye, Gauge, Sparkles } from "lucide-react";

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

        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
          {[
            "Filler Word Frequency Detection",
            "Accuracy vs Speed Graph",
            "Practice vs Improvement Curve",
            "Company-wise Readiness Chart",
          ].map((item, index) => (
            <motion.div
              key={item}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.06 }}
              className="glass rounded-xl border border-white/10 p-4"
            >
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
                {index % 2 === 0 ? <Gauge className="h-4 w-4 text-cyan-300" /> : <Eye className="h-4 w-4 text-purple-300" />}
                {item}
              </div>
              <div className="h-20 rounded-lg bg-gradient-to-r from-slate-800 to-slate-700 p-3">
                <div className="h-full w-full rounded-md bg-gradient-to-r from-purple-500/30 via-blue-500/20 to-cyan-500/20" />
              </div>
            </motion.div>
          ))}
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
      </div>
    </section>
  );
};

export default AnalyticsIntelligence;
