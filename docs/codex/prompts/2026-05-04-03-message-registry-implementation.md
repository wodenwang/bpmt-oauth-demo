# 2026-05-04 03 留言登记表实现

## 用户目标

按留言登记表实现计划推进 Task 1，先建立 Node.js 项目骨架和配置校验能力，为后续 BPMT OAuth 登录、留言 CRUD、数据库初始化和页面实现提供基础。

本文件是实现阶段的滚动归档。后续任务继续在本文件追加对应实现、验证结果和限制。

## Codex 任务提示词

```text
你正在实现 Task 1: Node 项目骨架和配置校验。

要求：
1. 只实现 Task 1，不实现后续 OAuth、server、setup、页面或 CRUD 任务。
2. 采用 TDD 顺序：先写 `test/config.test.js`，运行测试确认缺少 `package.json` 或 `src/config.js` 时失败，再创建 Node 项目文件和配置加载逻辑。
3. 创建 `package.json`、`.env.example`、`src/config.js`、`test/config.test.js`，修改 `.gitignore`，安装依赖生成 `package-lock.json`。
4. 配置加载函数 `loadConfig(env = process.env)` 必须从传入 env 或默认 `process.env` 读取，不在模块加载时强制读取真实 `.env`。
5. 配置校验必须检查必要环境变量、端口范围、端口纯数字格式，并支持配置脱敏输出。
6. 不写入真实密钥；文档和示例中使用 `<BPMT_OAUTH_CLIENT_SECRET>`、`<BPMT_API_APP_SECRET>` 等占位符。
7. 最终运行 `npm test -- test/config.test.js` 并提交。
```

## 环境假设

- 工作目录：`/Users/wenzhewang/workspace/bpmt_project/bpmt-oauth-demo/.worktrees/message-registry`
- Git 分支：`feature/message-registry`
- BPMT 基础地址：`http://localhost`
- BPMT OAuth 回调地址：`http://localhost:81/oauth/callback`
- BPMT OpenAPI：`http://127.0.0.1/api/openapi.json`
- OAuth client id：`bpmt-oauth-demo`
- OAuth client secret：`<BPMT_OAUTH_CLIENT_SECRET>`
- BPMT API app key：`bpmt-api`
- BPMT API app secret：`<BPMT_API_APP_SECRET>`
- 数据库名：`bpmt`
- 本机密钥、数据库密码和真实本地凭据只允许保存在 `.codex/project-record.local.md`，不进入 Git 跟踪文件。

## 当前 Task 1 修改文件

- `package.json`
- `package-lock.json`
- `.env.example`
- `.gitignore`
- `src/config.js`
- `test/config.test.js`
- `docs/codex/prompts/2026-05-04-03-message-registry-implementation.md`

## 验证命令

Task 1 执行和复审过程中使用的关键验证命令：

```bash
npm test -- test/config.test.js
npm install
git diff --name-only
git status --short --branch
```

当前最终验证命令：

```bash
npm test -- test/config.test.js
```

## Task 1 结果摘要

- 已创建 Node.js 项目骨架，使用 ESM 模块和 Node 20+。
- 已配置依赖：`dotenv`、`ejs`、`express`、`express-session`、`mysql2`、`supertest`。
- 已创建 `.env.example`，所有敏感项均使用占位符。
- 已实现 `loadConfig(env = process.env)`，用于解析端口、BPMT 基础地址、OAuth 客户端配置、BPMT API 签名配置和数据库配置。
- 已实现 `redactConfig(config)`，用于脱敏 `sessionSecret`、OAuth client secret、BPMT API app secret 和数据库密码。
- 已移除 `src/config.js` 的顶层 `dotenv/config` 副作用，后续启动入口负责显式加载 dotenv。
- 已严格校验 `PORT` 和 `DB_PORT` 必须为纯数字字符串，且范围为 `1..65535`。
- 已将 `BPMT_BASE_URL` 和 `BPMT_API_BASE_URL` 的尾部多个 `/` 统一去除。
- 已保留 `package.json` 中 Task 1 计划要求的 `start`、`dev`、`setup` 脚本中间态；这些入口文件会由后续任务实现。

## 已知限制

- Task 1 只完成项目骨架和配置校验，不启动 Web 服务。
- `src/server.js` 和 `scripts/setup.js` 尚未实现，因此 `npm start`、`npm run dev`、`npm run setup` 需要等待后续任务。
- OAuth 授权码登录、token 交换、用户信息读取、本地 session、数据库表初始化、留言 CRUD 和页面样式均未在 Task 1 实现。
- 本轮没有连接 BPMT 实例或 MariaDB，只验证配置解析逻辑。
- 本归档不包含真实密钥、授权码、访问令牌、数据库密码或本机专用凭据。

## Task 2 用户目标

实现 BPMT OpenAPI 请求签名工具和 `DEMO_MESSAGE` 动态表定义，为后续 setup 脚本调用 BPMT API 创建留言登记表提供基础。Task 2 只提供可复用的签名函数、canonical string 构造、query 归一化和表结构常量，不实际调用 BPMT API，也不连接数据库。

## Task 2 Codex 任务提示词

```text
你正在实现 Task 2: BPMT API 签名和 DEMO_MESSAGE 表定义。

要求：
1. 只实现 Task 2，不实现后续 BPMT OpenAPI 调用、数据库初始化、OAuth 登录或留言 CRUD。
2. 采用 TDD 顺序：先写 `test/bpmt-signature.test.js` 和 `test/table-definition.test.js`，运行测试确认缺少模块时失败，再创建实现文件。
3. 创建 `src/bpmt/signature.js`，实现 `normalizeQuery`、`buildCanonicalString`、`signBpmtRequest`。
4. 创建 `src/setup/tableDefinition.js`，导出 `DEMO_MESSAGE_TABLE` 表定义。
5. canonical string 必须按 BPMT OpenAPI 说明使用 `METHOD`、`PATH`、`NORMALIZED_QUERY`、`TIMESTAMP`、`NONCE`、`SHA256_HEX(BODY)` 逐行拼接。
6. query 排序必须使用确定性的 Java `String.compareTo` 等价顺序：先比较 name，再比较 value。
7. query 编码必须对齐 BPMT Java 服务端 `URLEncoder.encode(...).replace("+", "%20")` 风格：空格编码为 `%20`，`~!'()` 编码为大写 percent hex，`*` 保持不编码。
8. 不写入真实密钥；测试中只能使用固定假值。
9. 最终运行 `npm test -- test/bpmt-signature.test.js test/table-definition.test.js` 和 `npm test`。
```

## Task 2 修改文件

初始实现修改文件：

- `src/bpmt/signature.js`
- `src/setup/tableDefinition.js`
- `test/bpmt-signature.test.js`
- `test/table-definition.test.js`

代码质量复审修正文件：

- `src/bpmt/signature.js`
- `test/bpmt-signature.test.js`
- `test/table-definition.test.js`

本归档补记文件：

- `docs/codex/prompts/2026-05-04-03-message-registry-implementation.md`

## Task 2 验证命令

Task 2 初始实现和复审修正过程中使用的关键验证命令：

```bash
npm test -- test/bpmt-signature.test.js test/table-definition.test.js
npm test
git diff --name-only
git status --short --branch
```

当前最终验证命令：

```bash
npm test -- test/bpmt-signature.test.js test/table-definition.test.js
```

## Task 2 结果摘要

- 已实现 `normalizeQuery(query = '')`，支持去除开头 `?`、解析重复参数、按解码后的 name/value 排序，并重新编码为 BPMT 签名需要的 query string。
- 已将 query 排序对齐 Java `String.compareTo` 语义，使用确定性的 UTF-16/code-unit 字符串比较，避免 `localeCompare` 受 locale 或 ICU 行为影响。
- 已将 query 编码对齐 BPMT Java 服务端：空格输出 `%20`，`~!'()` 输出 `%7E%21%27%28%29`，`*` 保持不编码。
- 已实现 `buildCanonicalString(...)`，按 `METHOD`、`PATH`、`NORMALIZED_QUERY`、`TIMESTAMP`、`NONCE`、`SHA256_HEX(BODY)` 用换行连接。
- 已实现 `signBpmtRequest(...)`，使用 `HMAC-SHA256` 和服务端保存的 app secret 生成 `X-BPMT-Signature`，并返回 BPMT 所需的 `X-BPMT-App-Key`、`X-BPMT-Timestamp`、`X-BPMT-Nonce`、`X-BPMT-Signature` 请求头。
- 已创建 `DEMO_MESSAGE_TABLE`，表名为 `DEMO_MESSAGE`，包含 `ID`、`TITLE`、`CONTENT`、`CREATOR_USERID`、`CREATE_TIME`、`UPDATE_TIME` 六个字段；`ID` 为主键，`CONTENT` 为 `Clob`。
- 已补充 signature golden 断言，覆盖固定输入下的签名值。
- 已补充混合大小写、特殊字符、重复参数的 `normalizeQuery` 测试。
- 已增强 `DEMO_MESSAGE_TABLE` 测试，全量断言字段 `type`、`totalSize`、`required`、`primaryKey` 等结构。

