import type { DocumentFormat, FieldFill } from "./types.ts";

const decoder = new TextDecoder();
const encoder = new TextEncoder();

/** Replaces every occurrence of `needle`, keeping the rest intact. */
export function replaceAll(text: string, needle: string, value: string): string {
  if (!needle) {
    return text;
  }
  return text.split(needle).join(value);
}

function applyFills(text: string, fills: FieldFill[]): string {
  let result = text;
  for (const fill of fills) {
    if (fill.anchor) {
      result = replaceAll(result, fill.anchor, fill.value);
    }
  }
  return result;
}

export const txtFormat: DocumentFormat = {
  id: "txt",
  label: "Текст",
  extensions: ["txt", "md", "csv"],
  canWrite: true,
  extractText(data) {
    return Promise.resolve(decoder.decode(data));
  },
  fill(source, fills) {
    return Promise.resolve(encoder.encode(applyFills(decoder.decode(source), fills)));
  },
};
