import { renderMarkdown } from '@/lib/markdown';

interface Props {
  source: string;
  goalSlug: string;
}

export async function MarkdownContent({ source, goalSlug }: Props) {
  const html = await renderMarkdown(source, { goalSlug });
  return <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: html }} />;
}
