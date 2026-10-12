import { createServerFn } from "@tanstack/react-start";
import { useAppSession } from "./session.ts";

/** Clears the session. Takes no parameters. */
export const signOut = createServerFn({ method: "POST" }).handler(async () => {
  const session = await useAppSession();
  await session.clear();
  return { ok: true as const };
});
