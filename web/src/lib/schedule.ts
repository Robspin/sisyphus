// web/src/lib/schedule.ts
import { addInterval, parseInterval } from './intervals';
import { listInterviews } from './vault';
import { listResearchRuns, lastResearchRun } from './log';
import type { Goal, CalendarEvent } from './types';

const DAY_MS = 86_400_000;

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function lastStandup(vaultPath: string, slug: string): Promise<string | null> {
  const interviews = await listInterviews(vaultPath, slug);
  if (interviews.length === 0) return null;
  return interviews[0].date;
}

export async function nextStandupDue(vaultPath: string, goal: Goal): Promise<string> {
  const last = await lastStandup(vaultPath, goal.slug);
  if (!last) {
    const created = goal.frontmatter.created as unknown;
    // gray-matter may parse YAML dates as Date objects
    return created instanceof Date ? ymd(created) : String(created);
  }
  const next = addInterval(new Date(`${last}T00:00:00Z`), goal.frontmatter.standup_interval);
  return ymd(next);
}

export async function lastResearch(vaultPath: string, slug: string): Promise<Date | null> {
  const last = await lastResearchRun(vaultPath, slug);
  return last?.timestamp ?? null;
}

export async function nextResearchDue(vaultPath: string, goal: Goal): Promise<Date | null> {
  const last = await lastResearch(vaultPath, goal.slug);
  if (!last) return new Date();
  return addInterval(last, goal.frontmatter.research_interval);
}

export function isOverdue(dateYmd: string, now: Date = new Date()): boolean {
  return new Date(`${dateYmd}T23:59:59Z`).getTime() < now.getTime() - DAY_MS;
}

export interface CalendarRange {
  from: Date;
  to: Date;
  now?: Date;
}

export async function calendarEvents(
  vaultPath: string,
  goals: Goal[],
  range: CalendarRange,
): Promise<CalendarEvent[]> {
  const events: CalendarEvent[] = [];
  const now = range.now ?? new Date();

  for (const goal of goals) {
    // Standups completed
    const interviews = await listInterviews(vaultPath, goal.slug);
    for (const i of interviews) {
      const d = new Date(`${i.date}T00:00:00Z`);
      if (d >= range.from && d <= range.to) {
        events.push({ date: i.date, goalSlug: goal.slug, kind: 'standup-done' });
      }
    }

    // Standup-due / standup-missed: walk from last interview forward by interval until past `to`
    const intervalMs = parseInterval(goal.frontmatter.standup_interval);
    const startDate = interviews[0]
      ? new Date(`${interviews[0].date}T00:00:00Z`).getTime() + intervalMs
      : new Date(`${goal.frontmatter.created}T00:00:00Z`).getTime();
    for (let t = startDate; t <= range.to.getTime(); t += intervalMs) {
      const d = new Date(t);
      if (d < range.from) continue;
      const dateStr = ymd(d);
      if (interviews.some(i => i.date === dateStr)) continue;
      const kind: CalendarEvent['kind'] = d.getTime() < now.getTime() - DAY_MS ? 'standup-missed' : 'standup-due';
      events.push({ date: dateStr, goalSlug: goal.slug, kind });
    }

    // Research completed
    const runs = await listResearchRuns(vaultPath, goal.slug);
    for (const r of runs) {
      if (r.timestamp >= range.from && r.timestamp <= range.to) {
        events.push({
          date: ymd(r.timestamp),
          goalSlug: goal.slug,
          kind: 'research-done',
          detail: r.detail,
        });
      }
    }

    // Research due (next-only)
    const next = await nextResearchDue(vaultPath, goal);
    if (next && next > now && next <= range.to) {
      events.push({ date: ymd(next), goalSlug: goal.slug, kind: 'research-due' });
    }
  }

  events.sort((a, b) => a.date.localeCompare(b.date));
  return events;
}
