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

  // --- Contract guards: ok() must ALWAYS produce a string `text` and must
  // NEVER throw, regardless of `data`. These fail if ok() reverts to a bare
  // `JSON.stringify(data)`:
  //   - undefined / function / symbol -> JSON.stringify returns undefined
  //     (text would be the value `undefined`, violating text: string)
  //   - BigInt / circular -> JSON.stringify throws (violates "never throw")
  // Each test asserts behavior (no throw + typeof string), not a literal,
  // so a correct-but-different fallback string still passes while the bug
  // reintroduction fails.

  test('ok(undefined) yields a string text block and does not throw', () => {
    let result;
    expect(() => {
      result = ok(undefined);
    }).not.toThrow();
    expect(typeof result.content[0].text).toBe('string');
    // The text block is a valid TextContent regardless of fallback wording.
    expect(result.content[0]).toMatchObject({ type: 'text' });
    expect(result).not.toHaveProperty('isError');
  });

  test('ok() of a non-serializable function yields a string text block', () => {
    let result;
    expect(() => {
      result = ok(() => 42);
    }).not.toThrow();
    expect(typeof result.content[0].text).toBe('string');
    expect(result.content[0].text.length).toBeGreaterThan(0);
  });

  test('ok(BigInt) does not throw and yields a string text block', () => {
    let result;
    expect(() => {
      result = ok(10n);
    }).not.toThrow();
    expect(typeof result.content[0].text).toBe('string');
    // Best-effort representation should carry the value, not be empty.
    expect(result.content[0].text).toBe('10');
  });

  test('ok(circular object) does not throw and yields a string text block', () => {
    const circular = { name: 'node' };
    circular.self = circular;
    let result;
    expect(() => {
      result = ok(circular);
    }).not.toThrow();
    expect(typeof result.content[0].text).toBe('string');
    expect(result.content[0].text.length).toBeGreaterThan(0);
  });

  test('ok(symbol) does not throw and yields a string text block', () => {
    let result;
    expect(() => {
      result = ok(Symbol('tag'));
    }).not.toThrow();
    expect(typeof result.content[0].text).toBe('string');
  });

  test('ok() still serializes ordinary objects to JSON (no regression)', () => {
    const result = ok({ ok: true, count: 3 });
    expect(result.content[0].text).toBe('{"ok":true,"count":3}');
  });
});
