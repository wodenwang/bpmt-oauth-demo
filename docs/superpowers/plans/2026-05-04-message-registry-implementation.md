# Message Registry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个运行在 81 端口的 BPMT OAuth 留言登记表 demo，支持登录、列表、查询、新增、查看、编辑、删除和 Docker 运行。

**Architecture:** 使用 Node.js + Express 服务端渲染。OAuth 登录和 BPMT API 签名调用只在服务端执行；表结构由一次性 setup 命令通过 BPMT OpenAPI 创建，运行期留言 CRUD 通过服务端 MariaDB 数据访问层完成。

**Tech Stack:** Node.js 20、Express、EJS、express-session、mysql2、dotenv、node:test、supertest、Docker。

---

## 当前前提

- 工作目录：`/Users/wenzhewang/workspace/bpmt_project/bpmt-oauth-demo`
- 已确认规格：`docs/superpowers/specs/2026-05-04-message-registry-design.md`
- OAuth 回调地址固定为：`http://localhost:81/oauth/callback`
- 目标表名固定为：`DEMO_MESSAGE`
- 文档和用户可见文案使用中文。

## 文件结构

实现后仓库应包含以下文件：

- `package.json`：Node 脚本、依赖和测试命令。
- `package-lock.json`：npm 锁定文件，由 `npm install` 生成。
- `.env.example`：可提交的环境变量模板，所有密钥使用占位符。
- `.dockerignore`：Docker 构建忽略规则。
- `Dockerfile`：独立 Docker 镜像，容器内监听 81 端口。
- `README.md`：中文运行说明、初始化说明、默认验证流程和安全提醒。
- `src/config.js`：读取和校验服务端环境变量，提供脱敏摘要。
- `src/app.js`：Express 应用装配，配置 session、视图、静态资源和路由。
- `src/server.js`：启动 HTTP 服务。
- `src/auth/oauth.js`：OAuth URL、state 校验、token 换取、userinfo 获取。
- `src/auth/routes.js`：`/login`、`/oauth/callback`、`/logout` 路由。
- `src/auth/session.js`：登录态中间件和 session 写入/清理。
- `src/bpmt/signature.js`：BPMT API HMAC 签名。
- `src/bpmt/api.js`：BPMT OpenAPI 调用封装。
- `src/setup/tableDefinition.js`：`DEMO_MESSAGE` 动态表定义。
- `scripts/setup.js`：一次性建表/同步命令。
- `src/db/pool.js`：MariaDB 连接池。
- `src/messages/sql.js`：留言 SQL 构造，保持参数化。
- `src/messages/repository.js`：留言表数据库访问。
- `src/messages/service.js`：字段校验、权限判断和分页整理。
- `src/messages/routes.js`：首页、详情、新增、编辑、删除、批量删除路由。
- `views/layout.ejs`：页面基础框架。
- `views/messages/index.ejs`：留言列表首页。
- `views/messages/modal.ejs`：新增、查看、编辑弹窗。
- `views/error.ejs`：OAuth、权限、配置和维护错误页。
- `public/styles/bpmt.css`：贴近 BPMT 灰色表格风格的样式。
- `public/scripts/messages.js`：弹窗、确认删除、批量删除交互。
- `test/*.test.js`：单元测试和路由测试。
- `docs/codex/prompts/2026-05-04-03-message-registry-implementation.md`：实现提示词归档。

## Task 1: Node 项目骨架和配置校验

**Files:**
- Create: `package.json`
- Create: `.env.example`
- Create: `src/config.js`
- Create: `test/config.test.js`
- Modify: `.gitignore`

- [ ] **Step 1: 写配置测试**

Create `test/config.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig, redactConfig } from '../src/config.js';

const baseEnv = {
  NODE_ENV: 'test',
  PORT: '81',
  SESSION_SECRET: 'test-session-secret',
  BPMT_BASE_URL: 'http://localhost',
  BPMT_OAUTH_CLIENT_ID: 'bpmt-oauth-demo',
  BPMT_OAUTH_CLIENT_SECRET: 'secret-value',
  BPMT_OAUTH_REDIRECT_URI: 'http://localhost:81/oauth/callback',
  BPMT_API_BASE_URL: 'http://127.0.0.1/api',
  BPMT_API_APP_KEY: 'bpmt-api',
  BPMT_API_APP_SECRET: 'api-secret-value',
  DB_HOST: 'localhost',
  DB_PORT: '3306',
  DB_USER: 'bpmt',
  DB_PASSWORD: 'db-password',
  DB_NAME: 'bpmt'
};

test('loadConfig parses required environment values', () => {
  const config = loadConfig(baseEnv);
  assert.equal(config.port, 81);
  assert.equal(config.oauth.clientId, 'bpmt-oauth-demo');
  assert.equal(config.oauth.redirectUri, 'http://localhost:81/oauth/callback');
  assert.equal(config.db.port, 3306);
});

test('loadConfig reports missing required values without leaking secrets', () => {
  const env = { ...baseEnv, BPMT_OAUTH_CLIENT_SECRET: '' };
  assert.throws(() => loadConfig(env), /缺少必要环境变量: BPMT_OAUTH_CLIENT_SECRET/);
});

test('redactConfig removes secrets from diagnostic output', () => {
  const config = loadConfig(baseEnv);
  const redacted = redactConfig(config);
  assert.equal(redacted.oauth.clientSecret, '<redacted>');
  assert.equal(redacted.bpmtApi.appSecret, '<redacted>');
  assert.equal(redacted.db.password, '<redacted>');
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- test/config.test.js`

Expected: 命令失败，原因是还没有 `package.json` 或 `src/config.js`。

- [ ] **Step 3: 创建 Node 项目文件**

Create `package.json`:

```json
{
  "name": "bpmt-oauth-demo",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "node src/server.js",
    "dev": "node --watch src/server.js",
    "setup": "node scripts/setup.js",
    "test": "node --test",
    "test:unit": "node --test test/*.test.js"
  },
  "dependencies": {
    "dotenv": "^16.4.7",
    "ejs": "^3.1.10",
    "express": "^4.21.2",
    "express-session": "^1.18.1",
    "mysql2": "^3.12.0"
  },
  "devDependencies": {
    "supertest": "^7.0.0"
  },
  "engines": {
    "node": ">=20"
  }
}
```

Create `.env.example`:

```dotenv
NODE_ENV=development
PORT=81
SESSION_SECRET=<DEMO_SESSION_SECRET>

BPMT_BASE_URL=http://localhost
BPMT_OAUTH_CLIENT_ID=bpmt-oauth-demo
BPMT_OAUTH_CLIENT_SECRET=<BPMT_OAUTH_CLIENT_SECRET>
BPMT_OAUTH_REDIRECT_URI=http://localhost:81/oauth/callback

BPMT_API_BASE_URL=http://127.0.0.1/api
BPMT_API_APP_KEY=bpmt-api
BPMT_API_APP_SECRET=<BPMT_API_APP_SECRET>

DB_HOST=localhost
DB_PORT=3306
DB_USER=<DB_USER>
DB_PASSWORD=<DB_PASSWORD>
DB_NAME=bpmt
```

Create `src/config.js`:

```js
import 'dotenv/config';

const REQUIRED_KEYS = [
  'SESSION_SECRET',
  'BPMT_BASE_URL',
  'BPMT_OAUTH_CLIENT_ID',
  'BPMT_OAUTH_CLIENT_SECRET',
  'BPMT_OAUTH_REDIRECT_URI',
  'BPMT_API_BASE_URL',
  'BPMT_API_APP_KEY',
  'BPMT_API_APP_SECRET',
  'DB_HOST',
  'DB_PORT',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME'
];

function requireValue(env, key) {
  const value = env[key];
  if (!value || String(value).trim() === '') {
    throw new Error(`缺少必要环境变量: ${key}`);
  }
  return String(value).trim();
}

function parsePort(value, key) {
  const port = Number.parseInt(value, 10);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`环境变量 ${key} 必须是有效端口`);
  }
  return port;
}

export function loadConfig(env = process.env) {
  for (const key of REQUIRED_KEYS) {
    requireValue(env, key);
  }

  return {
    nodeEnv: env.NODE_ENV || 'development',
    port: parsePort(env.PORT || '81', 'PORT'),
    sessionSecret: requireValue(env, 'SESSION_SECRET'),
    bpmtBaseUrl: requireValue(env, 'BPMT_BASE_URL').replace(/\/$/, ''),
    oauth: {
      clientId: requireValue(env, 'BPMT_OAUTH_CLIENT_ID'),
      clientSecret: requireValue(env, 'BPMT_OAUTH_CLIENT_SECRET'),
      redirectUri: requireValue(env, 'BPMT_OAUTH_REDIRECT_URI')
    },
    bpmtApi: {
      baseUrl: requireValue(env, 'BPMT_API_BASE_URL').replace(/\/$/, ''),
      appKey: requireValue(env, 'BPMT_API_APP_KEY'),
      appSecret: requireValue(env, 'BPMT_API_APP_SECRET')
    },
    db: {
      host: requireValue(env, 'DB_HOST'),
      port: parsePort(requireValue(env, 'DB_PORT'), 'DB_PORT'),
      user: requireValue(env, 'DB_USER'),
      password: requireValue(env, 'DB_PASSWORD'),
      database: requireValue(env, 'DB_NAME')
    }
  };
}

export function redactConfig(config) {
  return {
    ...config,
    sessionSecret: '<redacted>',
    oauth: { ...config.oauth, clientSecret: '<redacted>' },
    bpmtApi: { ...config.bpmtApi, appSecret: '<redacted>' },
    db: { ...config.db, password: '<redacted>' }
  };
}
```

