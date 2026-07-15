"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Briefcase,
  Users,
  FileText,
  ScanFace,
  Settings,
  BarChart3,
  LayoutDashboard,
  UserPlus,
  ArrowRight,
} from "lucide-react";

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

const QUICK_ACTIONS = [
  { label: "Dashboard", href: "/company/portal", icon: LayoutDashboard, group: "Pages" },
  { label: "Job Postings", href: "/company/portal/jobs", icon: Briefcase, group: "Pages" },
  { label: "Applications", href: "/company/portal/applications", icon: Users, group: "Pages" },
  { label: "Assessments", href: "/company/portal/assessments", icon: FileText, group: "Pages" },
  { label: "HireLens AI", href: "/company/portal/hirelens", icon: ScanFace, group: "Pages" },
  { label: "Team", href: "/company/portal/team", icon: UserPlus, group: "Pages" },
  { label: "Analytics", href: "/company/portal/analytics", icon: BarChart3, group: "Pages" },
  { label: "Settings", href: "/company/portal/settings", icon: Settings, group: "Pages" },
  { label: "Post New Job", href: "/company/portal/jobs/new", icon: Briefcase, group: "Actions" },
  { label: "Create Assessment", href: "/company/portal/assessments/new", icon: FileText, group: "Actions" },
  { label: "Start HireLens Session", href: "/company/portal/hirelens/new", icon: ScanFace, group: "Actions" },
];

export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  // Reset search on open
  useEffect(() => {
    if (open) setSearch("");
  }, [open]);

  const navigate = useCallback(
    (href: string) => {
      router.push(href);
      onClose();
    },
    [router, onClose]
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 z-[101] w-full max-w-lg"
          >
            <Command
              className="rounded-xl border border-[var(--portal-border-strong)] bg-[var(--portal-bg-elevated)] shadow-[var(--portal-shadow-modal)] overflow-hidden"
              loop
            >
              {/* Input */}
              <div className="flex items-center gap-3 px-4 border-b border-[var(--portal-border)]">
                <Search className="w-4 h-4 text-[var(--portal-text-muted)] flex-shrink-0" />
                <Command.Input
                  value={search}
                  onValueChange={setSearch}
                  placeholder="Search pages, actions, and more…"
                  className="flex-1 py-3.5 bg-transparent text-sm text-[var(--portal-text-primary)] placeholder:text-[var(--portal-text-muted)] outline-none"
                  autoFocus
                />
                <kbd className="text-[10px] px-1.5 py-0.5 rounded border border-[var(--portal-border)] text-[var(--portal-text-muted)] font-mono">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <Command.List className="max-h-[300px] overflow-y-auto p-2">
                <Command.Empty className="py-8 text-center text-sm text-[var(--portal-text-muted)]">
                  No results found.
                </Command.Empty>

                {["Pages", "Actions"].map((group) => {
                  const items = QUICK_ACTIONS.filter((a) => a.group === group);
                  return (
                    <Command.Group
                      key={group}
                      heading={group}
                      className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-[var(--portal-text-muted)]"
                    >
                      {items.map((action) => {
                        const Icon = action.icon;
                        return (
                          <Command.Item
                            key={action.href}
                            value={action.label}
                            onSelect={() => navigate(action.href)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm cursor-pointer transition-colors text-[var(--portal-text-secondary)] data-[selected=true]:bg-[var(--portal-primary-muted)] data-[selected=true]:text-[var(--portal-primary)]"
                          >
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            <span className="flex-1">{action.label}</span>
                            <ArrowRight className="w-3 h-3 opacity-0 data-[selected=true]:opacity-100 transition-opacity" />
                          </Command.Item>
                        );
                      })}
                    </Command.Group>
                  );
                })}
              </Command.List>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
