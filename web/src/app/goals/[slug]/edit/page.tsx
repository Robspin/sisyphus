import { notFound } from 'next/navigation';
import { readGoal, vaultRoot } from '@/lib/vault';
import { GoalEditForm } from '@/components/goal-edit-form';

export const dynamic = 'force-dynamic';

export default async function GoalEdit({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let goal;
  try { goal = await readGoal(vaultRoot(), slug); } catch { notFound(); }
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Edit {goal.frontmatter.title}</h1>
      <p className="text-sm text-muted-foreground">
        Editable frontmatter fields only. Body sections are managed by the human and the CLI.
      </p>
      <GoalEditForm goal={goal} />
    </div>
  );
}
