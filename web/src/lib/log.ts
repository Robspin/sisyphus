// web/src/lib/log.ts
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { LogEntry, ResearchRun } from './types';

// Splits "[date time] kindRaw <rest>" — `rest` differs by kind:
//   research <slug>: <detail>
//   standup: <comma-separated slugs>
//   lint: <detail>
const HEAD = /^\[(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})\] (\w+)(.*)$/;
const RESEARCH_TAIL = /^\s+([\w-]+):\s*(.*)$/;
const STANDUP_TAIL = /^:\s*(.*)$/;

export function parseLogLine(line: string): LogEntry | null {
  const m = HEAD.exec(line.trim());
  if (!m) return null;
  const [, date, time, kindRaw, rest] = m;
  const timestamp = new Date(`${date}T${time}:00.000Z`);
  let kind: LogEntry['kind'];
  let goal: string | undefined;
  let detail: string | undefined;

  switch (kindRaw) {
    case 'research': {
      const r = RESEARCH_TAIL.exec(rest);
      if (r) { goal = r[1]; detail = r[2]; }
      kind = 'research';
      break;
    }
    case 'standup': {
      const r = STANDUP_TAIL.exec(rest);
      if (r) {
        const goals = r[1].split(',').map(s => s.trim()).filter(Boolean);
        goal = goals[0];
        detail = r[1];
      }
      kind = 'standup';
      break;
    }
    case 'lint':
      kind = 'lint';
      detail = rest.replace(/^:\s*/, '');
      break;
    default:
      kind = 'other';
  }

  return { timestamp, kind, goal, raw: line, detail };
}

export async function parseLog(vaultPath: string): Promise<LogEntry[]> {
  let content: string;
  try { content = await readFile(path.join(vaultPath, 'LOG.md'), 'utf8'); }
  catch { return []; }
  return content
    .split('\n')
    .map(parseLogLine)
    .filter((e): e is LogEntry => e !== null);
}

export async function listResearchRuns(vaultPath: string, goalSlug: string): Promise<ResearchRun[]> {
  const entries = await parseLog(vaultPath);
  return entries
    .filter(e => e.kind === 'research' && e.goal === goalSlug)
    .map(e => {
      const sources = /\+(\d+) sources/.exec(e.detail ?? '');
      const concepts = /~(\d+) concepts/.exec(e.detail ?? '');
      return {
        ...e,
        kind: 'research' as const,
        goal: e.goal!,
        sourcesAdded: sources ? Number(sources[1]) : 0,
        conceptsTouched: concepts ? Number(concepts[1]) : 0,
      };
    });
}

export async function lastResearchRun(vaultPath: string, goalSlug: string): Promise<ResearchRun | null> {
  const runs = await listResearchRuns(vaultPath, goalSlug);
  if (runs.length === 0) return null;
  return runs.reduce((a, b) => (a.timestamp > b.timestamp ? a : b));
}
