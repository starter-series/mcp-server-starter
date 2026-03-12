import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { name, description, schema, handler } from './tools/greet.js';

const server = new McpServer({
  name: 'my-mcp-server',
  version: '1.0.0',
});

server.tool(name, description, schema, handler);

const transport = new StdioServerTransport();
await server.connect(transport);
