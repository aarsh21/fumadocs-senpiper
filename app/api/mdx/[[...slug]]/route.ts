import { source, getLLMText } from '@/lib/source';
import { NextResponse } from 'next/server';

export async function GET(
  _request: Request,
  props: { params: Promise<{ slug?: string[] }> }
) {
  const params = await props.params;
  const page = source.getPage(params.slug ?? []);
  
  if (!page) {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  }

  const content = await getLLMText(page);

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
