#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { parseConfig } from "./config.js";
import { createServer } from "./server.js";

const config = parseConfig();

const fatal = (label: string, value: unknown): never => {
  // stderr so the parent MCP client sees the crash; stdout is the transport.
  console.error(label, value);
  process.exit(1);
};

const server = createServer();
const transport = new StdioServerTransport();

try {
  await server.connect(transport);
} catch (error) {
  fatal("Failed to connect MCP server:", error);
}

if (config.debug) {
  console.error("MCP server running on stdio");
}

const shutdown = async () => {
  try {
    await transport.close();
    process.exit(0);
  } catch (error) {
    fatal("Failed to close MCP server:", error);
  }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("unhandledRejection", (reason) => fatal("Unhandled promise rejection:", reason));
process.on("uncaughtException", (error) => fatal("Uncaught exception:", error));