Modify `.gitignore` to include:

```gitignore
coverage/
npm-debug.log*
```

- [ ] **Step 4: 安装依赖并运行测试**

Run: `npm install`

Expected: 生成 `package-lock.json`。

Run: `npm test -- test/config.test.js`

Expected: 3 个测试通过。

- [ ] **Step 5: 提交**

Run:

```bash
git add package.json package-lock.json .env.example .gitignore src/config.js test/config.test.js
git commit -m "chore: 初始化 Node 配置"
```

Expected: 生成一个只包含项目骨架和配置校验的提交。

## Task 2: BPMT API 签名和 DEMO_MESSAGE 表定义

**Files:**
- Create: `src/bpmt/signature.js`
- Create: `src/setup/tableDefinition.js`
- Create: `test/bpmt-signature.test.js`
- Create: `test/table-definition.test.js`

- [ ] **Step 1: 写签名和表定义测试**

Create `test/bpmt-signature.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { buildCanonicalString, signBpmtRequest, normalizeQuery } from '../src/bpmt/signature.js';

test('normalizeQuery sorts decoded query pairs and encodes spaces as %20', () => {
  assert.equal(normalizeQuery('b=two&a=hello world&a=alpha'), 'a=alpha&a=hello%20world&b=two');
});

test('buildCanonicalString follows BPMT OpenAPI description', () => {
  const body = JSON.stringify({ name: 'DEMO_MESSAGE' });
  const canonical = buildCanonicalString({
    method: 'POST',
    path: '/api/v1/dynamic-tables',
    query: '',
    timestamp: '1777867200',
    nonce: 'nonce-1',
    body
  });

  const bodyHash = crypto.createHash('sha256').update(body).digest('hex');
  assert.equal(canonical, `POST\n/api/v1/dynamic-tables\n\n1777867200\nnonce-1\n${bodyHash}`);
});

test('signBpmtRequest returns required BPMT headers', () => {
  const headers = signBpmtRequest({
    method: 'POST',
    path: '/api/v1/dynamic-tables',
    query: '',
    body: '{"name":"DEMO_MESSAGE"}',
    appKey: 'bpmt-api',
    appSecret: 'api-secret',
    timestamp: '1777867200',
    nonce: 'nonce-1'
  });

  assert.equal(headers['X-BPMT-App-Key'], 'bpmt-api');
  assert.equal(headers['X-BPMT-Timestamp'], '1777867200');
  assert.equal(headers['X-BPMT-Nonce'], 'nonce-1');
  assert.match(headers['X-BPMT-Signature'], /^[a-f0-9]{64}$/);
});
```

Create `test/table-definition.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { DEMO_MESSAGE_TABLE } from '../src/setup/tableDefinition.js';

test('DEMO_MESSAGE table definition matches confirmed design', () => {
  assert.equal(DEMO_MESSAGE_TABLE.name, 'DEMO_MESSAGE');
  assert.equal(DEMO_MESSAGE_TABLE.cacheFlag, 0);
  assert.deepEqual(
    DEMO_MESSAGE_TABLE.columns.map((column) => column.name),
    ['ID', 'TITLE', 'CONTENT', 'CREATOR_USERID', 'CREATE_TIME', 'UPDATE_TIME']
  );
  assert.equal(DEMO_MESSAGE_TABLE.columns.find((column) => column.name === 'ID').primaryKey, true);
  assert.equal(DEMO_MESSAGE_TABLE.columns.find((column) => column.name === 'CONTENT').type, 'Clob');
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- test/bpmt-signature.test.js test/table-definition.test.js`

Expected: 测试失败，提示模块不存在。

- [ ] **Step 3: 实现签名和表定义**

Create `src/bpmt/signature.js`:

```js
import crypto from 'node:crypto';

function encodeQueryComponent(value) {
  return encodeURIComponent(value).replace(/\+/g, '%20');
}

export function normalizeQuery(query = '') {
  const raw = query.startsWith('?') ? query.slice(1) : query;
  if (!raw) return '';

  const pairs = [];
  for (const [name, value] of new URLSearchParams(raw).entries()) {
    pairs.push([name, value]);
  }

  return pairs
    .sort(([leftName, leftValue], [rightName, rightValue]) => {
      if (leftName === rightName) return leftValue.localeCompare(rightValue);
      return leftName.localeCompare(rightName);
    })
    .map(([name, value]) => `${encodeQueryComponent(name)}=${encodeQueryComponent(value)}`)
    .join('&');
}

function sha256Hex(body) {
  return crypto.createHash('sha256').update(body || '').digest('hex');
}

export function buildCanonicalString({ method, path, query = '', timestamp, nonce, body = '' }) {
  return [
    method.toUpperCase(),
    path,
    normalizeQuery(query),
    String(timestamp),
    nonce,
    sha256Hex(body)
  ].join('\n');
}

export function signBpmtRequest({ method, path, query = '', body = '', appKey, appSecret, timestamp, nonce }) {
  const canonical = buildCanonicalString({ method, path, query, timestamp, nonce, body });
  const signature = crypto.createHmac('sha256', appSecret).update(canonical).digest('hex');

  return {
    'X-BPMT-App-Key': appKey,
    'X-BPMT-Timestamp': String(timestamp),
    'X-BPMT-Nonce': nonce,
    'X-BPMT-Signature': signature
  };
}
```

Create `src/setup/tableDefinition.js`:

```js
export const DEMO_MESSAGE_TABLE = {
  name: 'DEMO_MESSAGE',
  description: 'OAuth demo 留言登记表',
  cacheFlag: 0,
  columns: [
    {
      name: 'ID',
      description: '主键',
      type: 'String',
      totalSize: 36,
      primaryKey: true,
      required: true
    },
    {
      name: 'TITLE',
      description: '留言标题',
      type: 'String',
      totalSize: 200,
      required: true
    },
    {
      name: 'CONTENT',
      description: '留言内容',
      type: 'Clob',
      required: true
    },
    {
      name: 'CREATOR_USERID',
      description: '创建人 userid',
      type: 'String',
      totalSize: 64,
      required: true
    },
    {
      name: 'CREATE_TIME',
      description: '创建时间',
      type: 'Date',
      required: true
    },
    {
      name: 'UPDATE_TIME',
      description: '更新时间',
      type: 'Date',
      required: true
    }
  ]
};
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test -- test/bpmt-signature.test.js test/table-definition.test.js`

Expected: 6 个测试通过。

- [ ] **Step 5: 提交**

Run:

```bash
git add src/bpmt/signature.js src/setup/tableDefinition.js test/bpmt-signature.test.js test/table-definition.test.js
git commit -m "feat: 添加 BPMT 表结构和签名"
```

Expected: 提交只包含 BPMT 签名和动态表定义。

## Task 3: 一次性 setup 命令

**Files:**
- Create: `src/bpmt/api.js`
- Create: `scripts/setup.js`
- Create: `test/bpmt-api.test.js`

- [ ] **Step 1: 写 BPMT API 客户端测试**

Create `test/bpmt-api.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { createBpmtApiClient } from '../src/bpmt/api.js';
import { DEMO_MESSAGE_TABLE } from '../src/setup/tableDefinition.js';

test('createDynamicTable posts signed request to BPMT API', async () => {
  const calls = [];
  const client = createBpmtApiClient({
    baseUrl: 'http://127.0.0.1/api',
    appKey: 'bpmt-api',
    appSecret: 'api-secret',
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return {
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: { name: 'DEMO_MESSAGE' } }),
        text: async () => JSON.stringify({ success: true, data: { name: 'DEMO_MESSAGE' } })
      };
    },
    now: () => 1777867200,
    nonce: () => 'nonce-1'
  });

  const result = await client.createDynamicTable(DEMO_MESSAGE_TABLE);
  assert.equal(result.data.name, 'DEMO_MESSAGE');
  assert.equal(calls[0].url, 'http://127.0.0.1/api/v1/dynamic-tables');
  assert.equal(calls[0].options.method, 'POST');
  assert.equal(calls[0].options.headers['X-BPMT-App-Key'], 'bpmt-api');
  assert.equal(JSON.parse(calls[0].options.body).name, 'DEMO_MESSAGE');
});

test('createDynamicTable treats existing table conflict as already initialized', async () => {
  const client = createBpmtApiClient({
    baseUrl: 'http://127.0.0.1/api',
    appKey: 'bpmt-api',
    appSecret: 'api-secret',
    fetchImpl: async () => ({
      ok: false,
      status: 409,
      json: async () => ({ error: 'conflict', message: 'table exists' }),
      text: async () => JSON.stringify({ error: 'conflict', message: 'table exists' })
    }),
    now: () => 1777867200,
    nonce: () => 'nonce-1'
  });

  const result = await client.createDynamicTable(DEMO_MESSAGE_TABLE);
  assert.equal(result.alreadyExists, true);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- test/bpmt-api.test.js`

