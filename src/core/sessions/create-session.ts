import { db } from "@/lib/db";
import { SESSION_TTL_SECONDS } from "./constants.ts";

/** Inserts a session row for the user and returns its id. */
export async function createSession(userId: string): Promise<{ id: string }> {
  const id = crypto.randomUUID();
  const now = Date.now();

  await db.readWrite
    .insertInto("session")
    .values({
      id,
      user_id: userId,
      created_at: String(now),
      expires_at: String(now + SESSION_TTL_SECONDS * 1000),
    })
    .execute();

  return { id };
}
