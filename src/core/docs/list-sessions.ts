import { privateServerFn } from "@/core/auth/middleware.ts";
import { listSessionViews } from "./store.ts";

/** Journal: all sessions across users, with authorship. Read-only listing. */
export const listDocumentSessions = privateServerFn({ method: "GET" }).handler(async () => {
  return { sessions: await listSessionViews() };
});
