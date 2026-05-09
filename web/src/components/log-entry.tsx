import Link from 'next/link';
import type { LogEntry, LogEntryKind } from '@/lib/types';
import { cn } from '@/lib/utils';

const KIND_TONE: Record<LogEntryKind, { dot: string; chip: string; rail: string }> = {
  research: { dot: 'bg-info',    chip: 'text-info border-info/30 bg-info/10',       rail: 'bg-info/40' },
  standup:  { dot: 'bg-success', chip: 'text-success border-success/30 bg-success/10', rail: 'bg-success/40' },
  lint:     { dot: 'bg-warning', chip: 'text-warning border-warning/30 bg-warning/10', rail: 'bg-warning/40' },
  other:    { dot: 'bg-muted-foreground/60', chip: 'text-muted-foreground border-border bg-muted/40', rail: 'bg-border' },
};

interface Props {
  entry: LogEntry;
}

const SOURCES_RE = /\+(\d+)\s+sources?/;
const CONCEPTS_RE = /[+~](\d+)\s+concepts?/;

function extractMetrics(detail: string) {
  const s = SOURCES_RE.exec(detail);
  const c = CONCEPTS_RE.exec(detail);
  return {
    sources: s ? Number(s[1]) : null,
    concepts: c ? Number(c[1]) : null,
  };
}

export function LogEntryRow({ entry }: Props) {
  const tone = KIND_TONE[entry.kind];
  const time = entry.timestamp.toISOString().slice(11, 16);
  const detail = entry.detail ?? '';
  const metrics = entry.kind === 'research' ? extractMetrics(detail) : null;

  // Strip the metrics prefix from the displayed detail so it's not duplicated.
  const cleanedDetail = entry.kind === 'research'
    ? detail.replace(/^[+~]\d+\s+sources?,?\s*[+~]?\d*\s*concepts?\.?\s*/i, '')
    : detail;

  return (
    <li className="group relative flex gap-4 py-3">
      <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
        <span className={cn('h-1.5 w-1.5 rounded-full', tone.dot)} />
        <span className={cn('w-px flex-1 mt-1', tone.rail)} />
      </div>

      <div className="min-w-0 flex-1 pb-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs tabular-nums text-muted-foreground">{time}</span>
          <span className={cn('inline-flex items-center rounded border px-1.5 py-0 font-mono text-[10px] uppercase tracking-wider', tone.chip)}>
            {entry.kind}
          </span>
          {entry.goal && (
            <Link
              href={`/goals/${entry.goal}`}
              className="font-mono text-xs text-foreground hover:text-signal transition-colors"
            >
              {entry.goal}
            </Link>
          )}
          {metrics && (metrics.sources !== null || metrics.concepts !== null) && (
            <span className="ml-auto flex items-center gap-1.5">
              {metrics.sources !== null && (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] text-foreground tabular-nums">
                  <span className="text-muted-foreground">+</span>{metrics.sources}<span className="text-muted-foreground">src</span>
                </span>
              )}
              {metrics.concepts !== null && (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] text-foreground tabular-nums">
                  <span className="text-muted-foreground">~</span>{metrics.concepts}<span className="text-muted-foreground">cpt</span>
                </span>
              )}
            </span>
          )}
        </div>
        {cleanedDetail && (
          <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed line-clamp-3 group-hover:line-clamp-none">
            {cleanedDetail}
          </p>
        )}
      </div>
    </li>
  );
}
