import { cn } from '@/lib/utils';

interface Props {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeading({ eyebrow, title, description, action, className }: Props) {
  return (
    <div className={cn('flex items-end justify-between gap-6 border-b border-border pb-4 mb-6', className)}>
      <div className="min-w-0">
        {eyebrow && (
          <div className="flex items-center gap-2 mb-2">
            <span className="h-1 w-1 rounded-full bg-signal" />
            <span className="label-mono">{eyebrow}</span>
          </div>
        )}
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description && (
          <p className="mt-1.5 text-sm text-muted-foreground max-w-2xl">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