## Task 2 已知限制

- Task 2 只实现签名函数和动态表定义，不调用 BPMT `/api/v1/dynamic-tables`。
- Task 2 不读取 `.env`，也不读取 `.codex/project-record.local.md`；真实 `BPMT_API_APP_SECRET` 仍只允许保存在本机未跟踪文件中。
- Task 2 没有连接本机 BPMT 实例、MariaDB 或 OpenAPI 文档，只通过单元测试验证 canonical string、签名头和表定义结构。
- `signBpmtRequest(...)` 由调用方传入 `timestamp`、`nonce`、`appKey` 和 `appSecret`；后续 Task 需要负责生成 nonce、读取配置、发起 HTTP 请求和处理 BPMT 返回值。
- 本归档不包含真实密钥、授权码、访问令牌、数据库密码或本机专用凭据。

## Task 3 用户目标

实现一次性 `npm run setup` 基础命令，用服务端环境变量中的 BPMT API 签名配置调用 BPMT OpenAPI，创建 demo 所需的 `DEMO_MESSAGE` 动态表；如果表已存在，则将 `409 Conflict` 视为已初始化并继续执行 DDL 同步。Task 3 不实现真实留言 CRUD、OAuth 页面或数据库业务逻辑。

## Task 3 Codex 任务提示词

```text
你正在实现 Task 3: 一次性 setup 命令。

要求：
1. 只实现 Task 3，不实现后续任务。
2. 只写入 `src/bpmt/api.js`、`scripts/setup.js`、`test/bpmt-api.test.js`，并更新本滚动归档。
3. 采用 TDD 顺序：先写 `test/bpmt-api.test.js`，运行 `npm test -- test/bpmt-api.test.js` 确认缺少 `src/bpmt/api.js` 时失败。
4. 创建 `src/bpmt/api.js`，实现 `createBpmtApiClient(...)`、`createDynamicTable(...)` 和 `syncDynamicTableDdl(...)`。
5. BPMT 签名 canonical path 必须使用 public URI，例如 `/api/v1/dynamic-tables`，不能只使用 `/v1/dynamic-tables`。
6. 创建 `scripts/setup.js`，读取 `loadConfig()`，脱敏输出 BPMT API 配置，创建 `DEMO_MESSAGE` 表，已存在时执行 DDL 同步。
7. 不写入真实密钥；测试只能使用固定假值。
8. 最终运行 `npm test -- test/bpmt-api.test.js` 和 `npm test`。
```

## Task 3 修改文件

- `src/bpmt/api.js`
- `scripts/setup.js`
- `test/bpmt-api.test.js`
- `docs/codex/prompts/2026-05-04-03-message-registry-implementation.md`

## Task 3 验证命令

Task 3 按 TDD 顺序执行的关键验证命令：

```bash
npm test -- test/bpmt-api.test.js
npm test
git diff --name-only
git status --short --branch
```

RED 阶段验证结果：

```text
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '.../src/bpmt/api.js'
```

GREEN 阶段验证结果：

```text
npm test -- test/bpmt-api.test.js
# tests 2
# pass 2

npm test
# tests 12
# pass 12
```

## Task 3 结果摘要

- 已新增 `createBpmtApiClient(...)`，支持注入 `fetchImpl`、`now` 和 `nonce`，便于单元测试固定 HTTP 请求和签名输入。
- 已实现 `createDynamicTable(tableDefinition)`，向 `${baseUrl}/v1/dynamic-tables` 发起 `POST`，请求体为 `DEMO_MESSAGE_TABLE` 的 JSON。
- 已实现 `syncDynamicTableDdl(tableName)`，向 `${baseUrl}/v1/dynamic-tables/{tableName}/ddl:sync` 发起 `POST`。
- 已确认签名调用使用 public canonical path：`/api${publicPath}`，例如 `/api/v1/dynamic-tables`；实际请求 URL 继续使用配置中的 `BPMT_API_BASE_URL` 加 public path，例如 `http://127.0.0.1/api/v1/dynamic-tables`。
- 已实现响应解析：优先读取 `response.text()` 后解析 JSON；非 JSON 响应以 `{ raw }` 返回，避免错误信息丢失。
- 已将 `409 Conflict` 处理为 `{ alreadyExists: true, payload }`，用于 setup 命令幂等运行。
- 已新增 `scripts/setup.js`，通过 `loadConfig()` 读取运行环境变量，通过 `redactConfig(config).bpmtApi` 打印脱敏配置，并输出中文初始化进度。

## Task 3 已知限制

- Task 3 单元测试使用 fake fetch，没有连接本机 BPMT 实例，也没有真实创建或同步 `DEMO_MESSAGE` 表。
- `scripts/setup.js` 已在后续代码质量复审中改为显式加载 `dotenv/config`；`src/config.js` 仍保持无 dotenv 顶层副作用。
- `scripts/setup.js` 捕获异常后只打印 `error.message`，不会输出 `client_secret`、`BPMT_API_APP_SECRET`、授权码、访问令牌或数据库密码。
- setup 命令只初始化 BPMT 动态表，不创建本地 MySQL 留言业务表，不实现 OAuth 登录、留言 CRUD 或页面。
- 本归档不包含真实密钥、授权码、访问令牌、数据库密码或本机专用凭据。

## Task 3 代码质量复审修复

### 复审问题

Task 3 初始提交后，代码质量审查指出以下问题需要修正：

- HTTP 错误消息只包含 method、path 和 status，`scripts/setup.js` 只打印该 message，无法看到 BPMT 返回的安全诊断字段。
- `test/bpmt-api.test.js` 未用 golden 签名锁住 `createDynamicTable(...)` 的 canonical path。
- 缺少 `syncDynamicTableDdl('DEMO_MESSAGE')` 的 URL、method 和签名 golden 测试。
- 缺少非 `409` HTTP 错误测试，未断言错误消息包含安全 payload 诊断且不包含 secret。
- `scripts/setup.js` 作为 CLI 入口应显式加载 `dotenv/config`，但 `src/config.js` 不能恢复 dotenv 顶层副作用。
- `scripts/setup.js` 脱敏配置输出需要中文前缀。

