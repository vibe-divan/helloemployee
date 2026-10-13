import { storage } from "@/lib/storage";
import { privateServerFn } from "@/core/auth/middleware.ts";
import { DEFAULT_MAX_ATTEMPTS, MAX_FILE_BYTES } from "./constants.ts";
import { detectFormat, mimeForFormat } from "./formats";
import { enqueueDocumentJob } from "./jobs";
import { cancelActiveSessions, findSessionById, insertDocument, insertSession } from "./store.ts";

/**
 * Uploads a source document, cancels the previous active session and starts a
 * new one. Analysis runs in the background. The result keeps the source format,
 * since values are substituted into the original file in place.
 */
export const startDocumentSession = privateServerFn({ method: "POST" })
  .validator((data: FormData) => data)
  .handler(async ({ data, context }) => {
    const ownerId = context.session.userId;

    const file = data.get("file");
    if (!(file instanceof File)) {
      return { ok: false as const, error: "Файл не выбран" };
    }
    if (file.size === 0) {
      return { ok: false as const, error: "Файл пустой" };
    }
    if (file.size > MAX_FILE_BYTES) {
      return { ok: false as const, error: "Файл слишком большой" };
    }

    const format = detectFormat(file.name);
    if (!format) {
      return { ok: false as const, error: `Формат не поддерживается: ${file.name}` };
    }

    const bytes = new Uint8Array(await file.arrayBuffer());

    await cancelActiveSessions(ownerId);

    const documentId = crypto.randomUUID();
    const storageKey = `documents/${documentId}.${format.id}`;
    const mimeType = file.type || mimeForFormat(format.id);
    await storage.put(storageKey, bytes, mimeType);
    await insertDocument({
      id: documentId,
      ownerId,
      role: "source",
      storageKey,
      fileName: file.name,
      mimeType,
      format: format.id,
      size: file.size,
    });

    const sessionId = crypto.randomUUID();
    await insertSession({
      id: sessionId,
      ownerId,
      sourceDocumentId: documentId,
      outputFormat: format.id,
      maxAttempts: DEFAULT_MAX_ATTEMPTS,
    });

    if (!(await findSessionById(sessionId))) {
      return { ok: false as const, error: "Не удалось создать сессию" };
    }

    await enqueueDocumentJob("analyze", sessionId);

    return { ok: true as const, sessionId };
  });
