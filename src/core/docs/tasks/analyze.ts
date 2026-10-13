import { storage } from "@/lib/storage";
import { analyzeDocument } from "../ai";
import { getFormat } from "../formats";
import {
  currentTimestamp,
  findDocumentById,
  findSessionById,
  insertFields,
  insertTemplate,
  updateSession,
} from "../store.ts";

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function isStopped(sessionId: string): Promise<boolean> {
  const session = await findSessionById(sessionId);
  return !session || session.status !== "analyzing";
}

/** Analyzes the uploaded document and builds a template with fields to fill. */
export async function runAnalysis(sessionId: string): Promise<void> {
  const session = await findSessionById(sessionId);
  if (!session || session.status !== "analyzing") {
    return;
  }

  try {
    const document = await findDocumentById(session.sourceDocumentId);
    if (!document) {
      throw new Error("Исходный документ не найден");
    }
    const format = getFormat(document.format);
    if (!format) {
      throw new Error(`Формат не поддерживается: ${document.format}`);
    }

    const text = (await format.extractText(await storage.get(document.storage_key))).trim();
    if (!text) {
      throw new Error("Не удалось извлечь текст из документа");
    }

    const analysis = await analyzeDocument(text, format.id);
    if (await isStopped(sessionId)) {
      return;
    }

    const templateId = crypto.randomUUID();
    await insertTemplate({
      id: templateId,
      sourceDocumentId: session.sourceDocumentId,
      title: analysis.title,
    });
    await insertFields(
      analysis.fields.map((field, index) => ({
        id: crypto.randomUUID(),
        templateId,
        name: field.name,
        label: field.label,
        type: field.type,
        required: field.required,
        constraints: field.constraints ?? {},
        description: field.description ?? null,
        position: index,
      })),
    );

    await updateSession(sessionId, { templateId, status: "awaiting_input" });
  } catch (error) {
    await updateSession(sessionId, {
      status: "failed",
      error: messageOf(error),
      completedAt: currentTimestamp(),
    });
  }
}
