import { Kysely } from "kysely";
import { BunSqliteDialect } from "kysely-bun-sqlite-dialect";
import { Database } from "bun:sqlite";
import { env } from "@/lib/env";
import type { DB } from "./db.gen";

interface CreateDbParams {
  connectionString: string;
}

function createDb(params: CreateDbParams) {
  const db = new Kysely<DB>({
    dialect: new BunSqliteDialect({
      database: new Database(params.connectionString),
    }),
  });
  return db;
}

export const db = {
  readWrite: createDb({ connectionString: env.DB_WRITE_URL }),
  readOnly: createDb({ connectionString: env.DB_READ_URL }),
};
