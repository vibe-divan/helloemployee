// oxlint-disable no-console - valid use

import { createEnvSensitiveEntity } from "@/lib/utils";
import { colors } from "./colors.ts";
import { getTimestamp } from "./get-timestamp.ts";

/**
 * It is better to determine prefix on startup
 * than check NODE_ENV on each call.
 */
const getLogPrefix = createEnvSensitiveEntity({
  dev: () => `${colors.muted}${getTimestamp()} ${colors.info}INFO${colors.reset}`,
  prod: () => `${getTimestamp()} INFO`,
  test: () => `${getTimestamp()} INFO`, // Tests doesn't need colors
});

/**
 * Logs provided args as information message.
 * Automatically picks fitting color mode.
 *
 * @example
 * ```typescript
 * log.info("Hello!") // 2026-08-06T19:55:47.733Z INFO Hello!
 * ```
 */
export function info(...args: unknown[]): void {
  const prefix = getLogPrefix();
  console.log(prefix, ...args);
}
