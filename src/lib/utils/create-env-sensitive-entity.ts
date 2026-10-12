interface CreateEnvSensitiveEntityParams<T> {
  dev: T;
  prod: T;
  test?: T;
}

/**
 * Chooses entity based on node env. Doesn't depends on `@app/shared/env`.
 * Useful for import side-effect objects and functions initialization.
 *
 * @example
 * ```typescript
 * const logInfo = createEnvSensitiveEntity({
 *   dev: (...args: unknown[]) => console.log(
 *     `${color.blue}INFO${color.reset}`,
 *     ...args,
 *   ),
 *   prod: (...args: unknown[]) => console.log("INFO", ...args)
 * })
 *
 * logInfo("Hello world!")
 * ```
 */
export function createEnvSensitiveEntity<T>(params: CreateEnvSensitiveEntityParams<T>): T {
  if (Bun.env.NODE_ENV === "production") {
    return params.prod;
  }

  if (Bun.env.NODE_ENV === "test") {
    return params.test ?? params.dev;
  }

  return params.dev;
}
