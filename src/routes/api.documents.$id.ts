import { createFileRoute } from "@tanstack/react-router";
import { getSession } from "@/core/sessions/get-session.ts";
import { getSessionId } from "@/core/sessions/session-cookie.ts";
import { findDocumentById } from "@/core/docs/store.ts";
import { storage } from "@/lib/storage";

export const Route = createFileRoute("/api/documents/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const sessionId = getSessionId();
        const session = sessionId ? await getSession(sessionId) : null;
        if (!session) {
          return new Response("Unauthorized", { status: 401 });
        }

        const document = await findDocumentById(params.id);
        if (!document) {
          return new Response("Not found", { status: 404 });
        }

        const bytes = await storage.get(document.storage_key);
        const body = bytes.buffer.slice(
          bytes.byteOffset,
          bytes.byteOffset + bytes.byteLength,
        ) as ArrayBuffer;
        return new Response(body, {
          headers: {
            "content-type": document.mime_type,
            "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(document.file_name)}`,
          },
        });
      },
    },
  },
});
