/**
 * Example MCP Resource — exposes server metadata (name, version, runtime) at a
 * fixed URI. Resources are how you expose data to the client (in contrast to
 * Tools which perform actions). Replace with your own resource.
 */
// JSON modules — stable in Node 22; replaces `createRequire(import.meta.url)`.
import packageJson from "../../package.json" with { type: "json" };

const pkg = packageJson as { name: string; version: string };

export const name = "server-info";
export const uri = "info://server/status";

export const metadata = {
  title: "Server Info",
  description: "Server metadata: name, version, and runtime info.",
  mimeType: "application/json",
};

export const description = metadata.description;

export async function handler(resourceUri: URL) {
  const payload = {
    name: pkg.name,
    version: pkg.version,
    runtime: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
    },
  };
  return {
    contents: [
      {
        uri: resourceUri.href,
        mimeType: metadata.mimeType,
        text: JSON.stringify(payload, null, 2),
      },
    ],
  };
}
