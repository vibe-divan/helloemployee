import { storage } from "@/lib/storage";
import { privateServerFn } from "@/core/auth/middleware.ts";
import { DEFAULT_MAX_ATTEMPTS, MAX_FILE_BYTES } from "./constants.ts";
import { detectFormat, getFormat, mimeForFormat, writableFormats } from "./formats";
import { enqueueDocumentJob } from "./jobs";
import { cancelActiveSessions, findSessionById, insertDocument, insertSession } from "./store.ts";

/** Resolves the actual output format, falling back when the requested one is unavailable. */
function resolveOutputFormat(requested: string, inputFormatId: string) {
  const wanted = requested ? getFormat(requested) : undefined;
  const docx = getFormat("docx");
  const input = getFormat(inputFormatId);
  const chosen =
    (wanted?.canWrite ? wanted : undefined) ??
    (docx?.canWrite ? docx : undefined) ??
    (input?.canWrite ? input : undefined) ??
    writableFormats()[0];

  if (!chosen) {
    throw new Error("Нет доступных форматов вывода");
  }

  const notice =
    requested && chosen.id !== requested
      ? `Формат вывода изменён на «${chosen.label}»: вариант «${requested}» недоступен.`
      : null;

  return { format: chosen.id, notice };
}

/**
 * Uploads a source document, cancels the previous active session and starts a
 * new one. Analysis runs in the background.
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

    let output: { format: string; notice: string | null };
    try {
      output = resolveOutputFormat(String(data.get("outputFormat") ?? ""), format.id);
    } catch (error) {
      return {
        ok: false as const,
        error: error instanceof Error ? error.message : String(error),
      };
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
      outputFormat: output.format,
      maxAttempts: DEFAULT_MAX_ATTEMPTS,
    });

    if (!(await findSessionById(sessionId))) {
      return { ok: false as const, error: "Не удалось создать сессию" };
    }

    await enqueueDocumentJob("analyze", sessionId);

    return { ok: true as const, sessionId, notice: output.notice };
  });
