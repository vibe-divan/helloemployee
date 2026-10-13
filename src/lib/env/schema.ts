import * as v from "valibot";

export const envSchema = v.object({
  NODE_ENV: v.picklist(["development", "production", "test"]),
  PORT: v.pipe(v.string(), v.toNumber()),

  DB_READ_URL: v.string(),
  DB_WRITE_URL: v.string(),

  DEEPSEEK_API_KEY: v.string(),
  DEEPSEEK_BASE_URL: v.optional(v.string(), "https://api.deepseek.com"),
  DEEPSEEK_MODEL: v.optional(v.string(), "deepseek-flash"),

  STORAGE_DIR: v.optional(v.string(), "./.data/storage"),
  QUEUE_DB_PATH: v.optional(v.string(), "./.data/queue.db"),

  // Optional TTF/OTF used to render Cyrillic text into generated PDFs.
  PDF_FONT_PATH: v.optional(v.string(), ""),
});

export type Env = v.InferOutput<typeof envSchema>;
