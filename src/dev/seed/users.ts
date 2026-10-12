import { sql } from "kysely";
import { db } from "@/lib/db";
import { log } from "@/lib/log";
import { hashPassword } from "@/lib/security";

export interface SeedUser {
  login: string;
  password: string;
}

const DEFAULT_USERS: SeedUser[] = [{ login: "admin", password: "admin" }];

/** Creates a credential when the login is free. Returns false if it exists. */
export async function createUserIfMissing(params: SeedUser): Promise<boolean> {
  const existing = await db.readOnly
    .selectFrom("user")
    .select("id")
    .where(sql<boolean>`lower(login) = lower(${params.login})`)
    .executeTakeFirst();

  if (existing) {
    return false;
  }

  const now = String(Date.now());
  await db.readWrite
    .insertInto("user")
    .values({
      id: crypto.randomUUID(),
      login: params.login,
      password_hash: await hashPassword(params.password),
      created_at: now,
      updated_at: now,
    })
    .execute();

  return true;
}

/** Seeds users. Idempotent. */
export async function seedUsers(users: SeedUser[] = DEFAULT_USERS): Promise<void> {
  for (const user of users) {
    const created = await createUserIfMissing(user);
    log.info(created ? `Created user "${user.login}"` : `User "${user.login}" already exists`);
  }
}
