import { describe, test, expect } from '@jest/globals';
import { handler } from '../dist/tools/greet.js';

describe('greet tool', () => {
  test('returns greeting with name', async () => {
    const result = await handler({ name: 'World' });
    expect(result.content[0].text).toBe('Hello, World!');
  });

  test('handles different names', async () => {
    const result = await handler({ name: 'MCP' });
    expect(result.content[0].text).toBe('Hello, MCP!');
  });
});
