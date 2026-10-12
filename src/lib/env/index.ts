import { validate } from "./validate";
import { type Env, envSchema } from "./schema.ts";
import * as v from "valibot";

/**
 * Loads env, validates it with schema and validation func and returns result.
 * @returns
 */
async function loadEnv(): Promise<Env> {
  const env = v.parse(envSchema, { ...Bun.env });
  await validate(env);
  return env;
}

// Top-level await is most convenient way to sync access to validated env.
/** Validated env config. */
export const env: Env = await loadEnv();
