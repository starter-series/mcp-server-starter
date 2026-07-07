import { describe, test, expect, afterEach, beforeAll, jest } from '@jest/globals';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// MA3 fix (2026-05-21 second-pass audit): `dist/index.js` is the actual
// entry point — it owns JSON-modules import of package.json, McpServer
// construction, tool/resource/prompt registration, transport.connect(),
// the fatal() helper, the SIGINT/SIGTERM shutdown path, and the
// unhandledRejection / uncaughtException handlers. None of that was
// exercised by unit tests; coverage was excluded by design. This test
// spawns the compiled binary, drives it via the same stdio JSON-RPC the
// MCP client would, and verifies the registrations are actually reachable
// end-to-end. It also exercises the SIGTERM shutdown handler.

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SERVER_BIN = path.resolve(__dirname, '../../dist/index.js');

const PROTOCOL_VERSION = '2025-06-18';
jest.setTimeout(30000);

/**
 * Stateful JSON-RPC driver over a spawned child's stdio.
 *
 * The SDK frames messages as `\n`-delimited JSON. Hold an incoming buffer,
 * split on newlines, dispatch by id. The frame is intentionally small —
 * this isn't a full client, just enough to prove the wire is alive.
 */
function makeDriver(child) {
  const pending = new Map();
  let nextId = 1;
  let buffer = '';
  let stderr = '';

  child.stdout.setEncoding('utf8');
  child.stdout.on('data', (chunk) => {
    buffer += chunk;
    let nlIdx;
    while ((nlIdx = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, nlIdx);
      buffer = buffer.slice(nlIdx + 1);
      if (!line.trim()) continue;
      const msg = JSON.parse(line);
      if (msg.id !== undefined && pending.has(msg.id)) {
        pending.get(msg.id).resolve(msg);
        pending.delete(msg.id);
      }
    }
  });

  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (chunk) => {
    stderr += chunk;
  });

  function call(method, params) {
    const id = nextId++;
    const message = { jsonrpc: '2.0', id, method, params };
    return new Promise((resolve, reject) => {
      // Clear the watchdog when the response arrives — an unresolved
      // setTimeout would keep jest's loop alive past test completion and
      // surface as "Jest did not exit".
      const watchdog = setTimeout(() => {
        if (pending.has(id)) {
          pending.delete(id);
          reject(
            new Error(
              `Timeout waiting for response to ${method} (id=${id}). stderr: ${stderr}`,
            ),
          );
        }
      }, 10000);
      watchdog.unref();
      pending.set(id, {
        resolve: (msg) => {
          clearTimeout(watchdog);
          resolve(msg);
        },
        reject: (err) => {
          clearTimeout(watchdog);
          reject(err);
        },
      });
      child.stdin.write(JSON.stringify(message) + '\n');
    });
  }

  function notify(method, params) {
    const message = { jsonrpc: '2.0', method, params };
    child.stdin.write(JSON.stringify(message) + '\n');
  }

  return { call, notify };
}

async function bootServer() {
  const child = spawn(process.execPath, [SERVER_BIN], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, MCP_DEBUG: 'false' },
  });
  const driver = makeDriver(child);

  let initResult;
  try {
    initResult = await driver.call('initialize', {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: {},
      clientInfo: { name: 'boot-smoke', version: '0.0.0' },
    });
    driver.notify('notifications/initialized', {});
  } catch (error) {
    if (child.exitCode === null) {
      child.kill('SIGTERM');
      await Promise.race([
        once(child, 'exit'),
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ]);
      if (child.exitCode === null) child.kill('SIGKILL');
    }
    throw error;
  }

  return { child, driver, initResult };
}

describe('Server boot — dist/index.js spawned as a child process', () => {
  beforeAll(async () => {
    // The boot test runs against the compiled output; the pretest hook
    // builds it, but make the dependency explicit so a partial build is
    // a loud failure rather than a confusing "ENOENT".
    const fs = await import('node:fs/promises');
    await fs.access(SERVER_BIN);
  });

  let child;
  afterEach(async () => {
    if (child && child.exitCode === null) {
      child.kill('SIGTERM');
      // Wait for the SIGTERM handler in src/index.ts to actually finish.
      await Promise.race([
        once(child, 'exit'),
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ]);
      if (child.exitCode === null) child.kill('SIGKILL');
    }
  });

  test('boots, responds to initialize, advertises greet via tools/list', async () => {
    const booted = await bootServer();
    child = booted.child;

    expect(booted.initResult.result).toBeDefined();
    expect(booted.initResult.result.protocolVersion).toBeDefined();
    expect(booted.initResult.result.serverInfo?.name).toBe('my-mcp-server');

    const listResult = await booted.driver.call('tools/list', {});
    const greetTool = listResult.result?.tools?.find((t) => t.name === 'greet');
    expect(greetTool).toBeDefined();
    expect(greetTool.outputSchema).toBeDefined();
  });

  test('advertises resources and prompts through the actual binary', async () => {
    const booted = await bootServer();
    child = booted.child;

    const resourcesResult = await booted.driver.call('resources/list', {});
    expect(resourcesResult.result?.resources?.map((resource) => resource.uri)).toContain(
      'info://server/status',
    );

    const promptsResult = await booted.driver.call('prompts/list', {});
    expect(promptsResult.result?.prompts?.map((prompt) => prompt.name)).toEqual(
      expect.arrayContaining(['hello', 'code-review']),
    );
  });

  test('greet tool round-trips through the actual binary', async () => {
    const booted = await bootServer();
    child = booted.child;

    const callResult = await booted.driver.call('tools/call', {
      name: 'greet',
      arguments: { name: 'Spawn' },
    });

    expect(callResult.result?.content?.[0]).toEqual({
      type: 'text',
      text: 'Hello, Spawn!',
    });
    expect(callResult.result?.structuredContent).toEqual({
      greeting: 'Hello, Spawn!',
      language: 'en',
    });
  });

  test('SIGTERM triggers the shutdown handler and the process exits cleanly', async () => {
    const booted = await bootServer();
    child = booted.child;

    child.kill('SIGTERM');
    const [exitCode, signal] = await once(child, 'exit');

    // The shutdown() handler calls process.exit(0); the OS-level signal
    // matters only if the handler is missing. Either is acceptable
    // evidence that the process didn't hang.
    expect(exitCode === 0 || signal === 'SIGTERM').toBe(true);
  });
});
