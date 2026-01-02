import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { streamText, convertToModelMessages, type UIMessage } from 'ai';
import { source } from '@/lib/source';

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
const MINIMAX_BASE_URL = process.env.MINIMAX_BASE_URL || 'https://api.minimax.io/v1';
const MINIMAX_MODEL = process.env.MINIMAX_MODEL || 'MiniMax-M2.1';

export const maxDuration = 30;

interface DocPage {
  url: string;
  title: string;
  description: string;
}

async function buildDocsContext(): Promise<{ context: string; pages: DocPage[] }> {
  const allPages = source.getPages();
  const pages: DocPage[] = [];
  const contextParts: string[] = [];

  for (const page of allPages.slice(0, 25)) {
    const title = page.data.title || 'Untitled';
    const description = page.data.description || '';
    const url = `/docs${page.url}`;
    
    let content = '';
    try {
      content = await page.data.getText('processed');
    } catch {
      content = description;
    }

    pages.push({ url, title, description });
    contextParts.push(`[${title}] (${url})\n${description}\n\n${content.slice(0, 1200)}`);
  }

  return {
    context: contextParts.join('\n\n---\n\n'),
    pages,
  };
}

export async function POST(request: Request) {
  if (!MINIMAX_API_KEY) {
    return new Response('MINIMAX_API_KEY not configured', { status: 500 });
  }

  const { messages }: { messages: UIMessage[] } = await request.json();

  const { context: docsContext } = await buildDocsContext();

  const minimax = createOpenAICompatible({
    name: 'minimax',
    apiKey: MINIMAX_API_KEY,
    baseURL: MINIMAX_BASE_URL,
  });

  const systemPrompt = `You are a helpful documentation assistant for Senpiper Internal Docs.
You help users understand the Form Schema DSL documentation, field types, expressions, and form structure concepts.
Answer questions based on the documentation context provided. Be concise and helpful.
If you don't know the answer based on the provided context, say so.

Documentation Context:
${docsContext}`;

  const result = streamText({
    model: minimax(MINIMAX_MODEL),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