Expected: 测试失败，提示 `src/bpmt/api.js` 不存在。

- [ ] **Step 3: 实现 BPMT API 客户端和 setup 命令**

Create `src/bpmt/api.js`:

```js
import crypto from 'node:crypto';
import { signBpmtRequest } from './signature.js';

function makeNonce() {
  return crypto.randomBytes(16).toString('hex');
}

async function readJson(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export function createBpmtApiClient({ baseUrl, appKey, appSecret, fetchImpl = fetch, now, nonce }) {
  async function requestJson({ method, publicPath, bodyObject }) {
    const body = bodyObject ? JSON.stringify(bodyObject) : '';
    const timestamp = now ? now() : Math.floor(Date.now() / 1000);
    const nonceValue = nonce ? nonce() : makeNonce();
    const headers = {
      'Content-Type': 'application/json',
      ...signBpmtRequest({
        method,
        path: `/api${publicPath}`,
        query: '',
        body,
        appKey,
        appSecret,
        timestamp,
        nonce: nonceValue
      })
    };

    const response = await fetchImpl(`${baseUrl}${publicPath}`, {
      method,
      headers,
      body: body || undefined
    });
    const payload = await readJson(response);

    if (!response.ok) {
      const error = new Error(`BPMT API 调用失败: ${method} ${publicPath} HTTP ${response.status}`);
      error.status = response.status;
      error.payload = payload;
      throw error;
    }

    return payload;
  }

  return {
    async createDynamicTable(tableDefinition) {
      try {
        return await requestJson({
          method: 'POST',
          publicPath: '/v1/dynamic-tables',
          bodyObject: tableDefinition
        });
      } catch (error) {
        if (error.status === 409) {
          return { alreadyExists: true, payload: error.payload };
        }
        throw error;
      }
    },

    async syncDynamicTableDdl(tableName) {
      return requestJson({
        method: 'POST',
        publicPath: `/v1/dynamic-tables/${encodeURIComponent(tableName)}/ddl:sync`
      });
    }
  };
}
```

Create `scripts/setup.js`:

```js
import { loadConfig, redactConfig } from '../src/config.js';
import { createBpmtApiClient } from '../src/bpmt/api.js';
import { DEMO_MESSAGE_TABLE } from '../src/setup/tableDefinition.js';

async function main() {
  const config = loadConfig();
  const client = createBpmtApiClient(config.bpmtApi);
  console.log('开始初始化 BPMT demo 表结构');
  console.log(JSON.stringify(redactConfig(config).bpmtApi));

  const createResult = await client.createDynamicTable(DEMO_MESSAGE_TABLE);
  if (createResult.alreadyExists) {
    console.log('DEMO_MESSAGE 已存在，执行 DDL 同步');
    await client.syncDynamicTableDdl(DEMO_MESSAGE_TABLE.name);
  } else {
    console.log('DEMO_MESSAGE 已创建');
  }

  console.log('BPMT demo 表结构初始化完成');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test -- test/bpmt-api.test.js`

Expected: 2 个测试通过。

- [ ] **Step 5: 提交**

Run:

```bash
git add src/bpmt/api.js scripts/setup.js test/bpmt-api.test.js
git commit -m "feat: 添加 BPMT 初始化命令"
```

Expected: 提交包含 setup 命令和 BPMT API 客户端。

## Task 4: MariaDB 留言 SQL 和 Repository

**Files:**
- Create: `src/db/pool.js`
- Create: `src/messages/sql.js`
- Create: `src/messages/repository.js`
- Create: `test/message-sql.test.js`

- [ ] **Step 1: 写 SQL 构造测试**

Create `test/message-sql.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCountMessagesQuery,
  buildDeleteMessageQuery,
  buildFindMessageQuery,
  buildInsertMessageQuery,
  buildListMessagesQuery,
  buildTableExistsQuery,
  buildUpdateMessageQuery
} from '../src/messages/sql.js';

test('buildListMessagesQuery uses filters, limit, offset and parameter args', () => {
  const query = buildListMessagesQuery({ title: '测试', creatorUserid: 'admin', page: 2, pageSize: 20 });
  assert.match(query.sql, /FROM DEMO_MESSAGE/);
  assert.match(query.sql, /TITLE LIKE \?/);
  assert.match(query.sql, /CREATOR_USERID = \?/);
  assert.match(query.sql, /ORDER BY CREATE_TIME DESC/);
  assert.deepEqual(query.args, ['%测试%', 'admin', 20, 20]);
});

test('buildCountMessagesQuery mirrors list filters without pagination', () => {
  const query = buildCountMessagesQuery({ title: '测试', creatorUserid: '' });
  assert.match(query.sql, /COUNT\(\*\) AS total/);
  assert.deepEqual(query.args, ['%测试%']);
});

test('buildInsertMessageQuery inserts server-owned creator and timestamps', () => {
  const query = buildInsertMessageQuery({
    id: 'uuid-1',
    title: '标题',
    content: '内容',
    creatorUserid: 'admin',
    now: '2026-05-04 09:30:00'
  });
  assert.match(query.sql, /INSERT INTO DEMO_MESSAGE/);
  assert.deepEqual(query.args, ['uuid-1', '标题', '内容', 'admin', '2026-05-04 09:30:00', '2026-05-04 09:30:00']);
});

test('buildUpdateMessageQuery updates title, content and update time by id', () => {
  const query = buildUpdateMessageQuery({
    id: 'uuid-1',
    title: '新标题',
    content: '新内容',
    now: '2026-05-04 10:00:00'
  });
  assert.deepEqual(query.args, ['新标题', '新内容', '2026-05-04 10:00:00', 'uuid-1']);
});

test('find and delete queries stay parameterized', () => {
  assert.deepEqual(buildFindMessageQuery('uuid-1').args, ['uuid-1']);
  assert.deepEqual(buildDeleteMessageQuery('uuid-1').args, ['uuid-1']);
});

test('buildTableExistsQuery checks current database metadata', () => {
  const query = buildTableExistsQuery();
  assert.match(query.sql, /information_schema\.TABLES/);
  assert.deepEqual(query.args, ['DEMO_MESSAGE']);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- test/message-sql.test.js`

Expected: 测试失败，提示 `src/messages/sql.js` 不存在。

- [ ] **Step 3: 实现 SQL 构造、连接池和 Repository**

Create `src/messages/sql.js`:

```js
const TABLE = 'DEMO_MESSAGE';

function normalizePage(page) {
  const parsed = Number.parseInt(page || '1', 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function normalizePageSize(pageSize) {
  const parsed = Number.parseInt(pageSize || '20', 10);
  if (!Number.isInteger(parsed) || parsed < 1) return 20;
  return Math.min(parsed, 100);
}

function buildWhere(filters = {}) {
  const clauses = [];
  const args = [];

  if (filters.title && filters.title.trim()) {
    clauses.push('TITLE LIKE ?');
    args.push(`%${filters.title.trim()}%`);
  }

  if (filters.creatorUserid && filters.creatorUserid.trim()) {
    clauses.push('CREATOR_USERID = ?');
    args.push(filters.creatorUserid.trim());
  }

  return {
    whereSql: clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '',
    args
  };
}

export function buildListMessagesQuery(filters = {}) {
  const page = normalizePage(filters.page);
  const pageSize = normalizePageSize(filters.pageSize);
  const offset = (page - 1) * pageSize;
  const { whereSql, args } = buildWhere(filters);

  return {
    sql: `SELECT ID, TITLE, CONTENT, CREATOR_USERID, CREATE_TIME, UPDATE_TIME FROM ${TABLE}${whereSql} ORDER BY CREATE_TIME DESC LIMIT ? OFFSET ?`,
    args: [...args, pageSize, offset],
    page,
    pageSize
  };
}

export function buildCountMessagesQuery(filters = {}) {
  const { whereSql, args } = buildWhere(filters);
  return {
    sql: `SELECT COUNT(*) AS total FROM ${TABLE}${whereSql}`,
    args
  };
}

export function buildFindMessageQuery(id) {
  return {
    sql: `SELECT ID, TITLE, CONTENT, CREATOR_USERID, CREATE_TIME, UPDATE_TIME FROM ${TABLE} WHERE ID = ?`,
    args: [id]
  };
}

export function buildInsertMessageQuery({ id, title, content, creatorUserid, now }) {
  return {
    sql: `INSERT INTO ${TABLE} (ID, TITLE, CONTENT, CREATOR_USERID, CREATE_TIME, UPDATE_TIME) VALUES (?, ?, ?, ?, ?, ?)`,
    args: [id, title, content, creatorUserid, now, now]
  };
}

export function buildUpdateMessageQuery({ id, title, content, now }) {
  return {
    sql: `UPDATE ${TABLE} SET TITLE = ?, CONTENT = ?, UPDATE_TIME = ? WHERE ID = ?`,
    args: [title, content, now, id]
  };
}

export function buildDeleteMessageQuery(id) {
  return {
    sql: `DELETE FROM ${TABLE} WHERE ID = ?`,
    args: [id]
  };
}

export function buildTableExistsQuery() {
  return {
    sql: 'SELECT COUNT(*) AS total FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',
    args: [TABLE]
  };
}
```

