'use client';

import { useTransition, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateGoalFrontmatter } from '@/lib/actions';
import type { Goal } from '@/lib/types';

export function GoalEditForm({ goal }: { goal: Goal }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await updateGoalFrontmatter(goal.slug, {
          status: formData.get('status') as never,
          priority: Number(formData.get('priority')),
          target_review: (formData.get('target_review') as string) || undefined,
          standup_interval: (formData.get('standup_interval') as string) || undefined,
          research_interval: (formData.get('research_interval') as string) || undefined,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  }

  return (
    <form action={onSubmit} className="space-y-4 max-w-md">
      <div>
        <Label>Status</Label>
        <Select name="status" defaultValue={goal.frontmatter.status}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="active">active</SelectItem>
            <SelectItem value="paused">paused</SelectItem>
            <SelectItem value="done">done</SelectItem>
            <SelectItem value="abandoned">abandoned</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Priority</Label>
        <Input name="priority" type="number" defaultValue={goal.frontmatter.priority} min={1} max={99} />
      </div>
      <div>
        <Label>Target review (YYYY-MM-DD)</Label>
        <Input
          name="target_review"
          defaultValue={goal.frontmatter.target_review ? String(goal.frontmatter.target_review).slice(0, 10) : ''}
        />
      </div>
      <div>
        <Label>Standup interval (1d / 7d / daily / weekly)</Label>
        <Input name="standup_interval" defaultValue={goal.frontmatter.standup_interval ?? ''} />
      </div>
      <div>
        <Label>Research interval</Label>
        <Input name="research_interval" defaultValue={goal.frontmatter.research_interval ?? ''} />
      </div>
      <Button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save'}</Button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </form>
  );
}
