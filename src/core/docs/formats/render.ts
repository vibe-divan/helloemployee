import type { GeneratedDocument } from "./types.ts";

export function renderPlainText(doc: GeneratedDocument): string {
  const lines: string[] = [doc.title, ""];
  for (const field of doc.fields) {
    lines.push(`${field.label}: ${field.value}`);
  }
  const body = doc.body.trim();
  if (body) {
    lines.push("", body);
  }
  return lines.join("\n");
}
