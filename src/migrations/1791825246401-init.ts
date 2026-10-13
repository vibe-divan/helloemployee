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

  await sql`
    create table "session" (
      id uuid not null,
      user_id uuid not null,
      created_at bigint not null,
      expires_at bigint not null,
      primary key (id),
      foreign key (user_id) references "user" (id) on delete cascade
    );
  `.execute(tx);

  // Separate statements: the sqlite dialect runs only the first statement of a
  // multi-statement query.
  await sql`
    create unique index "user_login_unique"
      on "user" (lower(login));
  `.execute(tx);

  await sql`
    create index "session_user_id_index" on "session" (user_id);
  `.execute(tx);
}
