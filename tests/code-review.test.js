import { describe, test, expect } from '@jest/globals';
import { z } from 'zod';
import {
  handler,
  argsSchema,
  name,
  title,
  description,
} from '../dist/prompts/code-review.js';

describe('code-review prompt', () => {
  test('has stable identity metadata', () => {
    expect(name).toBe('code-review');
    expect(title).toBe('Code Review');
    expect(typeof description).toBe('string');
    expect(description.length).toBeGreaterThan(0);
  });

  describe('argsSchema (Zod)', () => {
    const shape = z.object(argsSchema);

    test('accepts valid language + non-empty code', () => {
      expect(shape.safeParse({ language: 'ts', code: 'const x = 1;' }).success).toBe(true);
    });

    test('rejects empty code', () => {
      const result = shape.safeParse({ language: 'js', code: '' });
      expect(result.success).toBe(false);
    });

    test('rejects unsupported language', () => {
      const result = shape.safeParse({ language: 'ruby', code: 'puts 1' });
      expect(result.success).toBe(false);
    });

    test('rejects missing fields', () => {
      expect(shape.safeParse({ language: 'ts' }).success).toBe(false);
      expect(shape.safeParse({ code: 'x' }).success).toBe(false);
    });
  });

  describe('handler', () => {
    test('returns a single user text message with interpolated language label and code', () => {
      const code = 'function add(a, b) { return a + b }';
      const result = handler({ language: 'js', code });

      expect(result.description).toBe(description);
      expect(result.messages).toHaveLength(1);

      const [msg] = result.messages;
      expect(msg.role).toBe('user');
      expect(msg.content.type).toBe('text');
      expect(msg.content.text).toContain('JavaScript');
      expect(msg.content.text).toContain(code);
      expect(msg.content.text).toContain('```js');
    });

    test('uses correct language label per enum value', () => {
      const code = 'x = 1';
      expect(handler({ language: 'ts', code }).messages[0].content.text).toContain('TypeScript');
      expect(handler({ language: 'python', code }).messages[0].content.text).toContain('Python');
      expect(handler({ language: 'go', code }).messages[0].content.text).toContain('Go');
    });
  });
});
