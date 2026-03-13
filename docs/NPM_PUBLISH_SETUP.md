# npm Publish Setup

## Option 1: OIDC Trusted Publishing (Recommended)

No secrets needed. The CD workflow uses GitHub's OIDC token to authenticate with npm.

### Steps

1. Go to [npmjs.com](https://www.npmjs.com) → your package → **Settings** → **Publishing access**
2. Under **Require two-factor authentication or an automation token**, select **Require two-factor authentication**
3. For OIDC you don't create a token. Instead:
   - Go to your package page → **Settings** → **Provenance** → Enable
   - Under **Trusted Publishing**, add your repository:
     - Owner: `your-org`
     - Repository: `your-repo`
     - Environment: `npm`
     - Workflow: `cd.yml`

4. Create a GitHub Environment:
   - Go to your GitHub repo → **Settings** → **Environments** → **New environment**
   - Name it `npm` (must match the `environment:` in cd.yml)
   - Optionally add required reviewers for extra safety

5. Update `package.json`:

   ```json
   {
     "name": "your-mcp-server",
     "bin": {
       "your-mcp-server": "dist/index.js"
     }
   }
   ```

6. That's it! Trigger the CD workflow:
   - Bump version: `npm run version:patch`
   - Commit and push
   - Go to **Actions** → **Publish to npm** → **Run workflow**

### After Publishing

Users can run your MCP server with:

```bash
npx your-mcp-server
```

Or add to Claude Desktop config:

```json
{
  "mcpServers": {
    "your-mcp-server": {
      "command": "npx",
      "args": ["-y", "your-mcp-server"]
    }
  }
}
```

## Option 2: Classic npm Token

If you can't use OIDC (e.g., private npm registry), use a classic automation token.

### Steps

1. Go to [npmjs.com](https://www.npmjs.com) → **Access Tokens** → **Generate New Token** → **Granular Access Token**
2. Set permissions: **Read and write** for the specific package
3. Add the token to GitHub:

   **Important: `environment: npm` in the workflow means you must use an _environment_ secret, not a repo secret.**

   - Go to your GitHub repo → **Settings** → **Environments** → **npm**
   - Add secret: `NPM_TOKEN` = your token

   > **Common mistake:** Adding `NPM_TOKEN` as a _repository_ secret instead of an _environment_ secret. When the workflow has `environment: npm`, it only sees secrets from that environment. Repository secrets are NOT available to environment-scoped jobs.

4. Uncomment the `NODE_AUTH_TOKEN` env in `cd.yml`:
   ```yaml
   - name: Publish with provenance
     env:
       NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
     run: npm publish --provenance --access public
   ```

## Note on npm Classic Tokens

npm is deprecating classic automation tokens in December 2025. Granular access tokens or OIDC are the recommended replacements. This starter defaults to OIDC for this reason.
