import { describe, it, expect } from 'vitest';
import { renderMarkdown } from '@/lib/markdown';

describe('renderMarkdown', () => {
  it('renders headings', async () => {
    const html = await renderMarkdown('# Hello', { goalSlug: 'alpha' });
    expect(html).toMatch(/<h1>Hello<\/h1>/);
  });
  it('renders GFM tables', async () => {
    const html = await renderMarkdown('| a | b |\n|---|---|\n| 1 | 2 |', { goalSlug: 'alpha' });
    expect(html).toMatch(/<table>/);
  });
  it('resolves source-style wikilinks', async () => {
    const html = await renderMarkdown('See [[2026-04-26-alpha-foo]]', { goalSlug: 'alpha' });
    expect(html).toMatch(/href="\/goals\/alpha\/sources\/2026-04-26-alpha-foo"/);
  });
  it('resolves concept-style wikilinks', async () => {
    const html = await renderMarkdown('See [[alpha-concept]]', { goalSlug: 'alpha' });
    expect(html).toMatch(/href="\/goals\/alpha\/concepts\/alpha-concept"/);
  });
  it('strips dangerous tags', async () => {
    const html = await renderMarkdown('<script>alert(1)</script>Hello', { goalSlug: 'alpha' });
    expect(html).not.toMatch(/<script>/);
    expect(html).toMatch(/Hello/);
  });
});
