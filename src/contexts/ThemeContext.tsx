'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type ThemeName = 'dark' | 'midnight' | 'forest' | 'parchment' | 'codeterm' | 'light';

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  resolvedTheme: ThemeName;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const validThemes: ThemeName[] = ['dark', 'midnight', 'forest', 'parchment', 'codeterm', 'light'];

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
    background: 'bg-[#0A0C10]',
    sidebarBg: 'bg-[#0D0F14]',
    cardBg: 'bg-[#12151C]',
    cardBorder: 'border-[#1F2430]',
    text: 'text-white',
    textMuted: 'text-[#8E95A5]',
    accent: 'text-[#F97316]',
    activeNavBg: 'bg-[#24180F]',
    activeIconColor: 'text-[#F97316]',
    // Extra tokens for train page
    heroBg1: 'from-[#1C1410] via-[#17100D] to-[#0D0907]',
    heroBorder1: 'border-[#3D2517]/80',
    heroBg2: 'from-[#1F0E12] via-[#1A0A0D] to-[#0D0507]',
    heroBorder2: 'border-[#4A1720]/80',
    statsBg: 'bg-[#12151C]',
    statsBorder: 'border-[#1F2430]',
    heading: 'text-white',
    subheading: 'bg-gradient-to-r from-orange-400 via-amber-400 to-rose-400 bg-clip-text text-transparent',
    greetingColor: 'text-[#F97316]',
    bodyText: 'text-[#B0B7C6]',
    moduleCard: 'bg-[#12151C] border-[#1F2430] hover:border-orange-500/40 hover:shadow-orange-500/10',
    moduleArrow: 'bg-orange-500/20 text-orange-400 group-hover:bg-orange-500 group-hover:text-white',
    filterBtn: 'bg-[#12151C] border-[#1F2430] text-slate-200 hover:bg-slate-800',
    navBtn: 'bg-[#12151C] border-[#1F2430] text-slate-400 hover:bg-slate-800',
  },
  midnight: {
    name: 'Night',
    background: 'bg-[#0A1929]',
    sidebarBg: 'bg-[#071320]',
    cardBg: 'bg-[#0F2744]',
    cardBorder: 'border-blue-500/20',
    text: 'text-white',
    textMuted: 'text-slate-400',
    accent: 'text-sky-400',
    activeNavBg: 'bg-sky-500/15',
    activeIconColor: 'text-sky-400',
    heroBg1: 'from-[#0E1F35] via-[#0A1929] to-[#060E18]',
    heroBorder1: 'border-sky-500/20',
    heroBg2: 'from-[#10203A] via-[#0C1A2E] to-[#070E1C]',
    heroBorder2: 'border-blue-500/20',
    statsBg: 'bg-[#0F2744]',
    statsBorder: 'border-blue-500/20',
    heading: 'text-white',
    subheading: 'bg-gradient-to-r from-sky-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent',
    greetingColor: 'text-sky-400',
    bodyText: 'text-slate-400',
    moduleCard: 'bg-[#0F2744] border-blue-500/20 hover:border-sky-400/50 hover:shadow-sky-500/10',
    moduleArrow: 'bg-sky-500/20 text-sky-400 group-hover:bg-sky-500 group-hover:text-white',
    filterBtn: 'bg-[#0F2744] border-blue-500/20 text-slate-200 hover:bg-[#0D2040]',
    navBtn: 'bg-[#0F2744] border-blue-500/20 text-slate-400 hover:bg-[#0D2040]',
  },
  forest: {
    name: 'Forest',
    background: 'bg-[#0B140E]',
    sidebarBg: 'bg-[#070D09]',
    cardBg: 'bg-[#111C14]',
    cardBorder: 'border-emerald-600/25',
    text: 'text-[#E8E4D9]',
    textMuted: 'text-[#9AAD8E]',
    accent: 'text-amber-400',
    activeNavBg: 'bg-emerald-500/15',
    activeIconColor: 'text-emerald-400',
    heroBg1: 'from-[#131F16] via-[#0F180F] to-[#090F0A]',
    heroBorder1: 'border-emerald-600/25',
    heroBg2: 'from-[#14201A] via-[#101810] to-[#080E0A]',
    heroBorder2: 'border-emerald-700/25',
    statsBg: 'bg-[#111C14]',
    statsBorder: 'border-emerald-600/25',
    heading: 'text-[#E8E4D9]',
    subheading: 'bg-gradient-to-r from-emerald-400 via-amber-400 to-lime-400 bg-clip-text text-transparent',
    greetingColor: 'text-emerald-400',
    bodyText: 'text-[#9AAD8E]',
    moduleCard: 'bg-[#111C14] border-emerald-600/25 hover:border-emerald-400/50 hover:shadow-emerald-500/10',
    moduleArrow: 'bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white',
    filterBtn: 'bg-[#111C14] border-emerald-600/25 text-[#E8E4D9] hover:bg-[#14201A]',
    navBtn: 'bg-[#111C14] border-emerald-600/25 text-[#9AAD8E] hover:bg-[#14201A]',
  },
  parchment: {
    name: 'Parchment',
    background: 'bg-[#F4F1EA]',
    sidebarBg: 'bg-[#EBE7DF]',
    cardBg: 'bg-[#FCFBF8]',
    cardBorder: 'border-[#E6E2D8]',
    text: 'text-[#1C1917]',
    textMuted: 'text-[#57534E]',
    accent: 'text-[#EF4444]',
    activeNavBg: 'bg-red-500/10',
    activeIconColor: 'text-[#EF4444]',
    heroBg1: 'from-[#FFF7F0] via-[#FFF9F5] to-white',
    heroBorder1: 'border-[#F7E2D2]',
    heroBg2: 'from-[#FFF2F4] via-[#FFF6F7] to-white',
    heroBorder2: 'border-[#FAD0D6]',
    statsBg: 'bg-white',
    statsBorder: 'border-[#EFEBE4]',
    heading: 'text-[#1C1917]',
    subheading: 'text-[#8B3E0B]',
    greetingColor: 'text-[#9A4E12]',
    bodyText: 'text-[#655E57]',
    moduleCard: 'bg-white border-[#EFEBE4] hover:shadow-slate-300/50',
    moduleArrow: 'bg-[#F5E6DA] text-[#9A4E12] group-hover:bg-[#E56B2D] group-hover:text-white',
    filterBtn: 'bg-white border-[#EFEBE4] text-[#3E3833] hover:bg-slate-50',
    navBtn: 'bg-white border-[#EFEBE4] text-[#655E57] hover:bg-slate-100',
  },
  codeterm: {
    name: 'Code',
    background: 'bg-[#0D0D0D]',
    sidebarBg: 'bg-[#080808]',
    cardBg: 'bg-[#141414]',
    cardBorder: 'border-[#CC4125]/30',
    text: 'text-[#F0EDE8]',
    textMuted: 'text-[#888580]',
    accent: 'text-[#CC4125]',
    activeNavBg: 'bg-[#CC4125]/15',
    activeIconColor: 'text-[#CC4125]',
    heroBg1: 'from-[#1A1008] via-[#130C05] to-[#0D0D0D]',
    heroBorder1: 'border-[#CC4125]/25',
    heroBg2: 'from-[#1A0A08] via-[#130808] to-[#0D0D0D]',
    heroBorder2: 'border-[#CC4125]/20',
    statsBg: 'bg-[#141414]',
    statsBorder: 'border-[#CC4125]/30',
    heading: 'text-[#F0EDE8]',
    subheading: 'bg-gradient-to-r from-[#CC4125] via-orange-400 to-amber-400 bg-clip-text text-transparent',
    greetingColor: 'text-[#CC4125]',
    bodyText: 'text-[#888580]',
    moduleCard: 'bg-[#141414] border-[#CC4125]/30 hover:border-[#CC4125]/60 hover:shadow-[#CC4125]/10',
    moduleArrow: 'bg-[#CC4125]/20 text-[#CC4125] group-hover:bg-[#CC4125] group-hover:text-white',
    filterBtn: 'bg-[#141414] border-[#CC4125]/30 text-[#F0EDE8] hover:bg-[#1A1A1A]',
    navBtn: 'bg-[#141414] border-[#CC4125]/30 text-[#888580] hover:bg-[#1A1A1A]',
  },
  light: {
    name: 'Light',
    background: 'bg-[#F8F6F2]',
    sidebarBg: 'bg-white',
    cardBg: 'bg-white',
    cardBorder: 'border-[#EFEBE4]',
    text: 'text-[#1E1B18]',
    textMuted: 'text-[#655E57]',
    accent: 'text-[#9A4E12]',
    activeNavBg: 'bg-[#FDF6ED]',
    activeIconColor: 'text-[#9A4E12]',
    heroBg1: 'from-[#FFF7F0] via-[#FFF9F5] to-white',
    heroBorder1: 'border-[#F7E2D2]',
    heroBg2: 'from-[#FFF2F4] via-[#FFF6F7] to-white',
    heroBorder2: 'border-[#FAD0D6]',
    statsBg: 'bg-white',
    statsBorder: 'border-[#EFEBE4]',
    heading: 'text-[#1E1B18]',
    subheading: 'text-[#8B3E0B]',
    greetingColor: 'text-[#9A4E12]',
    bodyText: 'text-[#655E57]',
    moduleCard: 'bg-white border-[#EFEBE4] hover:shadow-slate-300/50',
    moduleArrow: 'bg-[#F5E6DA] text-[#9A4E12] group-hover:bg-[#E56B2D] group-hover:text-white',
    filterBtn: 'bg-white border-[#EFEBE4] text-[#3E3833] hover:bg-slate-50',
    navBtn: 'bg-white border-[#EFEBE4] text-[#655E57] hover:bg-slate-100',
  },
};


