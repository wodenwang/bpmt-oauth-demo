# AGENTS.md

本仓库是通过 Codex 构建的 `bpmt-lite` OAuth 对接示例项目。

## 项目目标

- 本 demo 用于验证 `bpmt-lite` 的 OAuth 第三方鉴权登录能力。
- 本 demo 必须严格遵照官方 `bpmt-lite` OAuth 集成流程实现。
- 本仓库必须保留完整、结构化的 Codex 提示词，方便后续用户查阅、复用和改造。
- 除非上游 `bpmt-lite` 文档新增能力，否则不要自行发明 OAuth 变体、OIDC 流程、refresh token 流程或自定义 BPMT 端点。

## 协作和文档语言

- 本项目与 Codex 的对话默认使用中文。
- 本项目所有文档默认使用中文编写。
- 技术标识、命令、URL、端点、参数名、错误码、文件名和代码片段可以保留英文原文。
- 提示词归档也必须使用中文说明上下文、执行过程、验证结果和限制。

## 决策依据

做实现或架构判断时，按以下顺序查阅：

1. 本仓库的 `AGENTS.md`。
2. 上游 OAuth 集成文档：
   `https://github.com/wodenwang/bpmt-doc/blob/main/docs/11.OAuth%E7%AC%AC%E4%B8%89%E6%96%B9%E7%99%BB%E5%BD%95/README.md`
3. 本机正在运行的 BPMT 实例和数据库。
4. 本仓库已有实现模式。

## 仓库信息

- 线上仓库：`https://github.com/wodenwang/bpmt-oauth-demo`
- 默认分支：`main`

## 本机 BPMT 测试环境

- BPMT 基础地址：`http://localhost`
- 本地 BPMT OpenAPI 文档：`http://127.0.0.1/api/openapi.json`
- OAuth 授权端点：`http://localhost/oauth/authorize`
- OAuth 换 token 端点：`http://localhost/oauth/token`
- OAuth 用户信息端点：`http://localhost/oauth/userinfo`
- BPMT 中配置的 demo 回调地址：`http://localhost:81/oauth/callback`
- MariaDB 地址和端口：`localhost:3306`
- 数据库名：`bpmt`

密钥和本机专用凭据不进入 Git 跟踪。本机精确信息见：

- `.codex/project-record.local.md`

## OAuth 客户端

- `client_id`：`bpmt-oauth-demo`
- `client_secret`：仅保存在 `.codex/project-record.local.md`
- 已登记回调地址：`http://localhost:81/oauth/callback`

## BPMT API 调用签名

后续如果 demo 需要调用 BPMT 普通 API，优先参考本地 OpenAPI 文档：

- `http://127.0.0.1/api/openapi.json`

本机 API 签名配置：

- `BPMT_API_APP_KEY`：`bpmt-api`
- `BPMT_API_APP_SECRET`：仅保存在 `.codex/project-record.local.md`
- `BPMT_API_ACT_AS`：`admin`

## 必须实现和验证的 OAuth 流程

实现并验证授权码登录流程：

1. 用户打开 demo 应用。
2. demo 应用将浏览器跳转到 BPMT `/oauth/authorize`。
3. 如果用户尚未登录 BPMT，由 BPMT 负责展示登录页并完成登录。
4. BPMT 校验 `client_id`、精确匹配的 `redirect_uri` 和用户权限。
5. BPMT 携带 `code` 和可选 `state` 回跳 demo 的 `/oauth/callback`。
6. demo 应用使用 `grant_type=authorization_code` 调用 `POST /oauth/token`。
7. demo 应用收到 `access_token` 和 `userid` 后，建立自己的本地会话。
8. demo 应用使用 `Authorization: Bearer <access_token>` 调用 `GET /oauth/userinfo`。
9. demo 应用展示已登录的 BPMT 用户信息，并提供退出 demo 本地会话的路径。

## 安全规则

- 不要把 `client_secret`、`BPMT_API_APP_SECRET`、授权 `code`、`access_token`、密码或数据库凭据写入浏览器可见代码、公开文档或日志。
- `client_secret` 只能保存在服务端。
- `BPMT_API_APP_SECRET` 只能保存在服务端。
- 回调地址必须精确匹配。当前已登记回调地址是 `http://localhost:81/oauth/callback`。
- 不要把 BPMT 的 `access_token` 当作 demo 应用的永久会话。demo 应用必须建立自己的本地会话。
- 如果被 Git 跟踪的文档需要提到 client secret，使用 `<BPMT_OAUTH_CLIENT_SECRET>` 这类占位符。
- 如果被 Git 跟踪的文档需要提到 API app secret，使用 `<BPMT_API_APP_SECRET>` 这类占位符。

## Codex 提示词归档要求

每次有意义的实现或验证步骤，都应在以下目录新增提示词记录：

- `docs/codex/prompts/`

提示词记录应包含：

- 用户目标
- Codex 任务提示词
- 环境假设
- 修改文件
- 验证命令
- 结果摘要
- 已知限制

提示词应便于初学者理解和复用。不要在被 Git 跟踪的提示词记录中写入密钥。