### 修复内容

- `test/bpmt-api.test.js` 新增 `X-BPMT-Signature` 精确断言，固定 `now=1777867200`、`nonce=nonce-1` 和测试假密钥 `api-secret`。
- `createDynamicTable(...)` 的签名 golden 固定为 `faf2c8c2dce79b8fac84a307c5db6efb505864e6d3b235486b1c449115f18cec`，用于锁住 canonical path `/api/v1/dynamic-tables`。
- 新增 `syncDynamicTableDdl('DEMO_MESSAGE')` 测试，断言 URL 为 `http://127.0.0.1/api/v1/dynamic-tables/DEMO_MESSAGE/ddl:sync`，method 为 `POST`，签名 golden 为 `c0e62d244495ce6aface2e0cad6af53e9dc94b0c569114d8fc03d45521719cfa`，用于锁住 canonical path `/api/v1/dynamic-tables/DEMO_MESSAGE/ddl:sync`。
- 新增非 `409` 错误测试，断言 `error.status`，并确认 `error.message` 包含 `code`、`error`、`message` 三个安全诊断字段，同时不包含测试假密钥。
- `src/bpmt/api.js` 新增安全诊断格式化，只从 payload 中提取 `code`、`error`、`message`，并对当前 app secret 做兜底脱敏。
- `scripts/setup.js` 顶部新增 `import 'dotenv/config';`，让 CLI 入口支持后续 `.env` 用户路径。
- `scripts/setup.js` 脱敏配置输出调整为 `BPMT API 配置：...`。

### 复审修复验证

RED 阶段验证结果：

```text
npm test -- test/bpmt-api.test.js
# fail 1
# failing test: createDynamicTable includes safe BPMT diagnostics for non-conflict errors
# reason: error.message 缺少 INVALID_SIGNATURE
```

GREEN 阶段验证结果：

```text
npm test -- test/bpmt-api.test.js
# tests 4
# pass 4
```

最终验证结果：

```text
npm test -- test/bpmt-api.test.js
# tests 4
# pass 4

npm test
# tests 14
# pass 14
```

### 复审修复限制

- 本次修复仍不连接真实 BPMT 实例，HTTP 行为通过 fake fetch 单元测试验证。
- 本次修复不修改 Task 2 的 `src/bpmt/signature.js`。
- 测试中的 `api-secret` 是固定假值，不是真实 `BPMT_API_APP_SECRET`。
- 本归档不包含真实密钥、授权码、访问令牌、数据库密码或本机专用凭据。

## Task 3 二次代码质量复审修复

### 二次复审问题

Task 3 复审修复后，代码质量审查继续指出以下问题：

- 真实 BPMT ErrorEnvelope 可能是嵌套结构，例如 `{ error: { code, message, requestId, details } }`，此前诊断会输出 `error=[object Object]`。
- `error.payload` 此前保留原始 payload 且可枚举，未来如果调用 `console.error(error)` 或 `util.inspect(error)`，可能把 secret 带入日志。

### 二次修复内容

- `test/bpmt-api.test.js` 新增嵌套 ErrorEnvelope 测试，断言 `error.message` 包含 `INVALID_SIGNATURE`、`bad sign` 和 `requestId=req-123`，且不包含 `[object Object]`。
- `test/bpmt-api.test.js` 新增错误对象脱敏断言，确认 `JSON.stringify(error.payload)` 和 `util.inspect(error)` 都不包含测试假密钥 `api-secret`。
- `src/bpmt/api.js` 新增递归 `sanitizePayload(...)`，会把字符串中的当前 app secret 替换为 `<redacted>`，并按 key 名脱敏 `appSecret`、`clientSecret`、`password`、`secret`、`accessToken`、`refreshToken`、`token`。
- `src/bpmt/api.js` 保留 BPMT 错误码字段 `code`，不会因为字段名为 `code` 而脱敏 `INVALID_SIGNATURE`。
- `src/bpmt/api.js` 的 `error.payload` 现在挂载脱敏后的 payload，不再挂载原始 payload。
- `src/bpmt/api.js` 的安全诊断同时支持顶层 `{ code, error, message, error_description }` 和嵌套 `{ error: { code, message, requestId, details } }`。

### 二次修复验证

RED 阶段验证结果：

```text
npm test -- test/bpmt-api.test.js
# fail 1
# failing test: createDynamicTable includes nested BPMT error envelope diagnostics without leaking secrets
# reason: error.message 输出 error=[object Object]，缺少 INVALID_SIGNATURE
```

GREEN 阶段验证结果：

```text
npm test -- test/bpmt-api.test.js
# tests 5
# pass 5
```

最终验证结果：

```text
npm test -- test/bpmt-api.test.js
# tests 5
# pass 5

npm test
# tests 15
# pass 15
```

### 二次修复限制

- 本次修复仍不连接真实 BPMT 实例，HTTP 行为通过 fake fetch 单元测试验证。
- 本次修复不修改 `scripts/setup.js`，也不修改 Task 2 的 `src/bpmt/signature.js`。
- 测试中的 `api-secret` 是固定假值，不是真实 `BPMT_API_APP_SECRET`。
- 本归档不包含真实密钥、授权码、访问令牌、数据库密码或本机专用凭据。

## Task 4 用户目标

实现 MariaDB 留言 SQL 构造和 Repository 封装，为后续留言业务规则提供参数化 SQL 访问层。Task 4 只构造 SQL、创建连接池工厂和 repository 包装，不连接真实 MariaDB，也不实现后续业务校验、路由或页面。

## Task 4 Codex 任务提示词

```text
你正在实现 Task 4: MariaDB 留言 SQL 和 Repository。

要求：
1. 只实现 Task 4，不实现后续任务。
2. 只写入 `src/db/pool.js`、`src/messages/sql.js`、`src/messages/repository.js`、`test/message-sql.test.js`，并更新本滚动归档。
3. 采用 TDD 顺序：先写 `test/message-sql.test.js`，运行 `npm test -- test/message-sql.test.js` 确认缺少 `src/messages/sql.js` 时失败。
4. SQL 必须使用参数占位符和 args 数组，不拼接用户输入。
5. `DEMO_MESSAGE` 支持按标题模糊筛选、按创建人筛选、分页、计数、按 id 查询、插入、更新、删除和表存在性检查。
6. 创建 `src/db/pool.js`，从 `loadConfig().db` 读取数据库配置并创建 mysql2 promise pool。
7. 创建 `src/messages/repository.js`，基于注入的 pool.execute 封装 tableExists、list、findById、insert、update、delete。
8. 不写入真实数据库凭据，不连接真实数据库。
9. 最终运行 `npm test -- test/message-sql.test.js` 和 `npm test`，并提交。
```

## Task 4 修改文件

- `src/db/pool.js`
- `src/messages/sql.js`
- `src/messages/repository.js`
- `test/message-sql.test.js`
- `docs/codex/prompts/2026-05-04-03-message-registry-implementation.md`

## Task 4 验证命令

Task 4 按 TDD 顺序执行的关键验证命令：

```bash
npm test -- test/message-sql.test.js
npm test
git diff --name-only
git status --short --branch
```

RED 阶段验证结果：

```text
npm test -- test/message-sql.test.js
# fail 1
# reason: Error [ERR_MODULE_NOT_FOUND]: Cannot find module '.../src/messages/sql.js'
```

GREEN 阶段验证结果：

```text
npm test -- test/message-sql.test.js
# tests 6
# pass 6
```

