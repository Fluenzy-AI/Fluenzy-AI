'use client';

import { useTheme, themeConfig } from '@/contexts/ThemeContext';

export function TrainNavigation() {
  const { resolvedTheme } = useTheme();
  const currentTheme = themeConfig[resolvedTheme] || themeConfig.dark;
  const isLight = resolvedTheme === 'light';

  return (
    <div className={`border-b ${currentTheme.cardBorder} ${isLight ? 'bg-white/80' : 'bg-slate-900/50'} backdrop-blur-sm`}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-12 flex items-center">
        <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          Train
        </span>
      </div>
    </div>
  );
}
