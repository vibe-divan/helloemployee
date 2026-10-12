import { createServerFn } from "@tanstack/react-start";
import { db } from "@/lib/db";
import { useAppSession } from "./session.ts";
import type { AuthUser } from "./types.ts";

/** Returns the signed-in user, or null. Takes no parameters. */
export const getCurrentUser = createServerFn({ method: "GET" }).handler(
  async (): Promise<AuthUser | null> => {
    const session = await useAppSession();
    const userId = session.data.userId;
    if (!userId) {
      return null;
    }

    const user = await db.readOnly
      .selectFrom("user")
      .selectAll()
      .where("id", "=", userId)
      .executeTakeFirst();

    return user ? { id: user.id, login: user.login } : null;
  },
);
