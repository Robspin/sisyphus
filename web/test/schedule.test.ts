import { describe, it, expect } from 'vitest';
import { lastStandup, nextStandupDue, lastResearch, nextResearchDue, isOverdue, calendarEvents } from '@/lib/schedule';
import { readGoal, listGoals } from '@/lib/vault';
import path from 'node:path';

const VAULT = path.join(__dirname, 'fixtures/vault');

describe('lastStandup', () => {
  it('returns the latest interview date for alpha', async () => {
    const date = await lastStandup(VAULT, 'alpha');
    expect(date).toBe('2026-05-02');
  });
  it('returns null for beta (no interviews)', async () => {
    expect(await lastStandup(VAULT, 'beta')).toBeNull();
  });
});

describe('nextStandupDue', () => {
  it('returns last + interval for alpha (1d)', async () => {
    const goal = await readGoal(VAULT, 'alpha');
    const next = await nextStandupDue(VAULT, goal);
    expect(next).toBe('2026-05-03');
  });
  it('returns the goal created date when no interviews exist', async () => {
    const goal = await readGoal(VAULT, 'beta');
    const next = await nextStandupDue(VAULT, goal);
    expect(next).toBe('2026-04-01');
  });
});

describe('lastResearch / nextResearchDue', () => {
  it('returns the latest research run timestamp for alpha', async () => {
    const date = await lastResearch(VAULT, 'alpha');
    expect(date?.toISOString()).toBe('2026-05-01T02:00:00.000Z');
  });
  it('computes next research due', async () => {
    const goal = await readGoal(VAULT, 'alpha');
    const next = await nextResearchDue(VAULT, goal);
    expect(next?.toISOString()).toBe('2026-05-02T02:00:00.000Z');
  });
});

describe('isOverdue', () => {
  it('flags a date in the past as overdue', () => {
    expect(isOverdue('2020-01-01', new Date('2026-05-03T00:00:00Z'))).toBe(true);
  });
  it('does not flag a future date', () => {
    expect(isOverdue('2030-01-01', new Date('2026-05-03T00:00:00Z'))).toBe(false);
  });
});

describe('calendarEvents', () => {
  it('produces events for goals across a date range', async () => {
    const goals = await listGoals(VAULT);
    const events = await calendarEvents(VAULT, goals.filter(g => g.frontmatter.status === 'active'), {
      from: new Date('2026-04-25'),
      to: new Date('2026-05-05'),
      now: new Date('2026-05-03T00:00:00Z'),
    });
    const standupDone = events.filter(e => e.kind === 'standup-done');
    expect(standupDone.length).toBe(2);
    expect(standupDone.map(e => e.date)).toEqual(expect.arrayContaining(['2026-04-30', '2026-05-02']));
    const researchDone = events.filter(e => e.kind === 'research-done');
    expect(researchDone.length).toBeGreaterThanOrEqual(2);
  });
});
