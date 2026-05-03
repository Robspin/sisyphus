import { listGoals, vaultRoot } from '@/lib/vault';
import { lastResearch, nextResearchDue } from '@/lib/schedule';
import { parseLog } from '@/lib/log';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RelativeDate } from '@/components/relative-date';

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
  const history = log.filter(e => e.kind === 'research').reverse();

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-semibold mb-2">Upcoming</h2>
        <Table>
          <TableHeader>
            <TableRow><TableHead>Goal</TableHead><TableHead>Interval</TableHead><TableHead>Last</TableHead><TableHead>Next</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {upcoming.map(({ g, last, next }) => (
              <TableRow key={g.slug}>
                <TableCell>{g.frontmatter.title}</TableCell>
                <TableCell>{g.frontmatter.research_interval ?? 'daily'}</TableCell>
                <TableCell>{last ? <RelativeDate date={last} /> : '—'}</TableCell>
                <TableCell>{next ? <RelativeDate date={next} variant="due" /> : '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-2">History</h2>
        <ul className="divide-y">
          {history.map((e, i) => (
            <li key={i} className="py-2 text-sm">
              <span className="font-mono text-xs text-muted-foreground">{e.timestamp.toISOString().slice(0, 16).replace('T', ' ')}</span>
              {' · '}
              <span className="font-medium">{e.goal}</span>
              {' · '}
              <span className="text-muted-foreground">{e.detail}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