Create `src/db/pool.js`:

```js
import mysql from 'mysql2/promise';
import { loadConfig } from '../config.js';

export function createDbPool(dbConfig = loadConfig().db) {
  return mysql.createPool({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database,
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: false
  });
}
```

Create `src/messages/repository.js`:

```js
import {
  buildCountMessagesQuery,
  buildDeleteMessageQuery,
  buildFindMessageQuery,
  buildInsertMessageQuery,
  buildListMessagesQuery,
  buildTableExistsQuery,
  buildUpdateMessageQuery
} from './sql.js';

function mapRow(row) {
  return {
    id: row.ID,
    title: row.TITLE,
    content: row.CONTENT,
    creatorUserid: row.CREATOR_USERID,
    createTime: row.CREATE_TIME,
    updateTime: row.UPDATE_TIME
  };
}

export function createMessageRepository(pool) {
  return {
    async tableExists() {
      const query = buildTableExistsQuery();
      const [rows] = await pool.execute(query.sql, query.args);
      return Number(rows[0]?.total || 0) === 1;
    },

    async list(filters) {
      const countQuery = buildCountMessagesQuery(filters);
      const listQuery = buildListMessagesQuery(filters);
      const [countRows] = await pool.execute(countQuery.sql, countQuery.args);
      const [rows] = await pool.execute(listQuery.sql, listQuery.args);
      const total = Number(countRows[0]?.total || 0);

      return {
        rows: rows.map(mapRow),
        total,
        page: listQuery.page,
        pageSize: listQuery.pageSize,
        totalPages: Math.max(1, Math.ceil(total / listQuery.pageSize))
      };
    },

    async findById(id) {
      const query = buildFindMessageQuery(id);
      const [rows] = await pool.execute(query.sql, query.args);
      return rows[0] ? mapRow(rows[0]) : null;
    },

    async insert(message) {
      const query = buildInsertMessageQuery(message);
      await pool.execute(query.sql, query.args);
      return this.findById(message.id);
    },

    async update(message) {
      const query = buildUpdateMessageQuery(message);
      await pool.execute(query.sql, query.args);
      return this.findById(message.id);
    },

    async delete(id) {
      const query = buildDeleteMessageQuery(id);
      const [result] = await pool.execute(query.sql, query.args);
      return result.affectedRows === 1;
    }
  };
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test -- test/message-sql.test.js`

Expected: 5 个测试通过。

- [ ] **Step 5: 提交**

Run:

```bash
git add src/db/pool.js src/messages/sql.js src/messages/repository.js test/message-sql.test.js
git commit -m "feat: 添加留言数据库访问层"
```

Expected: 提交包含参数化 SQL 和 Repository。

## Task 5: 留言业务服务

**Files:**
- Create: `src/messages/service.js`
- Create: `test/message-service.test.js`

- [ ] **Step 1: 写业务服务测试**

Create `test/message-service.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { createMessageService, ValidationError, PermissionError, NotFoundError } from '../src/messages/service.js';

function createRepo(seed = {}) {
  const store = new Map(Object.entries(seed));
  return {
    async list(filters) {
      return { rows: [...store.values()], total: store.size, page: Number(filters.page || 1), pageSize: 20, totalPages: 1 };
    },
    async findById(id) {
      return store.get(id) || null;
    },
    async insert(message) {
      const row = { ...message, createTime: message.now, updateTime: message.now };
      store.set(message.id, row);
      return row;
    },
    async update(message) {
      const old = store.get(message.id);
      const row = { ...old, title: message.title, content: message.content, updateTime: message.now };
      store.set(message.id, row);
      return row;
    },
    async delete(id) {
      return store.delete(id);
    },
    async tableExists() {
      return true;
    }
  };
}

test('isReady reports table existence from repository', async () => {
  const service = createMessageService({ repository: createRepo() });
  assert.equal(await service.isReady(), true);
});

test('create writes current userid as creator', async () => {
  const service = createMessageService({
    repository: createRepo(),
    idFactory: () => 'uuid-1',
    clock: () => '2026-05-04 09:30:00'
  });

  const row = await service.create({ title: '标题', content: '内容' }, { userid: 'admin' });
  assert.equal(row.creatorUserid, 'admin');
});

test('create rejects blank title and content', async () => {
  const service = createMessageService({ repository: createRepo() });
  await assert.rejects(() => service.create({ title: ' ', content: '内容' }, { userid: 'admin' }), ValidationError);
  await assert.rejects(() => service.create({ title: '标题', content: ' ' }, { userid: 'admin' }), ValidationError);
});

test('update allows only creator', async () => {
  const repo = createRepo({
    'uuid-1': { id: 'uuid-1', title: '旧', content: '旧内容', creatorUserid: 'admin' }
  });
  const service = createMessageService({ repository: repo, clock: () => '2026-05-04 10:00:00' });

  await assert.rejects(
    () => service.update('uuid-1', { title: '新', content: '新内容' }, { userid: 'other' }),
    PermissionError
  );

  const row = await service.update('uuid-1', { title: '新', content: '新内容' }, { userid: 'admin' });
  assert.equal(row.title, '新');
});

test('delete allows only creator and reports missing rows', async () => {
  const repo = createRepo({
    'uuid-1': { id: 'uuid-1', title: '旧', content: '旧内容', creatorUserid: 'admin' }
  });
  const service = createMessageService({ repository: repo });

  await assert.rejects(() => service.delete('missing', { userid: 'admin' }), NotFoundError);
  await assert.rejects(() => service.delete('uuid-1', { userid: 'other' }), PermissionError);
  assert.equal(await service.delete('uuid-1', { userid: 'admin' }), true);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- test/message-service.test.js`

Expected: 测试失败，提示 `src/messages/service.js` 不存在。

- [ ] **Step 3: 实现业务服务**

Create `src/messages/service.js`:

```js
import crypto from 'node:crypto';

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
  }
}

export class PermissionError extends Error {
  constructor(message = '只能编辑或删除自己创建的留言') {
    super(message);
    this.name = 'PermissionError';
    this.status = 403;
  }
}

export class NotFoundError extends Error {
  constructor(message = '留言不存在') {
    super(message);
    this.name = 'NotFoundError';
    this.status = 404;
  }
}

function formatDateTime(date = new Date()) {
  const pad = (value) => String(value).padStart(2, '0');
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate())
  ].join('-') + ' ' + [
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds())
  ].join(':');
}

function normalizeInput(input) {
  const title = String(input.title || '').trim();
  const content = String(input.content || '').trim();

  if (!title) throw new ValidationError('留言标题不能为空');
  if (title.length > 200) throw new ValidationError('留言标题不能超过 200 个字符');
  if (!content) throw new ValidationError('留言内容不能为空');

  return { title, content };
}

function requireUser(user) {
  if (!user?.userid) {
    throw new PermissionError('请先登录');
  }
  return user;
}

export function createMessageService({ repository, idFactory = crypto.randomUUID, clock = () => formatDateTime() }) {
  async function requireOwnedMessage(id, user) {
    const row = await repository.findById(id);
    if (!row) throw new NotFoundError();
    if (row.creatorUserid !== user.userid) throw new PermissionError();
    return row;
  }

  return {
    async isReady() {
      return repository.tableExists ? repository.tableExists() : true;
    },

    async list(filters = {}) {
      return repository.list(filters);
    },

    async findById(id) {
      const row = await repository.findById(id);
      if (!row) throw new NotFoundError();
      return row;
    },

    async create(input, currentUser) {
      const user = requireUser(currentUser);
      const normalized = normalizeInput(input);
      return repository.insert({
        id: idFactory(),
        ...normalized,
        creatorUserid: user.userid,
        now: clock()
      });
    },

    async update(id, input, currentUser) {
      const user = requireUser(currentUser);
      await requireOwnedMessage(id, user);
      const normalized = normalizeInput(input);
      return repository.update({
        id,
        ...normalized,
        now: clock()
      });
    },

    async delete(id, currentUser) {
      const user = requireUser(currentUser);
      await requireOwnedMessage(id, user);
      return repository.delete(id);
    },

    async deleteMany(ids, currentUser) {
      const results = [];
      for (const id of ids) {
        results.push(await this.delete(id, currentUser));
      }
      return results;
    }
  };
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test -- test/message-service.test.js`

Expected: 5 个测试通过。

- [ ] **Step 5: 提交**

Run:

```bash
git add src/messages/service.js test/message-service.test.js
git commit -m "feat: 添加留言业务规则"
```

