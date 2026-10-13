import type { Selectable } from "kysely";
import { db } from "@/lib/db";
import type {
  Document as DocumentRow,
  DocumentField as DocumentFieldRow,
  DocumentSession as SessionRow,
} from "@/lib/db/db.gen";
import type {
  DocumentField,
  DocumentFieldStatus,
  DocumentFieldType,
  DocumentSession,
  DocumentSessionStatus,
  DocumentSessionView,
  DocumentTemplate,
  FieldConstraints,
} from "./types.ts";

export function currentTimestamp(): string {
  return String(Date.now());
}

function parseConstraints(raw: string | null): FieldConstraints {
  if (!raw) {
    return {};
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as FieldConstraints) : {};
  } catch {
    return {};
  }
}

function toField(row: Selectable<DocumentFieldRow>): DocumentField {
  return {
    id: row.id,
    name: row.name,
    label: row.label,
    type: row.type as DocumentFieldType,
    required: row.required === 1,
    constraints: parseConstraints(row.constraints),
    description: row.description,
    anchor: row.anchor,
    value: row.value,
    status: row.status as DocumentFieldStatus,
    position: row.position,
  };
}

function toSession(row: SessionRow): DocumentSession {
  return {
    id: row.id,
    ownerId: row.owner_id,
    status: row.status as DocumentSessionStatus,
    outputFormat: row.output_format,
    sourceDocumentId: row.source_document_id,
    resultDocumentId: row.result_document_id,
    templateId: row.template_id,
    attempts: row.attempts,
    maxAttempts: row.max_attempts,
    error: row.error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
  };
}

export async function findSessionById(id: string): Promise<DocumentSession | null> {
  const row = await db.readOnly
    .selectFrom("document_session")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirst();
  return row ? toSession(row) : null;
}

export async function findActiveSession(ownerId: string): Promise<DocumentSession | null> {
  const row = await db.readOnly
    .selectFrom("document_session")
    .selectAll()
    .where("owner_id", "=", ownerId)
    .where("status", "in", ["analyzing", "awaiting_input", "generating"])
    .orderBy("created_at", "desc")
    .executeTakeFirst();
  return row ? toSession(row) : null;
}

export async function findTemplateWithFields(templateId: string): Promise<DocumentTemplate | null> {
  const template = await db.readOnly
    .selectFrom("document_template")
    .selectAll()
    .where("id", "=", templateId)
    .executeTakeFirst();
  if (!template) {
    return null;
  }
  const fields = await db.readOnly
    .selectFrom("document_field")
    .selectAll()
    .where("template_id", "=", templateId)
    .orderBy("position")
    .execute();
  return {
    id: template.id,
    sourceDocumentId: template.source_document_id,
    title: template.title,
    fields: fields.map(toField),
  };
}

export function findDocumentById(id: string): Promise<DocumentRow | undefined> {
  return db.readOnly.selectFrom("document").selectAll().where("id", "=", id).executeTakeFirst();
}

export async function buildSessionView(session: DocumentSession): Promise<DocumentSessionView> {
  const [author, source, result, template] = await Promise.all([
    db.readOnly
      .selectFrom("user")
      .select("login")
      .where("id", "=", session.ownerId)
      .executeTakeFirst(),
    db.readOnly
      .selectFrom("document")
      .select("file_name")
      .where("id", "=", session.sourceDocumentId)
      .executeTakeFirst(),
    session.resultDocumentId
      ? db.readOnly
          .selectFrom("document")
          .select("file_name")
          .where("id", "=", session.resultDocumentId)
          .executeTakeFirst()
      : Promise.resolve(undefined),
    session.templateId ? findTemplateWithFields(session.templateId) : Promise.resolve(null),
  ]);

  return {
    ...session,
    authorLogin: author?.login ?? "",
    template,
    sourceFileName: source?.file_name ?? null,
    resultFileName: result?.file_name ?? null,
  };
}

export async function listSessionViews(): Promise<DocumentSessionView[]> {
  const rows = await db.readOnly
    .selectFrom("document_session as s")
    .innerJoin("user as u", "u.id", "s.owner_id")
    .leftJoin("document as src", "src.id", "s.source_document_id")
    .leftJoin("document as res", "res.id", "s.result_document_id")
    .select([
      "s.id as id",
      "s.owner_id as owner_id",
      "s.status as status",
      "s.output_format as output_format",
      "s.source_document_id as source_document_id",
      "s.result_document_id as result_document_id",
      "s.template_id as template_id",
      "s.attempts as attempts",
      "s.max_attempts as max_attempts",
      "s.error as error",
      "s.created_at as created_at",
      "s.updated_at as updated_at",
      "s.completed_at as completed_at",
      "u.login as author_login",
      "src.file_name as source_file_name",
      "res.file_name as result_file_name",
    ])
    .orderBy("s.created_at", "desc")
    .execute();

  return rows.map((row) => ({
    ...toSession(row),
    authorLogin: row.author_login,
    template: null,
    sourceFileName: row.source_file_name,
    resultFileName: row.result_file_name,
  }));
}