最终验证结果：

```text
npm test -- test/message-sql.test.js
# tests 6
# pass 6

npm test
# tests 21
# pass 21
```

## Task 4 结果摘要

- 已新增 `src/messages/sql.js`，集中构造 `DEMO_MESSAGE` 的参数化 SQL。
- 已实现列表查询筛选：`TITLE LIKE ?`、`CREATOR_USERID = ?`、`ORDER BY CREATE_TIME DESC`、`LIMIT ? OFFSET ?`。
- 已实现计数查询，并复用列表筛选逻辑但不带分页参数。
- 已实现按 id 查询、插入、更新、删除和当前数据库下表存在性检查。
- 已将分页默认值设为 `page=1`、`pageSize=20`，并将 `pageSize` 上限限制为 `100`。
- 已新增 `src/db/pool.js`，通过 `mysql2/promise` 和 `loadConfig().db` 创建 MariaDB 连接池。
- 已新增 `src/messages/repository.js`，基于注入的 pool 封装留言数据访问方法，并将数据库字段映射为 demo 内部字段名。
- 已确认任务给出的测试实际包含 6 个 test case，最终按实际数量报告 6 个通过。

## Task 4 已知限制

- Task 4 没有连接真实 MariaDB，也没有读取 `.codex/project-record.local.md`。
- `repository.js` 当前只封装数据库访问，不实现标题长度、内容必填、作者权限、登录态或业务错误处理；这些留给后续 Task。
- `insert(...)` 和 `update(...)` 执行写入后会调用 `findById(...)` 返回最新记录，调用方需要确保传入的 pool 是可用的服务端数据库连接。
- 本归档不包含真实密钥、授权码、访问令牌、数据库密码或本机专用凭据。

## Task 4 代码质量审查修复

### 审查问题

Task 4 初始提交后，代码质量审查指出以下问题需要修正：

- `normalizePage(...)` 和 `normalizePageSize(...)` 使用 `parseInt`，会把 `2abc` 解析成 `2`。
- `TITLE LIKE ?` 没有转义 `%`、`_`、`\`，无法保证普通子串搜索语义。
- `repository.insert(...)` 和 `repository.update(...)` 依赖 `this.findById(...)`，解构调用或回调传递时会丢失 `this`。
- 缺少 repository 行为测试，未覆盖 fake pool 下的查询顺序、行映射、写后回读和删除返回值。
- `mysql2` pool 未设置 `dateStrings: true`，未来 `Date` 对象直出到 EJS 时可能产生展示不一致。
- 列表排序只按 `CREATE_TIME DESC`，同秒数据分页顺序不稳定。
- `buildWhere(...)` 对非 string filter 值直接 `.trim()`，会抛出 `trim is not a function`。

### 修复内容

- `test/message-sql.test.js` 新增严格分页测试，确认 `page='2abc'` 和 `pageSize='30xyz'` 会回退到 `page=1`、`pageSize=20`。
- `test/message-sql.test.js` 新增 `pageSize='150'` 上限测试，确认最大分页大小为 `100`。
- `test/message-sql.test.js` 新增 `%`、`_`、`\` 的 LIKE 转义测试，确认 SQL 使用 `LIKE ? ESCAPE '\\'`，参数使用转义后的普通子串模式。
- `test/message-sql.test.js` 新增非 string filter 测试，确认不会调用非法 `.trim()`。
- `src/messages/sql.js` 新增严格正整数校验，字符串必须全量匹配数字且大于 0；内部数字参数仍要求正整数。
- `src/messages/sql.js` 新增 LIKE 转义逻辑，将 `\`、`%`、`_` 转义为字面量搜索字符，并在 SQL 中声明 escape 字符。
- `src/messages/sql.js` 将列表排序调整为 `ORDER BY CREATE_TIME DESC, ID DESC`，保证同秒稳定分页。
- `src/messages/repository.js` 将 repository 方法改为闭包函数，`insert(...)` 和 `update(...)` 直接调用闭包内的 `findById(...)`，不再依赖动态 `this`。
- `test/message-repository.test.js` 新增 fake pool 行为测试，覆盖 `tableExists()`、`list()`、`findById()`、`insert()`、`update()`、`delete()` 和解构调用场景。
- `src/db/pool.js` 增加 `dateStrings: true`，并在测试中确认 pool 配置不会把 MariaDB 日期列直接转为 JS `Date`。

### 修复验证

RED 阶段验证结果：

```text
npm test -- test/message-sql.test.js test/message-repository.test.js
# tests 16
# pass 9
# fail 7
# failing reasons:
# - ORDER BY 缺少 ID DESC
# - page='2abc' 被解析为 2
# - LIKE SQL 缺少 ESCAPE '\\'
# - 非 string title 调用 .trim() 抛错
# - insert/update 解构调用时 this.findById 为空
```

补充 `dateStrings` 测试后的 RED 阶段验证结果：

```text
npm test -- test/message-repository.test.js
# tests 7
# pass 3
# fail 4
# additional failing reason: pool.pool.config.connectionConfig.dateStrings 为 false
```

GREEN 阶段验证结果：

```text
npm test -- test/message-sql.test.js test/message-repository.test.js
# tests 17
# pass 17
```

最终验证结果：

```text
npm test -- test/message-sql.test.js test/message-repository.test.js
# tests 17
# pass 17

npm test
# tests 32
# pass 32
```

### 修复限制

- 本次修复没有连接真实 MariaDB，repository 行为通过 fake pool 验证。
- `createDbPool(...)` 测试只创建并关闭 mysql2 pool，不执行查询，不读取真实环境变量。
- 本次修复不实现留言业务规则、路由、页面或 OAuth 流程。
- 本归档不包含真实密钥、授权码、访问令牌、数据库密码或本机专用凭据。

## Task 5 用户目标

实现留言业务服务层，在不连接真实数据库、不实现 Express 路由和页面的前提下，封装留言列表、查询、创建、更新、删除和批量删除的业务规则。服务层必须使用 Task 4 的 repository 形状，并负责标题/内容校验、当前用户校验、创建人写入和创建人权限判断。

## Task 5 Codex 任务提示词

```text
你正在实现 Task 5: 留言业务服务。

要求：
1. 只实现 Task 5，不实现后续路由、页面或 OAuth 接入。
2. 写入范围只限于 `src/messages/service.js`、`test/message-service.test.js`，并更新本滚动归档。
3. 采用 TDD 顺序：先写 `test/message-service.test.js`，运行 `npm test -- test/message-service.test.js` 确认缺少 `src/messages/service.js` 时失败。
4. 创建 `src/messages/service.js`，导出 `createMessageService`、`ValidationError`、`PermissionError`、`NotFoundError`。
5. `ValidationError.status=400`，`PermissionError.status=403`，`NotFoundError.status=404`。
6. `create(...)` 必须要求 `currentUser.userid`，校验并 trim `title` 和 `content`，标题最大 200 字符，并由服务端写入 `creatorUserid=currentUser.userid`。
7. `update(...)` 和 `delete(...)` 必须先查找留言，只有创建人可以修改或删除。
8. `deleteMany(...)` 必须复用同一条删除权限路径，但不要依赖动态 `this`；解构调用也必须可用。
9. 不写入真实密钥、授权码、访问令牌或数据库凭据。
10. 最终运行 `npm test -- test/message-service.test.js` 和 `npm test`。
```

## Task 5 修改文件

- `src/messages/service.js`
- `test/message-service.test.js`
- `docs/codex/prompts/2026-05-04-03-message-registry-implementation.md`

## Task 5 验证命令

Task 5 按 TDD 顺序执行的关键验证命令：

```bash
npm test -- test/message-service.test.js
npm test
git diff --name-only
git status --short --branch
```

RED 阶段验证结果：

```text
npm test -- test/message-service.test.js
# fail 1
# reason: Error [ERR_MODULE_NOT_FOUND]: Cannot find module '.../src/messages/service.js'
```

GREEN 阶段验证结果：

```text
npm test -- test/message-service.test.js
# tests 7
# pass 7
```

最终验证结果：

```text
npm test -- test/message-service.test.js
# tests 7
# pass 7

