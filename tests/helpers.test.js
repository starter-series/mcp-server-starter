import { describe, test, expect } from '@jest/globals';
import { ok, err } from '../dist/helpers.js';

describe('response helpers', () => {
  test('ok() wraps text in content array', () => {
    const result = ok('success');
    expect(result.content).toEqual([{ type: 'text', text: 'success' }]);
    expect(result).not.toHaveProperty('isError');
    expect(result).not.toHaveProperty('structuredContent');
  });

  test('ok() with structured payload sets structuredContent', () => {
    const result = ok('hi', { greeting: 'hi', language: 'en' });
    expect(result.content).toEqual([{ type: 'text', text: 'hi' }]);
    expect(result.structuredContent).toEqual({ greeting: 'hi', language: 'en' });
  });

  test('ok() serializes non-string data to JSON in text mirror', () => {
    const result = ok({ ok: true, count: 3 });
    expect(result.content[0].text).toBe('{"ok":true,"count":3}');
  });

  test('err() wraps text with isError flag', () => {
    const result = err('something failed');
    expect(result.content).toEqual([{ type: 'text', text: 'something failed' }]);
    expect(result.isError).toBe(true);
  });
});
