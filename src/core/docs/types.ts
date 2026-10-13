export type DocumentSessionStatus =
  | "analyzing"
  | "awaiting_input"
  | "generating"
  | "completed"
  | "failed"
  | "cancelled";

export type DocumentFieldType = "string" | "number" | "integer" | "boolean" | "date" | "enum";

export type DocumentFieldStatus = "pending" | "filled" | "invalid";

export interface FieldConstraints {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  values?: string[];
}

export interface DocumentField {
  id: string;
  name: string;
  label: string;
  type: DocumentFieldType;
  required: boolean;
  constraints: FieldConstraints;
  description: string | null;
  value: string | null;
  status: DocumentFieldStatus;
  position: number;
}

export interface DocumentTemplate {
  id: string;
  sourceDocumentId: string;
  title: string;
  fields: DocumentField[];
}

export interface DocumentSession {
  id: string;
  ownerId: string;
  status: DocumentSessionStatus;
  outputFormat: string | null;
  sourceDocumentId: string;
  resultDocumentId: string | null;
  templateId: string | null;
  attempts: number;
  maxAttempts: number;
  error: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface DocumentSessionView extends DocumentSession {
  authorLogin: string;
  template: DocumentTemplate | null;
  sourceFileName: string | null;
  resultFileName: string | null;
}

/** A session that is still being worked on (not finished/cancelled). */
export const ACTIVE_STATUSES: DocumentSessionStatus[] = [
  "analyzing",
  "awaiting_input",
  "generating",
];

export function isActiveStatus(status: DocumentSessionStatus): boolean {
  return ACTIVE_STATUSES.includes(status);
}
