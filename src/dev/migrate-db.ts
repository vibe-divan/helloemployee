// oxlint-disable no-console - clean logs are necessary

import { promises as fs } from "node:fs";
import * as path from "node:path";
import { parseArgs } from "node:util";
import { sql } from "kysely";
import { FileMigrationProvider, Migrator } from "kysely/migration";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

const { values } = parseArgs({
  args: Bun.argv,
  options: { reset: { type: "boolean" } },
  strict: false,
});

/**
 * Migrates database to latest, with `migrations` dir.
 * Should not be used in runtime.
 */
async function migrateToLatest() {
  const startTime = performance.now();
  console.log();

  let yellow = "";
  let green = "";
  let gray = "";
  let reset = "";
  let warnIcon = "";
  let successIcon = "";
  let stepSuccessIcon = "";
  let failIcon = "";
  if (env.NODE_ENV === "development") {
    yellow = "\x1b[93m";
    green = "\x1b[92m";
    gray = "\x1b[90m";
    reset = "\x1b[0m";
    warnIcon = "⚠️ ";
    successIcon = "✅ ";
    stepSuccessIcon = "✔️ ";
    failIcon = "❌ ";
  }

  if (values.reset) {
    console.warn(`${warnIcon}${yellow}Database reset started${reset}`);

    const userSchemas = await sql<{ nspname: string }>`
			select nspname from pg_catalog.pg_namespace
			where nspname not like 'pg_%' and nspname != 'information_schema'
		`.execute(db.readWrite);

    for (const row of userSchemas.rows) {
      await sql.raw(`drop schema ${row.nspname} cascade`).execute(db.readWrite);
      console.warn(`${gray}├─${reset} ${stepSuccessIcon}Schema "${row.nspname}" dropped`);
    }

    await sql`create schema public`.execute(db.readWrite);
    console.warn(`${gray}├─${reset} ${stepSuccessIcon}Schema "public" recreated`);

    await sql`grant all on schema public to public`.execute(db.readWrite);
    console.warn(`${gray}└─${reset} ${stepSuccessIcon}Granted all on schema "public"\n`);
  }

  const migrator = new Migrator({
    db: db.readWrite,
    provider: new FileMigrationProvider({
      fs: fs,
      path: path,
      migrationFolder: path.join(import.meta.dir, "../migrations"),
    }),
  });

  const { error, results } = await migrator.migrateToLatest();

  if (results?.length === 0) {
    console.log(`${successIcon}${green}Up to date, no migrations to apply${reset}\n`);
  } else if (results) {
    console.log(
      `${successIcon}${green}Migrations applied successfully ${gray}${(performance.now() - startTime).toFixed(2)} ms${reset}`,
    );
    results.forEach((result, i) => {
      const sym = results.length === i + 1 ? `${gray}└─${reset}` : `${gray}├─${reset}`;

      if (result.status === "Success") {
        console.log(`${sym} ${stepSuccessIcon}${result.migrationName}`);
      } else if (result.status === "Error") {
        console.error(`\n${failIcon}Failed to migrate: "${result.migrationName}"`);
      }
    });
    console.log("");
  }

  if (error) {
    console.error("Failed to migrate");
    console.error(error);
    process.exit(1);
  }

  await db.readWrite.destroy();
}

if (import.meta.main) {
  migrateToLatest();
}
