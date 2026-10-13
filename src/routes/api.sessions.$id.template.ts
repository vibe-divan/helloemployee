import { createFileRoute } from "@tanstack/react-router";
import { getSession } from "@/core/sessions/get-session.ts";
import { getSessionId } from "@/core/sessions/session-cookie.ts";
import { findDocumentById, findSessionById } from "@/core/docs/store.ts";
import { templateStorageKey } from "@/core/docs/template.ts";
import { storage } from "@/lib/storage";

export const Route = createFileRoute("/api/sessions/$id/template")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const authSessionId = getSessionId();
        const authSession = authSessionId ? await getSession(authSessionId) : null;
        if (!authSession) {
          return new Response("Unauthorized", { status: 401 });
        }

        const session = await findSessionById(params.id);
        if (!session || session.ownerId !== authSession.userId) {
          return new Response("Not found", { status: 404 });
        }

        const document = await findDocumentById(session.sourceDocumentId);
        if (!document) {
          return new Response("Not found", { status: 404 });
        }

        const key = templateStorageKey(session.id, document.format);
        if (!(await storage.exists(key))) {
          return new Response("Not found", { status: 404 });
        }

        const bytes = await storage.get(key);
        const body = bytes.buffer.slice(
          bytes.byteOffset,
          bytes.byteOffset + bytes.byteLength,
        ) as ArrayBuffer;
        const base = document.file_name.replace(/\.[^.]+$/, "");
        const fileName = `${base}-template.${document.format}`;
        return new Response(body, {
          headers: {
            "content-type": document.mime_type,
            "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
          },
        });
      },
    },
  },
});
