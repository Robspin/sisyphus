import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { listGoals, vaultRoot } from '@/lib/vault';
import { lastStandup, nextStandupDue } from '@/lib/schedule';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RelativeDate } from '@/components/relative-date';
import { SectionHeading } from '@/components/section-heading';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const STATUS_TONE: Record<string, string> = {
  active:    'bg-success/15 text-success border-success/30',
  paused:    'bg-warning/15 text-warning border-warning/30',
  done:      'bg-muted text-muted-foreground border-border',
  abandoned: 'bg-muted text-muted-foreground border-border',
};

export default async function GoalsPage() {
  const root = vaultRoot();
  const goals = await listGoals(root);

  const rows = await Promise.all(goals.map(async (g) => ({
    g,
    last: await lastStandup(root, g.slug),
    next: await nextStandupDue(root, g),
  })));

  return (
    <div>
      <SectionHeading
        eyebrow={`${goals.length} goal${goals.length === 1 ? '' : 's'}`}
        title="Goals"
        description="All goals tracked in this vault, including paused and archived."
      />
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="label-mono pl-4">Title</TableHead>
              <TableHead className="label-mono">Status</TableHead>
              <TableHead className="label-mono">P</TableHead>
              <TableHead className="label-mono">Standup</TableHead>
              <TableHead className="label-mono">Last</TableHead>
              <TableHead className="label-mono">Next</TableHead>
              <TableHead className="w-8"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ g, last, next }) => (
              <TableRow key={g.slug} className="border-border group">
                <TableCell className="pl-4">
                  <Link href={`/goals/${g.slug}`} className="font-medium text-foreground hover:text-signal transition-colors">
                    {g.frontmatter.title}
                  </Link>
                  <div className="label-mono mt-0.5">{g.slug}</div>
                </TableCell>
                <TableCell>
                  <span className={cn('inline-flex items-center rounded-full border px-1.5 py-0 font-mono text-[10px] uppercase tracking-wider', STATUS_TONE[g.frontmatter.status])}>
                    {g.frontmatter.status}
                  </span>
                </TableCell>
                <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">{g.frontmatter.priority}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{g.frontmatter.standup_interval ?? '—'}</TableCell>
                <TableCell>{last ? <RelativeDate date={last} /> : <span className="font-mono text-xs text-muted-foreground/60">—</span>}</TableCell>
                <TableCell><RelativeDate date={next} variant="due" /></TableCell>
                <TableCell>
                  <Link href={`/goals/${g.slug}`} aria-label={`Open ${g.slug}`}>
                    <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-signal transition-colors" />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
