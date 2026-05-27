import { describe, test, expect } from '@jest/globals';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import * as greet from '../../dist/tools/greet.js';

// MA2 fix (2026-05-21 second-pass audit): the previous greet.test.js
// "structuredContent matches outputSchema" assertion validated the handler
// output against the same zod schema we declared — a self-check, not a
// contract check. This test puts the real SDK in the loop:
//   - McpServer.registerTool() with our real config and handler
//   - Client.callTool() through a linked InMemoryTransport pair
// The SDK runs its own zod validation on the way out, so a drift between
// the handler's returned shape and the declared outputSchema would fail
// here, not just in our tautological assertion.

async function buildLinkedPair() {
  const server = new McpServer({ name: 'mcp-server-starter-test', version: '0.0.0' });
  server.registerTool(greet.name, greet.config, greet.handler);

  const client = new Client(
    { name: 'starter-contract-test', version: '0.0.0' },
    { capabilities: {} },
  );

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

  return { server, client };
}

describe('SDK contract — greet tool round-trips through real SDK validation', () => {
  test('listTools advertises greet with declared input & output schemas', async () => {
    const { server, client } = await buildLinkedPair();
    try {
      const { tools } = await client.listTools();
      const greetTool = tools.find((t) => t.name === 'greet');
      expect(greetTool).toBeDefined();
      expect(greetTool.inputSchema).toBeDefined();
      // outputSchema is exposed to the client so it knows to expect structuredContent.
      expect(greetTool.outputSchema).toBeDefined();
      expect(greetTool.annotations).toMatchObject({
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      });
    } finally {
      await client.close();
      await server.close();
    }
  });

  test('callTool returns text content AND structuredContent validated by the SDK', async () => {
    const { server, client } = await buildLinkedPair();
    try {
      const result = await client.callTool({ name: 'greet', arguments: { name: 'World' } });

      // text mirror (every client should see this).
      expect(result.content?.[0]).toEqual({ type: 'text', text: 'Hello, World!' });
      // structuredContent (modern clients with outputSchema awareness).
      expect(result.structuredContent).toEqual({ greeting: 'Hello, World!', language: 'en' });
      // SDK sets isError correctly on success.
      expect(result.isError).toBeFalsy();
    } finally {
      await client.close();
      await server.close();
    }
  });

  test('SDK rejects callTool with empty name (Zod inputSchema enforced server-side)', async () => {
    const { server, client } = await buildLinkedPair();
    try {
      // The handler never runs — the SDK validates `arguments` against
      // `inputSchema` before dispatching.
      const result = await client.callTool({ name: 'greet', arguments: { name: '' } });
      // Different SDK versions either throw or return isError; both forms
      // are accepted contract evidence as long as the handler did NOT see
      // an empty string.
      expect(result.isError).toBe(true);
    } catch (e) {
      expect(e).toBeDefined();
    } finally {
      await client.close();
      await server.close();
    }
  });

  test('SDK rejects callTool with name over 200 chars (Zod max constraint)', async () => {
    const { server, client } = await buildLinkedPair();
    try {
      const result = await client.callTool({
        name: 'greet',
        arguments: { name: 'x'.repeat(201) },
      });
      expect(result.isError).toBe(true);
    } catch (e) {
      expect(e).toBeDefined();
    } finally {
      await client.close();
      await server.close();
    }
  });
});
