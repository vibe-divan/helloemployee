// oxlint-disable no-console - valid use

import { createEnvSensitiveEntity } from "@/lib/utils";
import { colors } from "./colors.ts";
import { getTimestamp } from "./get-timestamp.ts";

/**
 * It is better to determine prefix on startup
 * than check NODE_ENV on each call.
 */
const getLogPrefix = createEnvSensitiveEntity({
  dev: () => `${colors.error}${getTimestamp()} CRITICAL${colors.reset}`,
  prod: () => `${getTimestamp()} CRITICAL`,
  test: () => `${getTimestamp()} CRITICAL`, // Tests doesn't need colors
});

/**
 * Logs provided args as error message and exits process with code 1.
 * Automatically picks fitting color mode.
 * **Use it carefully!**
 *
 * @example
 * ```typescript
 * log.critical("I'm dead!") // 2026-08-06T19:58:53.041Z CRITICAL I'm dead!
 * ```
 */
export function critical(...args: unknown[]): never {
  const prefix = getLogPrefix();
  console.error(prefix, ...args);
  process.exit(1);
}
