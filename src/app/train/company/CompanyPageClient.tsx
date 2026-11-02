"use client";

import LearnEnglishWrapper from "@/modules/train/LearnEnglishWrapper";
import MobileCompanyPage from "@/components/MobileCompanyPage";
import { useTheme, themeConfig } from "@/contexts/ThemeContext";
import { useEffect, useState } from "react";

function useMobileBreakpoint() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

export default function CompanyPageClient() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const currentTheme = themeConfig[resolvedTheme] || themeConfig.dark;
  const isMobile = useMobileBreakpoint();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={`min-h-screen ${resolvedTheme === 'light' || resolvedTheme === 'parchment' ? 'bg-slate-50' : 'bg-slate-900'}`} />;
  }

  if (isMobile) {
    return <MobileCompanyPage />;
  }

  return (
    <div className={`min-h-screen flex flex-col ${currentTheme.background} ${currentTheme.text} theme-transition`}>
      <div className="flex-1 overflow-auto">
        <LearnEnglishWrapper mode="company" />
      </div>
    </div>
  );
}

