"use client";

import React from "react";
import { cn } from "@/lib/utils";

type StatusVariant =
  | "pending"
  | "active"
  | "inactive"
  | "shortlisted"
  | "interviewing"
  | "interview_scheduled"
  | "accepted"
  | "hired"
  | "rejected"
  | "completed"
  | "suspended"
  | "info"
  | "default";

interface PortalStatusBadgeProps {
  status: string;
  className?: string;
  size?: "sm" | "md";
}

const STATUS_MAP: Record<string, StatusVariant> = {
  PENDING: "pending",
  ACTIVE: "active",
  INACTIVE: "inactive",
  SHORTLISTED: "shortlisted",
  INTERVIEWING: "interviewing",
  INTERVIEW_SCHEDULED: "interview_scheduled",
  ACCEPTED: "accepted",
  HIRED: "hired",
  REJECTED: "rejected",
  COMPLETED: "completed",
  SUSPENDED: "suspended",
  REVIEWED: "info",
};

/**
 * StatusBadge — semantic-only status pills.
 * Color is derived from status enum. Never decorative.
 */
export default function PortalStatusBadge({ status, className, size = "sm" }: PortalStatusBadgeProps) {
  const variant = STATUS_MAP[status.toUpperCase()] || "default";

  const styles: Record<StatusVariant, { bg: string; text: string; border: string }> = {
    pending: {
      bg: "var(--portal-warning-muted)",
      text: "var(--portal-warning)",
      border: "transparent",
    },
    active: {
      bg: "var(--portal-success-muted)",
      text: "var(--portal-success)",
      border: "transparent",
    },
    inactive: {
      bg: "var(--portal-disabled-bg)",
      text: "var(--portal-text-muted)",
      border: "var(--portal-border)",
    },
    shortlisted: {
      bg: "var(--portal-info-muted)",
      text: "var(--portal-info)",
      border: "transparent",
    },
    interviewing: {
      bg: "var(--portal-primary-muted)",
      text: "var(--portal-primary)",
      border: "transparent",
    },
    interview_scheduled: {
      bg: "var(--portal-primary-muted)",
      text: "var(--portal-primary)",
      border: "transparent",
    },
    accepted: {
      bg: "var(--portal-success-muted)",
      text: "var(--portal-success)",
      border: "transparent",
    },
    hired: {
      bg: "var(--portal-success-muted)",
      text: "var(--portal-success)",
      border: "transparent",
    },
    rejected: {
      bg: "var(--portal-danger-muted)",
      text: "var(--portal-danger)",
      border: "transparent",
    },
    completed: {
      bg: "var(--portal-success-muted)",
      text: "var(--portal-success)",
      border: "transparent",
    },
    suspended: {
      bg: "var(--portal-danger-muted)",
      text: "var(--portal-danger)",
      border: "transparent",
    },
    info: {
      bg: "var(--portal-info-muted)",
      text: "var(--portal-info)",
      border: "transparent",
    },
    default: {
      bg: "var(--portal-disabled-bg)",
      text: "var(--portal-text-secondary)",
      border: "var(--portal-border)",
    },
  };

  const s = styles[variant];
  const label = status.replace(/_/g, " ");

  return (
    <span
      className={cn(
        "inline-flex items-center font-semibold rounded-full whitespace-nowrap",
        size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1",
        className
      )}
      style={{
        backgroundColor: s.bg,
        color: s.text,
        border: `1px solid ${s.border}`,
      }}
    >
      {label}
    </span>
  );
}
