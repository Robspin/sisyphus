import { cn } from '@/lib/utils';

function formatRelative(target: Date, now: Date): string {
  const diffDays = Math.round((target.getTime() - now.getTime()) / 86_400_000);
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'tomorrow';
  if (diffDays === -1) return 'yesterday';
  return diffDays > 0 ? `in ${diffDays} days` : `${-diffDays} days ago`;
}

interface Props {
  date: string | Date;
  variant?: 'plain' | 'due';
  now?: Date;
}

export function RelativeDate({ date, variant = 'plain', now = new Date() }: Props) {
  const d = typeof date === 'string' ? new Date(`${date}T00:00:00Z`) : date;
  const text = formatRelative(d, now);
  const days = Math.round((d.getTime() - now.getTime()) / 86_400_000);
  const tone = variant === 'due'
    ? days < 0 ? 'text-red-600' : days === 0 ? 'text-amber-600' : 'text-emerald-600'
    : 'text-muted-foreground';
  return <span className={cn('text-xs font-medium', tone)}>{text}</span>;
}
