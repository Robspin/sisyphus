import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkWikiLink from 'remark-wiki-link';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';

export interface RenderContext {
  goalSlug: string;
}

const DATE_PREFIXED = /^\d{4}-\d{2}-\d{2}-/;

export async function renderMarkdown(input: string, ctx: RenderContext): Promise<string> {
  const file = await remark()
    .use(remarkGfm)
    .use(remarkWikiLink, {
      hrefTemplate: (permalink: string) => {
        const isSource = DATE_PREFIXED.test(permalink);
        const kind = isSource ? 'sources' : 'concepts';
        return `/goals/${ctx.goalSlug}/${kind}/${permalink}`;
      },
      pageResolver: (name: string) => [name],
    })
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSanitize)
    .use(rehypeStringify)
    .process(input);
  return String(file);
}
