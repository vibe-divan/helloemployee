import * as v from "valibot";
import { privateServerFn } from "@/core/auth/middleware.ts";
import { isPromptKey } from "./registry.ts";
import { deletePrompt } from "./store.ts";

const schema = v.object({ key: v.pipe(v.string(), v.minLength(1)) });

export type ResetPromptParams = v.InferOutput<typeof schema>;

/** Restores a prompt to its built-in default. */
export const resetPrompt = privateServerFn({ method: "POST" })
  .validator((data: ResetPromptParams) => v.parse(schema, data))
  .handler(async ({ data }) => {
    if (!isPromptKey(data.key)) {
      return { ok: false as const, error: "Неизвестный промпт" };
    }
    await deletePrompt(data.key);
    return { ok: true as const };
  });
