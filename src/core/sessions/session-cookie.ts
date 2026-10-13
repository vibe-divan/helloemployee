import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";
import { env } from "@/lib/env";
import { SESSION_COOKIE_NAME, SESSION_TTL_SECONDS } from "./constants.ts";

export function getSessionId(): string | undefined {
  return getCookie(SESSION_COOKIE_NAME);
}

export function setSessionId(id: string): void {
  setCookie(SESSION_COOKIE_NAME, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearSessionId(): void {
  deleteCookie(SESSION_COOKIE_NAME, { path: "/" });
}
