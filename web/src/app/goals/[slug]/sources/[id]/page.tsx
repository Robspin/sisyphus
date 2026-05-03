import { notFound } from 'next/navigation';
import { readSource, vaultRoot } from '@/lib/vault';
import { MarkdownContent } from '@/components/markdown-content';

export const dynamic = 'force-dynamic';

export default async function SourcePage({
  params,
}: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  let source;
  try { source = await readSource(vaultRoot(), slug, id); } catch { notFound(); }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{source.id}</h1>
      <dl className="grid grid-cols-[max-content,1fr] gap-x-4 text-sm text-muted-foreground">
        <dt>Kind</dt><dd>{source.frontmatter.source_kind}</dd>
        <dt>Confidence</dt><dd>{source.frontmatter.confidence}</dd>
        <dt>Ingested</dt><dd>{String(source.frontmatter.ingested).slice(0, 10)}</dd>
        {source.frontmatter.source_url && (<><dt>URL</dt><dd><a href={source.frontmatter.source_url} className="underline">{source.frontmatter.source_url}</a></dd></>)}
      </dl>
      <MarkdownContent source={source.body} goalSlug={slug} />
    </div>
  );
}
