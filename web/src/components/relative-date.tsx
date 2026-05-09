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
  className?: string;
}

export function RelativeDate({ date, variant = 'plain', now = new Date(), className }: Props) {
  const d = typeof date === 'string' ? new Date(`${date}T00:00:00Z`) : date;
  const text = formatRelative(d, now);
  const days = Math.round((d.getTime() - now.getTime()) / 86_400_000);
  const tone = variant === 'due'
    ? days < 0
      ? 'text-danger'
      : days === 0
        ? 'text-warning'
        : 'text-success'
    : 'text-muted-foreground';
  return <span className={cn('font-mono text-xs font-medium tabular-nums', tone, className)}>{text}</span>;
}
