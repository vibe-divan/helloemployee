import { AiError, chat, parseJson, type ChatMessage } from "@/lib/ai";
import { getPromptContent } from "@/core/prompts/store.ts";
import { generateUserPrompt } from "./prompts.ts";
import { docsTools, executeDocsTool } from "./tools.ts";
import type { GenerationContext, GenerationResult } from "./types.ts";

const MAX_TOOL_STEPS = 6;

async function runToolLoop(messages: ChatMessage[]): Promise<ChatMessage> {
  for (let step = 0; step < MAX_TOOL_STEPS; step += 1) {
    const response = await chat(messages, { tools: docsTools });

    messages.push({
      role: "assistant",
      content: response.content,
      tool_calls: response.toolCalls.length > 0 ? response.toolCalls : undefined,
    });

    if (response.toolCalls.length === 0) {
      return { role: "assistant", content: response.content };
    }

    for (const call of response.toolCalls) {
      const output = await executeDocsTool(call.function.name, call.function.arguments);
      messages.push({ role: "tool", tool_call_id: call.id, content: output });
    }
  }

  throw new AiError("ИИ превысил лимит обращений к инструментам");
}

function normalizeGeneration(raw: GenerationResult, context: GenerationContext): GenerationResult {
  const result: Record<string, string> = {};
  const source = raw?.fields && typeof raw.fields === "object" ? raw.fields : {};
  for (const field of context.fields) {
    const value = (source as Record<string, unknown>)[field.name];
    result[field.name] =
      typeof value === "string"
        ? value
        : value === undefined || value === null
          ? ""
          : String(value);
  }
  return { fields: result };
}

export async function generateDocument(
  context: GenerationContext,
  problems?: string,
): Promise<GenerationResult> {
  const systemPrompt = await getPromptContent("generate");
  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: generateUserPrompt(context, problems) },
  ];
  const final = await runToolLoop(messages);
  return normalizeGeneration(parseJson<GenerationResult>(final.content), context);
}
