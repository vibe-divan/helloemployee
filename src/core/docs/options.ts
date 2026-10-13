import { privateServerFn } from "@/core/auth/middleware.ts";
import { formats } from "./formats";

export interface OutputFormatOption {
  id: string;
  label: string;
  available: boolean;
}

export interface DocumentOptions {
  outputFormats: OutputFormatOption[];
  inputExtensions: string[];
}

/** Formats available to the picker (kept off the client bundle). */
export const getDocumentOptions = privateServerFn({ method: "GET" }).handler(
  async (): Promise<DocumentOptions> => ({
    outputFormats: formats.map((format) => ({
      id: format.id,
      label: format.label,
      available: format.canWrite,
    })),
    inputExtensions: formats.flatMap((format) => format.extensions),
  }),
);
