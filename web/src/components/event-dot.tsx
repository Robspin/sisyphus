import type { CalendarEventKind } from '@/lib/types';
import { cn } from '@/lib/utils';

const COLORS: Record<CalendarEventKind, string> = {
  'standup-done':    'bg-success',
  'standup-missed':  'bg-danger',
  'standup-due':     'bg-warning',
  'research-done':   'bg-info',
  'research-due':    'bg-muted-foreground/60',
};

export function EventDot({ kind }: { kind: CalendarEventKind }) {
  return <span className={cn('inline-block h-1.5 w-1.5 rounded-full', COLORS[kind])} />;
}
