import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { listPrompts } from "./list-prompts.ts";
import { resetPrompt, type ResetPromptParams } from "./reset-prompt.ts";
import { updatePrompt, type UpdatePromptParams } from "./update-prompt.ts";

export const promptKeys = {
  all: ["prompts"] as const,
};

export const promptsQuery = queryOptions({
  queryKey: promptKeys.all,
  queryFn: () => listPrompts(),
});

export const updatePromptMutation = mutationOptions({
  mutationFn: (params: UpdatePromptParams) => updatePrompt({ data: params }),
});

export const resetPromptMutation = mutationOptions({
  mutationFn: (params: ResetPromptParams) => resetPrompt({ data: params }),
});
