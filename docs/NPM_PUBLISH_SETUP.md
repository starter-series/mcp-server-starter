# npm Publishing Setup (OIDC)

This starter uses **OIDC trusted publishing** — no npm tokens needed as GitHub secrets.

## Steps

### 1. Create an npm account

Sign up at [npmjs.com](https://www.npmjs.com) if you haven't already.

### 2. Configure trusted publishing on npm

1. Go to **npmjs.com → Settings → Trusted Publishers → Add GitHub Actions**
2. Fill in:
   - **GitHub repo owner**: your GitHub username
   - **GitHub repo name**: your repo name
   - **Workflow filename**: `cd.yml`
   - **Environment**: `npm`
3. Click **Add**

### 3. Create GitHub Environment

1. Go to your repo → **Settings → Environments → New environment**
2. Name it `npm`
3. (Optional) Add protection rules like required reviewers

### 4. Update package.json

Change `name` to your desired npm package name:

```json
{
  "name": "your-mcp-server",
  "bin": {
    "your-mcp-server": "dist/index.js"
  }
}
```

### 5. Publish

1. Bump version: `npm run version:patch`
2. Commit and push
3. Go to **Actions → Publish to npm → Run workflow**

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