npm test
# tests 39
# pass 39
```

## Task 5 结果摘要

- 已新增 `src/messages/service.js`，通过注入的 `repository`、`idFactory` 和 `clock` 封装留言业务规则。
- 已导出 `ValidationError`、`PermissionError`、`NotFoundError`，并分别设置 HTTP 语义状态码 `400`、`403`、`404`。
- 已实现 `isReady()`：repository 提供 `tableExists()` 时委托检查，否则返回 `true`。
- 已实现 `list(filters)` 和 `findById(id)`；`findById(id)` 对缺失记录抛出 `NotFoundError`。
- 已实现 `create(input, currentUser)`：要求当前用户 `userid`，校验并修剪标题和内容，限制标题最大 200 字符，并强制写入服务端拥有的 `creatorUserid`。
- 已实现 `update(id, input, currentUser)`：记录必须存在，且只有 `creatorUserid` 匹配当前用户时允许更新。
- 已实现 `delete(id, currentUser)`：记录必须存在，且只有创建人可以删除；删除结果异常时按未找到处理。
- 已实现 `deleteMany(ids, currentUser)`：按顺序调用闭包内的 `deleteMessage(...)`，复用同一条权限路径，不依赖动态 `this`。
- 已新增 `test/message-service.test.js`，覆盖 readiness、创建人写入、空标题/内容拒绝、非对象输入拒绝、更新权限、删除权限和 `deleteMany` 解构调用。

## Task 5 已知限制

- Task 5 只实现留言业务服务层，不连接真实 MariaDB，不读取 `.codex/project-record.local.md`。
- Task 5 没有实现 Express 路由、OAuth 登录接入、EJS 页面、浏览器验证或真实 BPMT API 调用。
- 单元测试使用内存 fake repository，不写入真实数据库。
- `deleteMany(ids, currentUser)` 当前返回每条删除操作的布尔结果数组；后续路由层如果需要展示删除数量，可在路由层统计。
- 本归档不包含真实密钥、授权码、访问令牌、数据库密码或本机专用凭据。

## Task 5 审查后小修复

Task 5 规格审查和代码质量审查均通过。质量审查提醒业务错误 `message` 可能在后续统一错误页直接展示，因此将服务层默认错误文案和校验错误文案统一改为中文，并补充状态码与中文安全文案断言。

补充验证命令：

```bash
npm test -- test/message-service.test.js
npm test
```

补充验证结果：

```text
npm test -- test/message-service.test.js
# tests 8
# pass 8

npm test
# tests 40
# pass 40
```

## Task 6 用户目标

实现 BPMT OAuth 授权码登录模块，只交付 OAuth URL 构造、state 校验、token 换取、userinfo 获取、本地 session 工具和认证路由；不实现后续 Express 应用入口、留言路由、EJS 页面或 Docker。

## Task 6 Codex 任务提示词

```text
你是 Task 6 的实现代理。请在隔离 worktree 中直接编辑文件、运行测试并提交。

要求：
1. 只实现 Task 6，不实现 Task 7/8 的 Express 应用、留言路由、EJS 页面或 Docker。
2. 遵守 AGENTS.md，文案和文档使用中文，不能写入真实 client_secret、BPMT_API_APP_SECRET、授权 code、access_token、密码或数据库凭据。
3. 使用 TDD：先写 `test/oauth.test.js` 并确认失败，再实现 `src/auth/oauth.js`、`src/auth/session.js`、`src/auth/routes.js`。
4. `buildAuthorizeUrl(config, state)` 使用 `config.bpmtBaseUrl` 构造 `/oauth/authorize`，参数包含 `response_type=code`、`client_id`、`redirect_uri`、`state`。
5. `verifyState(expectedState, actualState)` 对缺失或不匹配抛出 `status=400` 的中文安全错误：`OAuth state 校验失败，请重新登录`。
6. `exchangeCodeForToken({ config, code, fetchImpl = fetch })` 使用表单 POST `/oauth/token`，并校验响应至少包含 `access_token`。
7. `fetchUserInfo({ config, accessToken, fetchImpl = fetch })` 使用 Bearer token GET `/oauth/userinfo`，并校验响应至少包含 `userid`。
8. OAuth HTTP 错误必须抛出带 HTTP 状态码的中文安全错误，错误信息不能泄露密钥、授权码、访问令牌或响应原文中的敏感值。
9. `parseResponse` 先读取 `text()` 再 `JSON.parse`，不要先 `json()` 再 `text()`。
10. session 只能保存 `userid`、`name`、`group`、`role`，不能保存 BPMT `access_token`。
11. `createAuthRouter({ express, config })` 实现 `GET /login`、`GET /oauth/callback`、`POST /logout`。
12. 最终运行 `npm test -- test/oauth.test.js`、`npm test` 和 `git status --short --branch`。
```

## Task 6 修改文件

- `src/auth/oauth.js`
- `src/auth/session.js`
- `src/auth/routes.js`
- `test/oauth.test.js`
- `docs/codex/prompts/2026-05-04-03-message-registry-implementation.md`

## Task 6 验证命令

Task 6 按 TDD 顺序执行的关键验证命令：

```bash
npm test -- test/oauth.test.js
npm test
git status --short --branch
```

RED 阶段验证结果：

```text
npm test -- test/oauth.test.js
# fail 1
# reason: Error [ERR_MODULE_NOT_FOUND]: Cannot find module '.../src/auth/oauth.js'
```

GREEN 阶段验证结果：

```text
npm test -- test/oauth.test.js
# tests 9
# pass 9
```

最终验证结果：

```text
npm test
# tests 49
# pass 49
```

## Task 6 结果摘要

- 已新增 `src/auth/oauth.js`，实现 BPMT 授权地址构造、OAuth state 校验、授权码换 token 和 Bearer token 获取用户信息。
- 已将 OAuth 响应解析统一为先读取 `response.text()`，再按需 `JSON.parse`，避免 fake response 或真实响应兼容问题。
- 已对 OAuth HTTP 错误输出中文安全错误，只包含调用阶段和 HTTP 状态码，不拼接响应原文，避免泄露密钥、授权码或访问令牌。
- 已对 token 和 userinfo 响应做必要字段校验：token 至少需要 `access_token`，userinfo 至少需要 `userid`。
- 已新增 `src/auth/session.js`，实现 `currentUser`、`saveUserSession`、`clearUserSession`、`requireLogin`；本地 session 只保存 `userid`、`name`、`group`、`role`。
- 已新增 `src/auth/routes.js`，实现 `GET /login` 生成并保存 state 后跳转 BPMT，`GET /oauth/callback` 完成 state 校验、token 换取、userinfo 获取和本地登录态写入，`POST /logout` 清理本地 session。
- 已新增 `test/oauth.test.js`，覆盖授权 URL、state 成功和失败、token form body、userinfo bearer、HTTP 错误脱敏、必要字段校验、session 不保存 token、`requireLogin` 和 callback 成功路径。

## Task 6 已知限制

- Task 6 只实现认证模块和单元测试，没有实现 Express 应用入口、留言路由、EJS 页面、Docker 镜像或浏览器端 OAuth 联调。
- 单元测试使用 fake `fetch` 和测试 session，不访问真实 BPMT 实例，不读取 `.codex/project-record.local.md`。
- 测试中出现的 `client-secret`、`code-1`、`token-1` 均为占位测试值，不是真实 OAuth 密钥、授权码或访问令牌。
- 本归档不包含真实 client secret、BPMT API app secret、授权码、访问令牌、数据库密码或本机专用凭据。

## Task 6 审查后修复

代码质量审查发现 OAuth 登录成功后直接把匿名 session 升级为登录 session，未重新生成 session，存在 session fixation 风险。本次修复保持原 OAuth state 校验、token 换取和 userinfo 获取语义不变，在 userinfo 成功后、写入本地用户会话前调用 `req.session.regenerate(...)`。如果 state 校验、token 换取、userinfo 获取或 session regenerate 任一步失败，都不会写入已登录用户 session。

补充修改文件：

- `src/auth/routes.js`
- `test/oauth.test.js`
- `docs/codex/prompts/2026-05-04-03-message-registry-implementation.md`

补充验证命令：

```bash
npm test -- test/oauth.test.js
npm test
git status --short --branch
```

补充 TDD 验证结果：

```text
npm test -- test/oauth.test.js
# RED: callback 成功路径新增断言失败，regenerate 调用次数为 0

