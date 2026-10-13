import * as v from "valibot";
import { privateServerFn } from "@/core/auth/middleware.ts";
import { cancelActiveSessions, currentTimestamp, findSessionById, updateSession } from "./store.ts";
import { isActiveStatus } from "./types.ts";

const schema = v.object({ sessionId: v.optional(v.string()) });

export type CancelSessionParams = v.InferOutput<typeof schema>;

/** Cancels a session (by id, or the current user's active one). */
export const cancelDocumentSession = privateServerFn({ method: "POST" })
  .validator((data: CancelSessionParams) => v.parse(schema, data))
  .handler(async ({ data, context }) => {
    if (data.sessionId) {
      const session = await findSessionById(data.sessionId);
      if (session && session.ownerId === context.session.userId && isActiveStatus(session.status)) {
        await updateSession(session.id, {
          status: "cancelled",
          completedAt: currentTimestamp(),
        });
      }
      return { ok: true as const };
    }

    await cancelActiveSessions(context.session.userId);
    return { ok: true as const };
  });
