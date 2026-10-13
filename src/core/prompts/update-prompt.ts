import * as v from "valibot";
import { privateServerFn } from "@/core/auth/middleware.ts";
import { isPromptKey } from "./registry.ts";
import { upsertPrompt } from "./store.ts";

const schema = v.object({
  key: v.pipe(v.string(), v.minLength(1)),
  content: v.pipe(v.string(), v.trim(), v.minLength(1, "Промпт не может быть пустым")),
});

export type UpdatePromptParams = v.InferOutput<typeof schema>;

/** Saves an edited system prompt. */
export const updatePrompt = privateServerFn({ method: "POST" })
  .validator((data: UpdatePromptParams) => v.parse(schema, data))
  .handler(async ({ data }) => {
    if (!isPromptKey(data.key)) {
      return { ok: false as const, error: "Неизвестный промпт" };
    }
    await upsertPrompt(data.key, data.content);
    return { ok: true as const };
  });
