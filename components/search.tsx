"use client";
import {
  type ComponentProps,
  createContext,
  type ReactNode,
  type SyntheticEvent,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { Loader2, MessageCircleIcon, RefreshCw, Send, X } from "lucide-react";
import { cn } from "../lib/cn";
import { buttonVariants } from "./ui/button";
import { type UIMessage, useChat, type UseChatHelpers } from "@ai-sdk/react";
import { DefaultChatTransport, isReasoningUIPart, isToolUIPart } from "ai";
import { Markdown } from "./markdown";
import { Presence } from "@radix-ui/react-presence";
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

const Context = createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
  chat: UseChatHelpers<UIMessage>;
} | null>(null);

function useChatContext() {
  return use(Context)!.chat;
}

function Header() {
  const { setOpen } = use(Context)!;

  return (
    <div className="sticky top-0 flex items-start gap-2">
      <div className="flex-1 p-3 border rounded-xl bg-fd-card text-fd-card-foreground">
        <p className="text-sm font-medium mb-2">Ask AI</p>
        <p className="text-xs text-fd-muted-foreground">
          Powered by OpenCode
        </p>
      </div>
      <button
        aria-label="Close"
        tabIndex={-1}
        className={cn(
          buttonVariants({
            size: "icon-sm",
            variant: "secondary",
            className: "rounded-full",
          }),
        )}
        onClick={() => setOpen(false)}
      >
        <X />
      </button>
    </div>
  );
}

function SearchAIActions() {
  const { messages, status, setMessages, regenerate } = useChatContext();
  const isLoading = status === "streaming";

  if (messages.length === 0) return null;

  return (
    <>
      {!isLoading && messages.at(-1)?.role === "assistant" && (
        <button
          type="button"
          className={cn(
            buttonVariants({
              variant: "secondary",
              size: "sm",
              className: "rounded-full gap-1.5",
            }),
          )}
          onClick={() => regenerate()}
        >
          <RefreshCw className="size-4" />
          Retry
        </button>
      )}
      <button
        type="button"
        className={cn(
          buttonVariants({
            variant: "secondary",
            size: "sm",
            className: "rounded-full",
          }),
        )}
        onClick={() => setMessages([])}
      >
        Clear Chat
      </button>
    </>
  );
}

function SearchAIInput(props: ComponentProps<"form">) {
  const { status, sendMessage, stop } = useChatContext();
  const [input, setInput] = useState("");
  const isLoading = status === "streaming" || status === "submitted";

  const onStart = (e?: SyntheticEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;
    void sendMessage({ text: input });
    setInput("");
  };

  return (
    <form
      {...props}
      className={cn("flex items-start pe-2", props.className)}
      onSubmit={onStart}
    >
      <Input
        value={input}
        placeholder={isLoading ? "AI is answering..." : "Ask a question"}
        autoFocus
        className="p-3"
        disabled={isLoading}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(event) => {
          if (!event.shiftKey && event.key === "Enter") {
            event.preventDefault();
            onStart();
          }
        }}
      />
      {isLoading ? (
        <button
          key="stop"
          type="button"
          className={cn(
            buttonVariants({
              variant: "secondary",
              className: "transition-all rounded-full mt-2 gap-2",
            }),
          )}
          onClick={stop}
        >
          <Loader2 className="size-4 animate-spin text-fd-muted-foreground" />
          Stop
        </button>
      ) : (
        <button
          key="submit"
          type="submit"
          className={cn(
            buttonVariants({
              variant: "secondary",
              className: "transition-all rounded-full mt-2",
            }),
          )}
          disabled={input.length === 0}
        >
          <Send className="size-4" />
        </button>
      )}
    </form>
  );
}

function List(props: Omit<ComponentProps<"div">, "dir">) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    function callback() {
      const container = containerRef.current;
      if (!container) return;

      container.scrollTo({
        top: container.scrollHeight,
        behavior: "instant",
      });
    }

    const observer = new ResizeObserver(callback);
    callback();

    const element = containerRef.current?.firstElementChild;

    if (element) {
      observer.observe(element);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      {...props}
      className={cn(
        "fd-scroll-container overflow-y-auto min-w-0 flex flex-col",
        props.className,
      )}
    >
      {props.children}
    </div>
  );
}

function Input(props: ComponentProps<"textarea">) {
  const ref = useRef<HTMLDivElement>(null);
  const shared = cn("col-start-1 row-start-1", props.className);

  return (
    <div className="grid flex-1">
      <textarea
        id="nd-ai-input"
        {...props}
        className={cn(
          "resize-none bg-transparent placeholder:text-fd-muted-foreground focus-visible:outline-none",
          shared,
        )}
      />
      <div ref={ref} className={cn(shared, "break-all invisible")}>
        {`${props.value?.toString() ?? ""}\n`}
      </div>
    </div>
  );
}

