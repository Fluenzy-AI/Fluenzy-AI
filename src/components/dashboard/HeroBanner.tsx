"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Briefcase, Sparkles, Flame } from "lucide-react";
import { HeroBannerSkeleton } from "../shared/SkeletonLoader";

interface HeroBannerProps {
  firstName: string;
  stats?: {
    total: number;
    shortlisted: number;
    interviews: number;
  };
  streak?: number;
  newMatches?: number;
  loading?: boolean;
  className?: string;
}

// Particle canvas background
function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Particle system
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
    }> = [];

    const particleCount = 40;
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.05 + 0.02,
      });
    }

    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      particles.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.offsetWidth;
        if (particle.x > canvas.offsetWidth) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.offsetHeight;
        if (particle.y > canvas.offsetHeight) particle.y = 0;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(124, 92, 252, ${particle.opacity})`;
        ctx.fill();
      });

      // Draw connecting lines
      particles.forEach((particle, i) => {
        particles.slice(i + 1).forEach((other) => {
          const dx = particle.x - other.x;
          const dy = particle.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `rgba(124, 92, 252, ${0.02 * (1 - distance / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  );
}

export function HeroBanner({
  firstName,
  stats,
  streak = 0,
  newMatches = 0,
  loading = false,
  className,
}: HeroBannerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  if (loading) {
    return <HeroBannerSkeleton />;
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        delay: 0.1,
        ease: [0.16, 1, 0.3, 1] as const,
        staggerChildren: 0.1,
      },
    },
  };

  const childVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate={mounted ? "visible" : "hidden"}
      className={cn(
        "relative overflow-hidden rounded-[20px] p-6 sm:p-8",
        // Glassmorphic styling
        "backdrop-blur-xl bg-[rgba(124,92,252,0.12)] border border-[rgba(124,92,252,0.25)]",
        "shadow-xl shadow-[#7C5CFC]/10",
        className
      )}
    >
      {/* Particle background */}
      <ParticleBackground />

      {/* Gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 30% 20%, rgba(124,92,252,0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(168,85,247,0.1) 0%, transparent 50%)",
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex-1 min-w-0">
          {/* Greeting */}
          <motion.p
            variants={childVariants}
            className="text-[#9F7FFF] text-sm font-medium flex items-center gap-2"
          >
            {greeting}
            <span className="text-base">👋</span>
          </motion.p>

          {/* Name */}
          <motion.h1
            variants={childVariants}
            className="text-[#F1F0F5] text-2xl sm:text-3xl font-bold mt-1 tracking-tight"
          >
            {firstName}
          </motion.h1>

          {/* Stats summary */}
          <motion.p variants={childVariants} className="text-[#8B8A99] text-sm mt-2">
            {stats && stats.total === 0 ? (
              "Start your journey — browse open positions below."
            ) : stats ? (
              <>
                {stats.total} application{stats.total !== 1 ? "s" : ""} ·{" "}
                {stats.shortlisted} shortlisted · {stats.interviews} interview
                {stats.interviews !== 1 ? "s" : ""} scheduled
              </>
            ) : (
              "Welcome back to your dashboard"
            )}
          </motion.p>

          {/* Badges row */}
          <motion.div
            variants={childVariants}
            className="flex flex-wrap items-center gap-3 mt-4"
          >
            {/* Streak badge */}
            {streak > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F59E0B]/10 border border-[#F59E0B]/20 text-[#F59E0B] text-xs font-medium">
                <Flame className="w-3.5 h-3.5" />
                {streak} day streak
              </span>
            )}

            {/* New matches badge */}
            {newMatches > 0 && (
              <motion.span
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] text-xs font-medium"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {newMatches} new job match{newMatches !== 1 ? "es" : ""} today
              </motion.span>
            )}
          </motion.div>
        </div>

        {/* CTA Button */}
        <motion.div variants={childVariants}>
          <Link
            href="/careers"
            className="group relative inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#7C5CFC] focus:ring-offset-2 focus:ring-offset-[#0D0F14]"
          >
            {/* Gradient border background */}
            <div
              className="absolute inset-0 rounded-xl p-[1px] overflow-hidden"
              style={{
                background:
                  "linear-gradient(135deg, #6B46FF 0%, #A855F7 50%, #EC4899 100%)",
              }}
            >
              <div className="w-full h-full rounded-[10px] bg-[rgba(13,15,20,0.9)]" />
            </div>

            {/* Glow effect on hover */}
            <div
              className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                background:
                  "linear-gradient(135deg, rgba(107,70,255,0.3) 0%, rgba(168,85,247,0.3) 50%, rgba(236,72,153,0.3) 100%)",
                filter: "blur(12px)",
              }}
              aria-hidden="true"
            />

            <span className="relative z-10 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Browse Jobs
            </span>

            <svg
              className="relative z-10 w-4 h-4 transition-transform group-hover:translate-x-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}
