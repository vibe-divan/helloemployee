import { privateServerFn } from "@/core/auth/middleware.ts";
import { formats } from "./formats";

export interface DocumentOptions {
  /** Extensions accepted by the picker (kept off the client bundle). */
  inputExtensions: string[];
}

export const getDocumentOptions = privateServerFn({ method: "GET" }).handler(
  async (): Promise<DocumentOptions> => ({
    inputExtensions: formats.flatMap((format) => format.extensions),
  }),
);
