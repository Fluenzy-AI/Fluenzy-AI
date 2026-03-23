"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular" | "card";
  width?: string | number;
  height?: string | number;
  animate?: boolean;
}

export function Skeleton({
  className,
  variant = "rectangular",
  width,
  height,
  animate = true,
}: SkeletonProps) {
  const baseClasses = cn(
    "bg-gradient-to-r from-white/[0.06] via-white/[0.12] to-white/[0.06]",
    animate && "animate-shimmer bg-[length:200%_100%]",
    {
      "rounded-full": variant === "circular",
      "rounded-lg": variant === "rectangular",
      "rounded-md": variant === "text",
      "rounded-2xl": variant === "card",
    },
    className
  );

  return (
    <div
      className={baseClasses}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
      }}
      aria-hidden="true"
    />
  );
}

// Pre-configured skeleton patterns
export function StatCardSkeleton() {
  return (
    <div className="bg-surface border border-white/[0.06] rounded-[14px] p-5">
      <div className="flex items-start justify-between mb-3">
        <Skeleton width={36} height={36} className="rounded-xl" />
        <Skeleton width={48} height={20} className="rounded-md" />
      </div>
      <Skeleton width={60} height={32} className="mb-2" />
      <Skeleton width={100} height={14} />
      <div className="mt-3">
        <Skeleton width="100%" height={32} className="rounded-lg" />
      </div>
    </div>
  );
}

export function JobCardSkeleton() {
  return (
    <div className="bg-surface border border-white/[0.06] rounded-[14px] p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Skeleton width="70%" height={20} className="mb-2" />
          <Skeleton width="40%" height={16} />
        </div>
        <Skeleton width={60} height={60} className="rounded-full" />
      </div>
      <div className="flex gap-2 mb-4">
        <Skeleton width={80} height={24} className="rounded-full" />
        <Skeleton width={70} height={24} className="rounded-full" />
        <Skeleton width={90} height={24} className="rounded-full" />
      </div>
      <div className="flex gap-2 mb-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} width={60} height={22} className="rounded-md" />
        ))}
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
        <Skeleton width={100} height={14} />
        <Skeleton width={100} height={40} className="rounded-xl" />
      </div>
    </div>
  );
}

export function ApplicationRowSkeleton() {
  return (
    <div className="bg-surface border border-white/[0.06] rounded-[14px] p-4">
      <div className="flex items-center gap-4">
        <Skeleton width={40} height={40} variant="circular" />
        <div className="flex-1 min-w-0">
          <Skeleton width="60%" height={18} className="mb-1" />
          <Skeleton width="40%" height={14} />
        </div>
        <Skeleton width={80} height={28} className="rounded-full" />
      </div>
      <div className="mt-4">
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton width={12} height={12} variant="circular" />
              {i < 5 && <Skeleton width={32} height={2} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProfileStrengthSkeleton() {
  return (
    <div className="bg-surface border border-white/[0.06] rounded-[14px] p-5">
      <Skeleton width={140} height={20} className="mb-4" />
      <div className="flex items-center justify-center mb-4">
        <Skeleton width={120} height={120} variant="circular" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton width={20} height={20} className="rounded-full" />
            <Skeleton width="70%" height={14} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function HeroBannerSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-[20px] p-6 sm:p-8 bg-surface border border-white/[0.06]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex-1">
          <Skeleton width={120} height={16} className="mb-2" />
          <Skeleton width={200} height={32} className="mb-2" />
          <Skeleton width={300} height={20} />
        </div>
        <Skeleton width={140} height={44} className="rounded-xl" />
      </div>
    </div>
  );
}
