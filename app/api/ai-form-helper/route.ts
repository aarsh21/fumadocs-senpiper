import { streamText, type ModelMessage } from "ai";
import { formSchemaOpencode, DEFAULT_MODEL_ID } from "@/lib/opencode-provider";
import { createWideEvent } from "@/lib/logging/wide-event";

export const maxDuration = 60;

function buildSystemPrompt(currentSchema: string): string {
  return `You are an expert Form Schema Builder for Senpiper V1 Form Schema DSL.

## ⛔ CRITICAL API RULES - MUST FOLLOW OR API WILL REJECT

### LAYOUT VALUES - READ CAREFULLY:
1. Section layout: Use "accordian" (WITH 'i') - NOT "accordion" ❌
2. Dropdown: Do NOT use "layout": "dropdown" - just OMIT the layout property entirely for dropdowns
3. Valid layouts ONLY: radio, small_pill, large_pill, checkbox, accordian, expandable, collapsible, expanded, collapsed, tab, table, card

### INVALID VALUES THAT WILL CAUSE API ERRORS:
- ❌ "layout": "accordion" → Use "accordian" (note the 'i')
- ❌ "layout": "dropdown" → REMOVE this property, dropdown is default
- ❌ "description": "checkbox" → Use string_list with enum: ["Yes", "No"]
- ❌ Section with "mandatory": true → Sections MUST have "mandatory": false
- ❌ Root "required" with section keys → Root "required" must be empty []
- ❌ Multimedia without multimediaType → MUST specify "multimediaType": "image" (or video/audio/document)
- ❌ Keys with spaces or special chars → Only lowercase letters, digits, and underscores allowed

### TYPE RULES:
- Date/time fields: "type": "string" (NOT "number")
- Multimedia: "type": "object" (NOT "array")

### REQUIRED ARRAY RULES:
- Root "required" array: ONLY section keys, usually empty []
- Section "required" array: field keys within THAT section only

## Current Schema Being Edited
\`\`\`json
${currentSchema}
\`\`\`

## Response Format
When providing schema changes, wrap the JSON schema in a code block like this:
\`\`\`json:schema
{ /* your complete schema here */ }
\`\`\`

BEFORE returning any schema, verify:
1. All section layouts use "accordian" (NOT "accordion")
2. No "layout": "dropdown" anywhere
3. All date/time fields have "type": "string"
4. All sections have "mandatory": false (sections CANNOT be mandatory)
5. Root "required" array is empty [] (not section keys)
6. All multimedia fields have "multimediaType" specified (e.g., "image")
7. All field keys use only lowercase letters, digits, underscores (NO SPACES)

First explain what you'll do, then provide the schema.
Always provide the COMPLETE schema, not partial updates.`;
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
  event.setAttribute("route", "ai-form-helper");

  try {
    event.startOperation("parse_request");
    const body = await request.json();
    const messages: IncomingMessage[] = body.messages || [];
    const currentSchema: string = body.currentSchema || "{}";
    event.endOperation("success", undefined, {
      messageCount: messages.length,
      schemaLength: currentSchema.length,
    });

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
      model: formSchemaOpencode(DEFAULT_MODEL_ID),
      system: buildSystemPrompt(currentSchema),
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
