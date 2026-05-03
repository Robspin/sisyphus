import Link from 'next/link';
import { notFound } from 'next/navigation';
import { readGoal, readProgress, listSources, listConcepts, vaultRoot } from '@/lib/vault';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { MarkdownContent } from '@/components/markdown-content';
import { ProvenanceBar } from '@/components/provenance-bar';
import { formatInterval } from '@/lib/intervals';

export const dynamic = 'force-dynamic';

export default async function GoalDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const root = vaultRoot();
  let goal, progress;
  try {
    goal = await readGoal(root, slug);
    progress = await readProgress(root, slug).catch(() => null);
  } catch {
    notFound();
  }
  const sources = await listSources(root, slug);
  const concepts = await listConcepts(root, slug);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{goal.frontmatter.title}</h1>
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
            <Badge variant="outline">{goal.frontmatter.status}</Badge>
            <span>standup: {formatInterval(goal.frontmatter.standup_interval)}</span>
            <span>·</span>
            <span>research: {formatInterval(goal.frontmatter.research_interval)}</span>
          </div>
        </div>
        <Link href={`/goals/${slug}/edit`} className="text-sm underline">Edit settings</Link>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sources">Sources ({sources.length})</TabsTrigger>
          <TabsTrigger value="concepts">Concepts ({concepts.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-6">
          <MarkdownContent source={goal.body} goalSlug={slug} />
          {progress && (
            <>
              <hr />
              <h2 className="text-lg font-semibold">Progress</h2>
              <MarkdownContent source={progress.body} goalSlug={slug} />
            </>
          )}
        </TabsContent>
        <TabsContent value="sources">
          <ul className="divide-y">
            {sources.map(s => (
              <li key={s.id} className="py-3">
                <Link href={`/goals/${slug}/sources/${s.id}`} className="font-medium hover:underline">{s.id}</Link>
                <div className="text-xs text-muted-foreground">{s.frontmatter.source_kind} · confidence {s.frontmatter.confidence}</div>
              </li>
            ))}
            {sources.length === 0 && <li className="py-3 text-sm text-muted-foreground">No sources yet.</li>}
          </ul>
        </TabsContent>
        <TabsContent value="concepts">
          <ul className="divide-y">
            {concepts.map(c => (
              <li key={c.id} className="py-3 flex items-center justify-between">
                <Link href={`/goals/${slug}/concepts/${c.id}`} className="font-medium hover:underline">{c.frontmatter.title}</Link>
                <ProvenanceBar {...c.frontmatter.provenance} />
              </li>
            ))}
            {concepts.length === 0 && <li className="py-3 text-sm text-muted-foreground">No concepts yet.</li>}
          </ul>
        </TabsContent>
      </Tabs>
    </div>
  );
}
