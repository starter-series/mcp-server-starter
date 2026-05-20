/**
 * Standard MCP response helpers.
 * Use ok() for success, err() for errors — tools should never throw.
 *
 * The 2026 MCP spec REQUIRES `structuredContent` when a tool declares an
 * `outputSchema`. Pass a structured payload as the second argument and it
 * will be set alongside the text content (the text mirror is kept so
 * clients that ignore `structuredContent` still see a value).
 */

type TextContent = { type: 'text'; text: string };
type ToolResponse = {
  content: TextContent[];
  structuredContent?: Record<string, unknown>;
  isError?: true;
};

export function ok(
  data: unknown,
  structured?: Record<string, unknown>,
): ToolResponse {
  const text = typeof data === 'string' ? data : JSON.stringify(data);
  const response: ToolResponse = {
    content: [{ type: 'text', text }],
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
