import { parseJson, chat } from "@/lib/ai";
import { getPromptContent } from "@/core/prompts/store.ts";
import type { DocumentFieldType } from "../types.ts";
import { analyzeUserPrompt } from "./prompts.ts";
import type { AnalysisResult, AnalyzedField } from "./types.ts";

const FIELD_TYPES: DocumentFieldType[] = ["string", "number", "integer", "boolean", "date", "enum"];

const NON_FILLABLE_RE =
  /подпис[ьи]|печат[ьи]|штамп|факсимил|роспис|оттиск|signature|stamp|seal|facsimile/i;

// HelloClient's own data must never become a variable (mandatory business rule).
const HELLOCLIENT_RE = /клиентские решения|helloclient|193782426/i;

/** Signatures, stamps and facsimiles are not fillable variables. */
function isNonFillable(field: AnalyzedField): boolean {
  return NON_FILLABLE_RE.test([field.name, field.label, field.description].join(" "));
}

/** HelloClient's identifying data is preserved as-is and is never a variable. */
function isHelloClientData(field: AnalyzedField): boolean {
  return HELLOCLIENT_RE.test(`${field.value} ${field.anchor}`);
}

function normalizeName(raw: string, index: number): string {
  const cleaned = raw
    .replace(/[^a-zA-Z0-9_.]/g, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^[_.]+|[_.]+$/g, "");
  return cleaned || `field_${index}`;
}

function normalizeField(raw: unknown, index: number): AnalyzedField | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const record = raw as Record<string, unknown>;
  const name = typeof record.name === "string" ? record.name.trim() : "";
  if (!name) {
    return null;
  }
  const value = typeof record.value === "string" ? record.value.trim() : "";
  const type = FIELD_TYPES.includes(record.type as DocumentFieldType)
    ? (record.type as DocumentFieldType)
    : "string";
  const constraints =
    record.constraints && typeof record.constraints === "object"
      ? (record.constraints as AnalyzedField["constraints"])
      : undefined;
  const anchor = typeof record.anchor === "string" && record.anchor ? record.anchor : value;

  return {
    name: normalizeName(name, index),
    label: typeof record.label === "string" && record.label.trim() ? record.label.trim() : name,
    type,
    required: record.required === true,
    description: typeof record.description === "string" ? record.description.trim() : "",
    value,
    anchor,
    constraints,
  };
}

function normalizeAnalysis(raw: AnalysisResult): AnalysisResult {
  const seen = new Set<string>();
  const fields: AnalyzedField[] = [];
  const list = Array.isArray(raw?.fields) ? raw.fields : [];
  list.forEach((item, index) => {
    const field = normalizeField(item, index);
    // Fields without a substitution anchor cannot be replaced in place.
    if (
      field &&
      field.anchor &&
      !isNonFillable(field) &&
      !isHelloClientData(field) &&
      !seen.has(field.name)
    ) {
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
  const systemPrompt = await getPromptContent("analyze");
  const response = await chat(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: analyzeUserPrompt(sourceText, format) },
    ],
    { json: true },
  );
  return normalizeAnalysis(parseJson<AnalysisResult>(response.content));
}
