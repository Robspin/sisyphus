import { describe, it, expect } from 'vitest';
import {
  listGoals, readGoal, listInterviews, listSources, listConcepts,
  readSource, readConcept, readProgress, listSharedConcepts,
} from '@/lib/vault';
import path from 'node:path';

const VAULT = path.join(__dirname, 'fixtures/vault');

describe('listGoals', () => {
  it('returns all three fixture goals sorted by priority', async () => {
    const goals = await listGoals(VAULT);
    expect(goals.map(g => g.slug)).toEqual(['alpha', 'beta', 'gamma']);
    expect(goals[0].frontmatter.title).toBe('Alpha goal');
  });
});

describe('readGoal', () => {
  it('returns frontmatter and body for alpha', async () => {
    const goal = await readGoal(VAULT, 'alpha');
    expect(goal.frontmatter.status).toBe('active');
    expect(goal.frontmatter.standup_interval).toBe('1d');
    expect(goal.body).toMatch(/Why this matters/);
  });
  it('throws for missing goal', async () => {
    await expect(readGoal(VAULT, 'nonexistent')).rejects.toThrow();
  });
});

describe('listInterviews', () => {
  it('returns alpha interviews sorted descending', async () => {
    const interviews = await listInterviews(VAULT, 'alpha');
    expect(interviews.map(i => i.date)).toEqual(['2026-05-02', '2026-04-30']);
  });
  it('returns empty for beta', async () => {
    expect(await listInterviews(VAULT, 'beta')).toEqual([]);
  });
});

describe('listSources', () => {
  it('returns alpha sources', async () => {
    const sources = await listSources(VAULT, 'alpha');
    expect(sources.map(s => s.id)).toEqual(['2026-04-26-alpha-foo']);
    expect(sources[0].frontmatter.source_kind).toBe('article');
  });
});

describe('listConcepts', () => {
  it('returns alpha concepts', async () => {
    const concepts = await listConcepts(VAULT, 'alpha');
    expect(concepts.map(c => c.id)).toEqual(['alpha-concept']);
    expect(concepts[0].frontmatter.provenance.extracted).toBe(1);
  });
});

describe('readSource / readConcept', () => {
  it('reads a single source by id', async () => {
    const s = await readSource(VAULT, 'alpha', '2026-04-26-alpha-foo');
    expect(s.frontmatter.confidence).toBe(0.8);
    expect(s.body).toMatch(/TL;DR/);
  });
  it('reads a single concept by id', async () => {
    const c = await readConcept(VAULT, 'alpha', 'alpha-concept');
    expect(c.frontmatter.title).toBe('Alpha concept');
  });
});

describe('readProgress', () => {
  it('reads progress.md for a goal', async () => {
    const p = await readProgress(VAULT, 'alpha');
    expect(p.body).toMatch(/Recent wins/);
  });
});

describe('listSharedConcepts', () => {
  it('returns concepts from _shared', async () => {
    const concepts = await listSharedConcepts(VAULT);
    expect(concepts.map(c => c.id)).toEqual(['shared-concept']);
  });
});