Expected: 提交包含字段校验和创建人权限判断。

## Task 6: OAuth 登录模块

**Files:**
- Create: `src/auth/oauth.js`
- Create: `src/auth/session.js`
- Create: `src/auth/routes.js`
- Create: `test/oauth.test.js`

- [ ] **Step 1: 写 OAuth 测试**

Create `test/oauth.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAuthorizeUrl, exchangeCodeForToken, fetchUserInfo, verifyState } from '../src/auth/oauth.js';

const oauthConfig = {
  bpmtBaseUrl: 'http://localhost',
  oauth: {
    clientId: 'bpmt-oauth-demo',
    clientSecret: 'client-secret',
    redirectUri: 'http://localhost:81/oauth/callback'
  }
};

test('buildAuthorizeUrl creates BPMT authorize URL with code response type', () => {
  const url = new URL(buildAuthorizeUrl(oauthConfig, 'state-1'));
  assert.equal(url.href.startsWith('http://localhost/oauth/authorize'), true);
  assert.equal(url.searchParams.get('response_type'), 'code');
  assert.equal(url.searchParams.get('client_id'), 'bpmt-oauth-demo');
  assert.equal(url.searchParams.get('redirect_uri'), 'http://localhost:81/oauth/callback');
  assert.equal(url.searchParams.get('state'), 'state-1');
});

test('verifyState rejects mismatch', () => {
  assert.equal(verifyState('state-1', 'state-1'), true);
  assert.throws(() => verifyState('state-1', 'state-2'), /OAuth state 校验失败/);
});

test('exchangeCodeForToken posts authorization_code form', async () => {
  const calls = [];
  const token = await exchangeCodeForToken({
    config: oauthConfig,
    code: 'code-1',
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return {
        ok: true,
        status: 200,
        json: async () => ({ access_token: 'token-1', token_type: 'Bearer', userid: 'admin' }),
        text: async () => JSON.stringify({ access_token: 'token-1', token_type: 'Bearer', userid: 'admin' })
      };
    }
  });

  assert.equal(token.userid, 'admin');
  assert.equal(calls[0].url, 'http://localhost/oauth/token');
  assert.equal(calls[0].options.method, 'POST');
  assert.match(String(calls[0].options.body), /grant_type=authorization_code/);
});

test('fetchUserInfo sends bearer token', async () => {
  const user = await fetchUserInfo({
    config: oauthConfig,
    accessToken: 'token-1',
    fetchImpl: async (url, options) => {
      assert.equal(url, 'http://localhost/oauth/userinfo');
      assert.equal(options.headers.Authorization, 'Bearer token-1');
      return {
        ok: true,
        status: 200,
        json: async () => ({ userid: 'admin', name: '管理员' }),
        text: async () => JSON.stringify({ userid: 'admin', name: '管理员' })
      };
    }
  });

  assert.equal(user.userid, 'admin');
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- test/oauth.test.js`

Expected: 测试失败，提示 OAuth 模块不存在。

- [ ] **Step 3: 实现 OAuth 纯函数和 session 工具**

Create `src/auth/oauth.js`:

```js
function safeError(message, status = 500) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function parseResponse(response, failureMessage) {
  const text = await response.text();
  let payload = {};
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { raw: text };
    }
  }

  if (!response.ok) {
    throw safeError(`${failureMessage}: HTTP ${response.status}`, response.status);
  }

  return payload;
}

export function buildAuthorizeUrl(config, state) {
  const url = new URL('/oauth/authorize', config.bpmtBaseUrl);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', config.oauth.clientId);
  url.searchParams.set('redirect_uri', config.oauth.redirectUri);
  url.searchParams.set('state', state);
  return url.toString();
}

export function verifyState(expectedState, actualState) {
  if (!expectedState || !actualState || expectedState !== actualState) {
    throw safeError('OAuth state 校验失败，请重新登录', 400);
  }
  return true;
}

export async function exchangeCodeForToken({ config, code, fetchImpl = fetch }) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.oauth.redirectUri,
    client_id: config.oauth.clientId,
    client_secret: config.oauth.clientSecret
  });

  const response = await fetchImpl(new URL('/oauth/token', config.bpmtBaseUrl).toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });

  return parseResponse(response, 'OAuth token 换取失败');
}

export async function fetchUserInfo({ config, accessToken, fetchImpl = fetch }) {
  const response = await fetchImpl(new URL('/oauth/userinfo', config.bpmtBaseUrl).toString(), {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  return parseResponse(response, 'OAuth userinfo 获取失败');
}
```

Create `src/auth/session.js`:

```js
export function currentUser(req) {
  return req.session?.user || null;
}

export function saveUserSession(req, userInfo) {
  req.session.user = {
    userid: userInfo.userid,
    name: userInfo.name || userInfo.userid,
    group: userInfo.group || null,
    role: userInfo.role || null
  };
}

export function clearUserSession(req) {
  return new Promise((resolve, reject) => {
    req.session.destroy((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

export function requireLogin(req, res, next) {
  if (currentUser(req)) {
    next();
    return;
  }
  res.redirect('/login');
}
```

Create `src/auth/routes.js`:

```js
import crypto from 'node:crypto';
import { buildAuthorizeUrl, exchangeCodeForToken, fetchUserInfo, verifyState } from './oauth.js';
import { clearUserSession, saveUserSession } from './session.js';

export function createAuthRouter({ express, config }) {
  const router = express.Router();

  router.get('/login', (req, res) => {
    const state = crypto.randomBytes(16).toString('hex');
    req.session.oauthState = state;
    res.redirect(buildAuthorizeUrl(config, state));
  });

  router.get('/oauth/callback', async (req, res, next) => {
    try {
      const { code, state, error, error_description: errorDescription } = req.query;
      if (error) {
        const oauthError = new Error(errorDescription || `OAuth 登录失败: ${error}`);
        oauthError.status = 400;
        throw oauthError;
      }
      if (!code) {
        const missingCode = new Error('OAuth 回调缺少 code');
        missingCode.status = 400;
        throw missingCode;
      }

      verifyState(req.session.oauthState, state);
      delete req.session.oauthState;

      const token = await exchangeCodeForToken({ config, code });
      const userInfo = await fetchUserInfo({ config, accessToken: token.access_token });
      saveUserSession(req, userInfo);
      res.redirect('/');
    } catch (error) {
      next(error);
    }
  });

  router.post('/logout', async (req, res, next) => {
    try {
      await clearUserSession(req);
      res.redirect('/');
    } catch (error) {
      next(error);
    }
  });

  return router;
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test -- test/oauth.test.js`

Expected: 4 个测试通过。

- [ ] **Step 5: 提交**

Run:

```bash
git add src/auth/oauth.js src/auth/session.js src/auth/routes.js test/oauth.test.js
git commit -m "feat: 添加 BPMT OAuth 登录模块"
```

Expected: 提交包含 OAuth 授权码流程和本地 session 工具。

## Task 7: Express 应用和留言路由

**Files:**
- Create: `src/app.js`
- Create: `src/server.js`
- Create: `src/messages/routes.js`
- Create: `test/message-routes.test.js`

- [ ] **Step 1: 写路由测试**

Create `test/message-routes.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import { createMessageRouter } from '../src/messages/routes.js';

test('message list redirects anonymous user to login', async () => {
  const app = express();
  app.use((req, res, next) => {
    req.session = {};
    next();
  });
  app.use(createMessageRouter({ express, service: {} }));

  const response = await request(app).get('/');
  assert.equal(response.status, 302);
  assert.equal(response.headers.location, '/login');
});

test('message list renders rows for logged-in user', async () => {
  const app = express();
  app.set('view engine', 'ejs');
  app.set('views', 'views');
  app.use((req, res, next) => {
    req.session = { user: { userid: 'admin', name: '管理员' } };
    next();
  });
  app.use(createMessageRouter({
    express,
    service: {
      async list() {
        return {
          rows: [{ id: 'uuid-1', title: '标题', content: '内容', creatorUserid: 'admin', createTime: '2026-05-04 09:30:00', updateTime: '2026-05-04 09:30:00' }],
          total: 1,
          page: 1,
          pageSize: 20,
          totalPages: 1
        };
      }
    }
  }));

  const response = await request(app).get('/');
  assert.equal(response.status, 200);
  assert.match(response.text, /留言登记/);
  assert.match(response.text, /标题/);
});

test('message list shows setup hint when DEMO_MESSAGE is missing', async () => {
  const app = express();
  app.set('view engine', 'ejs');
  app.set('views', 'views');
  app.use((req, res, next) => {
    req.session = { user: { userid: 'admin', name: '管理员' } };
    next();
  });
  app.use(createMessageRouter({
    express,
    service: {
      async isReady() {
        return false;
      }
    }
  }));

  const response = await request(app).get('/');
  assert.equal(response.status, 200);
  assert.match(response.text, /请先运行初始化命令/);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- test/message-routes.test.js`

Expected: 测试失败，提示留言路由或视图不存在。

- [ ] **Step 3: 实现应用和路由**

