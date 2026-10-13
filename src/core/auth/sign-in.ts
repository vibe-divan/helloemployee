import { sql } from "kysely";
import * as v from "valibot";
import { db } from "@/lib/db";
import { createSession, deleteSession, getSessionId, setSessionId } from "@/core/sessions";
import { verifyPassword } from "@/lib/security";
import { publicServerFn } from "./middleware.ts";
import type { AuthUser } from "./types.ts";

export const signInSchema = v.object({
  login: v.pipe(v.string(), v.trim(), v.minLength(1, "Enter your login")),
  password: v.pipe(v.string(), v.minLength(1, "Enter your password")),
});

export type SignInParams = v.InferOutput<typeof signInSchema>;

/** Verifies credentials and starts a server-side session. */
export const signIn = publicServerFn({ method: "POST" })
  .validator((data: SignInParams) => v.parse(signInSchema, data))
  .handler(async ({ data }) => {
    const user = await db.readOnly
      .selectFrom("user")
      .selectAll()
      .where(sql<boolean>`lower(login) = lower(${data.login})`)
      .executeTakeFirst();

    if (!user || !(await verifyPassword(data.password, user.password_hash))) {
      return { ok: false as const, error: "Invalid login or password" };
    }

    // Drop a prior session of this browser so orphaned rows don't accumulate.
    const previousId = getSessionId();
    if (previousId) {
      await deleteSession(previousId);
    }

    const session = await createSession(user.id);
    setSessionId(session.id);

    const authUser: AuthUser = { id: user.id, login: user.login };
    return { ok: true as const, user: authUser };
  });
