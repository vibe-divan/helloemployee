// oxlint-disable no-console - valid use

import { createEnvSensitiveEntity } from "@/lib/utils";
import { colors } from "./colors.ts";
import { getTimestamp } from "./get-timestamp.ts";

/**
 * It is better to determine prefix on startup
 * than check NODE_ENV on each call.
 */
const getLogPrefix = createEnvSensitiveEntity({
  // Additional space bar made on purpose for logs align.
  dev: () => `${colors.muted}${getTimestamp()} ${colors.error}ERR${colors.reset} `,
  prod: () => `${getTimestamp()} ERR`,
  test: () => `${getTimestamp()} ERR`, // Tests doesn't need colors
});

/**
 * Logs provided args as error message.
 * Automatically picks fitting color mode.
 *
 * @example
 * ```typescript
 * log.error("App crashed!") // 2026-08-06T19:58:53.041Z ERR  App crashed!
 * ```
 */
export function error(...args: unknown[]): void {
  const prefix = getLogPrefix();
  console.error(prefix, ...args);
}
