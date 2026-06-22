import { describe, test, expect } from '@jest/globals';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createServer } from '../../dist/server.js';

async function buildLinkedPair() {
  const server = createServer();
  const client = new Client(
    { name: 'starter-factory-test', version: '0.0.0' },
    { capabilities: {} },
  );

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

  return { server, client };
}

describe('server factory export', () => {
  test('package root imports a side-effect-free createServer factory', async () => {
    const root = await import('my-mcp-server');
    expect(typeof root.createServer).toBe('function');
  });

  test('createServer registers tools, resources, and prompts', async () => {
    const { server, client } = await buildLinkedPair();
    try {
      const [{ tools }, { resources }, { prompts }] = await Promise.all([
        client.listTools(),
        client.listResources(),
        client.listPrompts(),
      ]);

      expect(tools.map((tool) => tool.name)).toContain('greet');
      expect(resources.map((resource) => resource.uri)).toContain('info://server/status');
      expect(prompts.map((prompt) => prompt.name)).toEqual(
        expect.arrayContaining(['hello', 'code-review']),
      );
    } finally {
      await client.close();
      await server.close();
    }
  });

  test('hello prompt is registered through SDK prompt validation', async () => {
    const { server, client } = await buildLinkedPair();
    try {
      const result = await client.getPrompt({
        name: 'hello',
        arguments: { language: 'ko' },
      });

      expect(result.messages?.[0]?.content).toEqual({
        type: 'text',
        text: '친근한 인사말을 작성해주세요.',
      });
    } finally {
      await client.close();
      await server.close();
    }
  });
});
