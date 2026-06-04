/**
 * Standard MCP response helpers.
 * Use ok() for success, err() for errors — tools should never throw.
 *
 * `structured` mirrors the text payload for clients that read
 * `structuredContent` (required when a tool declares `outputSchema`).
 */

type TextContent = { type: 'text'; text: string };
type ToolResponse = {
  content: TextContent[];
  structuredContent?: Record<string, unknown>;
  isError?: true;
};

/**
 * Coerce arbitrary tool data into a guaranteed `string` for the text block.
 *
 * `JSON.stringify` has two failure modes that both violate the
 * `TextContent { text: string }` / "tools never throw" contract:
 *   1. It returns `undefined` (not a string) for `undefined`, functions, and
 *      symbols — yielding `text: undefined`.
 *   2. It throws a `TypeError` for BigInt and circular structures.
 * This helper absorbs both: it always returns a string and never throws.
 */
function toText(data: unknown): string {
  if (typeof data === 'string') {
    return data;
  }
  try {
    const json = JSON.stringify(data);
    // JSON.stringify(undefined | function | symbol) === undefined.
    return json === undefined ? String(data) : json;
  } catch {
    // BigInt, circular references, or a throwing toJSON(). Fall back to a
    // best-effort string so the response stays a valid TextContent block.
    try {
      return String(data);
    } catch {
      // Even String() can throw (e.g. a hostile Symbol.toPrimitive). Last
      // resort: an explicit marker. The contract is "always a string, never
      // throw" — never "round-trippable".
      return '[unserializable]';
    }
  }
}

export function ok(
  data: unknown,
  structured?: Record<string, unknown>,
): ToolResponse {
  const response: ToolResponse = {
    content: [{ type: 'text', text: toText(data) }],
  };
  if (structured !== undefined) {
    response.structuredContent = structured;
  }
  return response;
}

export function err(message: string): ToolResponse {
  return {
    content: [{ type: 'text', text: message }],
    isError: true,
  };
}
