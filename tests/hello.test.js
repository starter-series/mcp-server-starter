import { describe, test, expect } from '@jest/globals';
import { z } from 'zod';
import { handler, schema, argsSchema, name, title, description } from '../dist/prompts/hello.js';

describe('hello prompt', () => {
  test('has registerPrompt-ready metadata', () => {
    expect(name).toBe('hello');
    expect(title).toBe('Hello');
    expect(argsSchema).toBe(schema);
  });

  test('returns English greeting by default', () => {
    const result = handler({});
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].role).toBe('user');
    expect(result.messages[0].content.type).toBe('text');
    expect(result.messages[0].content.text).toBe('Write a friendly greeting.');
  });

  test('returns Korean greeting branch', () => {
    const result = handler({ language: 'ko' });
    expect(result.messages[0].content.text).toBe('친근한 인사말을 작성해주세요.');
  });

  test('returns Japanese greeting branch', () => {
    const result = handler({ language: 'ja' });
    expect(result.messages[0].content.text).toBe('フレンドリーな挨拶を書いてください。');
  });

  test('includes description on result', () => {
    const result = handler({});
    expect(result.description).toBe(description);
  });

  test('schema accepts supported languages and rejects unknown ones (Zod)', () => {
    const shape = z.object(argsSchema);
    expect(shape.safeParse({}).success).toBe(true);
    expect(shape.safeParse({ language: 'en' }).success).toBe(true);
    expect(shape.safeParse({ language: 'ko' }).success).toBe(true);
    expect(shape.safeParse({ language: 'ja' }).success).toBe(true);
    expect(shape.safeParse({ language: 'fr' }).success).toBe(false);
  });
});
