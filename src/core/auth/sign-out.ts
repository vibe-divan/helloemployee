import { clearSessionId, deleteSession, getSessionId } from "@/core/sessions";
import { publicServerFn } from "./middleware.ts";

/** Deletes the server-side session and clears the cookie. Takes no parameters. */
export const signOut = publicServerFn({ method: "POST" }).handler(async () => {
  const sessionId = getSessionId();
  if (sessionId) {
    await deleteSession(sessionId);
  }
  clearSessionId();
  return { ok: true as const };
});
