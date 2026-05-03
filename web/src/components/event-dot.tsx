import type { CalendarEventKind } from '@/lib/types';
import { cn } from '@/lib/utils';

const COLORS: Record<CalendarEventKind, string> = {
  'standup-done':    'bg-emerald-500',
  'standup-missed':  'bg-red-500',
  'standup-due':     'bg-amber-500',
  'research-done':   'bg-blue-500',
  'research-due':    'bg-slate-400',
};

export function EventDot({ kind }: { kind: CalendarEventKind }) {
  return <span className={cn('inline-block h-1.5 w-1.5 rounded-full', COLORS[kind])} />;
}
