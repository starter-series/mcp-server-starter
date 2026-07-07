import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as codeReview from "./prompts/code-review.js";
import * as hello from "./prompts/hello.js";
import { name, version } from "./pkg.js";
import * as serverInfo from "./resources/server-info.js";
import * as greet from "./tools/greet.js";

export function createServer() {
  const server = new McpServer({
    name,
    version,
  });

  // Tools — use registerTool for full control (annotations, title).
  server.registerTool(greet.name, greet.config, greet.handler);

  // Resources — expose data to the client. Use registerResource for full control.
  server.registerResource(serverInfo.name, serverInfo.uri, serverInfo.metadata, serverInfo.handler);

  // Prompts — guided workflows for common tasks. Use registerPrompt for full control
  // (title + description + argsSchema config object).
  server.registerPrompt(
    hello.name,
    {
      title: hello.title,
      description: hello.description,
      argsSchema: hello.argsSchema,
    },
    hello.handler,
  );
  server.registerPrompt(
    codeReview.name,
    {
      title: codeReview.title,
      description: codeReview.description,
      argsSchema: codeReview.argsSchema,
    },
    codeReview.handler,
  );

  return server;
}
