import { describe, it, expect, vi } from 'vitest';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { withTmpVault } from './helpers/tmp-vault';
import { _updateGoalFrontmatter as updateGoalFrontmatter } from '@/lib/actions';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

describe('updateGoalFrontmatter', () => {
  it('updates editable fields', async () => {
    await withTmpVault(async (vault) => {
      await updateGoalFrontmatter(vault, 'alpha', { priority: 9 });
      const raw = await readFile(path.join(vault, 'goals/alpha/_goal.md'), 'utf8');
      const fm = matter(raw).data;
      expect(fm.priority).toBe(9);
    });
  });

  it('preserves the body byte-for-byte', async () => {
    await withTmpVault(async (vault) => {
      const file = path.join(vault, 'goals/alpha/_goal.md');
      const before = matter(await readFile(file, 'utf8')).content;
      await updateGoalFrontmatter(vault, 'alpha', { priority: 5 });
      const after = matter(await readFile(file, 'utf8')).content;
      expect(after).toBe(before);
    });
  });

  it('rejects an invalid status', async () => {
    await withTmpVault(async (vault) => {
      await expect(
        updateGoalFrontmatter(vault, 'alpha', { status: 'lol' as never }),
      ).rejects.toThrow();
    });
  });

  it('rejects an unknown field', async () => {
    await withTmpVault(async (vault) => {
      await expect(
        updateGoalFrontmatter(vault, 'alpha', { secret: 'pwned' } as never),
      ).rejects.toThrow();
    });
  });

  it('accepts both "1d" and "daily" for intervals', async () => {
    await withTmpVault(async (vault) => {
      await updateGoalFrontmatter(vault, 'alpha', { standup_interval: 'daily' });
      const raw = await readFile(path.join(vault, 'goals/alpha/_goal.md'), 'utf8');
      const fm = matter(raw).data;
      expect(fm.standup_interval).toBe('daily');
    });
  });
});
