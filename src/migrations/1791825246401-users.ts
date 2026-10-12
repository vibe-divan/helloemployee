import { type Kysely, sql } from "kysely";

export async function up(tx: Kysely<unknown>) {
  await sql`
    create table "user" (
      id uuid not null,
      email text not null,
      password_hash text not null,
      created_at bigint not null,
      updated_at bigint not null,
      primary key (id)
    );

    -- email is case-insensitive unique
    create unique index
      on "user" (lower(email));
  `.execute(tx);
}
