import { describe, test, expect } from '@jest/globals';
import { z } from 'zod';
import { handler, config } from '../dist/tools/greet.js';

describe('greet tool', () => {
  test('returns greeting with name', async () => {
    const result = await handler({ name: 'World' });
    expect(result.content[0].text).toBe('Hello, World!');
    expect(result).not.toHaveProperty('isError');
  });

  test('interpolates different names verbatim', async () => {
    const result = await handler({ name: 'MCP' });
    expect(result.content[0].text).toBe('Hello, MCP!');
  });

  test('has safety annotations', () => {
    expect(config.annotations.readOnlyHint).toBe(true);
    expect(config.annotations.destructiveHint).toBe(false);
    expect(config.annotations.idempotentHint).toBe(true);
    expect(config.annotations.openWorldHint).toBe(false);
  });

  test('input schema rejects empty name (Zod)', () => {
    const shape = z.object(config.inputSchema);
    expect(shape.safeParse({ name: '' }).success).toBe(false);
  });

  test('input schema rejects name longer than 200 chars (Zod)', () => {
    const shape = z.object(config.inputSchema);
    expect(shape.safeParse({ name: 'x'.repeat(201) }).success).toBe(false);
    expect(shape.safeParse({ name: 'x'.repeat(200) }).success).toBe(true);
  });
});
