import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { getSession } from "@/core/sessions/get-session.ts";
import { getSessionId } from "@/core/sessions/session-cookie.ts";

/**
 * Middleware that extracts the session from the `sessid` cookie and attaches it
 * to context. **Does NOT reject unauthenticated requests** — session is null.
 */
const authorizedMiddleware = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const sessionId = getSessionId();
  const session = sessionId ? await getSession(sessionId) : null;

  return next({ context: { session } });
});

/**
 * Middleware that requires an authenticated session.
 */
const privateMiddleware = createMiddleware({ type: "function" })
  .middleware([authorizedMiddleware])
  .server(async ({ next, context }) => {
    const session = context.session;
    if (!session) {
      throw new Error("Unauthorized");
    }

    return next({ context: { session } });
  });

/**
 * Server function factory for endpoints that may access the session but
 * **don't require it**. Session is available as `context.session` (nullable).
 */
export const authorizedServerFn = createServerFn().middleware([authorizedMiddleware]);

/**
 * Server function factory for endpoints that require authentication.
 * Throws "Unauthorized" when no valid session is present.
 */
export const privateServerFn = createServerFn().middleware([privateMiddleware]);

/**
 * Server function factory for public endpoints that don't need session access.
 * No session data is attached to context.
 */
export const publicServerFn = createServerFn().middleware([]);
