import { notFound } from 'next/navigation';
import { ExternalLink } from 'lucide-react';
import { readSource, vaultRoot } from '@/lib/vault';
import { MarkdownContent } from '@/components/markdown-content';
import { SectionHeading } from '@/components/section-heading';

export const dynamic = 'force-dynamic';

export default async function SourcePage({
  params,
}: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  let source;
  try { source = await readSource(vaultRoot(), slug, id); } catch { notFound(); }

  return (
    <div>
      <SectionHeading
        eyebrow={`${slug} · source`}
        title={source.id}
      />
      <dl className="mb-6 grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
        <dt className="label-mono pt-1">Kind</dt>
        <dd className="font-mono text-xs text-foreground">{source.frontmatter.source_kind}</dd>
        <dt className="label-mono pt-1">Confidence</dt>
        <dd className="font-mono text-xs text-foreground tabular-nums">{source.frontmatter.confidence.toFixed(2)}</dd>
        <dt className="label-mono pt-1">Ingested</dt>
        <dd className="font-mono text-xs text-foreground">{String(source.frontmatter.ingested).slice(0, 10)}</dd>
        {source.frontmatter.source_url && (
          <>
            <dt className="label-mono pt-1">URL</dt>
            <dd>
              <a
                href={source.frontmatter.source_url}
                className="inline-flex items-center gap-1 font-mono text-xs text-signal hover:underline underline-offset-2 break-all"
                target="_blank"
                rel="noreferrer"
              >
                {source.frontmatter.source_url}
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            </dd>
          </>
        )}
      </dl>
      <div className="rounded-lg border border-border bg-card p-6">
        <MarkdownContent source={source.body} goalSlug={slug} />
      </div>
    </div>
  );
}