Create `src/messages/routes.js`:

```js
import { currentUser, requireLogin } from '../auth/session.js';

function parseFilters(query) {
  return {
    title: query.title || '',
    creatorUserid: query.creatorUserid || '',
    page: query.page || '1',
    pageSize: query.pageSize || '20'
  };
}

function selectedIds(body) {
  const raw = body.ids || [];
  return Array.isArray(raw) ? raw : [raw];
}

export function createMessageRouter({ express, service }) {
  const router = express.Router();

  router.get('/', requireLogin, async (req, res, next) => {
    try {
      const filters = parseFilters(req.query);
      if (service.isReady && !(await service.isReady())) {
        res.render('messages/index', {
          title: '留言登记',
          user: currentUser(req),
          filters,
          result: { rows: [], total: 0, page: 1, pageSize: 20, totalPages: 1 },
          setupRequired: true,
          flash: req.session.flash || null
        });
        delete req.session.flash;
        return;
      }
      const result = await service.list(filters);
      res.render('messages/index', {
        title: '留言登记',
        user: currentUser(req),
        filters,
        result,
        setupRequired: false,
        flash: req.session.flash || null
      });
      delete req.session.flash;
    } catch (error) {
      next(error);
    }
  });

  router.get('/messages/:id', requireLogin, async (req, res, next) => {
    try {
      const message = await service.findById(req.params.id);
      const mode = req.query.mode === 'edit' ? 'edit' : 'view';
      res.render('messages/modal', { mode, user: currentUser(req), message });
    } catch (error) {
      next(error);
    }
  });

  router.post('/messages', requireLogin, async (req, res, next) => {
    try {
      await service.create(req.body, currentUser(req));
      req.session.flash = { type: 'success', message: '留言已新增' };
      res.redirect('/');
    } catch (error) {
      next(error);
    }
  });

  router.post('/messages/:id/update', requireLogin, async (req, res, next) => {
    try {
      await service.update(req.params.id, req.body, currentUser(req));
      req.session.flash = { type: 'success', message: '留言已更新' };
      res.redirect('/');
    } catch (error) {
      next(error);
    }
  });

  router.post('/messages/:id/delete', requireLogin, async (req, res, next) => {
    try {
      await service.delete(req.params.id, currentUser(req));
      req.session.flash = { type: 'success', message: '留言已删除' };
      res.redirect('/');
    } catch (error) {
      next(error);
    }
  });

  router.post('/messages/bulk-delete', requireLogin, async (req, res, next) => {
    try {
      await service.deleteMany(selectedIds(req.body), currentUser(req));
      req.session.flash = { type: 'success', message: '选中留言已删除' };
      res.redirect('/');
    } catch (error) {
      next(error);
    }
  });

  return router;
}
```

Create `src/app.js`:

```js
import express from 'express';
import session from 'express-session';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from './config.js';
import { createAuthRouter } from './auth/routes.js';
import { createDbPool } from './db/pool.js';
import { createMessageRepository } from './messages/repository.js';
import { createMessageService } from './messages/service.js';
import { createMessageRouter } from './messages/routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

export function createApp({ appConfig = loadConfig(), messageService } = {}) {
  const app = express();
  const pool = messageService ? null : createDbPool(appConfig.db);
  const service = messageService || createMessageService({ repository: createMessageRepository(pool) });

  app.set('view engine', 'ejs');
  app.set('views', path.join(rootDir, 'views'));

  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());
  app.use('/static', express.static(path.join(rootDir, 'public')));
  app.use(session({
    name: 'bpmt_oauth_demo_sid',
    secret: appConfig.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: appConfig.nodeEnv === 'production'
    }
  }));

  app.use(createAuthRouter({ express, config: appConfig }));
  app.use(createMessageRouter({ express, service }));

  app.use((error, req, res, next) => {
    if (res.headersSent) {
      next(error);
      return;
    }
    const status = error.status || 500;
    res.status(status).render('error', {
      title: '系统提示',
      status,
      message: status >= 500 ? '系统暂时不可用，请稍后重试' : error.message,
      user: req.session?.user || null
    });
  });

  return app;
}
```

Create `src/server.js`:

```js
import { loadConfig, redactConfig } from './config.js';
import { createApp } from './app.js';

const config = loadConfig();
const app = createApp({ appConfig: config });

app.listen(config.port, () => {
  console.log(`bpmt-oauth-demo listening on ${config.port}`);
  console.log(JSON.stringify(redactConfig(config)));
});
```

- [ ] **Step 4: 创建最低可用视图以通过路由测试**

Create `views/layout.ejs`:

```ejs
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title><%= title %></title>
  <link rel="stylesheet" href="/static/styles/bpmt.css">
</head>
<body>
  <%- body %>
</body>
</html>
```

Create `views/messages/index.ejs`:

```ejs
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>留言登记</title>
</head>
<body>
  <h1>留言登记</h1>
  <p>当前用户：<%= user.name || user.userid %></p>
  <% if (setupRequired) { %>
    <p>请先运行初始化命令：npm run setup</p>
  <% } else { %>
  <table>
    <thead>
      <tr><th>标题</th><th>内容摘要</th><th>创建者</th></tr>
    </thead>
    <tbody>
      <% for (const row of result.rows) { %>
        <tr>
          <td><%= row.title %></td>
          <td><%= row.content %></td>
          <td><%= row.creatorUserid %></td>
        </tr>
      <% } %>
    </tbody>
  </table>
  <% } %>
</body>
</html>
```

Create `views/error.ejs`:

```ejs
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>系统提示</title>
</head>
<body>
  <h1>系统提示</h1>
  <p><%= message %></p>
</body>
</html>
```

Create `views/messages/modal.ejs`:

```ejs
<section>
  <h2><%= mode === 'view' ? '查看留言' : '编辑留言' %></h2>
  <p><%= message.title %></p>
  <p><%= message.content %></p>
</section>
```

- [ ] **Step 5: 运行路由测试确认通过**

Run: `npm test -- test/message-routes.test.js`

Expected: 3 个测试通过。

- [ ] **Step 6: 提交**

Run:

```bash
git add src/app.js src/server.js src/messages/routes.js views/layout.ejs views/messages/index.ejs views/messages/modal.ejs views/error.ejs test/message-routes.test.js
git commit -m "feat: 添加 Express 应用路由"
```

Expected: 提交包含可启动 Express 应用和基础页面。

## Task 8: BPMT 风格页面和前端交互

**Files:**
- Modify: `views/messages/index.ejs`
- Modify: `views/messages/modal.ejs`
- Modify: `views/error.ejs`
- Create: `public/styles/bpmt.css`
- Create: `public/scripts/messages.js`

- [ ] **Step 1: 替换列表页为 BPMT 风格结构**

Replace `views/messages/index.ejs` with:

