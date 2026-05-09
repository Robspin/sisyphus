'use server';

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { revalidatePath } from 'next/cache';
import matter from 'gray-matter';
import { z } from 'zod';
import { atomicWrite } from './atomic-write';
import { vaultRoot } from './vault';

const INTERVAL = z.string().regex(/^(\d+d|daily|weekly)$/);

const Patch = z.object({
  status: z.enum(['active', 'paused', 'done', 'abandoned']).optional(),
  priority: z.number().int().min(1).max(99).optional(),
  target_review: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  standup_interval: INTERVAL.optional(),
  research_interval: INTERVAL.optional(),
}).strict();

export type GoalPatch = z.infer<typeof Patch>;

/** Internal: vault-path-aware version, used in tests. */
export async function _updateGoalFrontmatter(
  vaultPath: string,
  slug: string,
  patch: GoalPatch,
): Promise<void> {
  const validated = Patch.parse(patch);
  const file = path.join(vaultPath, 'goals', slug, '_goal.md');
  const raw = await readFile(file, 'utf8');
  const parsed = matter(raw);
  const merged = { ...parsed.data, ...validated };
  const next = matter.stringify(parsed.content, merged);
  await atomicWrite(file, next);
}

/** Server Action: updates goal frontmatter using the configured vault root. */
export async function updateGoalFrontmatter(slug: string, patch: GoalPatch): Promise<void> {
  await _updateGoalFrontmatter(vaultRoot(), slug, patch);
  revalidatePath(`/goals/${slug}`);
  revalidatePath('/calendar');
  revalidatePath('/');
}
