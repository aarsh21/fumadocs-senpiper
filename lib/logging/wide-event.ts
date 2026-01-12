import { randomUUID } from "crypto";

export type EventSeverity = "debug" | "info" | "warn" | "error";

export interface OperationSpan {
  name: string;
  startTime: number;
  endTime?: number;
  durationMs?: number;
  status: "started" | "success" | "error";
  error?: string;
  attributes?: Record<string, unknown>;
}

export interface WideEventContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  method: string;
  path: string;
  userAgent?: string;
  ip?: string;
  userId?: string;
  sessionId?: string;
  subscriptionTier?: string;
  featureFlags?: Record<string, boolean>;
  aiProvider?: string;
  aiModel?: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  operations: OperationSpan[];
  startTime: number;
  endTime?: number;
  durationMs?: number;
  statusCode?: number;
  responseSize?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  attributes: Record<string, unknown>;
  severity: EventSeverity;
}

export class WideEvent {
  private context: WideEventContext;
  private currentOperation: OperationSpan | null = null;

  constructor(request: Request) {
    const url = new URL(request.url);

    this.context = {
      traceId: request.headers.get("x-trace-id") || randomUUID(),
      spanId: randomUUID(),
      parentSpanId: request.headers.get("x-parent-span-id") || undefined,
      method: request.method,
      path: url.pathname,
      userAgent: request.headers.get("user-agent") || undefined,
      ip: this.extractClientIp(request),
      startTime: Date.now(),
      operations: [],
      attributes: {},
      severity: "info",
    };
  }

  private extractClientIp(request: Request): string | undefined {
    const forwardedFor = request.headers.get("x-forwarded-for");
    if (forwardedFor) {
      return forwardedFor.split(",")[0].trim();
    }
    return (
      request.headers.get("x-real-ip") ||
      request.headers.get("cf-connecting-ip") ||
      undefined
    );
  }

  setUserId(userId: string): this {
    this.context.userId = userId;
    return this;
  }

  setSessionId(sessionId: string): this {
    this.context.sessionId = sessionId;
    return this;
  }

  setSubscriptionTier(tier: string): this {
    this.context.subscriptionTier = tier;
    return this;
  }

  setFeatureFlags(flags: Record<string, boolean>): this {
    this.context.featureFlags = flags;
    return this;
  }

  setAiContext(config: {
    provider: string;
    model: string;
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  }): this {
    this.context.aiProvider = config.provider;
    this.context.aiModel = config.model;
    if (config.promptTokens !== undefined)
      this.context.promptTokens = config.promptTokens;
    if (config.completionTokens !== undefined)
      this.context.completionTokens = config.completionTokens;
    if (config.totalTokens !== undefined)
      this.context.totalTokens = config.totalTokens;
    return this;
  }

  setAttribute(key: string, value: unknown): this {
    this.context.attributes[key] = value;
    return this;
  }

  setAttributes(attrs: Record<string, unknown>): this {
    Object.assign(this.context.attributes, attrs);
    return this;
  }

  startOperation(name: string, attributes?: Record<string, unknown>): this {
    if (this.currentOperation) {
      this.endOperation("success");
    }
    this.currentOperation = {
      name,
      startTime: Date.now(),
      status: "started",
      attributes,
    };
    return this;
  }

  endOperation(
    status: "success" | "error",
    error?: string,
    attributes?: Record<string, unknown>,
  ): this {
    if (this.currentOperation) {
      this.currentOperation.endTime = Date.now();
      this.currentOperation.durationMs =
        this.currentOperation.endTime - this.currentOperation.startTime;
      this.currentOperation.status = status;
      if (error) this.currentOperation.error = error;
      if (attributes) {
        this.currentOperation.attributes = {
          ...this.currentOperation.attributes,
          ...attributes,
        };
      }
      this.context.operations.push(this.currentOperation);
      this.currentOperation = null;
    }
    return this;
  }

  setError(error: Error | unknown): this {
    this.context.severity = "error";
    if (error instanceof Error) {
      this.context.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    } else {
      this.context.error = {
        name: "UnknownError",
        message: String(error),
      };
    }
    return this;
  }

  setResponse(statusCode: number, responseSize?: number): this {
    this.context.statusCode = statusCode;
    if (responseSize !== undefined) this.context.responseSize = responseSize;
    if (statusCode >= 500) this.context.severity = "error";
    else if (statusCode >= 400) this.context.severity = "warn";
    return this;
  }

  emit(): void {
    if (this.currentOperation) {
      this.endOperation("success");
    }

    this.context.endTime = Date.now();
    this.context.durationMs = this.context.endTime - this.context.startTime;

    const logData = {
      timestamp: new Date(this.context.endTime).toISOString(),
      level: this.context.severity,
      ...this.context,
    };

    const isDev = process.env.NODE_ENV === "development";
    const logLine = isDev
      ? JSON.stringify(logData, null, 2)
      : JSON.stringify(logData);

    if (this.context.severity === "error") {
      console.error(logLine);
    } else if (this.context.severity === "warn") {
      console.warn(logLine);
    } else {
      console.log(logLine);
    }
  }

  getTraceId(): string {
    return this.context.traceId;
  }

  getSpanId(): string {
    return this.context.spanId;
  }

  getDurationMs(): number | undefined {
    return this.context.durationMs;
  }

  getContext(): Readonly<WideEventContext> {
    return { ...this.context };
  }
}

export function createWideEvent(request: Request): WideEvent {
  return new WideEvent(request);
}
