import * as v from "valibot";

export const envSchema = v.object({
  NODE_ENV: v.picklist(["development", "production", "test"]),
  PORT: v.pipe(v.string(), v.toNumber()),

  DB_READ_URL: v.string(),
  DB_WRITE_URL: v.string(),

  // Encrypts session cookies. Must be at least 32 characters.
  SESSION_SECRET: v.pipe(v.string(), v.minLength(32)),
});

export type Env = v.InferOutput<typeof envSchema>;
