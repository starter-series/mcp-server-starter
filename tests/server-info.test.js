import { describe, test, expect } from '@jest/globals';
import { handler, name, uri, metadata } from '../dist/resources/server-info.js';

describe('server-info resource', () => {
  test('has stable name and uri', () => {
    expect(name).toBe('server-info');
    expect(uri).toBe('info://server/status');
    expect(metadata.mimeType).toBe('application/json');
  });

  test('returns contents shaped per MCP spec with server metadata', async () => {
    const result = await handler(new URL(uri));
    expect(Array.isArray(result.contents)).toBe(true);
    expect(result.contents).toHaveLength(1);

    const [entry] = result.contents;
    expect(entry.uri).toBe(uri);
    expect(entry.mimeType).toBe('application/json');
    expect(typeof entry.text).toBe('string');

    const payload = JSON.parse(entry.text);
    expect(typeof payload.name).toBe('string');
    expect(typeof payload.version).toBe('string');
    expect(payload.runtime.node).toBe(process.version);
    expect(payload.runtime.platform).toBe(process.platform);
    expect(payload.runtime.arch).toBe(process.arch);
  });
});
