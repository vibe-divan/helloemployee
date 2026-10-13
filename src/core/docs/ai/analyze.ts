import { parseJson, chat } from "@/lib/ai";
import type { DocumentFieldType } from "../types.ts";
import { ANALYZE_SYSTEM_PROMPT, analyzeUserPrompt } from "./prompts.ts";
import type { AnalysisResult, AnalyzedField } from "./types.ts";

const FIELD_TYPES: DocumentFieldType[] = ["string", "number", "integer", "boolean", "date", "enum"];

function normalizeField(raw: unknown, index: number): AnalyzedField | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const record = raw as Record<string, unknown>;
  const name = typeof record.name === "string" ? record.name.trim() : "";
  if (!name) {
    return null;
  }
  const type = FIELD_TYPES.includes(record.type as DocumentFieldType)
    ? (record.type as DocumentFieldType)
    : "string";
  const constraints =
    record.constraints && typeof record.constraints === "object"
      ? (record.constraints as AnalyzedField["constraints"])
      : undefined;

  return {
    name: name.replace(/[^a-zA-Z0-9_]/g, "_") || `field_${index}`,
    label: typeof record.label === "string" && record.label.trim() ? record.label.trim() : name,
    type,
    required: record.required === true,
    description: typeof record.description === "string" ? record.description : undefined,
    constraints,
  };
}

function normalizeAnalysis(raw: AnalysisResult): AnalysisResult {
  const seen = new Set<string>();
  const fields: AnalyzedField[] = [];
  const list = Array.isArray(raw?.fields) ? raw.fields : [];
  list.forEach((item, index) => {
    const field = normalizeField(item, index);
    if (field && !seen.has(field.name)) {
      seen.add(field.name);
      fields.push(field);
    }
  });
  return {
    title: typeof raw?.title === "string" && raw.title.trim() ? raw.title.trim() : "Документ",
    fields,
  };
}

export async function analyzeDocument(sourceText: string, format: string): Promise<AnalysisResult> {
  const response = await chat(
    [
      { role: "system", content: ANALYZE_SYSTEM_PROMPT },
      { role: "user", content: analyzeUserPrompt(sourceText, format) },
    ],
    { json: true },
  );
  return normalizeAnalysis(parseJson<AnalysisResult>(response.content));
}