```ejs
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>留言登记</title>
  <link rel="stylesheet" href="/static/styles/bpmt.css">
  <script src="/static/scripts/messages.js" defer></script>
</head>
<body>
  <main class="bpmt-page">
    <div class="bpmt-topline">
      <span>用户[<%= user.name || user.userid %>]已登录。</span>
      <form method="post" action="/logout"><button class="link-button" type="submit">退出 demo</button></form>
    </div>

    <% if (flash) { %>
      <div class="flash flash-<%= flash.type %>"><%= flash.message %></div>
    <% } %>

    <section class="panel">
      <div class="panel-title"><span>留言登记</span></div>

      <% if (setupRequired) { %>
        <div class="error-box">
          <h1>请先运行初始化命令</h1>
          <p>当前数据库中未检测到 <code>DEMO_MESSAGE</code>。请在服务端执行 <code>npm run setup</code> 后刷新本页。</p>
        </div>
      <% } else { %>
      <form class="query-grid" method="get" action="/">
        <label>标题(模糊)</label>
        <input type="text" name="title" value="<%= filters.title %>">
        <label>创建者</label>
        <input type="text" name="creatorUserid" value="<%= filters.creatorUserid %>">
        <input type="hidden" name="pageSize" value="<%= result.pageSize %>">
        <div class="query-actions">
          <button type="button" class="toolbar-button">查询条件</button>
          <a class="toolbar-button" href="/">重置条件</a>
          <button type="submit" class="toolbar-button primary">查询</button>
        </div>
      </form>

      <form method="post" action="/messages/bulk-delete" onsubmit="return confirmBulkDelete()">
        <table class="data-table">
          <thead>
            <tr>
              <th class="checkbox-cell"><input type="checkbox" onclick="toggleAllRows(this)"></th>
              <th class="ops-cell">操作</th>
              <th>标题</th>
              <th>内容摘要</th>
              <th>创建者</th>
              <th>创建时间</th>
              <th>更新时间</th>
            </tr>
          </thead>
          <tbody>
            <% if (result.rows.length === 0) { %>
              <tr><td colspan="7" class="empty-cell">暂无留言</td></tr>
            <% } %>
            <% for (const row of result.rows) { %>
              <% const owned = row.creatorUserid === user.userid; %>
              <tr>
                <td class="checkbox-cell"><input type="checkbox" name="ids" value="<%= row.id %>" <%= owned ? '' : 'disabled' %>></td>
                <td class="ops-cell">
                  <button type="button" class="icon-button" onclick="openViewDialog('<%= row.id %>')">看</button>
                  <button type="button" class="icon-button" <%= owned ? `onclick="openEditDialog('${row.id}')"` : 'disabled title="只能编辑自己创建的留言"' %>>改</button>
                  <button type="button" class="icon-button" <%= owned ? `onclick="deleteOne('${row.id}')"` : 'disabled title="只能删除自己创建的留言"' %>>删</button>
                </td>
                <td><%= row.title %></td>
                <td><%= row.content.length > 80 ? `${row.content.slice(0, 80)}...` : row.content %></td>
                <td><%= row.creatorUserid %></td>
                <td><%= row.createTime %></td>
                <td><%= row.updateTime %></td>
              </tr>
            <% } %>
          </tbody>
        </table>

        <div class="bottom-toolbar">
          <button type="button" class="toolbar-button primary" onclick="openCreateDialog()">新增</button>
          <button type="submit" class="toolbar-button">批量删除</button>
        </div>
      </form>

      <div class="pager">
        <strong>【每页记录数：<%= result.pageSize %>】总页数/总记录数：<%= result.totalPages %>/<%= result.total %></strong>
        <span>
          <a href="/?title=<%= encodeURIComponent(filters.title) %>&creatorUserid=<%= encodeURIComponent(filters.creatorUserid) %>&page=1&pageSize=<%= result.pageSize %>">首页</a>
          <a href="/?title=<%= encodeURIComponent(filters.title) %>&creatorUserid=<%= encodeURIComponent(filters.creatorUserid) %>&page=<%= Math.max(1, result.page - 1) %>&pageSize=<%= result.pageSize %>">上一页</a>
          <em><%= result.page %></em>
          <a href="/?title=<%= encodeURIComponent(filters.title) %>&creatorUserid=<%= encodeURIComponent(filters.creatorUserid) %>&page=<%= Math.min(result.totalPages, result.page + 1) %>&pageSize=<%= result.pageSize %>">下一页</a>
          <a href="/?title=<%= encodeURIComponent(filters.title) %>&creatorUserid=<%= encodeURIComponent(filters.creatorUserid) %>&page=<%= result.totalPages %>&pageSize=<%= result.pageSize %>">末页</a>
        </span>
      </div>
      <% } %>
    </section>

    <dialog id="message-dialog" class="message-dialog"></dialog>
    <form id="delete-form" method="post" hidden></form>
  </main>
</body>
</html>
```

- [ ] **Step 2: 更新弹窗视图、错误页、CSS 和 JS**

Replace `views/messages/modal.ejs` with:

```ejs
<form method="post" action="<%= mode === 'create' ? '/messages' : `/messages/${message.id}/update` %>" class="modal-form">
  <div class="modal-title"><%= mode === 'create' ? '新增留言' : mode === 'edit' ? '编辑留言' : '查看留言' %></div>
  <label>标题</label>
  <input name="title" maxlength="200" value="<%= message?.title || '' %>" <%= mode === 'view' ? 'readonly' : '' %> required>
  <label>内容</label>
  <textarea name="content" rows="8" <%= mode === 'view' ? 'readonly' : '' %> required><%= message?.content || '' %></textarea>
  <div class="modal-actions">
    <% if (mode !== 'view') { %><button type="submit" class="toolbar-button primary">保存</button><% } %>
    <button type="button" class="toolbar-button" onclick="closeDialog()">关闭</button>
  </div>
</form>
```

Replace `views/error.ejs` with:

```ejs
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>系统提示</title>
  <link rel="stylesheet" href="/static/styles/bpmt.css">
</head>
<body>
  <main class="bpmt-page">
    <section class="panel">
      <div class="panel-title"><span>系统提示</span></div>
      <div class="error-box">
        <h1>系统提示</h1>
        <p><%= message %></p>
        <a class="toolbar-button primary" href="/">返回首页</a>
      </div>
    </section>
  </main>
</body>
</html>
```

Create `public/scripts/messages.js`:

```js
function dialog() {
  return document.getElementById('message-dialog');
}

async function loadDialog(url) {
  const response = await fetch(url, { headers: { Accept: 'text/html' } });
  const html = await response.text();
  const element = dialog();
  element.innerHTML = html;
  element.showModal();
}

function openCreateDialog() {
  dialog().innerHTML = `
    <form method="post" action="/messages" class="modal-form">
      <div class="modal-title">新增留言</div>
      <label>标题</label>
      <input name="title" maxlength="200" required>
      <label>内容</label>
      <textarea name="content" rows="8" required></textarea>
      <div class="modal-actions">
        <button type="submit" class="toolbar-button primary">保存</button>
        <button type="button" class="toolbar-button" onclick="closeDialog()">关闭</button>
      </div>
    </form>`;
  dialog().showModal();
}

function openViewDialog(id) {
  loadDialog(`/messages/${encodeURIComponent(id)}`);
}

function openEditDialog(id) {
  loadDialog(`/messages/${encodeURIComponent(id)}?mode=edit`);
}

function closeDialog() {
  dialog().close();
}

function deleteOne(id) {
  if (!window.confirm('确认删除这条留言？')) return;
  const form = document.getElementById('delete-form');
  form.action = `/messages/${encodeURIComponent(id)}/delete`;
  form.submit();
}

function toggleAllRows(source) {
  document.querySelectorAll('input[name="ids"]:not(:disabled)').forEach((checkbox) => {
    checkbox.checked = source.checked;
  });
}

function confirmBulkDelete() {
  const checked = document.querySelectorAll('input[name="ids"]:checked');
  if (checked.length === 0) {
    window.alert('请先选择可删除的留言');
    return false;
  }
  return window.confirm(`确认删除选中的 ${checked.length} 条留言？`);
}

Object.assign(window, {
  openCreateDialog,
  openViewDialog,
  openEditDialog,
  closeDialog,
  deleteOne,
  toggleAllRows,
  confirmBulkDelete
});
```

Create `public/styles/bpmt.css` with the BPMT table style:

```css
* { box-sizing: border-box; }
body {
  margin: 0;
  font: 13px Arial, "Microsoft YaHei", sans-serif;
  color: #111;
  background: #fff;
}
.bpmt-page { padding: 4px 6px 24px; }
.bpmt-topline {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 26px;
  background: linear-gradient(#efefef, #cfcfcf);
  border-bottom: 1px solid #aaa;
  padding: 0 8px;
}
.panel {
  border: 1px solid #9f9f9f;
  border-radius: 3px;
  padding: 4px;
  margin-top: 8px;
}
.panel-title {
  height: 38px;
  border: 1px solid #aaa;
  background: linear-gradient(#f7f7f7, #cfcfcf);
  padding: 7px 10px;
}
.panel-title span {
  display: inline-block;
  background: #fff;
  border: 1px solid #aaa;
  border-bottom: 0;
  padding: 7px 14px;
  font-weight: 700;
}
.query-grid {
  display: grid;
  grid-template-columns: 160px minmax(180px, 1fr) 160px minmax(180px, 1fr);
  border-left: 1px solid #aaa;
  border-right: 1px solid #aaa;
}
.query-grid label {
  padding: 9px;
  text-align: center;
  font-weight: 700;
  background: linear-gradient(#eeeeee, #c8c8c8);
  border-bottom: 1px solid #aaa;
}
.query-grid input {
  height: 27px;
  margin: 5px;
  border: 1px solid #9db8d8;
}
.query-actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: space-between;
  padding: 7px;
  background: linear-gradient(#f4f4f4, #cccccc);
  border-bottom: 1px solid #aaa;
}
.toolbar-button,
.link-button,
.icon-button {
  border: 1px solid #c5c5c5;
  border-radius: 4px;
  background: linear-gradient(#ffffff, #eeeeee);
  color: #333;
  padding: 5px 12px;
  text-decoration: none;
  cursor: pointer;
}
.toolbar-button.primary { font-weight: 700; }
.link-button { border: 0; background: transparent; padding: 0; }
.icon-button { padding: 4px 7px; }
.icon-button:disabled,
.toolbar-button:disabled { color: #999; cursor: not-allowed; }
.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table th {
  background: linear-gradient(#eeeeee, #c8c8c8);
  border: 1px solid #aaa;
  padding: 8px;
  text-align: center;
}
.data-table td {
  border: 1px solid #d0d0d0;
  padding: 8px;
  background: #fff;
}
.checkbox-cell { width: 44px; text-align: center; }
.ops-cell { width: 110px; text-align: center; white-space: nowrap; }
.empty-cell { text-align: center; color: #666; }
.bottom-toolbar,
.pager {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 38px;
  padding: 7px;
  border: 1px solid #aaa;
  border-top: 0;
  background: linear-gradient(#eeeeee, #c8c8c8);
}
.pager a,
.pager em {
  display: inline-block;
  min-width: 32px;
  text-align: center;
  padding: 5px 8px;
  color: #333;
  background: #eee;
  border: 1px solid #ccc;
  text-decoration: none;
}
.flash { margin: 8px 0; padding: 8px; border: 1px solid #aaa; }
.flash-success { background: #f3fff3; }
.message-dialog {
  width: min(680px, 92vw);
  border: 1px solid #888;
  padding: 0;
}
.modal-title {
  background: linear-gradient(#f7f7f7, #cfcfcf);
  padding: 9px;
  font-weight: 700;
  border-bottom: 1px solid #aaa;
}
.modal-form {
  display: grid;
  grid-template-columns: 90px 1fr;
  gap: 8px;
  padding: 12px;
}
.modal-form label { font-weight: 700; text-align: right; padding-top: 6px; }
.modal-form input,
.modal-form textarea {
  border: 1px solid #9db8d8;
  padding: 6px;
  font: inherit;
}
.modal-actions { grid-column: 1 / -1; text-align: right; }
.error-box { padding: 18px; }
@media (max-width: 720px) {
  .query-grid { grid-template-columns: 110px 1fr; }
  .query-actions { grid-column: 1 / -1; }
  .data-table { font-size: 12px; }
}
```

