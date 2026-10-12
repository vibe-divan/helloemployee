import { db } from "@/lib/db";
import { seedUsers } from "./users.ts";

/** Collects entity seeders. Each entity owns its own seeder module. */
export async function seed(): Promise<void> {
  await seedUsers();
}

async function runFromCli() {
  await seed();
  await db.readWrite.destroy();
}

if (import.meta.main) {
  await runFromCli();
}
