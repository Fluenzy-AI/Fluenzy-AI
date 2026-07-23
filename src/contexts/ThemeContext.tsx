'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type ThemeName = 'dark' | 'midnight' | 'forest' | 'parchment' | 'codeterm';

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  resolvedTheme: ThemeName;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const validThemes: ThemeName[] = ['dark', 'midnight', 'forest', 'parchment', 'codeterm'];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>('dark');
  const [resolvedTheme, setResolvedTheme] = useState<ThemeName>('dark');

  const setTheme = useCallback((newTheme: ThemeName) => {
    const targetTheme = validThemes.includes(newTheme) ? newTheme : 'dark';
    setThemeState(targetTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('fluenzy-theme', targetTheme);
    }
  }, []);

  useEffect(() => {
    // Get saved theme or default to dark
    const savedTheme = localStorage.getItem('fluenzy-theme') as any;
    const initialTheme = validThemes.includes(savedTheme) ? savedTheme : 'dark';
    setThemeState(initialTheme);
  }, []);

  useEffect(() => {
    const currentTheme = validThemes.includes(theme) ? theme : 'dark';
    setResolvedTheme(currentTheme);
  }, [theme]);

  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement;
    const actualTheme = validThemes.includes(theme) ? theme : 'dark';
    
    // Remove all theme classes first
    root.classList.remove('light', 'dark', 'midnight', 'forest', 'parchment', 'codeterm', 'system');
    
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
  return validThemes.includes(theme) ? theme : 'dark';
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


