import { type Kysely, sql } from "kysely";

export async function up(tx: Kysely<unknown>) {
  await sql`
    create table "user" (
      id uuid not null,
      login text not null,
      password_hash text not null,
      created_at bigint not null,
      updated_at bigint not null,
      primary key (id)
    );
  `.execute(tx);

  // Separate statement: the sqlite dialect only runs the first statement of a
  // multi-statement query.
  await sql`
    create unique index "user_login_unique"
      on "user" (lower(login));
  `.execute(tx);
}