npm test -- test/oauth.test.js
# GREEN: tests 9
# pass 9

npm test
# tests 49
# pass 49
```

补充结果摘要：

- 已新增路由内 `regenerateSession(req)` Promise 包装，避免在 `saveUserSession(req, userInfo)` 前复用旧匿名 SID。
- 已补充 callback 成功路径测试，使用中间件包装 `req.session.regenerate`，断言登录成功时 regenerate 被调用 1 次，且 callback 完成后仍能读取本地用户 session。
- 已确认 `saveUserSession` 仍只保存 `userid`、`name`、`group`、`role`，不保存 BPMT `access_token`。

## Task 7 审查后小修复

Task 7 规格审查和代码质量审查均通过。质量审查建议补充两个显式回归用例，避免后续 UI 或路由重排时破坏登录保护和 flash 消费语义。本次补充：

- 匿名用户访问留言详情、新增、更新、删除和批量删除路由时均重定向 `/login`。
- POST 成功后的 flash 只在下一次首页访问展示一次，第二次访问不再展示。

补充验证命令：

```bash
npm test -- test/message-routes.test.js
npm test
```

补充验证结果：

```text
npm test -- test/message-routes.test.js
# tests 12
# pass 12

npm test
# tests 61
# pass 61
```
- 本次修复不包含真实密钥、授权码、访问令牌、密码或数据库凭据。

## Task 7 用户目标

实现 Express 应用装配和留言登记路由，打通 OAuth 本地登录态、留言 service、基础 EJS 页面和统一错误页。Task 7 只交付最低可用服务端渲染页面和路由行为，不实现 Task 8 的完整 BPMT 风格 UI，不做 Docker 或 README。

## Task 7 Codex 任务提示词

```text
你是 Task 7 的实现代理。请在隔离 worktree 中直接编辑文件、运行测试并提交。

要求：
1. 只实现 Task 7，不做 Task 8 的完整 BPMT 风格 UI，不做 Docker/README。
2. 遵守 AGENTS.md，所有用户可见文案和文档使用中文，不能写入真实 client_secret、BPMT_API_APP_SECRET、授权 code、access_token、密码或数据库凭据。
3. 使用 TDD：先写测试确认失败，再实现，再运行目标测试和全量测试。
4. `src/messages/routes.js` 导出 `createMessageRouter({ express, service })`。
5. 首页 `GET /` 必须 `requireLogin`，匿名用户重定向 `/login`；登录后解析 `title`、`creatorUserid`、`page`、`pageSize`，检查 `service.isReady()`，渲染 `messages/index`。
6. 留言详情、新增、更新、删除、批量删除路由均需 `requireLogin`，成功后设置中文 flash 并重定向 `/`。
7. 路由错误统一 `next(error)`，保留业务错误 `status`。
8. `src/app.js` 导出 `createApp({ appConfig = loadConfig(), messageService } = {})`，配置 EJS、body parser、`/static`、session、auth router、message router 和错误页。
9. 测试注入 `messageService` 时不能创建真实 DB 连接。
10. `src/server.js` 加载配置、创建 app 并监听端口，输出服务启动信息和脱敏配置。
11. 创建最低可用 EJS 视图以通过路由测试。
12. 更新滚动提示词归档，最终运行 `npm test -- test/message-routes.test.js`、`npm test`、`git status --short --branch` 并提交。
```

## Task 7 修改文件

- `src/app.js`
- `src/server.js`
- `src/messages/routes.js`
- `views/layout.ejs`
- `views/messages/index.ejs`
- `views/messages/modal.ejs`
- `views/error.ejs`
- `test/message-routes.test.js`
- `docs/codex/prompts/2026-05-04-03-message-registry-implementation.md`

## Task 7 验证命令

Task 7 按 TDD 顺序执行的关键验证命令：

```bash
npm test -- test/message-routes.test.js
npm test
git status --short --branch
```

RED 阶段验证结果：

```text
npm test -- test/message-routes.test.js
# fail 1
# reason: Error [ERR_MODULE_NOT_FOUND]: Cannot find module '.../src/app.js'
```

GREEN 阶段验证结果：

```text
npm test -- test/message-routes.test.js
# tests 10
# pass 10

npm test
# tests 59
# pass 59
```

## Task 7 结果摘要

- 已新增 `src/messages/routes.js`，实现首页、详情 modal、新增、更新、删除、批量删除留言路由。
- 首页已接入 `requireLogin`；匿名访问重定向 `/login`，登录用户访问时解析筛选条件并调用 `service.list(filters)`。
- 首页在 `service.isReady()` 存在且返回 `false` 时不查询列表，改为渲染 `DEMO_MESSAGE` 初始化提示。
- 首页渲染传入 `title='留言登记'`、`user`、`filters`、`result`、`setupRequired`、`flash`，并在渲染前消费和清理 `req.session.flash`。
- 所有写操作成功后设置中文 flash：`留言已新增`、`留言已更新`、`留言已删除`、`选中留言已删除`，然后重定向 `/`。
- 批量删除兼容单个字符串 `ids` 和数组 `ids`。
- 已新增 `src/app.js`，配置 EJS 视图、表单和 JSON body parser、`/static` 静态资源、`express-session`、OAuth auth router、留言 router 和统一错误页。
- `createApp(...)` 在注入 `messageService` 时不创建 DB pool；未注入时才创建 DB pool、repository 和 message service。
- session 名称为 `bpmt_oauth_demo_sid`，cookie 使用 `httpOnly`、`sameSite='lax'`，生产环境启用 `secure`。
- 错误页对 `status >= 500` 展示 `系统暂时不可用，请稍后重试`，对 4xx 展示业务错误 message。
- 已新增 `src/server.js`，显式加载 `.env`，创建 app 后监听 `config.port`，并输出启动端口和脱敏配置。
- 已创建最低可用 EJS 页面，后续 Task 8 可在此基础上替换为完整 BPMT 风格 UI。

## Task 7 已知限制

- Task 7 只实现最低可用服务端页面，不包含 Task 8 的完整 BPMT 风格视觉、交互细节或前端增强。
- Task 7 没有做真实浏览器 OAuth 联调，也没有连接本机 BPMT 实例或 MariaDB；路由测试通过注入 fake `messageService` 验证行为。
- `views/layout.ejs` 当前作为基础模板归档，未引入额外 layout 中间件；页面视图自身保持完整 HTML，便于 Task 8 后续替换。
- `src/server.js` 仅在运行时打印 `redactConfig(config)` 的脱敏结果，不输出真实密钥、授权码、访问令牌、密码或数据库凭据。
- 本归档不包含真实 client secret、BPMT API app secret、授权码、访问令牌、数据库密码或本机专用凭据。

## Task 8 用户目标

实现 BPMT 风格页面和前端交互，只替换留言登记页面、弹窗、错误页、静态 CSS/JS 和必要测试，不做 Docker、README 或真实 BPMT 联调。页面需要适合作为 iframe 嵌入 BPMT，风格接近业务系统的灰色渐变面板、查询条件区、工具条、表格和分页条。

## Task 8 Codex 任务提示词

```text
你是 Task 8 的实现代理。请在隔离 worktree 中直接编辑文件、运行测试并提交。

