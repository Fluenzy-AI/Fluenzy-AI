'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type ThemeName = 'dark' | 'light' | 'system' | 'midnight';

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  resolvedTheme: 'dark' | 'light' | 'midnight';
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
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light' | 'midnight'>('dark');

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
      let resolved: 'dark' | 'light' | 'midnight';
      
      if (theme === 'system') {
        resolved = getSystemTheme();
      } else if (theme === 'midnight') {
        resolved = 'midnight';
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
    }
    
    // Remove all theme classes first
    root.classList.remove('light', 'dark', 'midnight');
    
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
  },
  light: {
    name: 'Light',
    background: 'bg-[#F8FAFC]',
    cardBg: 'bg-white',
    cardBorder: 'border-[#E2E8F0]',
    text: 'text-[#0F172A]',
    textMuted: 'text-[#64748B]',
    accent: 'text-[#5B6CFF]',
  },
  system: {
    name: 'System',
    background: 'bg-[#0F172A]',
    cardBg: 'bg-[#1E293B]',
    cardBorder: 'border-white/[0.08]',
    text: 'text-white',
    textMuted: 'text-slate-400',
    accent: 'text-[#5B6CFF]',
  },
  midnight: {
    name: 'Midnight',
    background: 'bg-[#0a1929]',
    cardBg: 'bg-[#0f2744]/60',
    cardBorder: 'border-blue-500/30',
    text: 'text-white',
    textMuted: 'text-blue-200/70',
    accent: 'text-blue-400',
  },
};
