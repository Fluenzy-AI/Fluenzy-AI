"use client";
import React from "react";
import { motion } from "framer-motion";
import { Code, Users, MessageSquare, Briefcase, Zap, ArrowRight } from "lucide-react";
import Link from "next/link";

const trainingPaths = [
  {
    title: "English Learning",
    description: "Master business English, idioms, and professional communication",
    icon: MessageSquare,
    color: "from-blue-500 to-cyan-500",
    bgColor: "from-blue-900/20 to-cyan-900/20",
    borderColor: "border-blue-500/30",
  },
  {
    title: "Daily Conversation",
    description: "Practice real-world scenarios with AI conversation partner",
    icon: Users,
    color: "from-purple-500 to-pink-500",
    bgColor: "from-purple-900/20 to-pink-900/20",
    borderColor: "border-purple-500/30",
  },
  {
    title: "HR Interview Coach",
    description: "Behavioral questions, STAR method, leadership principles",
    icon: Briefcase,
    color: "from-orange-500 to-red-500",
    bgColor: "from-orange-900/20 to-red-900/20",
    borderColor: "border-orange-500/30",
  },
  {
    title: "Technical Mastery",
    description: "Algorithms, system design, coding challenges",
    icon: Code,
    color: "from-green-500 to-emerald-500",
    bgColor: "from-green-900/20 to-emerald-900/20",
    borderColor: "border-green-500/30",
  },
  {
    title: "Company Tracks",
    description: "Google, Amazon, Microsoft specific preparation",
    icon: Zap,
    color: "from-cyan-500 to-blue-500",
    bgColor: "from-cyan-900/20 to-blue-900/20",
    borderColor: "border-cyan-500/30",
  },
  {
    title: "GD Agent",
    description: "Group discussion simulations with multiple AI roles",
    icon: Users,
    color: "from-pink-500 to-purple-500",
    bgColor: "from-pink-900/20 to-purple-900/20",
    borderColor: "border-pink-500/30",
  },
];

const TrainingShowcase = () => {
  return (
    <section className="py-20 md:py-24 relative overflow-hidden bg-slate-950">
      {/* Background Decor */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px]" />

      <div className="container mx-auto px-4 md:px-8 xl:px-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-10 sm:mb-14 md:mb-20"
        >
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-900/40 to-blue-900/40 rounded-full px-4 py-2 sm:px-6 sm:py-3 mb-5 sm:mb-6 border border-white/5 backdrop-blur-md shadow-2xl">
            <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400 animate-pulse" />
            <span className="font-bold text-xs uppercase tracking-widest text-purple-200">AI Training Laboratory</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-extrabold mb-4 sm:mb-6 md:mb-8 tracking-tighter">
            <span className="bg-gradient-to-r from-white via-white to-slate-500 !bg-clip-text text-transparent">
              Select Your
            </span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 !bg-clip-text text-transparent">
              Practice Track
            </span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Professional-grade interview simulations powered by advanced neural models. Each track is designed for deep skill acquisition.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 md:gap-8">
          {trainingPaths.map((type, index) => (
            <motion.div
              key={type.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group"
            >
              <div className={`relative h-full bg-slate-900/40 backdrop-blur-xl rounded-[1.5rem] sm:rounded-[2.5rem] p-5 sm:p-8 border border-white/5 hover:border-purple-500/30 transition-all duration-500 shadow-2xl flex flex-col`}>
                {/* Accent Glow */}
                <div className={`absolute -inset-px bg-gradient-to-br ${type.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-[1.5rem] sm:rounded-[2.5rem] pointer-events-none`} />
                
                <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-[1.25rem] bg-gradient-to-br ${type.color} flex items-center justify-center mb-5 sm:mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-[0_0_30px_rgba(0,0,0,0.3)] relative z-10`}>
                  <type.icon className="w-6 h-6 sm:w-8 sm:h-8 text-white drop-shadow-md" />
                </div>

                <div className="relative z-10 flex-grow">
                  <h3 className="text-lg sm:text-2xl font-bold text-white mb-3 sm:mb-4 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-purple-200 group-hover:!bg-clip-text transition-all">
                    {type.title}
                  </h3>
                  <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-5 sm:mb-8 group-hover:text-slate-300 transition-colors">
                    {type.description}
                  </p>
                </div>

                <div className="mt-auto relative z-10 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                    </span>
                    <span className="text-[10px] uppercase tracking-tighter font-black text-purple-400/80">Active Neural Path</span>
                  </div>
                  
                  <Link href="/login" className="flex items-center space-x-1 text-white group/link">
                    <span className="text-sm font-bold border-b border-transparent group-hover/link:border-white transition-all">Start Track</span>
                    <ArrowRight className="h-4 w-4 group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-10 sm:mt-16 md:mt-24"
        >
          <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl sm:rounded-3xl md:rounded-[3rem] p-5 sm:p-8 md:p-12 overflow-hidden border border-white/5">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-purple-500/10 to-transparent blur-[80px]" />
            
<div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10 lg:gap-12 items-center">
              <div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 sm:mb-5 md:mb-6">Real-Time AI Feedback</h3>
                <p className="text-slate-400 text-sm sm:text-base md:text-lg leading-relaxed mb-5 sm:gap-6 md:mb-8">
                  Every response is analyzed instantly with detailed scoring, improvement suggestions, and comparative benchmarks against successful candidates.
                </p>
                <div className="flex flex-wrap gap-6 sm:gap-8">
                   <div className="space-y-1">
                      <div className="text-3xl sm:text-4xl font-extrabold text-white">95%</div>
                      <div className="text-xs uppercase tracking-widest text-slate-500 font-bold">Accuracy Rate</div>
                   </div>
                   <div className="space-y-1">
                      <div className="text-3xl sm:text-4xl font-extrabold text-white">24/7</div>
                      <div className="text-xs uppercase tracking-widest text-slate-500 font-bold">Always Active</div>
                   </div>
                </div>
              </div>
              
              <div className="bg-slate-950/50 rounded-2xl p-6 border border-white/5 shadow-inner backdrop-blur-2xl">
                 <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-3">
                       <div className="w-3 h-3 rounded-full bg-red-400" />
                       <div className="w-3 h-3 rounded-full bg-amber-400" />
                       <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Feedback Terminal</div>
                 </div>
                 <div className="space-y-4 font-mono text-sm">
                    <div className="text-emerald-400 flex items-start space-x-2">
                       <span className="text-slate-600">&gt;</span>
                       <span>Analysis complete: Confidence score 84%</span>
                    </div>
                    <div className="text-blue-400 flex items-start space-x-2">
                       <span className="text-slate-600">&gt;</span>
                       <span>Detected pattern: Strong technical clarity</span>
                    </div>
                    <div className="text-amber-400 flex items-start space-x-2">
                       <span className="text-slate-600">&gt;</span>
                       <span>Recommendation: Extend behavioral context</span>
                    </div>
                    <div className="text-slate-400 animate-pulse">_</div>
                 </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TrainingShowcase;
