import { db } from "@/lib/db";

/** Deletes a session row. No-op when the id is unknown. */
export async function deleteSession(sessionId: string): Promise<void> {
  await db.readWrite.deleteFrom("session").where("id", "=", sessionId).execute();
}
