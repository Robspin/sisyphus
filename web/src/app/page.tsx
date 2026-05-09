import { listGoals, vaultRoot } from '@/lib/vault';
import { isOverdue, nextStandupDue } from '@/lib/schedule';
import { GoalCard } from '@/components/goal-card';
import { SectionHeading } from '@/components/section-heading';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const root = vaultRoot();
  const goals = await listGoals(root);
  const active = goals.filter(g => g.frontmatter.status === 'active');

  const owed = (
    await Promise.all(
      active.map(async g => (isOverdue(await nextStandupDue(root, g)) ? g : null)),
    )
  ).filter(Boolean);

  const headline = owed.length > 0
    ? `${owed.length} standup${owed.length === 1 ? '' : 's'} owed`
    : 'Nothing overdue';
  const sub = owed.length > 0
    ? 'Catch up on the goals below to keep the streak alive.'
    : 'You are caught up. Compounding continues.';

  return (
    <div>
      <SectionHeading
        eyebrow="Dashboard"
        title={headline}
        description={sub}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {active.map(g => (
          <GoalCard key={g.slug} goal={g} />
        ))}
        {active.length === 0 && (
          <div className="col-span-full rounded-lg border border-dashed border-border bg-muted/30 p-10 text-center">
            <div className="label-mono mb-2">No active goals</div>
            <p className="text-sm text-muted-foreground">
              Scaffold one with <code className="font-mono text-xs">/goal new &lt;slug&gt;</code>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
