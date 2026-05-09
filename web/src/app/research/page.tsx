import { listGoals, vaultRoot } from '@/lib/vault';
import { lastResearch, nextResearchDue } from '@/lib/schedule';
import { parseLog } from '@/lib/log';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RelativeDate } from '@/components/relative-date';
import { SectionHeading } from '@/components/section-heading';
import { LogEntryRow } from '@/components/log-entry';

export const dynamic = 'force-dynamic';

export default async function ResearchPage() {
  const root = vaultRoot();
  const goals = await listGoals(root);
  const active = goals.filter(g => g.frontmatter.status === 'active');

  const upcoming = await Promise.all(active.map(async (g) => ({
    g,
    last: await lastResearch(root, g.slug),
    next: await nextResearchDue(root, g),
  })));

  const log = await parseLog(root);
  const history = log.filter(e => e.kind === 'research').sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return (
    <div className="space-y-10">
      <div>
        <SectionHeading
          eyebrow="Schedule"
          title="Research"
          description="Autonomous research runs per active goal — last touched and next due."
        />
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="label-mono pl-4">Goal</TableHead>
                <TableHead className="label-mono">Interval</TableHead>
                <TableHead className="label-mono">Last</TableHead>
                <TableHead className="label-mono">Next</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upcoming.map(({ g, last, next }) => (
                <TableRow key={g.slug} className="border-border">
                  <TableCell className="pl-4">
                    <span className="font-medium text-sm text-foreground">{g.frontmatter.title}</span>
                    <div className="label-mono mt-0.5">{g.slug}</div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {g.frontmatter.research_interval ?? 'daily'}
                  </TableCell>
                  <TableCell>
                    {last ? <RelativeDate date={last} /> : <span className="font-mono text-xs text-muted-foreground/60">—</span>}
                  </TableCell>
                  <TableCell>
                    {next ? <RelativeDate date={next} variant="due" /> : <span className="font-mono text-xs text-muted-foreground/60">—</span>}
                  </TableCell>
                </TableRow>
              ))}
              {upcoming.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-sm text-muted-foreground">No active goals.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="h-1 w-1 rounded-full bg-signal" />
          <span className="label-mono">History</span>
          <span className="ml-1 font-mono text-xs text-muted-foreground tabular-nums">{history.length}</span>
        </div>
        {history.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-10 text-center text-sm text-muted-foreground">
            No research runs logged yet.
          </div>
        ) : (
          <ul className="rounded-lg border border-border bg-card px-5 py-2 divide-y divide-border/60">
            {history.map((e, i) => (
              <LogEntryRow key={i} entry={e} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
