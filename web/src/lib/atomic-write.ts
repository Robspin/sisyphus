import { writeFile, rename } from 'node:fs/promises';

/**
 * Write `content` to `path` atomically: write to `path + '.tmp'`,
 * then rename onto the target. The original file is never partially written.
 */
export async function atomicWrite(path: string, content: string): Promise<void> {
  const tmp = `${path}.tmp`;
  await writeFile(tmp, content, 'utf8');
  await rename(tmp, path);
}
