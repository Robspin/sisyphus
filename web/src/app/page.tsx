import { listGoals, vaultRoot } from '@/lib/vault';
import { isOverdue, nextStandupDue } from '@/lib/schedule';
import { GoalCard } from '@/components/goal-card';

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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">
        {owed.length > 0
          ? `Today, you owe ${owed.length} standup${owed.length === 1 ? '' : 's'}.`
          : 'Nothing overdue. Nice.'}
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {active.map(g => (
          <GoalCard key={g.slug} goal={g} />
        ))}
      </div>
    </div>
  );
}
