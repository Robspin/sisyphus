import { mkdtemp, cp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const FIXTURE = path.join(__dirname, '..', 'fixtures', 'vault');

export async function withTmpVault<T>(fn: (vaultPath: string) => Promise<T>): Promise<T> {
  const dir = await mkdtemp(path.join(tmpdir(), 'sis-'));
  await cp(FIXTURE, dir, { recursive: true });
  try {
    return await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
