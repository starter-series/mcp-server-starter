# AGENTS.md

> This file provides context for AI coding assistants (Claude Code, Cursor, Copilot, Cline, etc.)

## Project Structure

```
src/
├── index.ts          # Server entry point — registers tools and starts transport
└── tools/
    └── greet.ts      # Example tool — copy this pattern for new tools
tests/
└── greet.test.js     # Tests run against built output in dist/
```

## Adding a New Tool

1. Create `src/tools/your-tool.ts`:
   ```ts
   import { z } from 'zod';

   export const name = 'your_tool';
   export const description = 'What your tool does';
   export const schema = {
     param: z.string().describe('Parameter description'),
   };

   export async function handler({ param }: { param: string }) {
     return {
       content: [{ type: 'text' as const, text: `Result: ${param}` }],
     };
   }
   ```
2. Register it in `src/index.ts`:
   ```ts
   import * as yourTool from './tools/your-tool.js';
   server.tool(yourTool.name, yourTool.description, yourTool.schema, yourTool.handler);
   ```
3. Add tests in `tests/your-tool.test.js`

## CI/CD Pipeline

- **CI** (`ci.yml`): gitleaks → large file check → npm ci → license check → audit → lint → build → test
- **CD** (`cd.yml`): CI gate → version guard → npm publish (OIDC) → GitHub Release

## Secrets

- **npm publishing**: Zero secrets needed (OIDC trusted publishing)
- **Environment variables**: Add to `.env` locally, configure in hosting platform for production

## Key Patterns

- Tools export `name`, `description`, `schema`, `handler` — registered in `index.ts`
- Zod schemas validate tool inputs at runtime
- `StdioServerTransport` for CLI/desktop usage (npx)
- Tests import from `dist/` (built output) — run `npm run build` before testing
- Use `.js` extensions in TypeScript imports (required for Node16 module resolution)

## Do NOT Modify

- `.github/workflows/` CI/CD pipeline structure
  - **Why**: Version guard, OIDC publishing, and CI gate protect against duplicate releases and untested deploys
- `tsconfig.json` module settings (`Node16`)
  - **Why**: Required for ESM + Node.js interop. Changing breaks `.js` extension imports
