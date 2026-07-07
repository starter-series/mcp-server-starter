# Security Policy

## Reporting a Vulnerability

Please use GitHub's **[Private Vulnerability Reporting](https://github.com/starter-series/mcp-server-starter/security/advisories/new)** for this repository:

1. Go to the **Security** tab → **Report a vulnerability**.
2. Fill in the form with reproduction steps, affected version (commit SHA), and impact.
3. The maintainer will acknowledge within **5 business days** and provide a patch ETA after triage.

**Do not** open a public issue, pull request, or discussion describing the vulnerability before a fix is published — the GHPVR channel keeps the report private until disclosure.

If GHPVR is unavailable, contact the maintainer through the email on their GitHub profile.

## Security Features (template-level)

- **gitleaks** — scans for committed secrets on every push (pinned by version + tarball SHA-256 in `ci.yml`).
- **npm audit** — fails CI on `--audit-level=high`. Transitive vulnerabilities can be pinned via `overrides` in `package.json` when upstream hasn't patched yet.
- **License compliance** — blocks GPL-2.0 / GPL-3.0 / AGPL-3.0 in CI.
- **Dependabot** — weekly version updates via the committed config; enable Dependabot security updates in repository settings.
- **Secret scanning + push protection** — enable these repository or organization settings when they are available for your GitHub plan.
- **CodeQL** — static analysis on push, PR, and weekly schedule.
- **OIDC trusted publishing** — supported after npm trusted publisher setup; no `NPM_TOKEN` is needed for that path.
- **`npm ci --ignore-scripts`** — postinstall scripts are blocked in CI to defend against compromised packages.
- **`permissions:` job-level least privilege** — `contents: read` on CI, `id-token: write` only where OIDC publishes.
- **Zod validation** — runtime schema validation on every tool input (`inputSchema`) and structured output (`outputSchema`).

## Best Practices for Downstream Servers

- Never commit `.env` files or API keys; use environment variables via `src/config.ts`.
- Keep dependencies up to date via Dependabot PRs.
- Validate every tool input with a Zod schema; validate every tool output (`structuredContent`) too when you declare `outputSchema`.
- **Shell command injection** — If your MCP tools execute shell commands, always escape or sanitize user input. Never pass raw tool arguments to `child_process.exec()` or template strings in shell commands. Use `execFile()` with explicit argument arrays instead.
- **Path traversal** — When tools accept filesystem paths, resolve them against an explicit allowed base directory (`path.resolve(base, input)` + verify `result.startsWith(base)`). Reject `..` segments rather than passing them through.
- **Prompt injection** — Tools and prompts that embed user-controlled strings into messages sent to the model (see `src/prompts/code-review.ts` for the pattern) are an injection surface:
  - Never concatenate untrusted text into a system-role message.
  - Treat tool-provided text as data, not as instructions to the model. Where possible, structure prompts so the model is instructed to summarise/analyse the user content rather than follow it.
  - For high-trust actions, require an out-of-band confirmation (an `elicitation/create` round-trip, or a separate tool call) instead of acting on the model's interpretation.
- **Resource URI scoping** — When implementing resource handlers, enforce that the URI requested matches the URI you registered. Don't let the client direct your server to read arbitrary paths.
- **Secret exposure in logs** — `console.error` on stdio goes to the client's stderr stream. Never log full API keys, OAuth tokens, or full user content; log fingerprints (first 4 + last 4 chars) at most.
