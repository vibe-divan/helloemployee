/** Content passed to format writers. `body` is the AI-rendered document text. */
export interface GeneratedDocument {
  title: string;
  body: string;
  fields: Array<{ label: string; value: string }>;
}

/**
 * A supported document format. `canWrite` is false when the environment cannot
 * produce it (e.g. PDF without a Cyrillic-capable font), so the caller can fall
 * back and notify the user.
 */
export interface DocumentFormat {
  id: string;
  label: string;
  extensions: string[];
  canWrite: boolean;
  extractText(data: Uint8Array): Promise<string>;
  write(doc: GeneratedDocument): Promise<Uint8Array>;
}
