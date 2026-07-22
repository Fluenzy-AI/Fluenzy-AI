"use client";
import React from "react";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import Card3D from "@/components/ui/Card3D";

const timeline = [
  { week: "Week 1", score: 62, confidence: 58, stress: 74 },
  { week: "Week 2", score: 71, confidence: 66, stress: 63 },
  { week: "Week 3", score: 80, confidence: 75, stress: 52 },
  { week: "Week 4", score: 89, confidence: 84, stress: 40 },
];

const stats = [
  "Weekly score progression",
  "Confidence improvement",
  "Stress reduction trend",
  "Practice consistency tracking",
  "Effort vs Result correlation",
];

const PerformanceEvolution = () => {
  return (
    <section className="relative overflow-hidden bg-slate-950 py-20 md:py-24">
      <div className="container relative z-10 mx-auto px-4 md:px-8 xl:px-16">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 text-center"
        >
          <h2 className="fluid-h2 font-bold text-white">Performance Evolution Engine</h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="glass rounded-2xl border border-white/10 p-5 lg:col-span-2">
            <div className="mb-4 text-sm font-semibold text-slate-300">Animated Timeline Graph</div>
            <div className="space-y-4">
              {timeline.map((item, index) => (
                <div key={item.week}>
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
                    <span>{item.week}</span>
                    <span>Score {item.score}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-700">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${item.score}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.65, delay: index * 0.07 }}
                      className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-cyan-400"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl border border-white/10 p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
              <TrendingUp className="h-4 w-4 text-cyan-300" />
              Growth Tracking
            </div>
            <div className="space-y-2">
              {stats.map((item) => (
                <div key={item} className="rounded-md border border-slate-700/60 bg-slate-900/60 px-3 py-2 text-sm text-slate-300">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Chart & Metrics Visual Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <Card3D depth={35} glowColor="rgba(6, 182, 212, 0.4)">
            <div className="relative rounded-2xl overflow-hidden border border-cyan-500/20 shadow-2xl bg-slate-900/60 p-2 group">
              <img
                src="/image/Chart.png"
                alt="Performance Breakdown & Growth Trajectory"
                className="w-full h-auto object-cover rounded-xl transition-transform duration-500 group-hover:scale-[1.02]"
              />
              <div className="p-3 text-center">
                <p className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Growth & Performance Metrics</p>
                <p className="text-[11px] text-slate-400 mt-1">Multi-session score progression and skill gain analytics</p>
              </div>
            </div>
          </Card3D>

          <Card3D depth={35} glowColor="rgba(168, 85, 247, 0.4)">
            <div className="relative rounded-2xl overflow-hidden border border-cyan-500/20 shadow-2xl bg-slate-900/60 p-2 group">
              <img
                src="/image/Chart1.png"
                alt="Score Progression Chart"
                className="w-full h-auto object-cover rounded-xl transition-transform duration-500 group-hover:scale-[1.02]"
              />
              <div className="p-3 text-center">
                <p className="text-xs font-bold text-purple-300 uppercase tracking-wider">Category Score Breakdown</p>
                <p className="text-[11px] text-slate-400 mt-1">Granular breakdown across Technical, Behavioral & Soft skills</p>
              </div>
            </div>
          </Card3D>

          <Card3D depth={35} glowColor="rgba(16, 185, 129, 0.4)">
            <div className="relative rounded-2xl overflow-hidden border border-cyan-500/20 shadow-2xl bg-slate-900/60 p-2 group">
              <img
                src="/image/Chart2.png"
                alt="Competency Graph"
                className="w-full h-auto object-cover rounded-xl transition-transform duration-500 group-hover:scale-[1.02]"
              />
              <div className="p-3 text-center">
                <p className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Competency Radar Graph</p>
                <p className="text-[11px] text-slate-400 mt-1">Benchmarking candidate capability profile against FAANG standards</p>
              </div>
            </div>
          </Card3D>
        </motion.div>
      </div>
    </section>
  );
};

export default PerformanceEvolution;
