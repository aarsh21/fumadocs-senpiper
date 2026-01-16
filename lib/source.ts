import { cache } from 'react';
import { docs } from 'fumadocs-mdx:collections/server';
import { type InferPageType, loader } from 'fumadocs-core/source';
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons';

// See https://fumadocs.dev/docs/headless/source-api for more info
export const source = loader({
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
  plugins: [lucideIconsPlugin()],
});

/**
 * Generate a URL map of all documentation pages for AI context.
 * Returns a formatted string listing all pages with their titles and URLs.
 * Cached per-request to avoid redundant computation.
 */
export const getDocumentationUrlMap = cache((): string => {
  const pages = source.getPages();
  
  const entries = pages.map((page) => {
    const url = `/docs/${page.slugs.join('/')}`;
    return `- ${page.data.title}: ${url}`;
  });

  return entries.join('\n');
});

export function getPageImage(page: InferPageType<typeof source>) {
  const segments = [...page.slugs, 'image.png'];

  return {
    segments,
    url: `/og/docs/${segments.join('/')}`,
  };
}

export async function getLLMText(page: InferPageType<typeof source>) {
  const processed = await page.data.getText('processed');

  return `# ${page.data.title}

${processed}`;
}
