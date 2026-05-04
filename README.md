# bpmt-oauth-demo

`bpmt-oauth-demo` 是用于验证 `bpmt-lite` OAuth 第三方鉴权登录能力的示例应用。应用通过 BPMT OAuth 授权码流程登录用户，在 demo 侧建立本地 session，并提供一个最小留言登记页面用于验证登录后的业务操作。

本项目严格遵照 BPMT OAuth 第三方登录流程：浏览器跳转到 BPMT `/oauth/authorize`，回调到 demo `/oauth/callback`，服务端使用授权码调用 `/oauth/token`，再用 Bearer token 调用 `/oauth/userinfo` 读取当前 BPMT 用户信息。OAuth 回调地址必须精确配置为：

```text
http://localhost:81/oauth/callback
```

## 功能

- BPMT OAuth 授权码登录入口和回调处理。
- demo 本地 session，不把 BPMT `access_token` 当作永久会话。
- 登录后展示 BPMT 返回的 `userid`、姓名、组织和角色基础信息。
- 留言登记列表、查询、新增、查看、编辑、删除和批量删除。
- 新增留言的创建人由服务端写入当前 BPMT `userid`，浏览器提交的创建人字段不会作为可信来源。
- 修改和删除只允许留言创建人执行。
- `npm run setup` 初始化 BPMT 动态表 `DEMO_MESSAGE` 并执行 DDL 同步。

## 不包含的能力

- 系统不维护 BPMT 用户密码，也不提供独立用户密码登录。
- 退出按钮只退出 demo 本地 session，不承诺退出 BPMT 登录态。
- 不实现 OIDC、`id_token`、refresh token 或跨系统单点登出。
- 不自定义 BPMT OAuth 端点，不扩展官方流程之外的授权模式。

## 环境变量

先复制示例配置，再按本机环境填写占位符：

```bash
cp .env.example .env
```

必要变量如下，密钥请只写入本机 `.env` 或运行环境，不要提交到 Git：

| 变量 | 说明 |
| --- | --- |
| `NODE_ENV` | 运行环境，本地开发通常为 `development` |
| `PORT` | demo 监听端口，默认 `81` |
| `SESSION_SECRET` | demo 本地 session 签名密钥，使用本机私有值 |
| `BPMT_BASE_URL` | BPMT 基础地址，本机默认 `http://localhost` |
| `BPMT_OAUTH_CLIENT_ID` | BPMT 登记的 OAuth 客户端标识，默认 `bpmt-oauth-demo` |
| `BPMT_OAUTH_CLIENT_SECRET` | BPMT 生成的 OAuth 客户端密钥，使用 `<BPMT_OAUTH_CLIENT_SECRET>` 占位符替换 |
| `BPMT_OAUTH_REDIRECT_URI` | 必须为 `http://localhost:81/oauth/callback` |
| `BPMT_API_BASE_URL` | BPMT OpenAPI 基础地址，本机默认 `http://127.0.0.1/api` |
| `BPMT_API_APP_KEY` | BPMT API app key，默认 `bpmt-api` |
| `BPMT_API_APP_SECRET` | BPMT API app secret，使用 `<BPMT_API_APP_SECRET>` 占位符替换 |
| `DB_HOST` | MariaDB 主机 |
| `DB_PORT` | MariaDB 端口，默认 `3306` |
| `DB_USER` | MariaDB 用户 |
| `DB_PASSWORD` | MariaDB 密码，使用本机私有值 |
| `DB_NAME` | MariaDB 数据库名，默认 `bpmt` |

`.env.example` 只包含占位符，不包含真实 `client_secret`、`BPMT_API_APP_SECRET`、授权码、访问令牌、密码或数据库凭据。

## 初始化表结构

初始化命令会读取服务端环境变量，使用 BPMT API 签名调用 OpenAPI 创建 `DEMO_MESSAGE` 动态表。如果表已存在，脚本会把 `409 Conflict` 视为已初始化并继续执行 DDL 同步。

```bash
npm run setup
```

初始化前请确认：

- BPMT 服务可访问。
- `BPMT_API_APP_KEY` 和 `BPMT_API_APP_SECRET` 已配置。
- MariaDB 中可访问 `bpmt` 数据库。
- OAuth 客户端已在 BPMT 后台登记，回调地址精确为 `http://localhost:81/oauth/callback`。

## 本地运行

安装依赖：

```bash
npm install
```

复制并填写本机配置：

```bash
cp .env.example .env
```

初始化表结构：

```bash
npm run setup
```

启动应用：

```bash
npm start
```

打开：

```text
http://localhost:81
```

开发时可使用：

```bash
npm run dev
```

## Docker 运行

构建镜像：

```bash
docker build -t bpmt-oauth-demo:local .
```

使用 `.env` 运行容器：

```bash
docker run --rm --name bpmt-oauth-demo \
  --env-file .env \
  -p 81:81 \
  bpmt-oauth-demo:local
```

如果容器内访问宿主机上的 BPMT 或 MariaDB，请按 Docker 环境调整 `.env` 中的主机名。例如 Docker Desktop 场景可评估使用 `host.docker.internal` 访问宿主机服务；但 OAuth 回调地址仍必须保持 `http://localhost:81/oauth/callback`，并与 BPMT 后台登记值完全一致。

容器内应用监听 `81` 端口，镜像启动命令为：

```bash
npm start
```

## 安全提醒

- 不要把 `client_secret`、`BPMT_API_APP_SECRET`、授权 `code`、`access_token`、密码或数据库凭据写入前端代码、公开文档、Git 提交或日志。
- `client_secret`、`BPMT_API_APP_SECRET` 和数据库密码只能放在服务端环境变量中。
- BPMT OAuth 授权码只能一次性使用，不要刷新旧回调页反复提交。
- demo 只保存自己的本地 session，session 中不保存 BPMT `access_token`。
- 日志中的配置输出必须保持脱敏。

## 验证

运行自动化测试：

```bash
npm test
```

构建 Docker 镜像：

```bash
docker build -t bpmt-oauth-demo:local .
```

检查工作区：

```bash
git status --short --branch
```
