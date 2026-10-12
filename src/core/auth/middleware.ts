import { createMiddleware } from "@tanstack/react-start";
import { db } from "@/lib/db";
import { useAppSession } from "./session.ts";
import type { AuthUser } from "./types.ts";

/**
 * Guards server functions. Resolves the viewer from the session cookie and
 * injects it into `context`; rejects the call when unauthenticated.
 */
export const authMiddleware = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const session = await useAppSession();
  const userId = session.data.userId;

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const user = await db.readOnly
    .selectFrom("user")
    .selectAll()
    .where("id", "=", userId)
    .executeTakeFirst();

  if (!user) {
    await session.clear();
    throw new Error("Unauthorized");
  }

  const viewer: AuthUser = { id: user.id, login: user.login };
  return next({ context: { viewer } });
});
