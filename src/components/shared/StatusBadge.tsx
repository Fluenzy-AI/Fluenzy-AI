"use client";

import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";

export type ApplicationStatus =
  | "PENDING"
  | "REVIEWED"
  | "SHORTLISTED"
  | "INTERVIEW_SCHEDULED"
  | "REJECTED"
  | "HIRED";

interface StatusBadgeProps {
  status: ApplicationStatus;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  animate?: boolean;
  className?: string;
}

const STATUS_CONFIG: Record<
  ApplicationStatus,
  {
    label: string;
    bg: string;
    text: string;
    border: string;
    icon: React.ReactNode;
  }
> = {
  PENDING: {
    label: "Applied",
    bg: "bg-[#52515E]/20",
    text: "text-[#8B8A99]",
    border: "border-[#52515E]/30",
    icon: (
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  REVIEWED: {
    label: "Reviewed",
    bg: "bg-[#F59E0B]/10",
    text: "text-[#F59E0B]",
    border: "border-[#F59E0B]/25",
    icon: (
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
  },
  SHORTLISTED: {
    label: "Shortlisted",
    bg: "bg-[#3B82F6]/10",
    text: "text-[#3B82F6]",
    border: "border-[#3B82F6]/25",
    icon: (
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  },
  INTERVIEW_SCHEDULED: {
    label: "Interview",
    bg: "bg-[#22C55E]/10",
    text: "text-[#22C55E]",
    border: "border-[#22C55E]/25",
    icon: (
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  REJECTED: {
    label: "Not Selected",
    bg: "bg-[#EF4444]/10",
    text: "text-[#EF4444]",
    border: "border-[#EF4444]/25",
    icon: (
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
  HIRED: {
    label: "Hired",
    bg: "bg-[#10B981]/10",
    text: "text-[#10B981]",
    border: "border-[#10B981]/25",
    icon: (
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
};

const SIZE_CONFIG = {
  sm: "px-2 py-0.5 text-[10px] gap-1",
  md: "px-2.5 py-1 text-[11px] gap-1.5",
  lg: "px-3 py-1.5 text-xs gap-2",
};

export function StatusBadge({
  status,
  size = "md",
  showIcon = true,
  animate = false,
  className,
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const [showConfetti, setShowConfetti] = useState(false);
  const prevStatus = useRef<ApplicationStatus | null>(null);

  useEffect(() => {
    if (animate && prevStatus.current && prevStatus.current !== status && status === "HIRED") {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 2000);
      return () => clearTimeout(timer);
    }
    prevStatus.current = status;
  }, [status, animate]);

  return (
    <span
      className={cn(
        "inline-flex items-center font-semibold rounded-full border transition-all duration-200",
        config.bg,
        config.text,
        config.border,
        SIZE_CONFIG[size],
        className
      )}
    >
      {showIcon && config.icon}
      <span>{config.label}</span>

      {/* Confetti effect for HIRED status */}
      <AnimatePresence>
        {showConfetti && (
          <motion.span
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {[...Array(8)].map((_, i) => (
              <motion.span
                key={i}
                className="absolute w-1 h-1 rounded-full bg-[#10B981]"
                initial={{
                  opacity: 1,
                  x: "50%",
                  y: "50%",
                }}
                animate={{
                  opacity: 0,
                  x: `${50 + Math.cos((i * Math.PI) / 4) * 100}%`,
                  y: `${50 + Math.sin((i * Math.PI) / 4) * 100}%`,
                }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            ))}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

// Timeline stepper component for application progress
interface ApplicationTimelineProps {
  currentStatus: ApplicationStatus;
  className?: string;
  showLabels?: boolean;
  size?: "sm" | "md";
}

const TIMELINE_STEPS: { key: ApplicationStatus; label: string }[] = [
  { key: "PENDING", label: "Applied" },
  { key: "REVIEWED", label: "Reviewed" },
  { key: "SHORTLISTED", label: "Shortlisted" },
  { key: "INTERVIEW_SCHEDULED", label: "Interview" },
  { key: "HIRED", label: "Hired" },
];

export function ApplicationTimeline({
  currentStatus,
  className,
  showLabels = true,
  size = "md",
}: ApplicationTimelineProps) {
  if (currentStatus === "REJECTED") {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
        <span className="text-xs text-[#EF4444] font-medium">Not selected</span>
      </div>
    );
  }

  const currentIdx = TIMELINE_STEPS.findIndex((s) => s.key === currentStatus);
  const dotSize = size === "sm" ? "w-2 h-2" : "w-2.5 h-2.5";
  const lineWidth = size === "sm" ? "w-4" : "w-6";

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {TIMELINE_STEPS.map((step, i) => {
        const done = i <= currentIdx;
        const active = i === currentIdx;

        return (
          <div key={step.key} className="flex items-center gap-1">
            <div className="flex flex-col items-center">
              <motion.div
                className={cn(
                  "rounded-full transition-all",
                  dotSize,
                  active
                    ? "bg-[#7C5CFC] ring-2 ring-[#7C5CFC]/30"
                    : done
                    ? "bg-[#22C55E]"
                    : "bg-[#52515E]"
                )}
                initial={false}
                animate={active ? { scale: [1, 1.2, 1] } : {}}
                transition={{
                  duration: 1.5,
                  repeat: active ? Infinity : 0,
                  ease: "easeInOut",
                }}
              />
              {showLabels && (
                <span
                  className={cn(
                    "text-[9px] mt-1 whitespace-nowrap hidden sm:block",
                    active
                      ? "text-[#7C5CFC] font-medium"
                      : done
                      ? "text-[#22C55E]"
                      : "text-[#52515E]"
                  )}
                >
                  {step.label}
                </span>
              )}
            </div>
            {i < TIMELINE_STEPS.length - 1 && (
              <div
                className={cn(
                  "h-px",
                  lineWidth,
                  showLabels && "mb-4 sm:mb-5",
                  i < currentIdx ? "bg-[#22C55E]" : "bg-[#52515E]"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
