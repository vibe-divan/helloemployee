import { storage } from "@/lib/storage";
import { analyzeDocument } from "../ai";
import { getFormat, mimeForFormat } from "../formats";
import { extractPlaceholderNames, placeholder, templateStorageKey } from "../template.ts";
import type { DocumentFieldType, FieldConstraints } from "../types.ts";
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

/**
 * Analyzes the uploaded document and builds a reusable template: every fragment
 * that should change on reuse is replaced with a `{{variable}}` placeholder.
 *
 * If the document already contains placeholders, it is treated as an existing
 * template — no re-analysis, its variables are used as approved.
 */
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

    const sourceBytes = await storage.get(document.storage_key);
    const text = (await format.extractText(sourceBytes)).trim();
    if (!text) {
      throw new Error("Не удалось извлечь текст из документа");
    }

    const placeholderNames = extractPlaceholderNames(text);
    if (placeholderNames.length > 0) {
      await persistTemplate(sessionId, {
        sourceDocumentId: session.sourceDocumentId,
        title: document.file_name,
        fields: placeholderNames.map((name, index) => ({
          name,
          label: name,
          type: "string",
          required: false,
          constraints: {},
          description: null,
          anchor: null,
          value: null,
          position: index,
        })),
        templateBytes: sourceBytes,
        formatId: format.id,
      });
      return;
    }

    const analysis = await analyzeDocument(text, format.id);
    if (await isStopped(sessionId)) {
      return;
    }

    const templateBytes = await format.fill(
      sourceBytes,
      analysis.fields.map((field) => ({
        name: field.name,
        type: "string" as const,
        anchor: field.anchor,
        value: placeholder(field.name),
      })),
    );

    await persistTemplate(sessionId, {
      sourceDocumentId: session.sourceDocumentId,
      title: analysis.title,
      fields: analysis.fields.map((field, index) => ({
        name: field.name,
        label: field.label,
        type: field.type,
        required: field.required,
        constraints: field.constraints ?? {},
        description: field.description ?? null,
        anchor: field.anchor,
        value: field.value || null,
        position: index,
      })),
      templateBytes,
      formatId: format.id,
    });
  } catch (error) {
    await updateSession(sessionId, {
      status: "failed",
      error: messageOf(error),
      completedAt: currentTimestamp(),
    });
  }
}

interface PersistTemplateParams {
  sourceDocumentId: string;
  title: string;
  fields: Array<{
    name: string;
    label: string;
    type: DocumentFieldType;
    required: boolean;
    constraints: FieldConstraints;
    description: string | null;
    anchor: string | null;
    value: string | null;
    position: number;
  }>;
  templateBytes: Uint8Array;
  formatId: string;
}

/** Stores the template document and its field structure, then opens the session. */
async function persistTemplate(sessionId: string, params: PersistTemplateParams): Promise<void> {
  await storage.put(
    templateStorageKey(sessionId, params.formatId),
    params.templateBytes,
    mimeForFormat(params.formatId),
  );

  const templateId = crypto.randomUUID();
  await insertTemplate({
    id: templateId,
    sourceDocumentId: params.sourceDocumentId,
    title: params.title,
  });
  await insertFields(
    params.fields.map((field) => ({
      id: crypto.randomUUID(),
      templateId,
      name: field.name,
      label: field.label,
      type: field.type,
      required: field.required,
      constraints: field.constraints,
      description: field.description,
      anchor: field.anchor,
      value: field.value,
      position: field.position,
    })),
  );

  await updateSession(sessionId, { templateId, status: "awaiting_input" });
}
