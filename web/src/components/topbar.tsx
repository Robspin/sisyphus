import { listGoals, vaultRoot } from '@/lib/vault';
import { isOverdue, nextStandupDue } from '@/lib/schedule';
import { ThemeToggle } from '@/components/theme-toggle';

export async function Topbar() {
  const root = vaultRoot();
  const goals = await listGoals(root);
  const active = goals.filter(g => g.frontmatter.status === 'active');
  const overdueCount = (
    await Promise.all(active.map(async g => isOverdue(await nextStandupDue(root, g))))
  ).filter(Boolean).length;

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/70 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto w-full max-w-6xl px-6 h-12 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="label-mono">Today</span>
          <span className="font-mono text-xs text-foreground tracking-tight">{today}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="label-mono">Standups</span>
            {overdueCount > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 font-mono text-[11px] font-medium text-warning">
                <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                {overdueCount} overdue
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-success/40 bg-success/10 px-2 py-0.5 font-mono text-[11px] font-medium text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                clear
              </span>
            )}
          </div>
          <div className="h-5 w-px bg-border" />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
