import { db } from "@/lib/db";
import { log } from "@/lib/log";
import { PROMPTS } from "@/core/prompts/registry.ts";

/** Seeds built-in system prompts. Idempotent: edited rows are kept. */
export async function seedPrompts(): Promise<void> {
  for (const definition of PROMPTS) {
    const existing = await db.readOnly
      .selectFrom("ai_prompt")
      .select("key")
      .where("key", "=", definition.key)
      .executeTakeFirst();

    if (existing) {
      log.info(`Prompt "${definition.key}" already exists`);
      continue;
    }

    await db.readWrite
      .insertInto("ai_prompt")
      .values({
        key: definition.key,
        content: definition.defaultContent,
        updated_at: String(Date.now()),
      })
      .execute();

    log.info(`Created prompt "${definition.key}"`);
  }
}
