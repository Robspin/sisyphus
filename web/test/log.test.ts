import { describe, it, expect } from 'vitest';
import { parseLog, parseLogLine, listResearchRuns, lastResearchRun } from '@/lib/log';
import path from 'node:path';

const FIXTURE = path.join(__dirname, 'fixtures/vault');

describe('parseLogLine', () => {
  it('parses a research line', () => {
    const e = parseLogLine('[2026-05-01 02:00] research alpha: +1 sources, ~0 concepts');
    expect(e?.kind).toBe('research');
    expect(e?.goal).toBe('alpha');
    expect(e?.timestamp.toISOString()).toBe('2026-05-01T02:00:00.000Z');
  });
  it('parses a standup line', () => {
    const e = parseLogLine('[2026-04-30 09:00] standup: alpha');
    expect(e?.kind).toBe('standup');
    expect(e?.goal).toBe('alpha');
  });
  it('returns null for non-log lines', () => {
    expect(parseLogLine('# Operations log')).toBeNull();
    expect(parseLogLine('')).toBeNull();
  });
});

describe('parseLog', () => {
  it('reads and parses LOG.md from fixture vault', async () => {
    const entries = await parseLog(FIXTURE);
    expect(entries.length).toBe(4);
    expect(entries.map(e => e.kind)).toEqual(['research', 'standup', 'research', 'standup']);
  });
});

describe('listResearchRuns', () => {
  it('returns only research runs for a goal', async () => {
    const runs = await listResearchRuns(FIXTURE, 'alpha');
    expect(runs.length).toBe(2);
    expect(runs.every(r => r.kind === 'research' && r.goal === 'alpha')).toBe(true);
  });
});

describe('lastResearchRun', () => {
  it('returns the most recent run for the goal', async () => {
    const last = await lastResearchRun(FIXTURE, 'alpha');
    expect(last?.timestamp.toISOString()).toBe('2026-05-01T02:00:00.000Z');
  });
  it('returns null if no runs', async () => {
    expect(await lastResearchRun(FIXTURE, 'beta')).toBeNull();
  });
});
