import { env } from "@/lib/env";
import { createFileStorage, type FileStorage } from "./file-storage.ts";

export { createFileStorage } from "./file-storage.ts";
export type { FileStorage } from "./file-storage.ts";

/** Process-wide storage instance (filesystem-backed S3 mock). */
export const storage: FileStorage = createFileStorage(env.STORAGE_DIR);
