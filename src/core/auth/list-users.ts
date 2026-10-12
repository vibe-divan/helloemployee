import { createServerFn } from "@tanstack/react-start";
import { db } from "@/lib/db";
import { authMiddleware } from "./middleware.ts";

/** Lists users. Requires the auth middleware. Takes no parameters. */
export const listUsers = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const users = await db.readOnly
      .selectFrom("user")
      .select(["id", "login", "created_at"])
      .orderBy("login")
      .execute();

    return {
      viewer: context.viewer,
      users: users.map((user) => ({
        id: user.id,
        login: user.login,
        createdAt: user.created_at,
      })),
    };
  });
