#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { parseConfig } from './config.js';
import { name, version } from './pkg.js';
import * as greet from './tools/greet.js';
import * as serverInfo from './resources/server-info.js';
import * as hello from './prompts/hello.js';
import * as codeReview from './prompts/code-review.js';

const config = parseConfig();

const server = new McpServer({
  name,
  version,
});

const fatal = (label: string, value: unknown): never => {
  // stderr so the parent MCP client sees the crash; stdout is the transport.
  console.error(label, value);
  process.exit(1);
};

// Tools — use registerTool for full control (annotations, title)
server.registerTool(greet.name, greet.config, greet.handler);
// To pass config to tool handlers in multi-module setups:
// import { registerNoteTools } from './notes/tools.js';
// registerNoteTools(server, config);

// Resources — expose data to the client. Use registerResource for full control.
server.registerResource(serverInfo.name, serverInfo.uri, serverInfo.metadata, serverInfo.handler);

// Prompts — guided workflows for common tasks. Use registerPrompt for full control
// (title + description + argsSchema config object).
server.prompt(hello.name, hello.description, hello.schema, hello.handler);
server.registerPrompt(
  codeReview.name,
  {
    title: codeReview.title,
    description: codeReview.description,
    argsSchema: codeReview.argsSchema,
  },
  codeReview.handler,
);

const transport = new StdioServerTransport();

try {
  await server.connect(transport);
} catch (error) {
  fatal('Failed to connect MCP server:', error);
}

if (config.debug) {
  console.error('MCP server running on stdio');
}

const shutdown = async () => {
  await transport.close();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('unhandledRejection', (reason) => fatal('Unhandled promise rejection:', reason));
process.on('uncaughtException', (error) => fatal('Uncaught exception:', error));
