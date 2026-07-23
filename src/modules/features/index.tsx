"use client";
import React from "react";
import { motion } from "framer-motion";
import Card3D from "@/components/ui/Card3D";

const Features = () => {
  return (
    <section id="features" className="relative overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950 py-20 md:py-24">
      <div className="absolute left-1/4 top-20 h-[500px] w-[500px] rounded-full bg-blue-500/5 blur-[120px]" />
      <div className="absolute bottom-20 right-1/4 h-[500px] w-[500px] rounded-full bg-violet-500/5 blur-[120px]" />

      <div className="container relative z-10 mx-auto px-4 md:px-8 xl:px-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 text-center md:mb-14"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">Core Training Ecosystem</p>
          <h2 className="fluid-h2 font-bold text-white">AI Interview Intelligence Operating System</h2>
        </motion.div>

        {/* Feature Screenshots Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <Card3D depth={40} glowColor="rgba(6, 182, 212, 0.4)">
            <div className="relative rounded-2xl overflow-hidden border border-purple-500/30 shadow-xl bg-slate-900/80 p-2 group transition-all duration-300">
              <img
                src="/image/landingimg3.png"
                alt="Technical Interview & Coding Evaluation"
                className="w-full h-auto object-cover rounded-xl transition-transform duration-500 group-hover:scale-[1.02]"
              />
              <p className="mt-3 text-xs font-bold text-center text-cyan-300 uppercase tracking-wider">Technical & Coding Interview</p>
            </div>
          </Card3D>

          <Card3D depth={40} glowColor="rgba(168, 85, 247, 0.4)">
            <div className="relative rounded-2xl overflow-hidden border border-purple-500/30 shadow-xl bg-slate-900/80 p-2 group transition-all duration-300">
              <img
                src="/image/GDAgent.png"
                alt="GD Agent & AI Group Discussion Room"
                className="w-full h-auto object-cover rounded-xl transition-transform duration-500 group-hover:scale-[1.02]"
              />
              <p className="mt-3 text-xs font-bold text-center text-purple-300 uppercase tracking-wider">GD Agent & AI Discussion Room</p>
            </div>
          </Card3D>

          <Card3D depth={40} glowColor="rgba(16, 185, 129, 0.4)">
            <div className="relative rounded-2xl overflow-hidden border border-purple-500/30 shadow-xl bg-slate-900/80 p-2 group transition-all duration-300">
              <img
                src="/image/ATS.png"
                alt="ATS Resume Checker & Score Engine"
                className="w-full h-auto object-cover rounded-xl transition-transform duration-500 group-hover:scale-[1.02]"
              />
              <p className="mt-3 text-xs font-bold text-center text-emerald-300 uppercase tracking-wider">ATS Resume Checker & Score</p>
            </div>
          </Card3D>

          <Card3D depth={40} glowColor="rgba(245, 158, 11, 0.4)">
            <div className="relative rounded-2xl overflow-hidden border border-purple-500/30 shadow-xl bg-slate-900/80 p-2 group transition-all duration-300">
              <img
                src="/image/AIJobSearch.png"
                alt="AI Job Search & Auto Apply Matcher"
                className="w-full h-auto object-cover rounded-xl transition-transform duration-500 group-hover:scale-[1.02]"
              />
              <p className="mt-3 text-xs font-bold text-center text-amber-300 uppercase tracking-wider">AI Job Matcher & Auto Apply</p>
            </div>
          </Card3D>

          <Card3D depth={40} glowColor="rgba(59, 130, 246, 0.4)">
            <div className="relative rounded-2xl overflow-hidden border border-purple-500/30 shadow-xl bg-slate-900/80 p-2 group transition-all duration-300">
              <img
                src="/image/landingimg4.png"
                alt="Behavioral Analytics & Feedback"
                className="w-full h-auto object-cover rounded-xl transition-transform duration-500 group-hover:scale-[1.02]"
              />
              <p className="mt-3 text-xs font-bold text-center text-blue-300 uppercase tracking-wider">Real-Time Performance Analytics</p>
            </div>
          </Card3D>

          <Card3D depth={40} glowColor="rgba(236, 72, 153, 0.4)">
            <div className="relative rounded-2xl overflow-hidden border border-purple-500/30 shadow-xl bg-slate-900/80 p-2 group transition-all duration-300">
              <img
                src="/image/GD.png"
                alt="Group Discussion Room Simulation"
                className="w-full h-auto object-cover rounded-xl transition-transform duration-500 group-hover:scale-[1.02]"
              />
              <p className="mt-3 text-xs font-bold text-center text-pink-300 uppercase tracking-wider">GD Simulation & Multi-Role Coaching</p>
            </div>
          </Card3D>
        </motion.div>
      </div>
    </section>
  );
};

export default Features;

