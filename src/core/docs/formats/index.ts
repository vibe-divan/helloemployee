import { docxFormat } from "./docx.ts";
import { pdfFormat } from "./pdf.ts";
import { txtFormat } from "./txt.ts";
import { xlsxFormat } from "./xlsx.ts";
import type { DocumentFormat } from "./types.ts";

export type { DocumentFormat, FieldFill } from "./types.ts";

/** Registry — add a module and list it here to support a new format. */
export const formats: DocumentFormat[] = [docxFormat, xlsxFormat, pdfFormat, txtFormat];

export function getFormat(id: string): DocumentFormat | undefined {
  return formats.find((format) => format.id === id);
}

export function detectFormat(fileName: string): DocumentFormat | undefined {
  const extension = fileName.toLowerCase().split(".").pop() ?? "";
  return formats.find((format) => format.extensions.includes(extension));
}

const MIME_TYPES: Record<string, string> = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pdf: "application/pdf",
  txt: "text/plain",
};

export function mimeForFormat(id: string): string {
  return MIME_TYPES[id] ?? "application/octet-stream";
}
