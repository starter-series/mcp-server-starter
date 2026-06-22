import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const root = new URL("..", import.meta.url);
const transport = new StdioClientTransport({
  command: process.execPath,
  args: ["dist/index.js"],
  cwd: root,
  env: {
    MCP_DEBUG: "false",
  },
  stderr: "pipe",
});

const client = new Client(
  { name: "mcp-server-starter-smoke", version: "0.0.0" },
  { capabilities: {} },
);

try {
  await client.connect(transport);

  const { tools } = await client.listTools();
  assert.ok(tools.some((tool) => tool.name === "greet"), "greet tool must be registered");

  const result = await client.callTool({
    name: "greet",
    arguments: { name: "Smoke" },
  });
  assert.equal(result.content?.[0]?.text, "Hello, Smoke!");
  assert.deepEqual(result.structuredContent, {
    greeting: "Hello, Smoke!",
    language: "en",
  });

  const { resources } = await client.listResources();
  assert.ok(resources.some((resource) => resource.uri === "info://server/status"), "server-info resource must be registered");

  const { prompts } = await client.listPrompts();
  assert.ok(prompts.some((prompt) => prompt.name === "hello"), "hello prompt must be registered");
} finally {
  await transport.close();
}
