"use client";

import LearnEnglishWrapper from "@/modules/train/LearnEnglishWrapper";
import { useTheme, themeConfig } from "@/contexts/ThemeContext";
import { useEffect, useState } from "react";
import { useModuleAccess } from "@/hooks/useModuleAccess";

export default function TechnicalPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { checking } = useModuleAccess("technical");
  
  const currentTheme = themeConfig[resolvedTheme] || themeConfig.dark;

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || checking) {
    return <div className="min-h-screen bg-slate-900" />;
  }

  return (
    <div className={`min-h-screen ${currentTheme.background} ${currentTheme.text} theme-transition`}>
      <LearnEnglishWrapper mode="technical" />
    </div>
  );
}