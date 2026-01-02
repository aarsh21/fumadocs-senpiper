import { source, getLLMText } from '@/lib/source';
import { notFound } from 'next/navigation';
import type { NextRequest } from 'next/server';

export const revalidate = false;

export async function GET(
  _request: NextRequest,
  props: { params: Promise<{ slug?: string[] }> }
) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const content = await getLLMText(page);

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}

export function generateStaticParams() {
  return source.generateParams();
}
