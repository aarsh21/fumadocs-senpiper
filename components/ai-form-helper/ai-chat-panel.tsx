"use client";

import { useRef, useEffect, useCallback, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { Send, Loader2, Trash2, Square, AlertCircle, X } from "lucide-react";
import { type UIMessage, useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isReasoningUIPart, isToolUIPart } from "ai";
import { Markdown } from "@/components/markdown";
import {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
} from "@/components/ai-elements/reasoning";
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";

interface AIChatPanelProps {
  currentSchema: string;
  onSchemaUpdate: (newSchema: string) => void;
}

// Extract text content from UIMessage parts
function getMessageText(message: UIMessage): string {
  const textParts = (message.parts ?? [])
    .filter((p) => p.type === "text")
    .map((p) => (p as { type: "text"; text: string }).text);
  return textParts.join("");
}

// Extract schema from markdown code blocks with :schema suffix
function extractSchemaFromText(text: string): string | null {
  // Match code blocks with json:schema language identifier
  const schemaBlockRegex = /```json:schema\s*([\s\S]*?)```/;
  const match = text.match(schemaBlockRegex);
  
  if (match?.[1]) {
    try {
      const parsed = JSON.parse(match[1].trim());
      return JSON.stringify(parsed, null, 2);
    } catch {
      return null;
    }
  }
  
  // Fallback: try to find any JSON that looks like a schema
  const jsonBlockRegex = /```json\s*([\s\S]*?)```/g;
  let jsonMatch;
  while ((jsonMatch = jsonBlockRegex.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(jsonMatch[1].trim());
      // Check if it looks like a form schema
      if (parsed.schema?.properties || parsed.properties) {
        return JSON.stringify(parsed, null, 2);
      }
    } catch {
      continue;
    }
  }
  
  return null;
}

export function AIChatPanel({
  currentSchema,
  onSchemaUpdate,
}: AIChatPanelProps) {
  const [input, setInput] = useState("");
  const [dismissedError, setDismissedError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastProcessedMessageRef = useRef<string | null>(null);

  const {
    messages,
    status,
    error,
    sendMessage,
    stop,
    setMessages,
  } = useChat({
    id: "form-schema-builder",
    transport: new DefaultChatTransport({
      api: "/api/ai-form-helper",
      body: { currentSchema },
    }),
  });

  const isLoading = status === "streaming" || status === "submitted";
  
  // Show error if not dismissed
  const showError = error && error.message !== dismissedError;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Extract schema from completed assistant messages
  useEffect(() => {
    if (status !== "ready" || messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    if (
      lastMessage.role !== "assistant" ||
      lastMessage.id === lastProcessedMessageRef.current
    ) {
      return;
    }

    const fullText = getMessageText(lastMessage);
    const schema = extractSchemaFromText(fullText);
    if (schema) {
      onSchemaUpdate(schema);
      lastProcessedMessageRef.current = lastMessage.id;
    }
  }, [messages, status, onSchemaUpdate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    setDismissedError(null); // Reset dismissed error on new message
    void sendMessage({ text: input });
    setInput("");
  };

  const clearChat = () => {
    setMessages([]);
    setDismissedError(null);
    lastProcessedMessageRef.current = null;
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b bg-fd-muted/30 px-4 py-2">
        <span className="text-sm font-medium">AI Assistant</span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={clearChat}
          disabled={messages.length === 0}
          aria-label="Clear chat"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      {showError && (
        <Alert variant="destructive" className="m-2 relative">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="pr-8">
            {error.message || "An unexpected error occurred"}
          </AlertDescription>
          <Button
            variant="ghost"
            size="icon-sm"
            className="absolute top-2 right-2"
            onClick={() => setDismissedError(error.message)}
            aria-label="Dismiss error"
          >
            <X className="h-3 w-3" />
          </Button>
        </Alert>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center text-sm text-fd-muted-foreground">
            <div className="max-w-xs space-y-2">
              <p className="font-medium">Ask me to modify your form schema</p>
              <p className="text-xs">
                Examples: &quot;Add a phone field&quot;, &quot;Make name field
                mandatory&quot;, &quot;Add a dropdown with options A, B, C&quot;
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <Message
                key={message.id}
                message={message}
                isLastMessage={index === messages.length - 1}
                chatStatus={status}
              />
            ))}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-lg bg-fd-muted px-3 py-2 text-sm">
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                  <span>Thinking…</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="border-t p-4">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isLoading ? "AI is answering…" : "Ask AI to modify your schema…"
            }
            aria-label="Message to AI assistant"
            className="min-h-[60px] resize-none"
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          {isLoading ? (
            <Button
              type="button"
              size="icon"
              variant="secondary"
              onClick={stop}
              aria-label="Stop generation"
            >
              <Square className="h-4 w-4" aria-hidden="true" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim()}
              aria-label="Send message"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

function Message({
  message,
  isLastMessage,
  chatStatus,
}: {
  message: UIMessage;
  isLastMessage: boolean;
  chatStatus: string;
}) {
  const isStreaming = isLastMessage && chatStatus === "streaming";

  if (message.role === "user") {
    const userText = getMessageText(message);
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-lg bg-fd-primary px-3 py-2 text-sm text-fd-primary-foreground">
          <div className="whitespace-pre-wrap">{userText}</div>
        </div>
      </div>
    );
  }

  const elements: ReactNode[] = [];
  let accumulatedMarkdown = "";
  let elementIndex = 0;

  const flushMarkdown = () => {
    if (accumulatedMarkdown) {
      elements.push(
        <div key={`text-${elementIndex++}`} className="prose prose-sm max-w-none">
          <Markdown text={accumulatedMarkdown} />
        </div>
      );
      accumulatedMarkdown = "";
    }
  };

  for (const part of message.parts ?? []) {
    if (part.type === "text") {
      accumulatedMarkdown += part.text;
    } else if (isReasoningUIPart(part)) {
      flushMarkdown();
      elements.push(
        <Reasoning key={`reasoning-${elementIndex++}`} isStreaming={isStreaming}>
          <ReasoningTrigger />
          <ReasoningContent>{part.text}</ReasoningContent>
        </Reasoning>
      );
    } else if (isToolUIPart(part)) {
      flushMarkdown();
      const toolName =
        "toolName" in part
          ? part.toolName
          : part.type.replace("tool-", "").replace("dynamic-tool", "dynamic");
      elements.push(
        <Tool key={`tool-${part.toolCallId}`}>
          <ToolHeader
            title={toolName}
            type="tool-invocation"
            state={part.state}
          />
          <ToolContent>
            <ToolInput input={part.input} />
            <ToolOutput output={part.output} errorText={part.errorText} />
          </ToolContent>
        </Tool>
      );
    }
  }

  flushMarkdown();

  const fallbackText = getMessageText(message);

  return (
    <div className="flex justify-start">
      <div
        className={cn(
          "max-w-[85%] space-y-3 rounded-lg bg-fd-muted px-3 py-2 text-sm",
          isStreaming && "animate-pulse"
        )}
      >
        {elements.length > 0 ? (
          elements
        ) : (
          <div className="whitespace-pre-wrap">{fallbackText}</div>
        )}
      </div>
    </div>
  );
}
