"use client";

import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number | string | null | undefined;
  icon?: React.ReactNode;
  trend?: {
    direction: "up" | "down" | "neutral";
    value: string; // e.g., "+12%" or "from last week"
  };
  variant?: "hero" | "default" | "compact";
  loading?: boolean;
  className?: string;
}

/**
 * StatCard — NaN-safe metric display.
 * Renders "0" for zero, "—" for null/undefined, skeleton for loading.
 * Never renders NaN.
 */
export default function StatCard({
  label,
  value,
  icon,
  trend,
  variant = "default",
  loading = false,
  className,
}: StatCardProps) {
  // NaN-safe value rendering
  const displayValue = (() => {
    if (loading) return null;
    if (value === null || value === undefined) return "—";
    if (typeof value === "number") {
      if (isNaN(value)) return "—";
      return value.toLocaleString();
    }
    return value;
  })();

  if (loading) {
    return (
      <div
        className={cn(
          "rounded-lg border animate-pulse",
          variant === "hero" ? "p-6" : variant === "compact" ? "p-3" : "p-4",
          className
        )}
        style={{
          backgroundColor: "var(--portal-bg-elevated)",
          borderColor: "var(--portal-border)",
        }}
      >
        <div className="space-y-3">
          <div className="h-4 w-20 rounded portal-skeleton" />
          <div className={cn("rounded portal-skeleton", variant === "hero" ? "h-10 w-24" : "h-7 w-16")} />
          {trend && <div className="h-3 w-16 rounded portal-skeleton" />}
        </div>
      </div>
    );
  }

  const TrendIcon =
    trend?.direction === "up" ? TrendingUp : trend?.direction === "down" ? TrendingDown : Minus;

  const trendColor =
    trend?.direction === "up"
      ? "var(--portal-success)"
      : trend?.direction === "down"
      ? "var(--portal-danger)"
      : "var(--portal-text-muted)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn(
        "rounded-lg border transition-shadow hover:shadow-[var(--portal-shadow-hover)]",
        variant === "hero" ? "p-6" : variant === "compact" ? "p-3" : "p-4",
        className
      )}
      style={{
        backgroundColor: "var(--portal-bg-elevated)",
        borderColor: "var(--portal-border)",
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p
            className={cn("font-medium", variant === "compact" ? "text-xs" : "text-sm")}
            style={{ color: "var(--portal-text-secondary)" }}
          >
            {label}
          </p>
          <p
            className={cn(
              "portal-mono font-bold mt-1",
              variant === "hero" ? "text-4xl" : variant === "compact" ? "text-xl" : "text-2xl"
            )}
            style={{ color: "var(--portal-text-primary)" }}
          >
            {displayValue}
          </p>
          {trend && (
            <div className="flex items-center gap-1 mt-1.5">
              <TrendIcon className="w-3 h-3" style={{ color: trendColor }} />
              <span className="text-xs font-medium" style={{ color: trendColor }}>
                {trend.value}
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              "rounded-lg flex items-center justify-center flex-shrink-0",
              variant === "hero" ? "w-12 h-12" : "w-10 h-10"
            )}
            style={{
              backgroundColor: "var(--portal-primary-muted)",
              color: "var(--portal-primary)",
            }}
          >
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  );
}
