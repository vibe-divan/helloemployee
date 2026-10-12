import { log } from "@/lib/log";
import type { Env } from "./schema.ts";

/** Validates the parsed environment variables. */
export async function validate(env: Env) {
  if (env.PORT < 1 || env.PORT > 65535) {
    log.critical("port is invalid");
  }
}