export interface NewDocument {
  id: string;
  ownerId: string;
  role: "source" | "result";
  storageKey: string;
  fileName: string;
  mimeType: string;
  format: string;
  size: number;
}

export async function insertDocument(input: NewDocument): Promise<void> {
  await db.readWrite
    .insertInto("document")
    .values({
      id: input.id,
      owner_id: input.ownerId,
      role: input.role,
      storage_key: input.storageKey,
      file_name: input.fileName,
      mime_type: input.mimeType,
      format: input.format,
      size: String(input.size),
      created_at: currentTimestamp(),
    })
    .execute();
}

export interface NewTemplate {
  id: string;
  sourceDocumentId: string;
  title: string;
}

export async function insertTemplate(input: NewTemplate): Promise<void> {
  const now = currentTimestamp();
  await db.readWrite
    .insertInto("document_template")
    .values({
      id: input.id,
      source_document_id: input.sourceDocumentId,
      title: input.title,
      created_at: now,
      updated_at: now,
    })
    .execute();
}

export interface NewField {
  id: string;
  templateId: string;
  name: string;
  label: string;
  type: DocumentFieldType;
  required: boolean;
  constraints: FieldConstraints;
  description: string | null;
  anchor: string | null;
  value: string | null;
  position: number;
}

export async function insertFields(fields: NewField[]): Promise<void> {
  if (fields.length === 0) {
    return;
  }
  const now = currentTimestamp();
  await db.readWrite
    .insertInto("document_field")
    .values(
      fields.map((field) => ({
        id: field.id,
        template_id: field.templateId,
        name: field.name,
        label: field.label,
        type: field.type,
        required: field.required ? 1 : 0,
        constraints: JSON.stringify(field.constraints),
        description: field.description,
        anchor: field.anchor,
        value: field.value,
        status: field.value ? "filled" : "pending",
        position: field.position,
        created_at: now,
        updated_at: now,
      })),
    )
    .execute();
}

export interface NewSession {
  id: string;
  ownerId: string;
  sourceDocumentId: string;
  outputFormat: string;
  maxAttempts: number;
}

export async function insertSession(input: NewSession): Promise<void> {
  const now = currentTimestamp();
  await db.readWrite
    .insertInto("document_session")
    .values({
      id: input.id,
      owner_id: input.ownerId,
      status: "analyzing",
      output_format: input.outputFormat,
      source_document_id: input.sourceDocumentId,
      result_document_id: null,
      template_id: null,
      attempts: 0,
      max_attempts: input.maxAttempts,
      error: null,
      created_at: now,
      updated_at: now,
      completed_at: null,
    })
    .execute();
}

export interface SessionPatch {
  status?: DocumentSessionStatus;
  outputFormat?: string;
  resultDocumentId?: string | null;
  templateId?: string;
  attempts?: number;
  error?: string | null;
  completedAt?: string | null;
}

export async function updateSession(id: string, patch: SessionPatch): Promise<void> {
  await db.readWrite
    .updateTable("document_session")
    .set({
      updated_at: currentTimestamp(),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.outputFormat !== undefined ? { output_format: patch.outputFormat } : {}),
      ...(patch.resultDocumentId !== undefined
        ? { result_document_id: patch.resultDocumentId }
        : {}),
      ...(patch.templateId !== undefined ? { template_id: patch.templateId } : {}),
      ...(patch.attempts !== undefined ? { attempts: patch.attempts } : {}),
      ...(patch.error !== undefined ? { error: patch.error } : {}),
      ...(patch.completedAt !== undefined ? { completed_at: patch.completedAt } : {}),
    })
    .where("id", "=", id)
    .execute();
}

export async function cancelActiveSessions(ownerId: string): Promise<void> {
  const now = currentTimestamp();
  await db.readWrite
    .updateTable("document_session")
    .set({ status: "cancelled", completed_at: now, updated_at: now })
    .where("owner_id", "=", ownerId)
    .where("status", "in", ["analyzing", "awaiting_input", "generating"])
    .execute();
}

export async function updateFieldValues(
  templateId: string,
  values: Record<string, string>,
  status: DocumentFieldStatus,
): Promise<void> {
  const now = currentTimestamp();
  for (const [name, value] of Object.entries(values)) {
    await db.readWrite
      .updateTable("document_field")
      .set({ value, status, updated_at: now })
      .where("template_id", "=", templateId)
      .where("name", "=", name)
      .execute();
  }
}
