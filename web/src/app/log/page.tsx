import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { vaultRoot } from '@/lib/vault';

export const dynamic = 'force-dynamic';

export default async function LogPage() {
  let raw = '';
  try { raw = await readFile(path.join(vaultRoot(), 'LOG.md'), 'utf8'); } catch {}
  const lines = raw.split('\n').filter(l => l.startsWith('[')).reverse();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Log</h1>
      <pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed">{lines.join('\n')}</pre>
    </div>
  );
}
