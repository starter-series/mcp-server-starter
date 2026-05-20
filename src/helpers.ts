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
