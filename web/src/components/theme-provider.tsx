'use client';

import { createContext, useContext, useEffect, useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'theme';
const STORAGE_EVENT = 'sisyphus:theme-change';

function readStoredTheme(): Theme {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'dark' || stored === 'light' ? stored : 'system';
}

function subscribeStoredTheme(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener(STORAGE_EVENT, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(STORAGE_EVENT, callback);
  };
}

function getServerThemeSnapshot(): Theme {
  return 'system';
}

function subscribeSystemTheme(callback: () => void) {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', callback);
  return () => mq.removeEventListener('change', callback);
}

function getSystemSnapshot(): ResolvedTheme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getServerSystemSnapshot(): ResolvedTheme {
  return 'light';
}

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(
    subscribeStoredTheme,
    readStoredTheme,
    getServerThemeSnapshot,
  );
  const systemTheme = useSyncExternalStore(
    subscribeSystemTheme,
    getSystemSnapshot,
    getServerSystemSnapshot,
  );
  const resolvedTheme: ResolvedTheme = theme === 'system' ? systemTheme : theme;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', resolvedTheme === 'dark');
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  const setTheme = (next: Theme) => {
    if (next === 'system') {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, next);
    }
    window.dispatchEvent(new Event(STORAGE_EVENT));
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
