/**
 * Standard MCP response helpers.
 * Use ok() for success, err() for errors — tools should never throw.
 */

export function ok(data: unknown) {
  const text = typeof data === 'string' ? data : JSON.stringify(data);
  return {
    content: [{ type: 'text' as const, text }],
  };
}

export function err(message: string) {
  return {
    content: [{ type: 'text' as const, text: message }],
    isError: true,
  };
}
