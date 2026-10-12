import { useSession } from "@tanstack/react-start/server";
import { env } from "@/lib/env";

export interface SessionData {
  userId?: string;
}

export const SESSION_NAME = "helloemployee-session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

/** Encrypted, http-only session cookie bound to the current request. Server-only. */
export function useAppSession() {
  return useSession<SessionData>({
    name: SESSION_NAME,
    password: env.SESSION_SECRET,
    maxAge: SESSION_MAX_AGE_SECONDS,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: env.NODE_ENV === "production",
      path: "/",
    },
  });
}
