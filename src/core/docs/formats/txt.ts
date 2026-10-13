import { renderPlainText } from "./render.ts";
import type { DocumentFormat } from "./types.ts";

const decoder = new TextDecoder();
const encoder = new TextEncoder();

export const txtFormat: DocumentFormat = {
  id: "txt",
  label: "Текст",
  extensions: ["txt", "md", "csv"],
  canWrite: true,
  extractText(data) {
    return Promise.resolve(decoder.decode(data));
  },
  write(doc) {
    return Promise.resolve(encoder.encode(renderPlainText(doc)));
  },
};
