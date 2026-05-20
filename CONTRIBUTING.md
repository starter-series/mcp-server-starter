# Contributing

Thanks for looking at the repo. This is a **template** — most "contributions" should be:

1. **Forks/templates** — click "Use this template" on GitHub and modify your copy. You don't need to send anything back here.
2. **Issues** — bug reports, security advisories, or template-improvement ideas that would benefit *every* downstream copy.

If you want to send a PR against the template itself, the rest of this file applies.

## Scope of accepted changes

Accepted:

- Security fixes (CVE patches, transitive `overrides`, hardening of CI workflows).
- Bumping to newer Node LTS / TypeScript / MCP SDK majors.
- Adoption of new MCP spec features (`outputSchema`, `structuredContent`, elicitation, sampling) as standardised.
- Documentation fixes that close README ↔ code drift.

Out of scope (declared **non-goals** in `README.md`):

- Bundling auth primitives, HMAC signing, rate-limiting, or HITL infra. Those belong in a host, not a starter template.
- Bundling Express / HTTP transport into the default scaffold. HTTP is documented as inline code; that's deliberate.
- Opinionated logging, tracing, or observability stacks.

Send these as separate downstream projects, not as PRs here.

## Local development

```bash
nvm use            # Node 22 (matches .nvmrc and CI)
npm ci
npm test           # builds + Jest with coverage gate
npm run lint
```

The `pretest` hook runs `npm run build`, so `npm test` always tests freshly compiled JS in `dist/`. Coverage thresholds are in `jest.config.js`.

## Branch + PR conventions

- Branch from `main`. Use `chore/`, `feat/`, `fix/`, `docs/`, `deps/` prefixes.
- Keep PRs focused — one concern per PR makes the squash-merge history readable.
- CI must be green before merge (`ci` is a required check on `main`).
- Squash merges only; `delete_branch_on_merge` is enabled on the repo.

## Security reports

Do **not** file security issues as public GitHub issues. Use GitHub's
[Private Vulnerability Reporting](https://github.com/starter-series/mcp-server-starter/security/advisories/new) instead. See `SECURITY.md` for the details.
