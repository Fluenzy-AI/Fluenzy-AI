"use client";
import React from "react";
import { motion } from "framer-motion";
import { Shield, Archive, Cloud, Clock3 } from "lucide-react";

const proItems = [
  "Unlimited Sessions",
  "Secure Career Vault",
  "Session Archive",
  "Guide History Management",
  "Smart Filtering",
  "Cloud-based AI scoring",
  "Real-time latency <200ms",
];

const ProFeatures = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 to-slate-900/60 py-20 md:py-24">
      <div className="container mx-auto px-4 md:px-8 xl:px-16">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass rounded-3xl border border-white/10 p-6 sm:p-8"
        >
          <h2 className="mb-6 text-3xl font-bold text-white">Pro Features</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {proItems.map((item, index) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: index * 0.04 }}
                className="rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-200"
              >
                {item}
              </motion.div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-3 text-xs text-slate-300">
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-slate-800 px-3 py-1.5">
              <Shield className="h-3.5 w-3.5 text-cyan-300" />
              Encrypted Storage
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-slate-800 px-3 py-1.5">
              <Archive className="h-3.5 w-3.5 text-purple-300" />
              Smart Archives
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-slate-800 px-3 py-1.5">
              <Cloud className="h-3.5 w-3.5 text-blue-300" />
              Cloud Scoring Engine
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-slate-800 px-3 py-1.5">
              <Clock3 className="h-3.5 w-3.5 text-emerald-300" />
              {"<200ms feedback loop"}
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ProFeatures;
