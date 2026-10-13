import { db } from "@/lib/db";
import { authorizedServerFn } from "./middleware.ts";
import type { AuthUser } from "./types.ts";

/** Returns the signed-in user, or null. Takes no parameters. */
export const getCurrentUser = authorizedServerFn({ method: "GET" }).handler(
  async ({ context }): Promise<AuthUser | null> => {
    const session = context.session;
    if (!session) {
      return null;
    }

    const user = await db.readOnly
      .selectFrom("user")
      .selectAll()
      .where("id", "=", session.userId)
      .executeTakeFirst();

    return user ? { id: user.id, login: user.login } : null;
  },
);
