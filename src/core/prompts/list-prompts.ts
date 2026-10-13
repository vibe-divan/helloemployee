import { privateServerFn } from "@/core/auth/middleware.ts";
import { listPromptViews } from "./store.ts";

/** Lists the editable system prompts with their effective content. */
export const listPrompts = privateServerFn({ method: "GET" }).handler(async () => ({
  prompts: await listPromptViews(),
}));
