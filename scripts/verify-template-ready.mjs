import { readFileSync } from "node:fs";

const root = new URL("..", import.meta.url);
const pkg = JSON.parse(readFileSync(new URL("package.json", root), "utf8"));

const placeholderNames = new Set(["my-mcp-server"]);
const placeholderDescriptions = new Set(["An MCP server"]);
const problems = [];

if (placeholderNames.has(pkg.name)) {
  problems.push("package.json name must be changed before publishing");
}

if (placeholderDescriptions.has(pkg.description)) {
  problems.push("package.json description must be changed before publishing");
}

if (pkg.bin && typeof pkg.bin === "object" && !Array.isArray(pkg.bin)) {
  for (const name of Object.keys(pkg.bin)) {
    if (placeholderNames.has(name)) {
      problems.push(`bin name must be changed before publishing: ${name}`);
    }
  }
}

if (problems.length > 0) {
  console.error("Template placeholders are still present:");
  for (const problem of problems) {
    console.error(`- ${problem}`);
  }
  process.exit(1);
}

console.log("template placeholders are publish-ready.");
