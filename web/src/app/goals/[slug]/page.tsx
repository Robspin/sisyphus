import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Pencil } from 'lucide-react';
import { readGoal, readProgress, listSources, listConcepts, vaultRoot } from '@/lib/vault';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MarkdownContent } from '@/components/markdown-content';
import { ProvenanceBar } from '@/components/provenance-bar';
import { SectionHeading } from '@/components/section-heading';
import { formatInterval } from '@/lib/intervals';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const STATUS_TONE: Record<string, string> = {
  active:    'bg-success/15 text-success border-success/30',
  paused:    'bg-warning/15 text-warning border-warning/30',
  done:      'bg-muted text-muted-foreground border-border',
  abandoned: 'bg-muted text-muted-foreground border-border',
};

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
    <div>
      <SectionHeading
        eyebrow={slug}
        title={goal.frontmatter.title}
        action={
          <Link
            href={`/goals/${slug}/edit`}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:border-signal/60 hover:text-signal transition-colors"
          >
            <Pencil className="h-3 w-3" />
            Edit settings
          </Link>
        }
      />

      <div className="-mt-2 mb-6 flex items-center gap-3 flex-wrap">
        <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider', STATUS_TONE[goal.frontmatter.status])}>
          {goal.frontmatter.status}
        </span>
        <Meta label="standup" value={formatInterval(goal.frontmatter.standup_interval)} />
        <Meta label="research" value={formatInterval(goal.frontmatter.research_interval)} />
        <Meta label="priority" value={String(goal.frontmatter.priority)} />
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="bg-transparent p-0 h-auto gap-1 border-b border-border w-full justify-start rounded-none">
          <TabTrigger value="overview" label="Overview" />
          <TabTrigger value="sources" label="Sources" count={sources.length} />
          <TabTrigger value="concepts" label="Concepts" count={concepts.length} />
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-8">
          <MarkdownContent source={goal.body} goalSlug={slug} />
          {progress && (
            <section className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="h-1 w-1 rounded-full bg-signal" />
                <span className="label-mono">Progress</span>
              </div>
              <MarkdownContent source={progress.body} goalSlug={slug} />
            </section>
          )}
        </TabsContent>

        <TabsContent value="sources" className="mt-6">
          <ul className="rounded-lg border border-border bg-card divide-y divide-border overflow-hidden">
            {sources.map(s => (
              <li key={s.id}>
                <Link href={`/goals/${slug}/sources/${s.id}`} className="block px-4 py-3 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-mono text-sm text-foreground truncate">{s.id}</span>
                    <span className="font-mono text-xs text-muted-foreground tabular-nums shrink-0">conf {s.frontmatter.confidence.toFixed(2)}</span>
                  </div>
                  <div className="label-mono mt-1">{s.frontmatter.source_kind}</div>
                </Link>
              </li>
            ))}
            {sources.length === 0 && (
              <li className="px-4 py-10 text-center text-sm text-muted-foreground">No sources yet.</li>
            )}
          </ul>
        </TabsContent>

        <TabsContent value="concepts" className="mt-6">
          <ul className="rounded-lg border border-border bg-card divide-y divide-border overflow-hidden">
            {concepts.map(c => (
              <li key={c.id}>
                <Link href={`/goals/${slug}/concepts/${c.id}`} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-muted/50 transition-colors">
                  <div className="min-w-0">
                    <div className="font-medium text-sm text-foreground truncate">{c.frontmatter.title}</div>
                    <div className="label-mono mt-0.5">
                      {c.frontmatter.sources_count} source{c.frontmatter.sources_count === 1 ? '' : 's'}
                    </div>
                  </div>
                  <ProvenanceBar {...c.frontmatter.provenance} />
                </Link>
              </li>
            ))}
            {concepts.length === 0 && (
              <li className="px-4 py-10 text-center text-sm text-muted-foreground">No concepts yet.</li>
            )}
          </ul>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="label-mono">{label}</span>
      <span className="font-mono text-xs text-foreground">{value}</span>
    </div>
  );
}

function TabTrigger({ value, label, count }: { value: string; label: string; count?: number }) {
  return (
    <TabsTrigger
      value={value}
      className="relative rounded-none border-0 bg-transparent px-3 py-2 text-sm text-muted-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none after:absolute after:left-0 after:right-0 after:-bottom-px after:h-px after:bg-signal after:scale-x-0 after:transition-transform data-[state=active]:after:scale-x-100"
    >
      {label}
      {typeof count === 'number' && (
        <span className="ml-1.5 font-mono text-[10px] text-muted-foreground tabular-nums">{count}</span>
      )}
    </TabsTrigger>
  );
}
