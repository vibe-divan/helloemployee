import * as v from "valibot";
import { privateServerFn } from "@/core/auth/middleware.ts";
import { buildSessionView, findSessionById } from "./store.ts";

const paramsSchema = v.object({ id: v.pipe(v.string(), v.minLength(1)) });

/** Returns a single session with its template and fields (for the journal detail). */
export const getDocumentSession = privateServerFn({ method: "GET" })
  .validator((data: { id: string }) => v.parse(paramsSchema, data))
  .handler(async ({ data }) => {
    const session = await findSessionById(data.id);
    return { session: session ? await buildSessionView(session) : null };
  });
