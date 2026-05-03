// web/src/lib/vault.ts
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import type {
  Goal, GoalFrontmatter, Source, SourceFrontmatter,
  Concept, ConceptFrontmatter, Interview, InterviewFrontmatter,
  ProgressDoc,
} from './types';

export function vaultRoot(): string {
  return path.resolve(process.env.VAULT_PATH ?? '..');
}

async function exists(p: string): Promise<boolean> {
  try { await stat(p); return true; } catch { return false; }
}

async function readMarkdown<T>(filePath: string): Promise<{ data: T; content: string }> {
  const raw = await readFile(filePath, 'utf8');
  const parsed = matter(raw);
  return { data: parsed.data as T, content: parsed.content };
}

export async function listGoals(vaultPath: string): Promise<Goal[]> {
  const goalsDir = path.join(vaultPath, 'goals');
  const entries = await readdir(goalsDir, { withFileTypes: true });
  const goals: Goal[] = [];
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const goalFile = path.join(goalsDir, e.name, '_goal.md');
    if (!(await exists(goalFile))) continue;
    const { data, content } = await readMarkdown<GoalFrontmatter>(goalFile);
    goals.push({ slug: e.name, frontmatter: data, body: content, path: goalFile });
  }
  goals.sort((a, b) => (a.frontmatter.priority ?? 99) - (b.frontmatter.priority ?? 99));
  return goals;
}

export async function readGoal(vaultPath: string, slug: string): Promise<Goal> {
  const goalFile = path.join(vaultPath, 'goals', slug, '_goal.md');
  if (!(await exists(goalFile))) throw new Error(`Goal not found: ${slug}`);
  const { data, content } = await readMarkdown<GoalFrontmatter>(goalFile);
  return { slug, frontmatter: data, body: content, path: goalFile };
}

export async function readProgress(vaultPath: string, slug: string): Promise<ProgressDoc> {
  const file = path.join(vaultPath, 'goals', slug, 'progress.md');
  const { data, content } = await readMarkdown<Record<string, unknown>>(file);
  return { goal: slug, body: content, path: file, frontmatter: data };
}

export async function listInterviews(vaultPath: string, slug: string): Promise<Interview[]> {
  const dir = path.join(vaultPath, 'goals', slug, 'raw', 'interviews');
  if (!(await exists(dir))) return [];
  const files = (await readdir(dir)).filter(f => f.endsWith('.md'));
  const items: Interview[] = [];
  for (const f of files) {
    const filePath = path.join(dir, f);
    const { data, content } = await readMarkdown<InterviewFrontmatter>(filePath);
    items.push({
      date: f.replace(/\.md$/, ''),
      goal: slug,
      frontmatter: data,
      body: content,
      path: filePath,
    });
  }
  items.sort((a, b) => b.date.localeCompare(a.date));
  return items;
}

export async function listSources(vaultPath: string, slug: string): Promise<Source[]> {
  const dir = path.join(vaultPath, 'goals', slug, 'wiki', 'sources');
  if (!(await exists(dir))) return [];
  const files = (await readdir(dir)).filter(f => f.endsWith('.md'));
  const items: Source[] = [];
  for (const f of files) {
    const filePath = path.join(dir, f);
    const { data, content } = await readMarkdown<SourceFrontmatter>(filePath);
    items.push({ id: f.replace(/\.md$/, ''), frontmatter: data, body: content, path: filePath });
  }
  items.sort((a, b) => b.id.localeCompare(a.id));
  return items;
}

export async function readSource(vaultPath: string, slug: string, id: string): Promise<Source> {
  const filePath = path.join(vaultPath, 'goals', slug, 'wiki', 'sources', `${id}.md`);
  if (!(await exists(filePath))) throw new Error(`Source not found: ${slug}/${id}`);
  const { data, content } = await readMarkdown<SourceFrontmatter>(filePath);
  return { id, frontmatter: data, body: content, path: filePath };
}

export async function listConcepts(vaultPath: string, slug: string): Promise<Concept[]> {
  const dir = path.join(vaultPath, 'goals', slug, 'wiki', 'concepts');
  if (!(await exists(dir))) return [];
  const files = (await readdir(dir)).filter(f => f.endsWith('.md'));
  const items: Concept[] = [];
  for (const f of files) {
    const filePath = path.join(dir, f);
    const { data, content } = await readMarkdown<ConceptFrontmatter>(filePath);
    items.push({ id: f.replace(/\.md$/, ''), frontmatter: data, body: content, path: filePath });
  }
  items.sort((a, b) => a.id.localeCompare(b.id));
  return items;
}

export async function readConcept(vaultPath: string, slug: string, id: string): Promise<Concept> {
  const filePath = path.join(vaultPath, 'goals', slug, 'wiki', 'concepts', `${id}.md`);
  if (!(await exists(filePath))) throw new Error(`Concept not found: ${slug}/${id}`);
  const { data, content } = await readMarkdown<ConceptFrontmatter>(filePath);
  return { id, frontmatter: data, body: content, path: filePath };
}

export async function listSharedConcepts(vaultPath: string): Promise<Concept[]> {
  const dir = path.join(vaultPath, '_shared', 'wiki', 'concepts');
  if (!(await exists(dir))) return [];
  const files = (await readdir(dir)).filter(f => f.endsWith('.md'));
  const items: Concept[] = [];
  for (const f of files) {
    const filePath = path.join(dir, f);
    const { data, content } = await readMarkdown<ConceptFrontmatter>(filePath);
    items.push({ id: f.replace(/\.md$/, ''), frontmatter: data, body: content, path: filePath });
  }
  return items;
}
