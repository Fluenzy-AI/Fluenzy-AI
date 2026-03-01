"use client";
import React, { useEffect, useMemo, useState } from "react";
import { motion, useInView, useMotionValue, useMotionValueEvent, useSpring } from "framer-motion";
import { Mic, MessageSquare, TrendingUp, Award, Target } from "lucide-react";
import { useRef } from "react";

const baseQuestion = "Explain the time complexity of quicksort and discuss optimization techniques.";

const CareerDashboard = () => {
  const [typedQuestion, setTypedQuestion] = useState("");
  const [dotCycle, setDotCycle] = useState(".");
  const analyticsRef = useRef<HTMLDivElement | null>(null);
  const analyticsInView = useInView(analyticsRef, { once: true, margin: "0px" });

  const scoreMotion = useMotionValue(0);
  const scoreSpring = useSpring(scoreMotion, { stiffness: 110, damping: 24 });
  const [liveScore, setLiveScore] = useState(0);

  useEffect(() => {
    const typeTimer = setInterval(() => {
      setTypedQuestion((prev) => {
        if (prev.length >= baseQuestion.length) {
          clearInterval(typeTimer);
          return prev;
        }
        return baseQuestion.slice(0, prev.length + 1);
      });
    }, 22);

    return () => clearInterval(typeTimer);
  }, []);

  useEffect(() => {
    const statusTimer = setInterval(() => {
      setDotCycle((prev) => (prev.length >= 3 ? "." : `${prev}.`));
    }, 420);
    return () => clearInterval(statusTimer);
  }, []);

  useEffect(() => {
    if (analyticsInView) {
      scoreMotion.set(92);
    }
  }, [analyticsInView, scoreMotion]);

  useMotionValueEvent(scoreSpring, "change", (latest) => {
    setLiveScore(Math.round(latest));
  });

  const progressBars = useMemo(
    () => [
      { label: "Interview Score", value: 92, color: "from-purple-500 to-blue-500" },
      { label: "Career Readiness", value: 78, color: "from-cyan-500 to-indigo-500" },
    ],
    []
  );

  return (
    <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:gap-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        whileHover={{ y: -6, rotateX: 2, rotateY: -1 }}
        className="dynamic-border-glow glass relative rounded-2xl border border-purple-400/25 bg-gradient-to-br from-slate-800/65 to-purple-900/30 p-5 shadow-2xl sm:p-6"
        data-touch-hover
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 4.6, ease: "easeInOut" }}
          className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-purple-500/20 blur-2xl"
        />
        <div className="mb-4 flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/20">
            <MessageSquare className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">AI Interviewer</h3>
            <p className="text-sm text-purple-200">Google-Style Technical Interview</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-slate-600/50 bg-slate-700/45 p-4">
            <p className="mb-2 text-sm text-purple-200">Question:</p>
            <p className="min-h-14 text-white">
              "{typedQuestion}
              <span className="animate-pulse text-cyan-300">|</span>"
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <div className="h-2.5 w-2.5 rounded-full bg-red-400 animate-pulse" />
            <span className="text-sm text-gray-300">AI analyzing response{dotCycle}</span>
          </div>

          <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="relative flex-1 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2 text-sm font-medium text-white transition-all duration-300 hover:from-purple-700 hover:to-blue-700 hover:shadow-[0_10px_24px_rgba(99,102,241,0.35)]"
            >
              <Mic className="mr-2 inline h-4 w-4" />
              Speak Answer
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="rounded-lg border border-slate-600/50 bg-slate-700/50 px-4 py-2 text-sm font-medium text-gray-200 transition-colors hover:bg-slate-600/50"
            >
              Type Response
            </motion.button>
          </div>
        </div>
      </motion.div>

      <motion.div
        ref={analyticsRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, delay: 0.2, ease: [0.25, 1, 0.5, 1] }}
        whileHover={{ y: -6 }}
        className="glass relative rounded-2xl border border-blue-400/25 bg-gradient-to-br from-slate-800/65 to-blue-900/30 p-5 shadow-2xl sm:p-6"
        data-touch-hover
      >
        <div className="mb-6 flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20">
            <TrendingUp className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Performance Analytics</h3>
            <p className="text-sm text-blue-200">Real-time Feedback Dashboard</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-purple-400" />
              <span className="text-sm text-gray-200">Interview Score</span>
            </div>
            <motion.span className="text-lg font-bold text-purple-300">{liveScore}%</motion.span>
          </div>

          {progressBars.map((bar, index) => (
            <div key={bar.label} className="space-y-1">
              <div className="text-xs text-slate-300">{bar.label}</div>
              <div className="h-2 w-full rounded-full bg-slate-700">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: analyticsInView ? `${bar.value}%` : '0%' }}
                  transition={{ duration: 0.7, delay: index * 0.12, ease: "easeInOut" }}
                  className={`h-2 rounded-full bg-gradient-to-r ${bar.color}`}
                />
              </div>
            </div>
          ))}

          <div className="grid grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.45 }}
              className="text-center"
            >
              <div className="text-2xl font-bold text-blue-400">47</div>
              <div className="text-xs text-gray-400">Sessions Completed</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.55 }}
              className="text-center"
            >
              <div className="text-2xl font-bold text-cyan-400">18</div>
              <div className="text-xs text-gray-400">Skills Mastered</div>
            </motion.div>
          </div>

          <div className="flex items-center space-x-2">
            <Award className="h-4 w-4 text-yellow-400" />
            <span className="text-sm text-gray-200">Next: FAANG Senior Engineer</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CareerDashboard;
