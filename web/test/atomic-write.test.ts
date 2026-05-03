import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { atomicWrite } from '@/lib/atomic-write';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

describe('atomicWrite', () => {
  let dir: string;
  beforeEach(async () => { dir = await mkdtemp(path.join(tmpdir(), 'aw-')); });
  afterEach(async () => { await rm(dir, { recursive: true, force: true }); });

  it('writes content to the target path', async () => {
    const target = path.join(dir, 'foo.md');
    await atomicWrite(target, 'hello');
    const content = await readFile(target, 'utf8');
    expect(content).toBe('hello');
  });

  it('leaves no .tmp file behind on success', async () => {
    const target = path.join(dir, 'foo.md');
    await atomicWrite(target, 'hello');
    const files = await readdir(dir);
    expect(files).toEqual(['foo.md']);
  });

  it('overwrites existing files', async () => {
    const target = path.join(dir, 'foo.md');
    await atomicWrite(target, 'one');
    await atomicWrite(target, 'two');
    expect(await readFile(target, 'utf8')).toBe('two');
  });
});
