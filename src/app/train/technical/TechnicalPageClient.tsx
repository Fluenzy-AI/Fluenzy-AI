"use client";

import LearnEnglishWrapper from "@/modules/train/LearnEnglishWrapper";
import { useTheme, themeConfig } from "@/contexts/ThemeContext";
import { useEffect, useState } from "react";

export default function TechnicalPageClient() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const currentTheme = themeConfig[resolvedTheme] || themeConfig.dark;

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-slate-900" />;
  }

  return (
    <div className={`min-h-screen ${currentTheme.background} ${currentTheme.text} theme-transition`}>
      <LearnEnglishWrapper mode="technical" />
    </div>
  );
}
