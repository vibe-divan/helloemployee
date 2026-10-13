import { db } from "@/lib/db";
import { privateServerFn } from "./middleware.ts";

/** Lists users. Requires an authenticated session. Takes no parameters. */
export const listUsers = privateServerFn({ method: "GET" }).handler(async () => {
  const users = await db.readOnly
    .selectFrom("user")
    .select(["id", "login", "created_at"])
    .orderBy("login")
    .execute();

  return {
    users: users.map((user) => ({
      id: user.id,
      login: user.login,
      createdAt: user.created_at,
    })),
  };
});