要求：
1. 只实现 Task 8，不做 Docker、README、真实 BPMT 联调。
2. 全中文用户可见文案和文档；不写入真实 client_secret、BPMT_API_APP_SECRET、授权 code、access_token、密码或数据库凭据。
3. 将 `views/messages/index.ejs` 替换为 BPMT 风格页面，包含顶部登录信息和退出按钮、面板标题“留言登记”、查询区、查询/重置按钮、表格、行内操作、新增/批量删除工具条、分页条、dialog 容器和隐藏 delete form。
4. 查询区字段为标题(模糊)、创建者，并保留 pageSize hidden。
5. 表格列为 checkbox、操作、标题、内容摘要、创建者、创建时间、更新时间。
6. 只有当前登录用户是创建人时才允许勾选、编辑、删除；其他人的编辑/删除按钮 disabled，并有中文 title。
7. 内容摘要长度受控，EJS 输出保持默认转义，不用未转义内容展示用户输入。
8. setupRequired 时显示初始化提示，包含 `DEMO_MESSAGE` 和 `npm run setup`。
9. `views/messages/modal.ejs` 支持 create/edit/view 三种 mode，create action `/messages`，edit action `/messages/:id/update`，view readonly，不展示 access token 或敏感信息。
10. `views/error.ejs` 使用同一 BPMT 风格 CSS，显示系统提示和返回首页按钮。
11. `public/scripts/messages.js` 实现 openCreateDialog、openViewDialog、openEditDialog、closeDialog、deleteOne、toggleAllRows、confirmBulkDelete，并挂到 window；删除和批量删除使用中文 confirm/alert。
12. `public/styles/bpmt.css` 实现简洁灰色 BPMT 风格，注意 iframe 内自适应、按钮和单元格文本不溢出，移动端基本可用。
13. 保持现有 Task 7 路由测试通过，并补充必要测试。
14. 追加滚动归档 Task 8 内容。
```

## Task 8 修改文件

- `views/messages/index.ejs`
- `views/messages/modal.ejs`
- `views/error.ejs`
- `public/styles/bpmt.css`
- `public/scripts/messages.js`
- `test/message-routes.test.js`
- `docs/codex/prompts/2026-05-04-03-message-registry-implementation.md`

## Task 8 验证命令

按 TDD 顺序执行的关键验证命令：

```bash
npm test -- test/message-routes.test.js
npm test
git status --short --branch
```

RED 阶段验证结果：

```text
npm test -- test/message-routes.test.js
# tests 14
# pass 10
# fail 4
# 失败点：首页缺少 BPMT 静态资源和权限态、modal 不支持 create/view readonly、错误页未加载统一 CSS。
```

GREEN 阶段验证结果：

```text
npm test -- test/message-routes.test.js
# tests 14
# pass 14
```

## Task 8 结果摘要

- 已将留言首页替换为 BPMT 风格业务页面，包含顶部登录信息、退出 demo、灰色渐变面板标题、查询条件区、工具条、表格、分页条、dialog 容器和隐藏删除表单。
- 查询区保留 `title`、`creatorUserid` 和隐藏 `pageSize`，重置按钮返回首页。
- 表格列已调整为 checkbox、操作、标题、内容摘要、创建者、创建时间、更新时间。
- 当前登录用户为创建人时可勾选、编辑和删除；非创建人记录不可勾选，编辑/删除按钮禁用并显示中文 `title`。
- 内容摘要在模板中限制为 80 字符；标题、内容、创建者等用户输入仍使用 EJS 默认转义输出。
- 初始化缺失时展示 `DEMO_MESSAGE` 和 `npm run setup` 提示，不查询留言列表。
- 弹窗视图支持 create/edit/view 三种模式；新增提交到 `/messages`，编辑提交到 `/messages/:id/update`，查看模式为 readonly 且不展示敏感信息。
- 错误页接入同一 `bpmt.css`，展示系统提示、状态码、错误信息和返回首页按钮。
- 已新增 `public/scripts/messages.js`，实现新增、查看、编辑弹窗、关闭、单条删除、全选可删除行和批量删除确认。
- 已新增 `public/styles/bpmt.css`，实现灰色 BPMT 风格、表格横向滚动、文本截断、按钮自适应和移动端基本布局。

## Task 8 已知限制

- 本任务只做页面和前端交互增强，没有修改 OAuth、留言 service、数据库、Docker 或 README。
- 本任务没有做真实 BPMT iframe 嵌入视觉验收，也没有连接本机 BPMT 实例或 MariaDB。
- 新增弹窗由前端内联 HTML 构造；查看和编辑弹窗通过 fetch 读取服务端 modal HTML。
- 行内按钮的 record id 来自服务端记录，当前沿用已有留言 id 约束；用户可见标题和内容仍由 EJS 默认转义保护。
- 本归档不包含真实 client secret、BPMT API app secret、授权码、访问令牌、数据库密码或本机专用凭据。

## Task 9 用户目标

为留言登记 demo 补齐 Docker 镜像构建文件、中文 README 运行说明和提示词归档。Task 9 只做 Docker、README 和归档，不做真实环境 OAuth 或 CRUD 联调。

## Task 9 Codex 任务提示词

```text
你是 Task 9 的实现代理。请在隔离 worktree 中直接编辑文件、运行测试并提交。你不是独自在代码库中工作；不要回退、覆盖或重写他人已提交的改动，只在本任务写入范围内增量修改。

工作目录：/Users/wenzhewang/workspace/bpmt_project/bpmt-oauth-demo/.worktrees/message-registry

必须遵守：
- 全中文文档。
- 遵守 AGENTS.md，不得写入真实 client_secret、BPMT_API_APP_SECRET、授权 code、access_token、密码或数据库凭据。
- 只实现 Task 9，不做真实环境 OAuth/CRUD 联调。
- 最后提交，提交信息建议：`docs: 添加运行和 Docker 说明`。

Task 9：Docker、README 和提示词归档

