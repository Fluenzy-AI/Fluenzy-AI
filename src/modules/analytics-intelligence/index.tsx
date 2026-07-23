"use client";
import React from "react";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import Card3D from "@/components/ui/Card3D";

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

        {/* Live Behavioral Analytics Screenshots Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
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

          <Card3D depth={35} glowColor="rgba(239, 68, 68, 0.4)">
            <div className="relative rounded-2xl overflow-hidden border border-red-500/30 shadow-2xl bg-slate-900/70 p-2 group">
              <img
                src="/image/Chart.png"
                alt="Growth & Performance Metrics"
                className="w-full h-auto object-cover rounded-xl transition-transform duration-500 group-hover:scale-[1.02]"
              />
              <div className="p-3 text-center">
                <p className="text-xs font-bold text-red-400 uppercase tracking-wider">Growth & Performance Metrics</p>
                <p className="text-[11px] text-slate-400 mt-1">Multi-session score progression and skill gain analytics</p>
              </div>
            </div>
          </Card3D>

          <Card3D depth={35} glowColor="rgba(239, 68, 68, 0.4)">
            <div className="relative rounded-2xl overflow-hidden border border-red-500/30 shadow-2xl bg-slate-900/70 p-2 group">
              <img
                src="/image/Chart1.png"
                alt="Category Score Breakdown"
                className="w-full h-auto object-cover rounded-xl transition-transform duration-500 group-hover:scale-[1.02]"
              />
              <div className="p-3 text-center">
                <p className="text-xs font-bold text-red-400 uppercase tracking-wider">Category Score Breakdown</p>
                <p className="text-[11px] text-slate-400 mt-1">Granular breakdown across Technical, Behavioral & Soft skills</p>
              </div>
            </div>
          </Card3D>

          <Card3D depth={35} glowColor="rgba(239, 68, 68, 0.4)">
            <div className="relative rounded-2xl overflow-hidden border border-red-500/30 shadow-2xl bg-slate-900/70 p-2 group">
              <img
                src="/image/Chart2.png"
                alt="Competency Radar Graph"
                className="w-full h-auto object-cover rounded-xl transition-transform duration-500 group-hover:scale-[1.02]"
              />
              <div className="p-3 text-center">
                <p className="text-xs font-bold text-red-400 uppercase tracking-wider">Competency Radar Graph</p>
                <p className="text-[11px] text-slate-400 mt-1">Benchmarking candidate capability profile against FAANG standards</p>
              </div>
            </div>
          </Card3D>
        </motion.div>
      </div>
    </section>
  );
};

export default AnalyticsIntelligence;


