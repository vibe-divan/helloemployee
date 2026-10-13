import { promises as fs } from "node:fs";
import * as path from "node:path";

/** Object storage with S3-like semantics, backed by the local filesystem. */
export interface FileStorage {
  put(key: string, data: Uint8Array, contentType: string): Promise<void>;
  get(key: string): Promise<Uint8Array>;
  exists(key: string): Promise<boolean>;
  delete(key: string): Promise<void>;
}

function resolveKey(root: string, key: string): string {
  const normalized = key.replace(/^\/+/, "");
  const target = path.resolve(root, normalized);
  const rootResolved = path.resolve(root);
  if (target !== rootResolved && !target.startsWith(rootResolved + path.sep)) {
    throw new Error(`Недопустимый ключ хранилища: ${key}`);
  }
  return target;
}

export function createFileStorage(root: string): FileStorage {
  return {
    async put(key, data) {
      const target = resolveKey(root, key);
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, data);
    },
    async get(key) {
      const target = resolveKey(root, key);
      try {
        return await fs.readFile(target);
      } catch {
        throw new Error(`Файл не найден в хранилище: ${key}`);
      }
    },
    async exists(key) {
      try {
        await fs.access(resolveKey(root, key));
        return true;
      } catch {
        return false;
      }
    },
    async delete(key) {
      try {
        await fs.unlink(resolveKey(root, key));
      } catch {
        // deleting a missing object is a no-op
      }
    },
  };
}
