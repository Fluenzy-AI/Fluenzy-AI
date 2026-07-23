"use client";

import React, { useState } from "react";
import { useTheme, ThemeName } from "@/contexts/ThemeContext";
import { Moon, Sparkles, Leaf, Coffee, Terminal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const themeOptions: { value: ThemeName; label: string; icon: any }[] = [
  { value: "dark", label: "Dark", icon: Moon },
  { value: "midnight", label: "Night", icon: Sparkles },
  { value: "forest", label: "Forest", icon: Leaf },
  { value: "parchment", label: "Parchment", icon: Coffee },
  { value: "codeterm", label: "Code", icon: Terminal },
];

export function ThemeSelector({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const activeOption = themeOptions.find((opt) => opt.value === theme) || themeOptions[0];
  const ActiveIcon = activeOption.icon;

  const isParchment = theme === "parchment";

  return (
    <div className={`relative ${className || ""}`}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          backgroundColor: isParchment ? "#ffffff" : "#0f172a",
          borderColor: isParchment ? "#ef4444" : "#334155",
          color: isParchment ? "#ef4444" : "#f8fafc",
        }}
        className={`theme-toggle-trigger p-2 rounded-xl border transition-all flex items-center justify-center shadow-sm cursor-pointer ${
          isParchment
            ? "bg-white border-red-500 text-red-500 hover:bg-red-50"
            : "bg-[#0f172a] border-slate-700/60 text-slate-100 hover:bg-[#1e293b] hover:text-white"
        }`}
        title="Change Theme"
        aria-label="Change Theme"
      >
        <ActiveIcon
          className="w-4 h-4 flex-shrink-0"
          style={{
            color: isParchment ? "#ef4444" : "#a855f7",
            stroke: isParchment ? "#ef4444" : "#a855f7",
          }}
        />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              className={`theme-toggle-dropdown absolute right-0 top-full mt-2 w-48 rounded-2xl shadow-2xl z-[9999] p-1.5 space-y-1 border ${
                isParchment
                  ? "bg-white border-slate-200"
                  : "bg-[#0f172a] border-slate-700/80"
              }`}
            >
              {themeOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = theme === opt.value;
                const textColor = isParchment
                  ? (isSelected ? "#EF4444" : "#000000")
                  : (isSelected ? "#e9d5ff" : "#f1f5f9");

                return (
                  <button
                    key={opt.value}
                    data-theme-option="true"
                    onClick={() => {
                      setTheme(opt.value);
                      setOpen(false);
                    }}
                    style={{ color: textColor }}
                    className={`theme-toggle-item w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-bold rounded-xl transition-all cursor-pointer ${
                      isSelected ? "theme-toggle-item-selected" : ""
                    } ${
                      isParchment
                        ? isSelected
                          ? "bg-red-100/70 border border-red-300"
                          : "hover:bg-slate-100 text-[#000000]"
                        : isSelected
                          ? "bg-purple-600/30 border border-purple-500/40"
                          : "hover:bg-[#1e293b] text-slate-100"
                    }`}
                  >
                    <Icon
                      className="w-4 h-4 flex-shrink-0"
                      style={{ color: textColor }}
                    />
                    <span
                      className="truncate font-bold"
                      style={{
                        color: textColor,
                        WebkitTextFillColor: textColor,
                      }}
                    >
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ThemeSelector;

