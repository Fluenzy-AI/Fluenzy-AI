"use client";
import React from "react";
import { motion } from "framer-motion";
import { CheckCircle, Clock, Zap } from "lucide-react";

const items = [
  {
    title: "Accuracy Rate",
    value: "95%",
    desc: "Industry-leading precision in evaluation",
    icon: CheckCircle,
    accent: "green",
    progress: 95,
  },
  {
    title: "Always Available",
    value: "24/7",
    desc: "Practice anytime with AI",
    icon: Clock,
    accent: "blue",
    progress: 100,
  },
  {
    title: "Unlimited Sessions",
    value: "∞",
    desc: "Practice without limits",
    icon: Zap,
    accent: "purple",
    progress: 92,
  },
  {
    title: "Instant Feedback",
    value: "< 200ms",
    desc: "Zero latency real-time voice analysis",
    icon: Zap,
    accent: "amber",
    progress: 88,
  },
  {
    title: "Behavioral Metrics",
    value: "50+",
    desc: "Analyzes tone, pace, confidence, and filler words",
    icon: CheckCircle,
    accent: "pink",
    progress: 86,
  },
  {
    title: "Global Benchmarking",
    value: "Top 1%",
    desc: "Compare your score with FAANG candidates",
    icon: Clock,
    accent: "cyan",
    progress: 90,
  },
];

const accentMap: Record<string, { border: string; glow: string; iconBg: string; text: string }> = {
  green: {
    border: "hover:border-green-500/60",
    glow: "from-green-500/5 to-emerald-500/5",
    iconBg: "from-green-500 to-emerald-500",
    text: "text-green-400",
  },
  blue: {
    border: "hover:border-blue-500/60",
    glow: "from-blue-500/5 to-cyan-500/5",
    iconBg: "from-blue-500 to-cyan-500",
    text: "text-blue-400",
  },
  purple: {
    border: "hover:border-purple-500/60",
    glow: "from-purple-500/5 to-pink-500/5",
    iconBg: "from-purple-500 to-pink-500",
    text: "text-purple-400",
  },
  amber: {
    border: "hover:border-amber-500/60",
    glow: "from-amber-500/5 to-orange-500/5",
    iconBg: "from-amber-500 to-orange-500",
    text: "text-amber-400",
  },
  pink: {
    border: "hover:border-pink-500/60",
    glow: "from-pink-500/5 to-rose-500/5",
    iconBg: "from-pink-500 to-rose-500",
    text: "text-pink-400",
  },
  cyan: {
    border: "hover:border-cyan-500/60",
    glow: "from-cyan-500/5 to-sky-500/5",
    iconBg: "from-cyan-500 to-sky-500",
    text: "text-cyan-400",
  },
};

const FeedbackSection = () => {
  return (
    <section className="relative overflow-hidden py-20 md:py-24">
      <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-purple-500/5 blur-3xl" />
      <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-blue-500/5 blur-3xl" />

      <div className="container relative z-10 mx-auto px-4 md:px-8 xl:px-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-14 text-center md:mb-16"
        >
          <h2 className="mb-4 text-2xl font-bold lg:text-4xl">
            <span className="text-white">Real-Time AI </span>
            <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 !bg-clip-text text-transparent">
              Feedback & Analytics
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-base text-gray-300">
            Get instant scoring, detailed benchmarks, and actionable insights to improve your interview performance.
          </p>
        </motion.div>

        <div className="mx-auto max-w-6xl">
          <div className="glass relative overflow-hidden rounded-2xl border border-card-border/50 p-5 shadow-xl sm:p-8">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/5 to-blue-500/5" />
            <div className="relative z-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {items.map((item, index) => {
                const styles = accentMap[item.accent];
                const fromLeft = index % 2 === 0;
                return (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, x: fromLeft ? -36 : 36, y: 16 }}
                    whileInView={{ opacity: 1, x: 0, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 100, damping: 18, delay: index * 0.06 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    className="group"
                  >
                    <div
                      className={`relative overflow-hidden rounded-xl border border-card-border/50 p-6 shadow-lg transition-all duration-300 ${styles.border}`}
                    >
                      <div
                        className={`absolute inset-0 rounded-xl bg-gradient-to-br ${styles.glow} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                      />
                      <div className="relative z-10 text-center">
                        <div className="relative mb-4">
                          <div className={`mx-auto h-12 w-12 rounded-lg bg-gradient-to-br p-3 shadow-md ${styles.iconBg}`}>
                            <item.icon className="h-full w-full text-white" />
                          </div>
                        </div>
                        <div className="mb-1 text-2xl font-bold text-white">{item.value}</div>
                        <div className={`mb-2 text-sm font-semibold ${styles.text}`}>{item.title}</div>
                        <div className="mb-4 text-xs text-gray-300">{item.desc}</div>
                        <div className="h-1.5 w-full rounded-full bg-slate-700">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${item.progress}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.65, delay: 0.1 + index * 0.05, ease: "easeInOut" }}
                            className={`h-1.5 rounded-full bg-gradient-to-r ${styles.iconBg}`}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.2 }}
              className="mt-10 text-center"
            >
              <div className="inline-flex items-center space-x-2 rounded-full border border-purple-500/30 bg-gradient-to-r from-purple-900/50 to-blue-900/50 px-6 py-3 backdrop-blur-sm">
                <Zap className="h-5 w-5 text-purple-400" />
                <span className="font-medium text-purple-200">Instant scoring • Detailed benchmarks • Actionable insights</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeedbackSection;
