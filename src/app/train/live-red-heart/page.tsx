'use client';

import { useState, useEffect } from 'react';
import MobileliveRedHeartPage from './MobileliveRedHeartPage';
import DesktopLiveRedHeartPage from './DesktopLiveRedHeartPage';

/* ── Mobile breakpoint detection (≤ 640 px) — matches train/live-gd pattern ── */
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

export default function LiveRedHeartPage() {
  const isMobile = useMobileBreakpoint();

  // Prevent hydration mismatch — render nothing until breakpoint is known
  if (isMobile === null) return null;

  // Mobile (≤ 640px) → dedicated mobile HeartSync page
  if (isMobile) return <MobileliveRedHeartPage />;

  // Desktop (> 640px) → full desktop HeartSync page
  return <DesktopLiveRedHeartPage />;
}
