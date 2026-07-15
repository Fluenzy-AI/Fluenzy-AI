"use client";

import React from "react";
import { cn } from "@/lib/utils";

/**
 * LiveIndicator — animated dot for real-time / AI states.
 * Uses the live-signal accent color. Only persistent animation in the portal.
 */
export default function LiveIndicator({
  size = "sm",
  label,
  className,
}: {
  size?: "sm" | "md";
  label?: string;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span
        className={cn(
          "rounded-full portal-live-pulse flex-shrink-0",
          size === "sm" ? "w-2 h-2" : "w-2.5 h-2.5"
        )}
        style={{ backgroundColor: "var(--portal-live)" }}
      />
      {label && (
        <span
          className={cn("font-semibold", size === "sm" ? "text-[10px]" : "text-xs")}
          style={{ color: "var(--portal-live)" }}
        >
          {label}
        </span>
      )}
    </span>
  );
}
