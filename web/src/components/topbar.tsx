import { listGoals, vaultRoot } from '@/lib/vault';
import { isOverdue, nextStandupDue } from '@/lib/schedule';
import { Badge } from '@/components/ui/badge';

export async function Topbar() {
  const root = vaultRoot();
  const goals = await listGoals(root);
  const active = goals.filter(g => g.frontmatter.status === 'active');
  const overdueCount = (
    await Promise.all(active.map(async g => isOverdue(await nextStandupDue(root, g))))
  ).filter(Boolean).length;
  return (
    <header className="border-b px-4 py-2 flex items-center justify-between">
      <div className="text-sm text-muted-foreground">Sisyphus vault</div>
      {overdueCount > 0 && (
        <Badge variant="destructive">{overdueCount} overdue</Badge>
      )}
    </header>
  );
}
