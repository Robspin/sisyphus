import { describe, it, expect } from 'vitest';
import { parseInterval, formatInterval, addInterval, INTERVAL_DEFAULT_MS } from '@/lib/intervals';

describe('parseInterval', () => {
  it('parses "1d" -> 86400000', () => {
    expect(parseInterval('1d')).toBe(86_400_000);
  });
  it('parses "7d" -> 604800000', () => {
    expect(parseInterval('7d')).toBe(604_800_000);
  });
  it('parses "14d"', () => {
    expect(parseInterval('14d')).toBe(14 * 86_400_000);
  });
  it('parses "daily" as 1d', () => {
    expect(parseInterval('daily')).toBe(86_400_000);
  });
  it('parses "weekly" as 7d', () => {
    expect(parseInterval('weekly')).toBe(604_800_000);
  });
  it('falls back to default for undefined', () => {
    expect(parseInterval(undefined)).toBe(INTERVAL_DEFAULT_MS);
  });
  it('throws on garbage', () => {
    expect(() => parseInterval('lol')).toThrow();
  });
});

describe('formatInterval', () => {
  it('formats 1d as "daily"', () => {
    expect(formatInterval('1d')).toBe('daily');
  });
  it('formats 7d as "weekly"', () => {
    expect(formatInterval('7d')).toBe('weekly');
  });
  it('formats 3d as "every 3 days"', () => {
    expect(formatInterval('3d')).toBe('every 3 days');
  });
  it('round-trips daily', () => {
    expect(formatInterval('daily')).toBe('daily');
  });
});

describe('addInterval', () => {
  it('adds 1d to a date', () => {
    const result = addInterval(new Date('2026-05-03T00:00:00Z'), '1d');
    expect(result.toISOString()).toBe('2026-05-04T00:00:00.000Z');
  });
  it('adds 7d to a date', () => {
    const result = addInterval(new Date('2026-05-03T00:00:00Z'), '7d');
    expect(result.toISOString()).toBe('2026-05-10T00:00:00.000Z');
  });
});
