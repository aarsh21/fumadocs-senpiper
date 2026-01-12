import { streamText, type ModelMessage } from "ai";
import { opencode, DEFAULT_MODEL_ID } from "@/lib/opencode-provider";
import { createWideEvent } from "@/lib/logging/wide-event";
import { getDocumentationUrlMap } from "@/lib/source";

export const maxDuration = 60;

function buildSystemPrompt(): string {
  const urlMap = getDocumentationUrlMap();
  
  return `You are a helpful documentation assistant for Senpiper Internal Docs.
You help users understand the Form Schema DSL documentation, field types, expressions, and form structure concepts.

IMPORTANT: You have access to the documentation files. When answering questions:
1. Use Grep to search for relevant terms in the documentation
2. Use Read to read the relevant documentation files
3. Base your answers on the actual documentation content you find

DOCUMENTATION REFERENCE LINKS:
When you mention a concept that has a documentation page, include a markdown link to it.
Available documentation pages:
${urlMap}

Example: "The [validatePredicateConfig](/docs/concepts/conditional-logic) is used for validation predicates..."

Be concise and helpful. Always include relevant documentation links when referencing concepts.
If you cannot find information after searching, say so.`;
}

interface MessagePart {
  type: string;
  text?: string;
}

interface IncomingMessage {
  id: string;
  role: "user" | "assistant";
  content?: string;
  parts?: MessagePart[];
}

function extractMessageContent(message: IncomingMessage): string {
  if (message.content) return message.content;
  if (message.parts) {
    return message.parts
      .filter((p) => p.type === "text" && p.text)
      .map((p) => p.text)
      .join("\n");
  }
  return "";
}

export async function POST(request: Request) {
  const event = createWideEvent(request);
  event.setAttribute("route", "chat");

  try {
    event.startOperation("parse_request");
    const body = await request.json();
    const messages: IncomingMessage[] = body.messages || [];
    event.endOperation("success", undefined, { messageCount: messages.length });

    event.setAiContext({
      provider: "opencode",
      model: DEFAULT_MODEL_ID,
    });

    const modelMessages: ModelMessage[] = messages.map((m) => ({
      role: m.role,
      content: extractMessageContent(m),
    }));

    event.startOperation("opencode_stream", {
      model: DEFAULT_MODEL_ID,
      messageCount: modelMessages.length,
    });

    const result = streamText({
      model: opencode(DEFAULT_MODEL_ID),
      system: buildSystemPrompt(),
      messages: modelMessages,
    });

    event.endOperation("success", undefined, { streaming: true });
    event.setResponse(200);
    event.emit();

    return result.toUIMessageStreamResponse();
  } catch (error) {
    event.setError(error);
    event.setResponse(500);
    event.emit();

    return new Response(
      error instanceof Error ? error.message : "Unknown error",
      { status: 500 },
    );
  }
}
