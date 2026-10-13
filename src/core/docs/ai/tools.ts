import { sql } from "kysely";
import { db } from "@/lib/db";
import type { ToolSpec } from "@/lib/ai";

const ALLOWED_TABLES = new Set([
  "user",
  "document",
  "document_template",
  "document_field",
  "document_session",
]);
const FORBIDDEN =
  /\b(insert|update|delete|drop|alter|create|attach|detach|pragma|vacuum|replace)\b/i;
const SENSITIVE_COLUMNS = new Set(["password_hash"]);
const ROW_LIMIT = 50;

export const docsTools: ToolSpec[] = [
  {
    type: "function",
    function: {
      name: "get_current_datetime",
      description: "Возвращает текущие дату и время (ISO, локально и таймзону).",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "query_database",
      description:
        "Выполняет READ-ONLY SQL SELECT по таблицам приложения (user, document, document_template, document_field, document_session) и возвращает строки в JSON. Только SELECT, без ';', максимум 50 строк.",
      parameters: {
        type: "object",
        properties: {
          sql: { type: "string", description: "SELECT-запрос без точки с запятой" },
        },
        required: ["sql"],
        additionalProperties: false,
      },
    },
  },
];

function errorResult(message: string): string {
  return JSON.stringify({ error: message });
}

function redactRow(row: unknown): unknown {
  if (!row || typeof row !== "object") {
    return row;
  }
  const clone: Record<string, unknown> = { ...(row as Record<string, unknown>) };
  for (const column of SENSITIVE_COLUMNS) {
    delete clone[column];
  }
  return clone;
}

async function executeReadOnlyQuery(query: string): Promise<string> {
  if (!query) {
    return errorResult("Пустой запрос");
  }
  if (query.includes(";")) {
    return errorResult("Запрос не должен содержать ';'");
  }
  if (!/^select\b/i.test(query.trim())) {
    return errorResult("Разрешены только SELECT-запросы");
  }
  if (FORBIDDEN.test(query.replace(/^select\b/i, ""))) {
    return errorResult("Запрос содержит недопустимые ключевые слова");
  }

  const tables = [...query.matchAll(/\b(?:from|join)\s+["'`]?([a-z_]+)["'`]?/gi)]
    .map((match) => (match[1] ?? "").toLowerCase())
    .filter(Boolean);
  for (const table of tables) {
    if (!ALLOWED_TABLES.has(table)) {
      return errorResult(`Таблица недоступна: ${table}`);
    }
  }

  const limited = /\blimit\b/i.test(query) ? query : `${query} limit ${ROW_LIMIT}`;
  try {
    const result = await sql.raw(limited).execute(db.readOnly);
    const rows = result.rows.slice(0, ROW_LIMIT).map(redactRow);
    return JSON.stringify({ rowCount: rows.length, rows });
  } catch (error) {
    return errorResult(error instanceof Error ? error.message : String(error));
  }
}

export async function executeDocsTool(name: string, rawArgs: string): Promise<string> {
  if (name === "get_current_datetime") {
    const now = new Date();
    return JSON.stringify({
      iso: now.toISOString(),
      local: now.toString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timestamp: now.getTime(),
    });
  }

  if (name === "query_database") {
    let query = "";
    try {
      const parsed = JSON.parse(rawArgs) as { sql?: unknown };
      query = typeof parsed.sql === "string" ? parsed.sql.trim() : "";
    } catch {
      return errorResult("Аргумент sql должен быть корректным JSON");
    }
    return executeReadOnlyQuery(query);
  }

  return errorResult(`Неизвестный инструмент: ${name}`);
}
