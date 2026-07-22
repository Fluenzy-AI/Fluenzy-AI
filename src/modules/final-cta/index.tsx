"use client";
import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, PlayCircle } from "lucide-react";
import Card3D from "@/components/ui/Card3D";

const FinalCta = () => {
  return (
    <section className="relative overflow-hidden bg-slate-950 pb-24 pt-10">
      <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/15 blur-3xl" />
      <div className="container relative z-10 mx-auto px-4 md:px-8 xl:px-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Card3D depth={40} glowColor="rgba(168, 85, 247, 0.4)">
            <div className="glass rounded-3xl border border-white/10 p-8 text-center bg-slate-900/80 shadow-2xl">
              <h2 className="fluid-h2 font-bold text-white">Your AI Interview Intelligence System Starts Here.</h2>
              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/login"
                  className="touch-target inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-xl transition hover:from-purple-700 hover:to-blue-700 sm:w-auto"
                >
                  Start Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="#hero"
                  className="touch-target inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10 sm:w-auto"
                >
                  See Live Demo
                  <PlayCircle className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </Card3D>
        </motion.div>
      </div>
    </section>
  );
};

export default FinalCta;
