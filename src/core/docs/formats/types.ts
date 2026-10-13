import type { DocumentFieldType } from "../types.ts";

/** A single substitution into the source document (in place). */
export interface FieldFill {
  name: string;
  type: DocumentFieldType;
  anchor: string | null;
  value: string;
}

/**
 * A supported document format. `fill` edits the ORIGINAL bytes so layout,
 * fonts and spacing stay untouched. `canWrite` is false when the environment
 * cannot produce the format.
 */
export interface DocumentFormat {
  id: string;
  label: string;
  extensions: string[];
  canWrite: boolean;
  extractText(data: Uint8Array): Promise<string>;
  fill(source: Uint8Array, fills: FieldFill[]): Promise<Uint8Array>;
}
