// web/src/lib/types.ts

export type GoalStatus = 'active' | 'paused' | 'done' | 'abandoned';

export interface GoalFrontmatter {
  type: 'goal';
  slug: string;
  title: string;
  status: GoalStatus;
  priority: number;
  created: string;
  target_review?: string;
  standup_interval?: string;
  research_interval?: string;
}

export interface Goal {
  slug: string;
  frontmatter: GoalFrontmatter;
  body: string;
  path: string;
}

export type SourceKind = 'article' | 'paper' | 'video' | 'podcast' | 'book' | 'interview';

export interface SourceFrontmatter {
  type: 'source';
  goal: string;
  source_url?: string;
  source_kind: SourceKind;
  ingested: string;
  confidence: number;
}

export interface Source {
  id: string;
  frontmatter: SourceFrontmatter;
  body: string;
  path: string;
}

export interface ConceptFrontmatter {
  type: 'concept';
  goal: string;
  title: string;
  created: string;
  updated: string;
  sources_count: number;
  provenance: { extracted: number; inferred: number; ambiguous: number };
}

export interface Concept {
  id: string;
  frontmatter: ConceptFrontmatter;
  body: string;
  path: string;
}

export interface InterviewFrontmatter {
  type: 'interview';
  goal: string;
  date: string;
  duration_min?: number;
}

export interface Interview {
  date: string;
  goal: string;
  frontmatter: InterviewFrontmatter;
  body: string;
  path: string;
}

export interface ProgressDoc {
  goal: string;
  body: string;
  path: string;
  frontmatter: Record<string, unknown>;
}

export type LogEntryKind = 'research' | 'standup' | 'lint' | 'other';

export interface LogEntry {
  timestamp: Date;
  kind: LogEntryKind;
  goal?: string;
  raw: string;
  detail?: string;
}

export interface ResearchRun extends LogEntry {
  kind: 'research';
  goal: string;
  sourcesAdded: number;
  conceptsTouched: number;
}

export type CalendarEventKind =
  | 'standup-done'
  | 'standup-missed'
  | 'standup-due'
  | 'research-done'
  | 'research-due';

export interface CalendarEvent {
  date: string;          // YYYY-MM-DD
  goalSlug: string;
  kind: CalendarEventKind;
  detail?: string;
}
