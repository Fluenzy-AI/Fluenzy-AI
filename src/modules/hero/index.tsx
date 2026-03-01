"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Play, Sparkles, ArrowRight } from "lucide-react";
import CareerDashboard from "./CareerDashboard";
import Link from "next/link";

const headlineWords = ["Train", "Smarter.", "Crack", "FAANG", "Interviews", "with", "AI."];

const Hero = () => {
  const [ripple, setRipple] = useState<{ x: number; y: number; key: number } | null>(null);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const triggerRipple = (event: React.MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setRipple({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      key: Date.now(),
    });
  };

  return (
    <section
      id="hero"
      className="hero-gradient-animate relative overflow-x-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-20 pb-12 sm:pt-24 sm:pb-16 md:pt-28 md:pb-20"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-purple-900/60 to-slate-900/80" />
      <div className="animate-float absolute left-2 top-20 h-40 w-40 rounded-full bg-purple-500/20 blur-3xl sm:left-10 sm:h-64 sm:w-64" />
      <div
        className="animate-float absolute bottom-20 right-2 h-48 w-48 rounded-full bg-blue-500/20 blur-3xl sm:right-10 sm:h-96 sm:w-96"
        style={{ animationDelay: "-1s" }}
      />
      <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/10 blur-3xl animate-pulse sm:h-96 sm:w-96" />

      {Array.from({ length: 12 }).map((_, i) => (
        <motion.span
          key={i}
          className="pointer-events-none absolute rounded-full bg-white/30"
          style={{
            width: i % 3 === 0 ? 2 : 3,
            height: i % 3 === 0 ? 2 : 3,
            left: `${6 + i * 8}%`,
            top: `${12 + (i % 5) * 16}%`,
          }}
          animate={{ opacity: [0.1, 0.5, 0.1], y: [0, -10, 0] }}
          transition={{ duration: 5 + i * 0.35, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      <div className="container relative z-10 mx-auto grid grid-cols-1 items-start gap-8 px-4 sm:px-6 md:px-8 xl:grid-cols-2 xl:items-center xl:gap-14 xl:px-16">
        <div className="text-center xl:text-left">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-5 inline-flex max-w-full items-center space-x-2 rounded-full border border-purple-500/30 bg-gradient-to-r from-purple-900/50 to-blue-900/50 px-3 py-2 text-left backdrop-blur-sm sm:mb-6 sm:px-6 sm:py-3"
          >
            <Sparkles className="h-4 w-4 shrink-0 text-purple-400 sm:h-5 sm:w-5" />
            <span className="break-words text-xs font-medium text-purple-200 sm:text-sm">AI-Powered Interview Training</span>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.08,
                  delayChildren: 0.2,
                },
              },
            }}
          >
            <h1 className="fluid-h1 mb-4 font-bold max-w-[18ch] mx-auto xl:mx-0 sm:mb-5">
              {headlineWords.map((word, i) => (
                <motion.span
                  key={`${word}-${i}`}
                  variants={{
                    hidden: { opacity: 0, y: 30, filter: "blur(8px)" },
                    visible: { opacity: 1, y: 0, filter: "blur(0px)" },
                  }}
                  transition={{ duration: 0.55, ease: "easeInOut" }}
                  className={`mr-3 inline-block ${
                    i >= 2 && i <= 4
                      ? "bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 !bg-clip-text text-transparent"
                      : "text-white"
                  }`}
                >
                  {word}
                </motion.span>
              ))}
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="fluid-body mx-auto mb-6 max-w-2xl px-1 text-gray-300 xl:mx-0 xl:px-0 sm:mb-7"
          >
            AI Interviewer • HR + Technical + GD Training • Real-Time Behavioral Analytics • Performance Intelligence
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex flex-col justify-center gap-3 sm:flex-row sm:gap-4 xl:justify-start"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
              <Button
                size="lg"
                asChild
                className="touch-target glow-effect relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-4 font-semibold text-white shadow-xl transition-all duration-300 hover:from-purple-700 hover:to-blue-700 hover:shadow-purple-500/40 sm:w-auto"
              >
                <Link href="/login" onMouseDown={triggerRipple}>
                  {ripple && (
                    <span key={ripple.key} className="button-ripple" style={{ left: ripple.x, top: ripple.y }} />
                  )}
                  <Play className="mr-2 h-4 w-4" />
                  Train Now
                </Link>
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                onClick={() => scrollToSection("features")}
                className="touch-target w-full rounded-xl border-purple-500/40 px-8 py-4 text-purple-200 backdrop-blur-md transition-all duration-300 hover:border-purple-400 hover:bg-purple-500/10 sm:w-auto"
              >
                Explore Features
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-gray-400 sm:mt-10 sm:gap-8 sm:text-sm xl:justify-start"
          >
            <div className="group flex cursor-default items-center space-x-3">
              <div className="h-2.5 w-2.5 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.5)] animate-pulse" />
              <span className="transition-colors group-hover:text-purple-300">AI Interviewer & GD Agent</span>
            </div>
            <div className="group flex cursor-default items-center space-x-3">
              <div className="h-2.5 w-2.5 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)] animate-pulse" />
              <span className="transition-colors group-hover:text-blue-300">Real-time Analytics</span>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex w-full justify-center mt-4 xl:mt-0"
        >
          <CareerDashboard />
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
