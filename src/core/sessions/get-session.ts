import { db } from "@/lib/db";
import type { Session } from "./types.ts";

/**
 * Loads a session by id. Returns null when missing or expired; expired rows
 * are removed on read.
 */
export async function getSession(sessionId: string): Promise<Session | null> {
  const row = await db.readOnly
    .selectFrom("session")
    .selectAll()
    .where("id", "=", sessionId)
    .executeTakeFirst();

  if (!row) {
    return null;
  }

  if (Number(row.expires_at) <= Date.now()) {
    await db.readWrite.deleteFrom("session").where("id", "=", sessionId).execute();
    return null;
  }

  return {
    id: row.id,
    userId: row.user_id,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  };
}
