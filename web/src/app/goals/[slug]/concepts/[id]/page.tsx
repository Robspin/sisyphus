import { notFound } from 'next/navigation';
import { readConcept, vaultRoot } from '@/lib/vault';
import { MarkdownContent } from '@/components/markdown-content';
import { ProvenanceBar } from '@/components/provenance-bar';

export const dynamic = 'force-dynamic';

export default async function ConceptPage({
  params,
}: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  let concept;
  try { concept = await readConcept(vaultRoot(), slug, id); } catch { notFound(); }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{concept.frontmatter.title}</h1>
        <ProvenanceBar {...concept.frontmatter.provenance} />
      </div>
      <div className="text-sm text-muted-foreground">
        {concept.frontmatter.sources_count} source{concept.frontmatter.sources_count === 1 ? '' : 's'} · updated {String(concept.frontmatter.updated).slice(0, 10)}
      </div>
      <MarkdownContent source={concept.body} goalSlug={slug} />
    </div>
  );
}
