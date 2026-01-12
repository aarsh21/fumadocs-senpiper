import { generateText } from "ai";
import { opencode, DEFAULT_MODEL_ID } from "@/lib/opencode-provider";
import { createWideEvent } from "@/lib/logging/wide-event";

export const maxDuration = 60;

const V1_SCHEMA_KNOWLEDGE = `
You are an expert at Senpiper V1 Form Schema DSL. You help users modify form schemas based on their natural language requests.

## V1 Schema Structure

A V1 form schema has this structure:
{
  "name": "Form Name",
  "groupId": "",
  "companyId": "",
  "schema": {
    "type": "object",
    "description": "form",
    "properties": { /* field definitions */ },
    "order": [ /* field keys in display order */ ],
    "required": [ /* mandatory field keys */ ],
    "searchableKeys": [],
    "enableViewModeWebLayout": false,
    "enableWebLayout": false
  },
  "disableDelete": true,
  "updatable": true,
  "adminOnly": false,
  "isPublic": false,
  "master": false,
  "hidden": false,
  "formIsParent": false,
  "formIsChild": false,
  "localisationMap": {},
  "formSetting": {
    "renderLayoutConfigOnWeb": false,
    "convertJsonToFilterStringCondition": false
  }
}

## Field Types (description values)

| Type | description | type | Notes |
|------|-------------|------|-------|
| Text Field | "textfield" | "string" | Single line text |
| Text Area | "textarea" | "string" | Multi-line text |
| Number | "number" | "number" | Numeric input |
| Dropdown | "string_list" | "string" | Requires enum array |
| Multi-select | "multi_string_list" | "array" | Multiple selections |
| Checkbox | "checkbox" | "boolean" | True/false |
| Date | "date" | "string" | Date picker |
| Time | "time" | "string" | Time picker |
| Timestamp | "timestamp" | "number" | Date + Time |
| Phone | "phone" | "string" | Phone input |
| Location | "location" | "object" | GPS coordinates |
| Multimedia | "multimedia" | "array" | Photos/files |
| Section | "section" | "null" | Visual divider |
| Label | "label" | "null" | Display text only |
| Signature | "signature" | "string" | Signature capture |
| Barcode | "barcode" | "string" | Barcode scanner |

## Field Definition Structure

{
  "key": "field_key",
  "title": "Field Label",
  "type": "string",
  "description": "textfield",
  "placeholder": "Optional hint text",
  "helpText": "Optional help text",
  "default": null,
  "accessMatrix": {
    "mandatory": false,
    "readOnly": false,
    "visibility": "VISIBLE"
  },
  "enum": [ /* for dropdowns */
    { "const": "value1", "title": "Display 1" },
    { "const": "value2", "title": "Display 2" }
  ],
  "predicates": [ /* conditional logic */ ]
}

## Predicate Types (Conditional Logic)

1. APPLY_ACCESS_MATRIX - Change field visibility/mandatory based on condition
{
  "type": "APPLY_ACCESS_MATRIX",
  "condition": "\${other_field} == 'value'",
  "accessMatrix": {
    "mandatory": true,
    "visibility": "VISIBLE"
  }
}

2. CALC - Calculate field value from expression
{
  "type": "CALC",
  "expression": "\${field1} + \${field2}"
}

3. OPTION_FILTER - Filter dropdown options based on condition
{
  "type": "OPTION_FILTER",
  "condition": "\${parent_field} == 'specific_value'",
  "enum": [/* filtered options */]
}

## Expression Syntax

- Field reference: \${field_key}
- Comparison: ==, !=, >, <, >=, <=
- Logical: &&, ||, !
- Arithmetic: +, -, *, /
- String contains: \${field}.contains("text")
- Null check: \${field} == null

## Rules

1. Every field must have: key, title, type, description
2. Field key must be unique and should be lowercase with underscores
3. "order" array must include all property keys
4. For dropdowns, "enum" is required
5. visibility can be "VISIBLE" or "INVISIBLE"
6. type must match description (string for textfield, number for number, etc.)

## Your Task

When the user asks to modify the schema:
1. Parse and understand the current schema
2. Apply the requested modifications
3. Return BOTH a brief explanation AND the complete modified schema

IMPORTANT: You MUST return your response in this exact JSON format:
{
  "message": "Brief explanation of what you changed",
  "schema": { /* the complete modified schema */ }
}

Always return valid JSON. The "schema" field must contain the entire form schema object.
`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface RequestBody {
  messages: ChatMessage[];
  currentSchema: string;
}

export async function POST(request: Request) {
  const event = createWideEvent(request);
  event.setAttribute("route", "ai-form-helper");

  try {
    event.startOperation("parse_request");
    const { messages, currentSchema }: RequestBody = await request.json();
    event.endOperation("success", undefined, {
      messageCount: messages.length,
      schemaLength: currentSchema.length,
    });

    event.setAiContext({ provider: "opencode", model: DEFAULT_MODEL_ID });

    const userMessages = messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const systemPrompt = `${V1_SCHEMA_KNOWLEDGE}

Current Schema:
\`\`\`json
${currentSchema}
\`\`\`

Remember: Always respond with valid JSON in format: {"message": "...", "schema": {...}}`;

    event.startOperation("llm_generate", {
      promptLength: systemPrompt.length,
    });
    const result = await generateText({
      model: opencode(DEFAULT_MODEL_ID),
      system: systemPrompt,
      messages: userMessages,
    });
    event.endOperation("success", undefined, {
      responseLength: result.text.length,
      usage: result.usage,
    });

    if (result.usage) {
      const usage = result.usage as {
        promptTokens?: number;
        completionTokens?: number;
        totalTokens?: number;
      };
      event.setAiContext({
        provider: "opencode",
        model: DEFAULT_MODEL_ID,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        totalTokens: usage.totalTokens,
      });
    }

    event.startOperation("parse_response");
    const responseText = result.text.trim();
    let parsed: { message: string; schema?: unknown };
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
        event.endOperation("success", undefined, { parsedJson: true });
      } else {
        parsed = { message: responseText };
        event.endOperation("success", undefined, { parsedJson: false });
      }
    } catch {
      parsed = { message: responseText };
      event.endOperation("error", "JSON parse failed");
    }

    event.setResponse(200);
    event.emit();

    return Response.json({
      message: parsed.message || responseText,
      schema: parsed.schema || null,
    });
  } catch (error) {
    event.setError(error);
    event.setResponse(500);
    event.emit();

    return Response.json(
      {
        message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        schema: null,
      },
      { status: 500 },
    );
  }
}
