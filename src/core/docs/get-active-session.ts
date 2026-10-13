import { privateServerFn } from "@/core/auth/middleware.ts";
import { buildSessionView, findActiveSession } from "./store.ts";

/** Returns the current user's active document session (if any) with its template. */
export const getActiveDocumentSession = privateServerFn({ method: "GET" }).handler(
  async ({ context }) => {
    const session = await findActiveSession(context.session.userId);
    if (!session) {
      return { session: null };
    }
    return { session: await buildSessionView(session) };
  },
);
