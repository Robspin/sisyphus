'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme, type Theme } from '@/components/theme-provider';

const NEXT: Record<Theme, Theme> = {
  light: 'dark',
  dark: 'system',
  system: 'light',
};

const ICONS: Record<Theme, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

const LABELS: Record<Theme, string> = {
  light: 'Light theme',
  dark: 'Dark theme',
  system: 'System theme',
};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const Icon = ICONS[theme];
  const label = LABELS[theme];

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => setTheme(NEXT[theme])}
      aria-label={`Switch theme (current: ${label})`}
      title={label}
    >
      <Icon />
    </Button>
  );
}