- [ ] **Step 3: 运行测试并启动本地服务看页面是否渲染**

Run: `npm test`

Expected: 所有已写测试通过。

Run: `PORT=8181 npm start`

Expected: 输出 `bpmt-oauth-demo listening on 8181`。如果没有真实环境变量，使用 `.env` 或直接传入测试环境变量启动。

- [ ] **Step 4: 提交**

Run:

```bash
git add views/messages/index.ejs views/messages/modal.ejs views/error.ejs public/styles/bpmt.css public/scripts/messages.js
git commit -m "feat: 添加 BPMT 风格留言页面"
```

Expected: 提交包含页面和静态资源。

## Task 9: Docker、README 和提示词归档

**Files:**
- Create: `Dockerfile`
- Create: `.dockerignore`
- Create: `README.md`

- [ ] **Step 1: 添加 Docker 文件**

Create `.dockerignore`:

```dockerignore
.git
.codex
.superpowers
node_modules
npm-debug.log
.DS_Store
.env
.env.*
!.env.example
```

Create `Dockerfile`:

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
COPY views ./views
COPY public ./public
COPY scripts ./scripts
EXPOSE 81
CMD ["npm", "start"]
```

- [ ] **Step 2: 添加中文 README**

Create `README.md`:

````md
# BPMT OAuth 留言登记表 Demo

本项目是 `bpmt-lite` OAuth 第三方登录示例。系统自身不维护用户密码，用户通过 BPMT OAuth 登录后进入留言列表页。新增留言的创建人由服务端写入当前 BPMT `userid`。

## 功能

- BPMT OAuth 授权码登录
- 留言列表、查询、分页
- 新增、查看、编辑、删除留言
- 所有已登录用户可查看全部留言
- 只有创建人可编辑和删除自己的留言
- 通过 BPMT API 初始化 `DEMO_MESSAGE` 表结构
- 运行期 CRUD 直连 MariaDB

## 环境变量

复制 `.env.example` 为 `.env`，填写本机密钥和数据库凭据。不要把 `.env` 提交到 Git。

## 初始化表结构

```bash
npm install
npm run setup
```

`npm run setup` 会通过 BPMT OpenAPI 创建或同步 `DEMO_MESSAGE`。

## 本地运行

```bash
npm start
```

默认监听 `http://localhost:81`。BPMT 第三方系统回调地址必须精确配置为：

```text
http://localhost:81/oauth/callback
```

## Docker 运行

```bash
docker build -t bpmt-oauth-demo:local .
docker run --rm --env-file .env -p 81:81 bpmt-oauth-demo:local
```

## 安全提醒

- `client_secret`、`BPMT_API_APP_SECRET`、数据库密码、OAuth code 和 access token 只允许存在服务端。
- 本项目只退出 demo 本地 session，不承诺退出 BPMT 登录态。
- 本项目不实现 OIDC、refresh token 或跨系统单点登出。
````

- [ ] **Step 3: 运行测试和 Docker 构建**

Run: `npm test`

Expected: 所有测试通过。

Run: `docker build -t bpmt-oauth-demo:local .`

Expected: Docker 镜像构建成功。

- [ ] **Step 4: 提交**

Run:

```bash
git add Dockerfile .dockerignore README.md
git commit -m "docs: 添加运行和 Docker 说明"
```

Expected: 提交包含 Docker 和中文运行文档。

## Task 10: 真实环境验证和收口

**Files:**
- Create: `docs/codex/prompts/2026-05-04-03-message-registry-implementation.md`

- [ ] **Step 1: 检查本机配置**

Run:

```bash
test -f .env && echo ".env exists" || echo ".env missing"
test -f .codex/project-record.local.md && echo "local record exists" || echo "local record missing"
```

Expected: 至少有一种本机配置来源存在。命令输出不得包含密钥。

- [ ] **Step 2: 执行表结构初始化**

Run: `npm run setup`

Expected: 输出 `BPMT demo 表结构初始化完成`。如果 `DEMO_MESSAGE` 已存在，输出 `DEMO_MESSAGE 已存在，执行 DDL 同步` 后成功结束。

- [ ] **Step 3: 启动 81 端口服务**

Run: `npm start`

Expected: 输出 `bpmt-oauth-demo listening on 81`。

- [ ] **Step 4: 浏览器验证 OAuth 和 CRUD**

Use Playwright or Chrome DevTools:

1. 打开 `http://localhost:81/`。
2. 未登录 demo 时应跳转 BPMT `/oauth/authorize`。
3. BPMT 登录成功后回到 `/oauth/callback`，再进入留言列表。
4. 新增一条标题为 `OAuth demo 测试留言` 的留言。
5. 在列表中看到该留言，创建者为当前 BPMT `userid`。
6. 查看该留言，弹窗显示完整内容。
7. 编辑该留言标题为 `OAuth demo 测试留言-已编辑`。
8. 删除该留言，列表不再显示该记录。

Expected: 上述 8 步全部成功。

- [ ] **Step 5: 创建提示词归档**

Create `docs/codex/prompts/2026-05-04-03-message-registry-implementation.md`:

````md
# 2026-05-04 03 留言登记表实现

## 用户目标

根据已确认设计，实现 BPMT OAuth 留言登记表 demo，支持登录、列表、查询、新增、查看、编辑、删除和 Docker 运行。

## Codex 任务提示词

```text
根据 docs/superpowers/specs/2026-05-04-message-registry-design.md 和 docs/superpowers/plans/2026-05-04-message-registry-implementation.md 执行实现。
```

## 环境假设

- BPMT 基础地址：`http://localhost`
- OAuth 回调地址：`http://localhost:81/oauth/callback`
- 表名：`DEMO_MESSAGE`
- 密钥使用 `.env` 或 `.codex/project-record.local.md`，不写入 Git。

## 修改文件

- `package.json`
- `package-lock.json`
- `.env.example`
- `.dockerignore`
- `Dockerfile`
- `README.md`
- `src/`
- `scripts/setup.js`
- `views/`
- `public/`
- `test/`

## 验证命令

```bash
npm test
npm run setup
docker build -t bpmt-oauth-demo:local .
docker run --rm --env-file .env -p 81:81 bpmt-oauth-demo:local
```

## 结果摘要

- `npm test`：通过。
- `npm run setup`：`DEMO_MESSAGE` 创建或同步成功。
- `docker build -t bpmt-oauth-demo:local .`：通过。
- 浏览器 OAuth 和 CRUD 验证：通过。

## 已知限制

本 demo 不实现 OIDC、refresh token、跨系统单点登出、附件、评论或复杂角色权限。
````

- [ ] **Step 6: 最终检查**

Run:

```bash
git status --short
rg -n "(BPMT_OAUTH_CLIENT_SECRET|BPMT_API_APP_SECRET|DB_PASSWORD|access_token|client_secret)=[^<\\s][^\\s]*" .
```

Expected: `git status --short` 只显示本任务应提交的文档变更；密钥扫描不应发现真实密钥。

- [ ] **Step 7: 提交验证归档**

Run:

```bash
git add docs/codex/prompts/2026-05-04-03-message-registry-implementation.md
git commit -m "docs: 记录留言登记表实现验证"
```

Expected: 提交只包含验证结果归档。

## 自查清单

- 规格中的 OAuth 授权码流程由 Task 6 和 Task 10 覆盖。
- 规格中的 `DEMO_MESSAGE` 表结构由 Task 2 和 Task 3 覆盖。
- 规格中的 MariaDB CRUD 由 Task 4、Task 5 和 Task 7 覆盖。
- 规格中的 BPMT 风格 UI 由 Task 8 覆盖。
- 规格中的 Docker 独立运行由 Task 9 和 Task 10 覆盖。
- 规格中的提示词归档要求由 Task 9 和 Task 10 覆盖。
- 每个写操作都通过服务端执行，浏览器不会收到 secret、code 或 access token。
- 所有 SQL 构造都使用参数数组，不拼接用户输入。
