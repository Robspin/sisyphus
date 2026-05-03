import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RelativeDate } from './relative-date';
import { lastStandup, nextStandupDue, lastResearch, nextResearchDue } from '@/lib/schedule';
import { vaultRoot } from '@/lib/vault';
import type { Goal } from '@/lib/types';

export async function GoalCard({ goal }: { goal: Goal }) {
  const root = vaultRoot();
  const last = await lastStandup(root, goal.slug);
  const next = await nextStandupDue(root, goal);
  const lastR = await lastResearch(root, goal.slug);
  const nextR = await nextResearchDue(root, goal);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            <Link href={`/goals/${goal.slug}`} className="hover:underline">
              {goal.frontmatter.title}
            </Link>
          </CardTitle>
          <Badge variant="outline">{goal.frontmatter.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-1 text-sm">
        <div>Last standup: {last ? <RelativeDate date={last} /> : <span className="text-muted-foreground">never</span>}</div>
        <div>Next standup: <RelativeDate date={next} variant="due" /></div>
        <div>Last research: {lastR ? <RelativeDate date={lastR} /> : <span className="text-muted-foreground">never</span>}</div>
        {nextR && <div>Next research: <RelativeDate date={nextR} variant="due" /></div>}
      </CardContent>
    </Card>
  );
}
