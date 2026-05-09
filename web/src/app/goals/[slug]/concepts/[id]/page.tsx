import { notFound } from 'next/navigation';
import { readConcept, vaultRoot } from '@/lib/vault';
import { MarkdownContent } from '@/components/markdown-content';
import { ProvenanceBar } from '@/components/provenance-bar';
import { SectionHeading } from '@/components/section-heading';

export const dynamic = 'force-dynamic';

export default async function ConceptPage({
  params,
}: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  let concept;
  try { concept = await readConcept(vaultRoot(), slug, id); } catch { notFound(); }

  return (
    <div>
      <SectionHeading
        eyebrow={`${slug} · concept`}
        title={concept.frontmatter.title}
        action={<ProvenanceBar {...concept.frontmatter.provenance} />}
      />
      <div className="mb-6 flex items-center gap-3 -mt-2 flex-wrap">
        <span className="label-mono">
          {concept.frontmatter.sources_count} source{concept.frontmatter.sources_count === 1 ? '' : 's'}
        </span>
        <span className="label-mono">
          updated {String(concept.frontmatter.updated).slice(0, 10)}
        </span>
      </div>
      <div className="rounded-lg border border-border bg-card p-6">
        <MarkdownContent source={concept.body} goalSlug={slug} />
      </div>
    </div>
  );
}
