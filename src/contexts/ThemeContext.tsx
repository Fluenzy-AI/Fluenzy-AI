'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type ThemeName = 'dark' | 'light' | 'system' | 'midnight' | 'forest' | 'parchment' | 'codeterm';

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  resolvedTheme: 'dark' | 'light' | 'midnight' | 'forest' | 'parchment' | 'codeterm';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const getSystemTheme = (): 'dark' | 'light' => {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'dark';
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>('dark');
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light' | 'midnight' | 'forest' | 'parchment' | 'codeterm'>('dark');

  const setTheme = useCallback((newTheme: ThemeName) => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('fluenzy-theme', newTheme);
    }
  }, []);

  useEffect(() => {
    // Get saved theme or default to dark
    const savedTheme = localStorage.getItem('fluenzy-theme') as ThemeName | null;
    const initialTheme = savedTheme || 'dark';
    setThemeState(initialTheme);
  }, []);

  useEffect(() => {
    const updateResolvedTheme = () => {
      let resolved: 'dark' | 'light' | 'midnight' | 'forest' | 'parchment' | 'codeterm';
      
      if (theme === 'system') {
        resolved = getSystemTheme();
      } else if (theme === 'midnight') {
        resolved = 'midnight';
      } else if (theme === 'forest') {
        resolved = 'forest';
      } else if (theme === 'parchment') {
        resolved = 'parchment';
      } else if (theme === 'codeterm') {
        resolved = 'codeterm';
      } else {
        resolved = theme;
      }
      
      setResolvedTheme(resolved);
    };

    updateResolvedTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        updateResolvedTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement;
    
    // Get the actual theme to apply (considering 'system' and 'midnight')
    let actualTheme = theme;
    if (theme === 'system') {
      actualTheme = getSystemTheme();
    } else if (theme === 'midnight') {
      actualTheme = 'midnight';
    } else if (theme === 'forest') {
      actualTheme = 'forest';
    } else if (theme === 'parchment') {
      actualTheme = 'parchment';
    } else if (theme === 'codeterm') {
      actualTheme = 'codeterm';
    }
    
    // Remove all theme classes first
    root.classList.remove('light', 'dark', 'midnight', 'forest', 'parchment', 'codeterm');
    
    // Add the current theme class
    root.classList.add(actualTheme);

    // Set data attribute for additional styling
    root.setAttribute('data-theme', actualTheme);
  }, [resolvedTheme, theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Helper function to get the actual theme name
export const getActualTheme = (theme: ThemeName): string => {
  if (theme === 'system') {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  }
  return theme;
};

// Theme configurations for different styles
export const themeConfig = {
  dark: {
    name: 'Dark',
    background: 'bg-[#0F172A]',
    cardBg: 'bg-[#1E293B]',
    cardBorder: 'border-white/[0.08]',
    text: 'text-white',
    textMuted: 'text-slate-400',
    accent: 'text-[#5B6CFF]',
    activeNavBg: 'bg-indigo-500/10',
    activeIconColor: 'text-indigo-400',
  },
  light: {
    name: 'Light',
    background: 'bg-[#F8FAFC]',
    cardBg: 'bg-white',
    cardBorder: 'border-[#E2E8F0]',
    text: 'text-[#0F172A]',
    textMuted: 'text-[#64748B]',
    accent: 'text-[#5B6CFF]',
    activeNavBg: 'bg-indigo-50',
    activeIconColor: 'text-indigo-500',
  },
  system: {
    name: 'System',
    background: 'bg-[#0F172A]',
    cardBg: 'bg-[#1E293B]',
    cardBorder: 'border-white/[0.08]',
    text: 'text-white',
    textMuted: 'text-slate-400',
    accent: 'text-[#5B6CFF]',
    activeNavBg: 'bg-indigo-500/10',
    activeIconColor: 'text-indigo-400',
  },
  midnight: {
    name: 'Night',
    background: 'bg-[#0a1929]',
    cardBg: 'bg-[#0f2744]/60',
    cardBorder: 'border-white/[0.08]',
    text: 'text-white',
    textMuted: 'text-slate-400',
    accent: 'text-slate-200',
    activeNavBg: 'bg-white/8',
    activeIconColor: 'text-white',
  },
  forest: {
    name: 'Forest',
    background: 'bg-[#0b140e]',
    cardBg: 'bg-[#111c14]/60',
    cardBorder: 'border-amber-600/20',
    text: 'text-[#e8e4d9]',
    textMuted: 'text-[#9aad8e]',
    accent: 'text-amber-400',
    activeNavBg: 'bg-amber-500/10',
    activeIconColor: 'text-amber-400',
  },
  parchment: {
    name: 'Parchment',
    background: 'bg-[#F4F1EA]',
    cardBg: 'bg-[#FCFBF8]',
    cardBorder: 'border-[#E6E2D8]',
    text: 'text-[#1C1917]',
    textMuted: 'text-[#57534E]',
    accent: 'text-[#EF4444]',
    activeNavBg: 'bg-red-500/10',
    activeIconColor: 'text-[#EF4444]',
  },
  codeterm: {
    name: 'Code',
    background: 'bg-[#0D0D0D]',
    cardBg: 'bg-[#141414]',
    cardBorder: 'border-[#CC4125]/25',
    text: 'text-[#F0EDE8]',
    textMuted: 'text-[#888580]',
    accent: 'text-[#CC4125]',
    activeNavBg: 'bg-[#CC4125]/10',
    activeIconColor: 'text-[#CC4125]',
  },
};

