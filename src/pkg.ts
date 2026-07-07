import packageJson from "../package.json" with { type: "json" };

/**
 * Validate the fields we read out of package.json at load time.
 *
 * The previous `as { name: string; version: string }` cast was a
 * compile-time no-op: if package.json ever lost `name`/`version` (or made
 * them non-strings), they would silently surface as `undefined` and get
 * handed to `new McpServer({ name, version })`, producing an invalid server
 * identity that only fails far downstream. Validate eagerly with a clear,
 * actionable error instead.
 */
export function assertPackageMeta(pkg: unknown): {
  name: string;
  version: string;
} {
  if (typeof pkg !== "object" || pkg === null) {
    throw new TypeError("package.json did not parse to an object");
  }
  const { name, version } = pkg as Record<string, unknown>;
  if (typeof name !== "string" || name.length === 0) {
    throw new TypeError(`package.json "name" must be a non-empty string (got ${typeof name})`);
  }
  if (typeof version !== "string" || version.length === 0) {
    throw new TypeError(
      `package.json "version" must be a non-empty string (got ${typeof version})`,
    );
  }
  return { name, version };
}

export const { name, version } = assertPackageMeta(packageJson);
