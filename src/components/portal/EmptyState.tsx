"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

/**
 * EmptyState — consistent empty/zero-data states.
 * Text + single primary CTA. No illustrations (enterprise tools shouldn't be cute).
 */
export default function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-16 px-6 rounded-lg border border-dashed",
        className
      )}
      style={{
        borderColor: "var(--portal-border)",
        backgroundColor: "var(--portal-bg-elevated)",
      }}
    >
      <div
        className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
        style={{
          backgroundColor: "var(--portal-disabled-bg)",
          color: "var(--portal-text-muted)",
        }}
      >
        {icon}
      </div>
      <h3
        className="text-base font-semibold mb-1.5"
        style={{ color: "var(--portal-text-primary)" }}
      >
        {title}
      </h3>
      <p
        className="text-sm max-w-sm mb-5"
        style={{ color: "var(--portal-text-muted)" }}
      >
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors"
          style={{
            backgroundColor: "var(--portal-primary)",
            color: "var(--portal-primary-text)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--portal-primary-hover)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--portal-primary)";
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
