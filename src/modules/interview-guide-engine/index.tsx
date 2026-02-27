"use client";
import React from "react";
import { motion } from "framer-motion";
import { FileText, Download } from "lucide-react";

const guideItems = [
  "Personalized Interview Strategy",
  "30s / 60s / 90s Introduction",
  "30+ HR Questions with structured ideal answers",
  "Beginner to Advanced Technical Q&A",
  "STAR Method personalized examples",
  "Company-specific culture fit answers",
  "Salary expectation framing",
  "Final checklist system",
  "Rapid memorization cheat sheet",
];

const InterviewGuideEngine = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950 py-20 md:py-24">
      <div className="container relative z-10 mx-auto px-4 md:px-8 xl:px-16">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="glass rounded-3xl border border-white/10 p-6 sm:p-8"
        >
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">Interview Guide Generation Engine</p>
              <h2 className="fluid-h2 mt-2 font-bold text-white">Strategy, Answers, and Execution System</h2>
            </div>
            <button className="touch-target inline-flex w-full items-center justify-center gap-2 rounded-xl border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-200 transition hover:bg-blue-500/20 sm:w-auto">
              <Download className="h-4 w-4" />
              Export as Smart PDF
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {guideItems.map((item, index) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, x: index % 2 === 0 ? -14 : 14 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.03 }}
                className="flex items-start gap-2 rounded-lg border border-slate-700/70 bg-slate-900/60 px-4 py-3 text-sm text-slate-200"
              >
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                <span>{item}</span>
              </motion.div>
            ))}
          </div>

          <p className="mt-5 text-sm text-slate-400">
            Every PDF includes branded analytics, strengths, risk flags, and actionable preparation insights.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default InterviewGuideEngine;
