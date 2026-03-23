"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { motion, useInView, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";
import * as Tooltip from "@radix-ui/react-tooltip";
import { Check, X, ArrowRight } from "lucide-react";
import { ProfileStrengthSkeleton } from "../shared/SkeletonLoader";

interface ProfileItem {
  label: string;
  done: boolean;
  tip: string;
  href?: string;
}

interface ProfileStrengthProps {
  completion: number;
  items: ProfileItem[];
  loading?: boolean;
  className?: string;
}

// Radial progress ring component
function RadialProgress({
  percentage,
  size = 120,
  strokeWidth = 8,
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true });
  const [hasAnimated, setHasAnimated] = useState(false);

  // Spring animation for the progress
  const spring = useSpring(0, { damping: 30, stiffness: 80 });
  const progress = useTransform(spring, (val) => Math.round(val));

  useEffect(() => {
    if (inView && !hasAnimated) {
      spring.set(percentage);
      setHasAnimated(true);
    }
  }, [inView, percentage, spring, hasAnimated]);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  // Determine color based on percentage
  const getColor = (pct: number) => {
    if (pct >= 80) return { stroke: "#22C55E", glow: "rgba(34,197,94,0.3)" };
    if (pct >= 50) return { stroke: "#F59E0B", glow: "rgba(245,158,11,0.3)" };
    return { stroke: "#EF4444", glow: "rgba(239,68,68,0.3)" };
  };

  const colors = getColor(percentage);

  return (
    <div className="relative">
      <svg
        ref={ref}
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="rgba(255,255,255,0.06)"
          fill="none"
        />

        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={colors.stroke}
          fill="none"
          strokeLinecap="round"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: useTransform(
              spring,
              (val) => circumference - (val / 100) * circumference
            ),
            filter: `drop-shadow(0 0 8px ${colors.glow})`,
          }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-2xl font-bold text-[#F1F0F5]"
        >
          {useTransform(progress, (val) => `${val}%`)}
        </motion.span>
        <span className="text-[10px] text-[#8B8A99] font-medium">Complete</span>
      </div>

      {/* Pulse animation when 100% */}
      {percentage >= 100 && (
        <motion.div
          className="absolute inset-0 rounded-full"
          initial={{ opacity: 0, scale: 1 }}
          animate={{ opacity: [0, 0.3, 0], scale: [1, 1.2, 1.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
          style={{
            background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
          }}
        />
      )}
    </div>
  );
}

// Checklist item component
function ChecklistItem({ item }: { item: ProfileItem }) {
  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <div
            className={cn(
              "flex items-center gap-3 py-2 px-2 -mx-2 rounded-lg transition-colors",
              !item.done && "hover:bg-white/[0.02]"
            )}
          >
            {/* Icon */}
            <span
              className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all",
                item.done
                  ? "bg-[#22C55E]/10 text-[#22C55E]"
                  : "bg-white/[0.06] text-[#52515E]"
              )}
            >
              {item.done ? (
                <Check className="w-3 h-3" strokeWidth={3} />
              ) : (
                <X className="w-3 h-3" strokeWidth={3} />
              )}
            </span>

            {/* Label */}
            <span
              className={cn(
                "text-xs flex-1 transition-colors",
                item.done
                  ? "text-[#8B8A99] line-through"
                  : "text-[#F1F0F5]"
              )}
            >
              {item.label}
            </span>

            {/* Add now button for incomplete items */}
            {!item.done && item.href && (
              <Link
                href={item.href}
                className="flex items-center gap-1 text-[10px] font-medium text-[#7C5CFC] hover:text-[#9F7FFF] transition-colors"
              >
                Add now
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        </Tooltip.Trigger>

        <Tooltip.Portal>
          <Tooltip.Content
            side="right"
            sideOffset={8}
            className="z-50 px-3 py-2 bg-[#1A1D28] border border-white/10 rounded-lg shadow-xl max-w-xs animate-in fade-in-0 zoom-in-95"
          >
            <p className="text-xs text-[#F1F0F5]">{item.tip}</p>
            <Tooltip.Arrow className="fill-[#1A1D28]" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

export function ProfileStrength({
  completion,
  items,
  loading = false,
  className,
}: ProfileStrengthProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  if (loading) {
    return <ProfileStrengthSkeleton />;
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
      className={cn(
        "bg-[#13161E] rounded-[14px] p-5",
        "border border-white/[0.06]",
        "shadow-[0_1px_3px_rgba(0,0,0,0.4),0_0_0_0.5px_rgba(255,255,255,0.06)]",
        className
      )}
    >
      <h3 className="text-sm font-bold text-[#F1F0F5] mb-5">Profile Strength</h3>

      {/* Radial progress */}
      <div className="flex justify-center mb-5">
        <RadialProgress percentage={completion} />
      </div>

      {/* Checklist */}
      <div className="space-y-1">
        {items.map((item) => (
          <ChecklistItem key={item.label} item={item} />
        ))}
      </div>

      {/* CTA when incomplete */}
      {completion < 100 && (
        <Link
          href="/candidates/dashboard/profile"
          className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#7C5CFC]/10 text-[#9F7FFF] hover:bg-[#7C5CFC]/20 text-xs font-semibold transition-colors"
        >
          Complete Profile
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </motion.div>
  );
}
