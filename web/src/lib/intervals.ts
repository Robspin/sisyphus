// web/src/lib/intervals.ts

export const INTERVAL_DEFAULT_MS = 86_400_000;

const NUMERIC = /^(\d+)d$/;

/**
 * Parse a duration string into milliseconds.
 * Accepts: "1d", "7d", "14d", "daily" (= 1d), "weekly" (= 7d).
 * Returns INTERVAL_DEFAULT_MS for undefined input.
 * Throws on unrecognized strings.
 */
export function parseInterval(input: string | undefined): number {
  if (input === undefined) return INTERVAL_DEFAULT_MS;
  if (input === 'daily') return 86_400_000;
  if (input === 'weekly') return 7 * 86_400_000;
  const m = NUMERIC.exec(input);
  if (m) return Number(m[1]) * 86_400_000;
  throw new Error(`Unrecognized interval: ${input}`);
}

/**
 * Convert an interval string into a human-friendly label.
 * "1d"/"daily" -> "daily"; "7d"/"weekly" -> "weekly"; otherwise "every N days".
 */
export function formatInterval(input: string | undefined): string {
  const ms = parseInterval(input);
  if (ms === 86_400_000) return 'daily';
  if (ms === 7 * 86_400_000) return 'weekly';
  const days = ms / 86_400_000;
  return `every ${days} days`;
}

/** Add an interval to a date and return a new Date. */
export function addInterval(date: Date, input: string | undefined): Date {
  return new Date(date.getTime() + parseInterval(input));
}
