import type { DocumentFieldType } from "../types.ts";

export interface AnalyzedField {
  name: string;
  label: string;
  type: DocumentFieldType;
  required: boolean;
  description: string;
  /** The concrete entity value found in the document (a suggested field value). */
  value: string;
  /** Where the value occurs in the source document (format-specific). */
  anchor: string;
  constraints?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    values?: string[];
  };
}

export interface AnalysisResult {
  title: string;
  fields: AnalyzedField[];
}

export interface GenerationFieldContext {
  name: string;
  label: string;
  type: string;
  required: boolean;
  description: string | null;
}

export interface GenerationContext {
  sourceText: string;
  title: string;
  fields: GenerationFieldContext[];
  values: Record<string, string>;
}

export interface GenerationResult {
  fields: Record<string, string>;
}
