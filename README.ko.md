<div align="center">

# MCP Server Starter

**TypeScript + OIDC npm Publishing + CI/CD.**

MCP 서버를 만들고, push로 배포하세요. 시크릿 0개.

[![CI](https://github.com/starter-series/mcp-server-starter/actions/workflows/ci.yml/badge.svg)](https://github.com/starter-series/mcp-server-starter/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![npm version](https://img.shields.io/npm/v/my-mcp-server.svg)](https://www.npmjs.com/package/my-mcp-server)

[English](README.md) | **한국어**

</div>

---

> **[Starter Series](https://github.com/starter-series/starter-series)** — 매번 AI한테 CI/CD 설명하지 마세요. Clone하고 바로 시작하세요.
>
> [Docker 배포](https://github.com/starter-series/docker-deploy-starter) · [Discord 봇](https://github.com/starter-series/discord-bot-starter) · [Telegram 봇](https://github.com/starter-series/telegram-bot-starter) · [브라우저 확장](https://github.com/starter-series/browser-extension-starter) · [Electron 앱](https://github.com/starter-series/electron-app-starter) · [npm 패키지](https://github.com/starter-series/npm-package-starter) · [React Native](https://github.com/starter-series/react-native-starter) · [VS Code 확장](https://github.com/starter-series/vscode-extension-starter) · **MCP 서버** · [Python MCP 서버](https://github.com/starter-series/python-mcp-server-starter) · [Cloudflare Pages](https://github.com/starter-series/cloudflare-pages-starter)

---

## 포함 사항

- **MCP SDK** — `@modelcontextprotocol/sdk` + stdio 트랜스포트
- **TypeScript** — Strict 모드, ES2022, Zod 스키마 검증
- **Safety Annotations** — 모든 도구에 readOnly/destructive/idempotent 힌트
- **Prompts** — 가이드 워크플로우 템플릿
- **응답 헬퍼** — `ok()`과 `err()`로 일관된 도구 응답
- **Config** — 환경변수 파싱 패턴
- **CI** — gitleaks, npm audit, 라이선스 검사, ESLint, 빌드, 테스트
- **CD** — OIDC trusted publishing으로 npm 배포 (시크릿 0개)
- **Dependabot** — 의존성 + GitHub Actions 자동 업데이트

## 빠른 시작

```bash
git clone https://github.com/starter-series/mcp-server-starter.git my-mcp-server
cd my-mcp-server
rm -rf .git && git init

npm install
npm run dev
```

## Tool 추가

> **Tool 이름은 클라이언트에 연결된 모든 MCP 서버에서 전역 고유해야 합니다.** 모듈 접두사를 붙이세요 (예: `action` 대신 `mymodule_action`).

`src/tools/your-tool.ts` 생성:

```ts
import { z } from 'zod';
import { ok, err } from '../helpers.js';

export const name = 'your_tool';

export const config = {
  title: 'Your Tool',
  description: 'Tool 설명',
  inputSchema: {
    input: z.string().describe('입력 파라미터'),
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
};

export async function handler({ input }: { input: string }) {
  try {
    return ok(`결과: ${input}`);
  } catch (e) {
    return err(`실패: ${e instanceof Error ? e.message : String(e)}`);
  }
}
```

`src/index.ts`에 등록:

```ts
import * as yourTool from './tools/your-tool.js';
server.registerTool(yourTool.name, yourTool.config, yourTool.handler);
```

## Prompt 추가

`src/prompts/your-prompt.ts` 생성:

```ts
import { z } from 'zod';

export const name = 'your-prompt';
export const description = '가이드 워크플로우 설명';

export const schema = {
  param: z.string().optional().describe('선택 파라미터'),
};

export function handler({ param }: { param?: string }) {
  return {
    description,
    messages: [{
      role: 'user' as const,
      content: { type: 'text' as const, text: `프롬프트 텍스트 ${param ?? '기본값'}` },
    }],
  };
}
```

`src/index.ts`에 등록:

```ts
import * as yourPrompt from './prompts/your-prompt.js';
server.prompt(yourPrompt.name, yourPrompt.description, yourPrompt.schema, yourPrompt.handler);
```

## Resource 추가

Resource는 클라이언트에 **데이터**를 노출합니다 (Tool은 **동작**을 수행). 실제 예시는 `src/resources/server-info.ts` 참고.

`src/resources/your-resource.ts` 생성:

```ts
export const name = 'your-resource';
export const uri = 'info://your/resource';

export const metadata = {
  title: 'Your Resource',
  description: '이 resource가 노출하는 데이터',
  mimeType: 'application/json',
};

export async function handler(resourceUri: URL) {
  return {
    contents: [{ uri: resourceUri.href, mimeType: metadata.mimeType, text: '...' }],
  };
}
```

`src/index.ts`에 등록:

```ts
import * as yourResource from './resources/your-resource.js';
server.registerResource(yourResource.name, yourResource.uri, yourResource.metadata, yourResource.handler);
```

## HTTP 트랜스포트

이 스타터는 **stdio**를 사용합니다 (로컬 MCP 서버의 표준). HTTP 트랜스포트가 필요한 경우 — [Smithery](https://smithery.ai)/[mcp.so](https://mcp.so) 같은 레지스트리 등록이나 원격 배포 — `StreamableHTTPServerTransport` + Express 패턴을 사용하세요:

```ts
import express from 'express';
import { randomUUID } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';

const app = express();
app.use(express.json());

const sessions = new Map<string, StreamableHTTPServerTransport>();

app.post('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string;
  const existing = sessions.get(sessionId);

  if (existing) {
    await existing.handleRequest(req, res);
    return;
  }

  if (!isInitializeRequest(req.body)) {
    res.status(400).json({ error: 'Bad Request: Not an initialize request' });
    return;
  }

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
  });

  transport.onclose = () => {
    const id = transport.sessionId;
    if (id) sessions.delete(id);
  };

  const server = createServer(); // your McpServer factory
  await server.connect(transport);
  if (transport.sessionId) sessions.set(transport.sessionId, transport);
  await transport.handleRequest(req, res);
});

app.get('/mcp', async (req, res) => {
  const t = sessions.get(req.headers['mcp-session-id'] as string);
  if (!t) return res.status(400).end();
  await t.handleRequest(req, res);
});

app.delete('/mcp', async (req, res) => {
  const t = sessions.get(req.headers['mcp-session-id'] as string);
  if (!t) return res.status(400).end();
  await t.handleRequest(req, res);
});

app.listen(3000);
```

> **왜 이렇게 복잡한가?** `isInitializeRequest` 없이는 모든 POST가 새 transport를 생성 → "Already connected" 에러. GET 없이는 클라이언트가 SSE를 통한 서버 notification을 받을 수 없습니다.

자세한 내용은 [MCP SDK 문서](https://github.com/modelcontextprotocol/typescript-sdk) 참고.

## 로컬 테스트

### MCP Inspector

```bash
npm run build
npx @modelcontextprotocol/inspector node dist/index.js
```

### Claude Desktop

`~/Library/Application Support/Claude/claude_desktop_config.json`에 추가:

```json
{
  "mcpServers": {
    "my-mcp-server": {
      "command": "node",
      "args": ["/절대/경로/dist/index.js"]
    }
  }
}
```

### npm 배포 후

```json
{
  "mcpServers": {
    "my-mcp-server": {
      "command": "npx",
      "args": ["-y", "my-mcp-server"]
    }
  }
}
```

## CI/CD

### CI (매 push/PR)

1. 시크릿 스캔 (gitleaks)
2. 대용량 파일 감지 (>5 MB)
3. 라이선스 검사 (GPL/AGPL 차단)
4. 보안 감사 (`npm audit`)
5. 린트 (ESLint + TypeScript)
6. 빌드 (TypeScript 컴파일)
7. 테스트 (Jest)

### 보안 & 유지보수

| 워크플로우 | 역할 |
|-----------|------|
| CodeQL (`codeql.yml`) | 보안 취약점 정적 분석 (push/PR + 주간) |
| Maintenance (`maintenance.yml`) | 주간 CI 헬스 체크 — 실패 시 이슈 자동 생성 |
| Stale (`stale.yml`) | 비활성 이슈/PR 30일 후 라벨링, 7일 후 자동 종료 |

### CD (수동 트리거)

1. CI 통과 필수
2. 버전 중복 방지 (version guard)
3. OIDC + provenance로 npm 배포
4. GitHub Release 생성

**설정:** [docs/NPM_PUBLISH_SETUP.md](docs/NPM_PUBLISH_SETUP.md) 참고

## 프로젝트 구조

```
src/
├── index.ts              # 서버 진입점 — Tool/Resource/Prompt 등록 + 트랜스포트
├── config.ts             # 환경변수 설정
├── helpers.ts            # ok() / err() 응답 헬퍼
├── tools/
│   └── greet.ts          # 예시 Tool + annotations (교체해서 사용)
├── resources/
│   └── server-info.ts    # 서버 메타데이터 Resource 예시 (교체해서 사용)
└── prompts/
    └── hello.ts          # 예시 Prompt (교체해서 사용)
tests/
├── greet.test.js         # Tool 테스트
├── helpers.test.js       # 헬퍼 테스트
├── server-info.test.js   # Resource 테스트
└── hello.test.js         # Prompt 테스트
```

## 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | tsx로 실행 (빌드 불필요) |
| `npm run build` | TypeScript 컴파일 |
| `npm start` | 컴파일된 서버 실행 |
| `npm test` | 빌드 + 테스트 (`pretest`가 자동 빌드) |
| `npm run lint` | ESLint |
| `npm run version:patch` | 패치 버전 올리기 |

## 라이선스

MIT