const roleName: Record<string, string> = {
  user: "you",
  assistant: "ai",
};

function Message({
  message,
  isLastMessage,
  chatStatus,
  ...props
}: {
  message: UIMessage;
  isLastMessage: boolean;
  chatStatus: string;
} & ComponentProps<"div">) {
  const isStreaming = isLastMessage && chatStatus === "streaming";

  const elements: ReactNode[] = [];
  let accumulatedMarkdown = "";
  let elementIndex = 0;

  const flushMarkdown = () => {
    if (accumulatedMarkdown) {
      elements.push(
        <div key={`text-${elementIndex++}`} className="prose text-sm">
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
      const toolName = part.type.replace("tool-", "").replace("dynamic-tool", "dynamic");
      elements.push(
        <Tool key={`tool-${part.toolCallId}`}>
          <ToolHeader
            title={"toolName" in part ? part.toolName : toolName}
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

  return (
    <div {...props}>
      <p
        className={cn(
          "mb-1 text-sm font-medium text-fd-muted-foreground",
          message.role === "assistant" && "text-fd-primary",
        )}
      >
        {roleName[message.role] ?? "unknown"}
      </p>
      {elements}
    </div>
  );
}

export function AISearch({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const chat = useChat({
    id: "search",
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });

  return (
    <Context value={useMemo(() => ({ chat, open, setOpen }), [chat, open])}>
      {children}
    </Context>
  );
}

export function AISearchTrigger() {
  const { open, setOpen } = use(Context)!;
  const pathname = usePathname();

  if (pathname === "/ai-form-helper") {
    return null;
  }

  return (
    <button
      className={cn(
        buttonVariants({
          variant: "secondary",
        }),
        "fixed bottom-4 gap-3 w-24 right-4 text-fd-muted-foreground rounded-2xl shadow-lg z-20 transition-[translate,opacity]",
        open && "translate-y-10 opacity-0",
      )}
      onClick={() => setOpen(true)}
    >
      <MessageCircleIcon className="size-4" />
      Ask AI
    </button>
  );
}

export function AISearchPanel() {
  const { open, setOpen } = use(Context)!;
  const chat = useChatContext();

  const onKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        setOpen(false);
        e.preventDefault();
      }

      if (e.key === "/" && (e.metaKey || e.ctrlKey) && !open) {
        setOpen(true);
        e.preventDefault();
      }
    },
    [open, setOpen],
  );

  useEffect(() => {
    window.addEventListener("keydown", onKeyPress);
    return () => window.removeEventListener("keydown", onKeyPress);
  }, [onKeyPress]);

  return (
    <>
      <style>
        {`
        @keyframes ask-ai-open {
          from { width: 0px; }
          to { width: var(--ai-chat-width); }
        }
        @keyframes ask-ai-close {
          from { width: var(--ai-chat-width); }
          to { width: 0px; }
        }`}
      </style>
      <Presence present={open}>
        <div
          data-state={open ? "open" : "closed"}
          className="fixed inset-0 z-30 backdrop-blur-sm bg-fd-background/80 data-[state=open]:animate-fd-fade-in data-[state=closed]:animate-fd-fade-out lg:hidden"
          onClick={() => setOpen(false)}
        />
      </Presence>
      <Presence present={open}>
          <div
            className={cn(
              "overflow-hidden z-30 bg-fd-popover text-fd-popover-foreground border-l shadow-xl",
              "fixed top-[var(--fd-nav-height,0px)] right-0 bottom-0 w-[400px] xl:w-[460px]",
              open ? "animate-fd-dialog-in" : "animate-fd-dialog-out",
            )}
            style={{ display: open ? "block" : "none" }}
          >
          <div className="flex flex-col p-2 size-full xl:p-4">
            <Header />
            <List
              className="px-3 py-4 flex-1 overscroll-contain"
              style={{
                maskImage:
                  "linear-gradient(to bottom, transparent, white 1rem, white calc(100% - 1rem), transparent 100%)",
              }}
            >
              <div className="flex flex-col gap-4">
                {chat.messages.length === 0 && (
                  <p className="text-sm text-fd-muted-foreground text-center py-8">
                    Ask me anything about the documentation!
                  </p>
                )}
                {chat.messages
                  .filter((msg) => msg.role !== "system")
                  .map((item, index, filteredMessages) => (
                    <Message
                      key={item.id}
                      message={item}
                      isLastMessage={index === filteredMessages.length - 1}
                      chatStatus={chat.status}
                    />
                  ))}
              </div>
            </List>
            <div className="rounded-xl border bg-fd-card text-fd-card-foreground has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-fd-ring">
              <SearchAIInput />
              <div className="flex items-center gap-1.5 p-1 empty:hidden">
                <SearchAIActions />
              </div>
            </div>
          </div>
        </div>
      </Presence>
    </>
  );
}
