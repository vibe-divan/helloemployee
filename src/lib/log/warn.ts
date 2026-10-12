// oxlint-disable no-console - valid use

import { createEnvSensitiveEntity } from "@/lib/utils";
import { colors } from "./colors.ts";
import { getTimestamp } from "./get-timestamp.ts";

/**
 * It is better to determine prefix on startup
 * than check NODE_ENV on each call.
 */
const getLogPrefix = createEnvSensitiveEntity({
  dev: () => `${colors.muted}${getTimestamp()} ${colors.warn}WARN${colors.reset}`,
  prod: () => `${getTimestamp()} WARN`,
  test: () => `${getTimestamp()} WARN`, // Tests doesn't need colors
});

/**
 * Logs provided args as warning message.
 * Automatically picks fitting color mode.
 *
 * @example
 * ```typescript
 * log.warn("Fix that!") // 2026-08-06T19:58:53.041Z WARN Fix that!
 * ```
 */
export function warn(...args: unknown[]): void {
  const prefix = getLogPrefix();
  console.warn(prefix, ...args);
}
