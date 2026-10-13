import { db } from "@/lib/db";
import { PROMPTS, PROMPTS_BY_KEY, type PromptKey } from "./registry.ts";

export interface PromptView {
  key: PromptKey;
  title: string;
  description: string;
  /** Effective content (the edited one, or the built-in default). */
  content: string;
  defaultContent: string;
  /** True when the content was edited and differs from the built-in default. */
  isCustom: boolean;
  updatedAt: string | null;
}

/** All prompts, merged from the DB with built-in defaults. */
export async function listPromptViews(): Promise<PromptView[]> {
  const rows = await db.readOnly.selectFrom("ai_prompt").selectAll().execute();
  const byKey = new Map(rows.map((row) => [row.key, row]));

  return PROMPTS.map((definition) => {
    const row = byKey.get(definition.key);
    return {
      key: definition.key,
      title: definition.title,
      description: definition.description,
      content: row?.content ?? definition.defaultContent,
      defaultContent: definition.defaultContent,
      isCustom: row !== undefined && row.content !== definition.defaultContent,
      updatedAt: row?.updated_at ?? null,
    };
  });
}

/** Effective system prompt content for an AI call. */
export async function getPromptContent(key: PromptKey): Promise<string> {
  const row = await db.readOnly
    .selectFrom("ai_prompt")
    .select("content")
    .where("key", "=", key)
    .executeTakeFirst();
  return row?.content ?? PROMPTS_BY_KEY[key].defaultContent;
}

/** Saves edited content for a prompt. */
export async function upsertPrompt(key: PromptKey, content: string): Promise<void> {
  const now = String(Date.now());
  await db.readWrite
    .insertInto("ai_prompt")
    .values({ key, content, updated_at: now })
    .onConflict((oc) => oc.column("key").doUpdateSet({ content, updated_at: now }))
    .execute();
}

/** Drops the edited content so the built-in default applies again. */
export async function deletePrompt(key: PromptKey): Promise<void> {
  await db.readWrite.deleteFrom("ai_prompt").where("key", "=", key).execute();
}
