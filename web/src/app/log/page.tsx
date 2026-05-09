import { vaultRoot } from '@/lib/vault';
import { parseLog } from '@/lib/log';
import { LogEntryRow } from '@/components/log-entry';
import { SectionHeading } from '@/components/section-heading';
import type { LogEntry, LogEntryKind } from '@/lib/types';

export const dynamic = 'force-dynamic';

const KIND_ORDER: LogEntryKind[] = ['research', 'standup', 'lint', 'other'];
const KIND_LABEL: Record<LogEntryKind, string> = {
  research: 'Research',
  standup:  'Standup',
  lint:     'Lint',
  other:    'Other',
};

function groupByDate(entries: LogEntry[]): { date: string; entries: LogEntry[] }[] {
  const map = new Map<string, LogEntry[]>();
  for (const e of entries) {
    const key = e.timestamp.toISOString().slice(0, 10);
    const arr = map.get(key) ?? [];
    arr.push(e);
    map.set(key, arr);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([date, entries]) => ({
      date,
      entries: entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
    }));
}

function formatDateHeading(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const yesterday = new Date(today.getTime() - 86_400_000).toISOString().slice(0, 10);
  if (iso === todayKey) return 'Today';
  if (iso === yesterday) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
}

export default async function LogPage() {
  const all = await parseLog(vaultRoot());
  const grouped = groupByDate(all);

  const totals = KIND_ORDER.reduce<Record<LogEntryKind, number>>((acc, k) => {
    acc[k] = all.filter(e => e.kind === k).length;
    return acc;
  }, { research: 0, standup: 0, lint: 0, other: 0 });

  return (
    <div>
      <SectionHeading
        eyebrow={`${all.length} ${all.length === 1 ? 'entry' : 'entries'}`}
        title="Activity log"
        description="Append-only stream of every operation across the vault. Newest first."
      />

      <div className="mb-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {KIND_ORDER.map(k => (
          <div key={k} className="rounded-lg border border-border bg-card px-4 py-3">
            <div className="label-mono">{KIND_LABEL[k]}</div>
            <div className="mt-1 font-mono text-2xl font-semibold tabular-nums text-foreground">
              {totals[k]}
            </div>
          </div>
        ))}
      </div>

      {grouped.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-10 text-center text-sm text-muted-foreground">
          No log entries yet.
        </div>
      )}

      <div className="space-y-10">
        {grouped.map(({ date, entries }) => (
          <section key={date}>
            <div className="sticky top-12 z-10 -mx-2 mb-2 px-2 py-2 bg-background/80 backdrop-blur-md flex items-center gap-3">
              <h2 className="font-semibold text-sm tracking-tight text-foreground">
                {formatDateHeading(date)}
              </h2>
              <span className="font-mono text-xs text-muted-foreground tabular-nums">{date}</span>
              <span className="flex-1 h-px bg-border" />
              <span className="label-mono">{entries.length} {entries.length === 1 ? 'entry' : 'entries'}</span>
            </div>
            <ul className="rounded-lg border border-border bg-card px-5 py-2 divide-y divide-border/60">
              {entries.map((e, i) => (
                <LogEntryRow key={i} entry={e} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
