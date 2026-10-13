import { storage } from "@/lib/storage";
import { generateDocument, type GenerationContext } from "../ai";
import { getFormat, mimeForFormat, type GeneratedDocument } from "../formats";
import {
  currentTimestamp,
  findDocumentById,
  findSessionById,
  findTemplateWithFields,
  insertDocument,
  updateFieldValues,
  updateSession,
} from "../store.ts";
import { formatProblems, validateFieldValues } from "../validation.ts";
import type { DocumentField, DocumentSession } from "../types.ts";

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function isStopped(sessionId: string): Promise<boolean> {
  const session = await findSessionById(sessionId);
  return !session || session.status !== "generating";
}

function collectValues(fields: DocumentField[]): Record<string, string> {
  const values: Record<string, string> = {};
  for (const field of fields) {
    values[field.name] = field.value ?? "";
  }
  return values;
}

async function persistResult(
  session: DocumentSession,
  title: string,
  fields: DocumentField[],
  values: Record<string, string>,
  body: string,
): Promise<void> {
  const formatId = session.outputFormat ?? "docx";
  const format = getFormat(formatId);
  if (!format || !format.canWrite) {
    throw new Error(`Формат вывода недоступен: ${formatId}`);
  }

  const generated: GeneratedDocument = {
    title,
    body,
    fields: fields.map((field) => ({ label: field.label, value: values[field.name] ?? "" })),
  };
  const bytes = await format.write(generated);

  const resultId = crypto.randomUUID();
  const storageKey = `documents/${resultId}.${format.id}`;
  await storage.put(storageKey, bytes, mimeForFormat(format.id));
  await insertDocument({
    id: resultId,
    ownerId: session.ownerId,
    role: "result",
    storageKey,
    fileName: `${title}.${format.id}`,
    mimeType: mimeForFormat(format.id),
    format: format.id,
    size: bytes.byteLength,
  });

  await updateSession(session.id, {
    status: "completed",
    resultDocumentId: resultId,
    error: null,
    completedAt: currentTimestamp(),
  });
}

/**
 * Fills the template with the AI (tools allowed), validates the result and
 * retries with the problem context up to `maxAttempts`. Stops early if the user
 * cancels the session. Fails with a clear message when values stay invalid.
 */
export async function runGeneration(sessionId: string): Promise<void> {
  const session = await findSessionById(sessionId);
  if (!session || session.status !== "generating" || !session.templateId) {
    return;
  }

  try {
    const template = await findTemplateWithFields(session.templateId);
    if (!template) {
      throw new Error("Шаблон не найден");
    }
    const document = await findDocumentById(session.sourceDocumentId);
    if (!document) {
      throw new Error("Исходный документ не найден");
    }
    const sourceFormat = getFormat(document.format);
    const sourceText = sourceFormat
      ? await sourceFormat.extractText(await storage.get(document.storage_key))
      : "";

    const fields = template.fields;
    const values = collectValues(fields);
    let problems: string | undefined;
    let lastErrors: Record<string, string[]> = {};
    let body = "";

    for (let attempt = 1; attempt <= session.maxAttempts; attempt += 1) {
      if (await isStopped(sessionId)) {
        return;
      }

      const context: GenerationContext = {
        sourceText,
        title: template.title,
        fields: fields.map((field) => ({
          name: field.name,
          label: field.label,
          type: field.type,
          required: field.required,
          description: field.description,
        })),
        values: { ...values },
      };

      const result = await generateDocument(context, problems);
      for (const [name, value] of Object.entries(result.fields)) {
        if (name in values) {
          values[name] = value;
        }
      }
      body = result.body;
      lastErrors = validateFieldValues(fields, values);
      const hasErrors = Object.keys(lastErrors).length > 0;

      await updateFieldValues(template.id, values, hasErrors ? "invalid" : "filled");
      await updateSession(sessionId, { attempts: attempt });

      if (!hasErrors) {
        await persistResult(session, template.title, fields, values, body);
        return;
      }
      problems = formatProblems(lastErrors);
    }

    throw new Error(
      `Не удалось получить корректные значения за ${session.maxAttempts} попыток:\n${formatProblems(lastErrors)}`,
    );
  } catch (error) {
    await updateSession(sessionId, {
      status: "failed",
      error: messageOf(error),
      completedAt: currentTimestamp(),
    });
  }
}
