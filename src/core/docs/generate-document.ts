import * as v from "valibot";
import { privateServerFn } from "@/core/auth/middleware.ts";
import { enqueueDocumentJob } from "./jobs";
import { findSessionById, updateSession } from "./store.ts";

const schema = v.object({ sessionId: v.pipe(v.string(), v.minLength(1)) });

export type GenerateDocumentParams = v.InferOutput<typeof schema>;

/** Queues background generation of the filled document. */
export const generateDocument = privateServerFn({ method: "POST" })
  .validator((data: GenerateDocumentParams) => v.parse(schema, data))
  .handler(async ({ data, context }) => {
    const session = await findSessionById(data.sessionId);
    if (!session || session.ownerId !== context.session.userId) {
      return { ok: false as const, error: "Сессия не найдена" };
    }
    if (session.status !== "awaiting_input") {
      return { ok: false as const, error: "Сессия не ожидает ввода" };
    }

    await updateSession(session.id, { status: "generating", attempts: 0, error: null });
    await enqueueDocumentJob("generate", session.id);

    return { ok: true as const };
  });