写入范围：
- Create: Dockerfile
- Create: .dockerignore
- Create/Modify: README.md
- Modify: docs/codex/prompts/2026-05-04-03-message-registry-implementation.md
- 可选小修复：如果浏览器验证噪音来自 favicon 404，可在 app 层加一个 `/favicon.ico` 204 响应并补测试；若做此项，说明原因并纳入提交。不要扩大到其他功能。
```

## Task 9 修改文件

- `Dockerfile`
- `.dockerignore`
- `README.md`
- `docs/codex/prompts/2026-05-04-03-message-registry-implementation.md`

## Task 9 验证命令

```bash
npm test
docker build -t bpmt-oauth-demo:local .
rg -n "(client_secret|BPMT_API_APP_SECRET|BPMT_OAUTH_CLIENT_SECRET|access_token|authorization code|授权码|密码|DB_PASSWORD)\\s*[:=]\\s*[^<\\s]" README.md Dockerfile .dockerignore docs/codex/prompts/2026-05-04-03-message-registry-implementation.md
git status --short --branch
```

## Task 9 结果摘要

- 已新增 `.dockerignore`，忽略 `.git`、`.codex`、`.superpowers`、`.worktrees`、`node_modules`、npm debug、`.DS_Store`、`.env`、`.env.*`，并通过 `!.env.example` 保留示例环境文件。
- 已新增 `Dockerfile`，使用 `node:20-alpine` 多阶段构建，安装 production 依赖，复制 `package.json`、`package-lock.json`、`src`、`views`、`public` 和 `scripts`，容器监听 `81` 端口并以 `npm start` 启动。
- 已新增中文 `README.md`，包含项目说明、功能、环境变量、初始化表结构、本地运行、Docker 运行、安全提醒和验证命令。
- README 明确 OAuth 回调地址为 `http://localhost:81/oauth/callback`，系统不维护用户密码，新增留言创建人由服务端写入当前 BPMT `userid`，退出只清理 demo 本地 session，不承诺退出 BPMT 登录态。
- README 明确本 demo 不实现 OIDC、refresh token 或跨系统单点登出。
- 本任务没有修改 OAuth、留言 CRUD、数据库或页面交互代码；未执行真实环境 OAuth/CRUD 联调。

## Task 9 已知限制

- Docker 运行依赖外部环境变量和可访问的 BPMT、MariaDB 服务；不同 Docker 网络环境下可能需要调整 `.env` 中的主机名。
- Docker 验证只构建镜像，不启动容器做真实 OAuth 登录或 CRUD 联调。
- 未添加 `/favicon.ico` 204 响应，因为本任务未执行浏览器验证，也没有发现 favicon 404 噪音证据。
- 本归档不包含真实 client secret、BPMT API app secret、授权码、访问令牌、数据库密码或本机专用凭据。

## Task 10 用户目标

对留言登记表 demo 做真实本机验证和收口，覆盖 BPMT API 初始化、81 端口启动、BPMT OAuth 登录、留言新增/查看/编辑/删除、Docker 构建和 Docker 运行形态。

## Task 10 Codex 任务提示词

```text
你正在执行 Task 10: 真实环境验证和收口。

要求：
1. 检查本机配置来源，只输出存在性，不打印密钥。
2. 使用本机未跟踪记录生成 worktree 专用 `.env`，`.env` 必须被 `.gitignore` 忽略。
3. 执行 `npm run setup` 初始化 `DEMO_MESSAGE`。
4. 启动 81 端口服务，使用浏览器验证 BPMT OAuth 登录和留言 CRUD。
5. 运行 `npm test`、`docker build -t bpmt-oauth-demo:local .` 和敏感赋值扫描。
6. 验证 Docker 运行形态；如果发现 Docker 内部访问 BPMT/MariaDB 的地址与浏览器访问地址冲突，补充向后兼容配置。
7. 追加中文归档，不写入真实 client secret、BPMT API app secret、授权 code、access token、密码或数据库凭据。
```

## Task 10 修改文件

- `src/config.js`
- `src/auth/oauth.js`
- `.env.example`
- `README.md`
- `test/config.test.js`
- `test/oauth.test.js`
- `docs/codex/prompts/2026-05-04-03-message-registry-implementation.md`

## Task 10 验证命令

```bash
test -f .env && echo ".env exists" || echo ".env missing"
test -f .codex/project-record.local.md && echo "local record exists" || echo "local record missing"
curl -fsS -o /dev/null -w 'bpmt_root_http=%{http_code}\n' http://localhost/ || true
curl -fsS -o /tmp/bpmt-openapi-check.json -w 'openapi_http=%{http_code}\n' http://127.0.0.1/api/openapi.json || true
npm run setup
npm start
npm test
docker build -t bpmt-oauth-demo:local .
docker run --rm --name bpmt-oauth-demo-verify --env-file .env \
  -e BPMT_SERVER_BASE_URL=http://docker.for.mac.localhost \
  -e BPMT_API_BASE_URL=http://docker.for.mac.localhost/api \
  -e DB_HOST=docker.for.mac.localhost \
  -p 81:81 bpmt-oauth-demo:local
rg -n "(BPMT_OAUTH_CLIENT_SECRET|BPMT_API_APP_SECRET|DB_PASSWORD|access_token|client_secret)=[^<\\s][^\\s]*" . --glob '!node_modules/**' --glob '!.env' --glob '!package-lock.json'
```

## Task 10 结果摘要

- 隔离 worktree 初始没有 `.env` 和 `.codex/project-record.local.md`；主仓库存在被忽略的 `.codex/project-record.local.md`。
- 已从主仓库本机记录生成 worktree 专用 `.env`，并确认 `.env` 被 `.gitignore` 忽略，权限为 `600`。
- 本机 BPMT 可访问：`http://localhost/` 返回 `200`，`http://127.0.0.1/api/openapi.json` 返回 `200`。
- `npm run setup` 成功，输出 `DEMO_MESSAGE 已创建` 和 `BPMT demo 表结构初始化完成`。
- `npm start` 成功监听 `81` 端口，日志中的 session、OAuth、BPMT API 和数据库密码均为 `<redacted>`。
- 浏览器真实验证通过：打开 `http://localhost:81/` 后跳转 BPMT 登录页，使用本机测试账号登录后回到留言首页。
- Host 运行形态 CRUD 验证通过：新增 `OAuth demo 测试留言`，列表创建者为 `admin`，查看弹窗展示完整内容，编辑为 `OAuth demo 测试留言-已编辑`，删除后列表回到 `暂无留言`。
- `npm test` 通过，`63/63`。
- `docker build -t bpmt-oauth-demo:local .` 通过。
- Docker 验证时发现容器内服务端访问 BPMT 的地址和浏览器访问 BPMT 的地址需要分离；已新增可选 `BPMT_SERVER_BASE_URL`，默认等于 `BPMT_BASE_URL`，保持本机兼容。
- 使用 Docker Desktop 本机可达内部地址 `docker.for.mac.localhost` 启动容器后，容器内 OpenAPI 检查返回 `200`。
- Docker 运行形态真实验证通过：容器监听 `81`，浏览器经 BPMT OAuth 回到 demo 首页；新增 `Docker OAuth demo 测试留言`，查看、编辑为 `Docker OAuth demo 测试留言-已编辑`、删除均成功。
- 敏感赋值扫描无命中。

## Task 10 已知限制

- Docker 内访问宿主机服务的主机名与 Docker Desktop / Linux Docker / Compose 网络有关。本机验证使用 `docker.for.mac.localhost`；其他环境可使用 `host.docker.internal` 或 Compose 服务名。
- `BPMT_BASE_URL` 是浏览器可访问 BPMT 的外部地址；`BPMT_SERVER_BASE_URL` 是 demo 服务端可访问 BPMT token/userinfo 的内部地址。未配置 `BPMT_SERVER_BASE_URL` 时默认复用 `BPMT_BASE_URL`。
- 本 demo 不实现 OIDC、refresh token、跨系统单点登出、附件、评论或复杂角色权限。
- 本归档不包含真实 client secret、BPMT API app secret、授权码、访问令牌、数据库密码或本机专用凭据。
