import { describe, test, expect, afterEach } from '@jest/globals';
import { parseConfig } from '../dist/config.js';

const ORIGINAL_DEBUG = process.env.MCP_DEBUG;

afterEach(() => {
  if (ORIGINAL_DEBUG === undefined) {
    delete process.env.MCP_DEBUG;
  } else {
    process.env.MCP_DEBUG = ORIGINAL_DEBUG;
  }
});

describe('parseConfig', () => {
  test('debug defaults to false when MCP_DEBUG is unset', () => {
    delete process.env.MCP_DEBUG;
    expect(parseConfig()).toEqual({ debug: false });
  });

  test('debug is true only when MCP_DEBUG === "true"', () => {
    process.env.MCP_DEBUG = 'true';
    expect(parseConfig().debug).toBe(true);
  });

  test('debug is false for any other MCP_DEBUG value', () => {
    for (const value of ['1', 'TRUE', 'yes', 'false', '', 'True']) {
      process.env.MCP_DEBUG = value;
      expect(parseConfig().debug).toBe(false);
    }
  });
});
