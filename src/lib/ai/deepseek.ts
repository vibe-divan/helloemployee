import { env } from "@/lib/env";

export interface ChatToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: ChatToolCall[];
  tool_call_id?: string;
  name?: string;
}

export interface ToolSpec {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface ChatOptions {
  tools?: ToolSpec[];
  json?: boolean;
  temperature?: number;
  timeoutMs?: number;
}

export interface ChatResponse {
  content: string | null;
  toolCalls: ChatToolCall[];
  finishReason: string;
}

/** Raised for transport/HTTP/shape failures so callers can surface a clear message. */
export class AiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiError";
  }
}

interface ChatCompletionResponse {
  choices?: Array<{
    finish_reason?: string;
    message?: {
      content?: string | null;
      tool_calls?: ChatToolCall[];
    };
  }>;
  error?: { message?: string };
}

/** OpenAI-compatible chat completion against DeepSeek. */
export async function chat(
  messages: ChatMessage[],
  options: ChatOptions = {},
): Promise<ChatResponse> {
  const body: Record<string, unknown> = {
    model: env.DEEPSEEK_MODEL,
    messages,
    temperature: options.temperature ?? 0.2,
    stream: false,
  };
  if (options.tools?.length) {
    body.tools = options.tools;
  }
  if (options.json) {
    body.response_format = { type: "json_object" };
  }

  let response: Response;
  try {
    response = await fetch(`${env.DEEPSEEK_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(options.timeoutMs ?? 120_000),
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new AiError(`Не удалось связаться с ИИ: ${reason}`);
  }

  const text = await response.text();
  if (!response.ok) {
    let detail = text.slice(0, 500);
    try {
      const parsed = JSON.parse(text) as ChatCompletionResponse;
      detail = parsed.error?.message ?? detail;
    } catch {
      // keep raw text
    }
    throw new AiError(`ИИ вернул ошибку ${response.status}: ${detail}`);
  }

  let parsed: ChatCompletionResponse;
  try {
    parsed = JSON.parse(text) as ChatCompletionResponse;
  } catch {
    throw new AiError("ИИ вернул ответ, который не удалось разобрать как JSON");
  }

  const choice = parsed.choices?.[0];
  if (!choice?.message) {
    throw new AiError("ИИ вернул пустой ответ");
  }

  return {
    content: choice.message.content ?? null,
    toolCalls: choice.message.tool_calls ?? [],
    finishReason: choice.finish_reason ?? "stop",
  };
}

/** Extracts the first JSON value from model output, tolerating code fences. */
export function parseJson<T>(content: string | null): T {
  if (!content) {
    throw new AiError("ИИ не вернул содержимое");
  }

  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(content);
  const candidate = (fenced?.[1] ?? content).trim();

  const start = candidate.search(/[[{]/);
  if (start === -1) {
    throw new AiError("В ответе ИИ нет JSON");
  }

  try {
    return JSON.parse(candidate.slice(start)) as T;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new AiError(`ИИ вернул некорректный JSON: ${reason}`);
  }
}
