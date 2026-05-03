import Link from 'next/link';
import { listGoals, vaultRoot } from '@/lib/vault';
import { lastStandup, nextStandupDue } from '@/lib/schedule';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { RelativeDate } from '@/components/relative-date';

export const dynamic = 'force-dynamic';

export default async function GoalsPage() {
  const root = vaultRoot();
  const goals = await listGoals(root);

  const rows = await Promise.all(goals.map(async (g) => ({
    g,
    last: await lastStandup(root, g.slug),
    next: await nextStandupDue(root, g),
  })));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Goals</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Standup</TableHead>
            <TableHead>Last</TableHead>
            <TableHead>Next</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ g, last, next }) => (
            <TableRow key={g.slug}>
              <TableCell><Link href={`/goals/${g.slug}`} className="hover:underline">{g.frontmatter.title}</Link></TableCell>
              <TableCell><Badge variant="outline">{g.frontmatter.status}</Badge></TableCell>
              <TableCell>{g.frontmatter.priority}</TableCell>
              <TableCell>{g.frontmatter.standup_interval ?? '—'}</TableCell>
              <TableCell>{last ? <RelativeDate date={last} /> : '—'}</TableCell>
              <TableCell><RelativeDate date={next} variant="due" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
