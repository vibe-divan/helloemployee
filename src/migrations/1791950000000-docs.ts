import { type Kysely, sql } from "kysely";

export async function up(tx: Kysely<unknown>) {
  await sql`
    create table "document" (
      id uuid not null,
      owner_id uuid not null,
      role text not null,
      storage_key text not null,
      file_name text not null,
      mime_type text not null,
      format text not null,
      size bigint not null,
      created_at bigint not null,
      primary key (id)
    );
  `.execute(tx);

  await sql`
    create table "document_template" (
      id uuid not null,
      source_document_id uuid not null,
      title text not null,
      created_at bigint not null,
      updated_at bigint not null,
      primary key (id)
    );
  `.execute(tx);

  await sql`
    create table "document_field" (
      id uuid not null,
      template_id uuid not null,
      name text not null,
      label text not null,
      type text not null,
      required integer not null,
      constraints text,
      description text,
      value text,
      status text not null,
      position integer not null,
      created_at bigint not null,
      updated_at bigint not null,
      primary key (id)
    );
  `.execute(tx);

  await sql`
    create table "document_session" (
      id uuid not null,
      owner_id uuid not null,
      status text not null,
      output_format text,
      source_document_id uuid not null,
      result_document_id uuid,
      template_id uuid,
      attempts integer not null,
      max_attempts integer not null,
      error text,
      created_at bigint not null,
      updated_at bigint not null,
      completed_at bigint,
      primary key (id)
    );
  `.execute(tx);

  // Separate statements: the sqlite dialect runs only the first statement of a
  // multi-statement query.
  await sql`create index "document_owner_id_index" on "document" (owner_id);`.execute(tx);
  await sql`create index "document_template_source_document_id_index" on "document_template" (source_document_id);`.execute(
    tx,
  );
  await sql`create index "document_field_template_id_index" on "document_field" (template_id);`.execute(
    tx,
  );
  await sql`create index "document_session_owner_id_index" on "document_session" (owner_id);`.execute(
    tx,
  );
  await sql`create index "document_session_status_index" on "document_session" (status);`.execute(
    tx,
  );
}
