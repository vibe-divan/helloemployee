import { env } from "@/lib/env";

/**
 * Reads database schema and writes corresponding types to codebase.
 * Should not be used in runtime.
 */
export async function genDbTypes() {
  const databaseUrl = env.DB_READ_URL; // Enough for schema read

  await Bun.$`bun -b kysely-codegen --url=${databaseUrl} --dialect kysely-bun-sqlite --out-file src/lib/db/db.gen.ts`;
}

if (import.meta.main) {
  await genDbTypes();
}
