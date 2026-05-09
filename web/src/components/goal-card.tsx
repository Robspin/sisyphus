import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { RelativeDate } from './relative-date';
import { lastStandup, nextStandupDue, lastResearch, nextResearchDue, isOverdue } from '@/lib/schedule';
import { vaultRoot } from '@/lib/vault';
import { cn } from '@/lib/utils';
import type { Goal } from '@/lib/types';

const STATUS_TONE: Record<string, string> = {
  active:    'bg-success/15 text-success border-success/30',
  paused:    'bg-warning/15 text-warning border-warning/30',
  done:      'bg-muted text-muted-foreground border-border',
  abandoned: 'bg-muted text-muted-foreground border-border',
};

export async function GoalCard({ goal }: { goal: Goal }) {
  const root = vaultRoot();
  const [last, next, lastR, nextR] = await Promise.all([
    lastStandup(root, goal.slug),
    nextStandupDue(root, goal),
    lastResearch(root, goal.slug),
    nextResearchDue(root, goal),
  ]);
  const overdue = isOverdue(next);

  return (
    <Link
      href={`/goals/${goal.slug}`}
      className={cn(
        'group relative flex flex-col rounded-lg border bg-card p-5 transition-all',
        'hover:border-signal/60 hover:shadow-[0_0_0_1px_var(--signal-muted)]',
        overdue ? 'border-warning/40' : 'border-border',
      )}
    >
      {overdue && <span className="absolute left-0 top-5 h-6 w-0.5 -translate-x-px rounded-r bg-warning" />}

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="label-mono">{goal.slug}</span>
            <span className={cn('inline-flex items-center rounded-full border px-1.5 py-0 font-mono text-[10px] uppercase tracking-wider', STATUS_TONE[goal.frontmatter.status])}>
              {goal.frontmatter.status}
            </span>
          </div>
          <h3 className="font-semibold text-base leading-snug text-foreground group-hover:text-signal transition-colors">
            {goal.frontmatter.title}
          </h3>
        </div>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-signal group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3">
        <Field label="Last standup">
          {last ? <RelativeDate date={last} /> : <span className="font-mono text-xs text-muted-foreground/60">never</span>}
        </Field>
        <Field label="Next standup">
          <RelativeDate date={next} variant="due" />
        </Field>
        <Field label="Last research">
          {lastR ? <RelativeDate date={lastR} /> : <span className="font-mono text-xs text-muted-foreground/60">never</span>}
        </Field>
        <Field label="Next research">
          {nextR ? <RelativeDate date={nextR} variant="due" /> : <span className="font-mono text-xs text-muted-foreground/60">—</span>}
        </Field>
      </div>
    </Link>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="label-mono">{label}</span>
      <span>{children}</span>
    </div>
  );
}
