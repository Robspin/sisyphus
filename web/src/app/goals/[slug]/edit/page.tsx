import { notFound } from 'next/navigation';
import { readGoal, vaultRoot } from '@/lib/vault';
import { GoalEditForm } from '@/components/goal-edit-form';
import { SectionHeading } from '@/components/section-heading';

export const dynamic = 'force-dynamic';

export default async function GoalEdit({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let goal;
  try { goal = await readGoal(vaultRoot(), slug); } catch { notFound(); }
  return (
    <div>
      <SectionHeading
        eyebrow={`${slug} · settings`}
        title={`Edit ${goal.frontmatter.title}`}
        description="Editable frontmatter fields only. Body sections are managed by the human and the CLI."
      />
      <div className="rounded-lg border border-border bg-card p-6">
        <GoalEditForm goal={goal} />
      </div>
    </div>
  );
}
