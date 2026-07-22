"use client";
import React from "react";
import { motion } from "framer-motion";
import { Brain, Target, TrendingUp, FileText, Users, Award, GitBranch, Boxes } from "lucide-react";
import Card3D from "@/components/ui/Card3D";

const AdvancedFeatures = () => {
  const features = [
    {
      icon: Brain,
      title: "Neural Learning Engine",
      description: "Adaptive AI loops tune interview difficulty and coaching strategy in real time.",
      gradient: "from-purple-500 to-blue-500",
    },
    {
      icon: FileText,
      title: "Intelligent Content Analysis",
      description: "Resume, JD, and session analytics are merged into a single recommendation engine.",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: Target,
      title: "Behavioral Pattern Recognition",
      description: "Vision + audio models detect confidence signals, stress signatures, and delivery drift.",
      gradient: "from-green-500 to-emerald-500",
    },
    {
      icon: TrendingUp,
      title: "Predictive Performance Analytics",
      description: "Trajectory forecasting identifies future risk zones before they affect interview outcomes.",
      gradient: "from-orange-500 to-red-500",
    },
    {
      icon: Users,
      title: "Multi-Agent AI Simulation",
      description: "Distributed AI roles simulate realistic panel rounds and group discussion pressure.",
      gradient: "from-pink-500 to-purple-500",
    },
    {
      icon: Award,
      title: "Benchmarking Intelligence",
      description: "Performance is benchmarked against FAANG-level standards and top percentile patterns.",
      gradient: "from-cyan-500 to-blue-500",
    },
    {
      icon: GitBranch,
      title: "MLOps Model Versioning",
      description: "Continuous model versioning ensures stable scoring quality and controlled upgrades.",
      gradient: "from-indigo-500 to-purple-500",
    },
    {
      icon: Boxes,
      title: "Microservices Architecture",
      description: "Low-latency modular services power scalable interview simulation and analytics pipelines.",
      gradient: "from-sky-500 to-blue-500",
    },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-900/50 to-slate-800 py-20 md:py-24">
      <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-purple-500/8 blur-3xl" />
      <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-blue-500/8 blur-3xl" />
      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />

      <div className="container relative z-10 mx-auto px-4 md:px-8 xl:px-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-14 text-center"
        >
          <h2 className="fluid-h2 mb-6 font-bold">
            <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 !bg-clip-text text-transparent">
              Enterprise AI
            </span>
            <br />
            <span className="text-white">Technology Stack</span>
          </h2>
          <p className="mx-auto max-w-3xl text-base text-gray-300 sm:text-lg">
            This is a production-grade AI Interview Intelligence platform, built for high-accuracy behavioral analytics and career execution.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 34 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: index * 0.05 }}
              className="group"
            >
              <Card3D depth={30} glowColor="rgba(168, 85, 247, 0.3)" className="h-full">
                <div className="glass relative h-full overflow-hidden rounded-2xl border border-white/10 p-6 shadow-xl transition-all duration-500 group-hover:border-purple-500/50 group-hover:shadow-purple-500/20 bg-slate-900/70">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <div className="relative z-10">
                    <div className="relative mb-4">
                      <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${feature.gradient} p-3 shadow-lg`}>
                        <feature.icon className="h-full w-full text-white" />
                      </div>
                    </div>
                    <h3 className="mb-2 text-base font-bold text-white">{feature.title}</h3>
                    <p className="text-sm leading-relaxed text-gray-300">{feature.description}</p>
                  </div>
                </div>
              </Card3D>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AdvancedFeatures;
