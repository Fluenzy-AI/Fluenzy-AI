"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { LayoutList, LayoutGrid, Columns3 } from "lucide-react";

type ViewMode = "table" | "card" | "kanban";

interface ViewToggleProps {
  views: ViewMode[];
  activeView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  className?: string;
}

const VIEW_CONFIG: Record<ViewMode, { icon: React.ComponentType<{ className?: string }>; label: string }> = {
  table: { icon: LayoutList, label: "Table view" },
  card: { icon: LayoutGrid, label: "Card view" },
  kanban: { icon: Columns3, label: "Kanban view" },
};

/**
 * ViewToggle — Table/Card/Kanban view mode switcher.
 */
export default function ViewToggle({ views, activeView, onViewChange, className }: ViewToggleProps) {
  return (
    <div
      className={cn("inline-flex items-center rounded-md border p-0.5 gap-0.5", className)}
      style={{
        borderColor: "var(--portal-border)",
        backgroundColor: "var(--portal-bg-elevated)",
      }}
    >
      {views.map((view) => {
        const { icon: Icon, label } = VIEW_CONFIG[view];
        const isActive = view === activeView;
        return (
          <button
            key={view}
            onClick={() => onViewChange(view)}
            title={label}
            className={cn(
              "p-1.5 rounded transition-colors",
              isActive
                ? ""
                : "hover:bg-[var(--portal-sidebar-hover)]"
            )}
            style={{
              backgroundColor: isActive ? "var(--portal-primary-muted)" : undefined,
              color: isActive ? "var(--portal-primary)" : "var(--portal-text-muted)",
            }}
          >
            <Icon className="w-4 h-4" />
          </button>
        );
      })}
    </div>
  );
}
