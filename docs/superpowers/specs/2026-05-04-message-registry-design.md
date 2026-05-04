# 留言登记表功能设计

## 背景

本项目是 `bpmt-lite` OAuth 对接示例项目。新增功能是一个独立运行的留言登记表系统，用于验证第三方系统通过 BPMT OAuth 登录后，使用当前 BPMT 用户身份创建和管理业务数据。

本设计遵守本仓库 `AGENTS.md`、上游 BPMT OAuth 文档和本机 BPMT OpenAPI 约束。项目对话和文档默认使用中文；技术标识、端点、参数名、文件名和代码片段可保留英文。

## 已确认需求

- 系统自身不实现独立登录鉴权模块，登录必须通过 BPMT OAuth 授权码流程。
- 登录成功后，留言创建人固定为当前 BPMT 登录态返回的 `userid`。
- 首页就是留言列表页面，不提供独立欢迎页。
- 页面最终会通过外部链接或 iframe 嵌入 BPMT，因此 UI 需要贴近 BPMT 现有灰色查询区、工具条、表格和分页风格。
- 表结构必须通过 BPMT API 创建和管理，命名统一使用 `DEMO_` 前缀。
- 项目最终运行在 `81` 端口，因为 BPMT 第三方系统已登记回调地址 `http://localhost:81/oauth/callback`。
- 当前先使用独立 Docker 运行，未来可融入 BPMT Docker Compose。
- 业务行 CRUD 运行期直连 BPMT 的 MariaDB 数据库。

## 方案选择

### 推荐并采用：Express 服务端渲染 + MariaDB 数据访问层

Node.js + Express 负责 OAuth 登录、session、页面渲染和表单接口。初始化命令通过 BPMT API 创建或同步 `DEMO_` 动态表；应用运行期通过服务端数据访问层直连 MariaDB 完成留言 CRUD。

采用该方案的原因：

- Docker 镜像和项目结构轻量，适合示例项目。
- `client_secret`、`BPMT_API_APP_SECRET`、数据库凭据和 OAuth token 都只在服务端处理。
- 服务端渲染更容易做出 BPMT 传统表格页风格。
- 数据访问层边界清楚，未来并入 BPMT Compose 或替换为其它数据访问方式时影响范围较小。

### 未采用方案

- Express + 小型前端 SPA：交互更灵活，但复杂度更高，且不如服务端渲染贴近 BPMT 传统页面。
- 全量通过 BPMT API 做 CRUD：边界更统一，但当前需求已明确运行期 CRUD 直连 MariaDB。

## 架构

应用由以下模块组成：

- `auth`：发起 BPMT OAuth 登录、处理 `/oauth/callback`、校验 `state`、换取 token、读取 userinfo、建立和退出本地 session。
- `bpmtApi`：封装 BPMT OpenAPI 签名调用，只用于初始化命令创建或同步表结构。
- `messageRepo`：封装 MariaDB 参数化 SQL，提供留言查询、新增、详情、更新、删除。
- `messageService`：执行业务校验、创建人写入、编辑删除权限判断和分页参数整理。
- `views`：渲染 BPMT 风格页面，包括查询区、表格、分页、弹窗表单和错误提示。
- `setup`：提供一次性初始化命令。应用启动时只做轻量表存在性检查，不自动执行 DDL。

## OAuth 流程

OAuth 必须严格遵守上游 BPMT 授权码登录流程：

1. 用户访问 demo 首页 `/`。
2. 如果没有 demo 本地 session，服务端生成随机 `state` 并跳转到 BPMT `/oauth/authorize`。
3. 授权请求参数包含 `response_type=code`、`client_id=bpmt-oauth-demo`、精确匹配的 `redirect_uri=http://localhost:81/oauth/callback` 和 `state`。
4. BPMT 负责展示登录页、校验第三方系统、校验回调地址和用户权限。
5. BPMT 带 `code` 和 `state` 回跳 `/oauth/callback`。
6. demo 服务端先校验 `state`，再使用服务端保存的 `client_secret` 调用 `POST /oauth/token`。
7. token 换取成功后，demo 服务端使用 `Authorization: Bearer <access_token>` 调用 `GET /oauth/userinfo`。
8. demo 将 `userid` 和安全可展示的用户基础信息写入本地 session。
9. demo 清理一次性 OAuth 中间态并跳回留言列表页。

本系统不实现 OIDC、`id_token`、`refresh_token`、跨系统单点登出或自定义 BPMT OAuth 端点。

## 数据表

通过 BPMT OpenAPI 创建一张动态表：

- 表名：`DEMO_MESSAGE`
- 描述：`OAuth demo 留言登记表`
- 缓存：`cacheFlag=0`

字段设计：

| 字段名 | BPMT 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `ID` | `String(36)` | 主键，必填 | 服务端生成 UUID |
| `TITLE` | `String(200)` | 必填 | 留言标题 |
| `CONTENT` | `Clob` | 必填 | 留言内容 |
| `CREATOR_USERID` | `String(64)` | 必填 | 创建人，取当前 OAuth userinfo 的 `userid` |
| `CREATE_TIME` | `Date` | 必填 | 创建时间 |
| `UPDATE_TIME` | `Date` | 必填 | 更新时间 |

运行期查询默认按 `CREATE_TIME desc` 排序，默认分页大小为 20 条。

## 权限规则

- 所有已登录 BPMT 且有第三方系统权限的用户都可以查看全部留言。
- 只有留言创建人可以编辑和删除自己的留言。
- 新增留言时，`CREATOR_USERID` 必须由服务端从 session 写入，浏览器提交值无效。
- 编辑和删除时，服务端必须用数据库中的 `CREATOR_USERID` 与当前 session `userid` 比对。
- 非创建人尝试编辑或删除时，返回明确无权限提示，不执行数据库写操作。

## 页面设计

首页 `/` 是留言列表页。页面采用接近 BPMT 截图红框中的传统表格风格：

- 顶部页签式标题：`留言登记`。
- 查询条件区：灰色渐变单元格，包含 `标题(模糊)` 和 `创建者`。
- 查询工具条：`查询条件`、`重置条件`、`查询`。
- 表格列：选择框、操作、标题、内容摘要、创建者、创建时间、更新时间。
- 行操作：查看、编辑、删除。
- 底部工具条：`新增`、`批量删除`。
- 分页条：展示每页记录数、总页数、总记录数和翻页按钮。

新增和编辑使用弹窗表单。表单字段只有 `标题` 和 `内容`。查看可以使用同一弹窗的只读模式。非本人留言的编辑和删除按钮置灰，或点击后显示无权限提示。

## 初始化和运行

项目提供一次性初始化命令，例如 `npm run setup`。该命令读取服务端环境变量，通过 BPMT API 签名调用动态表接口创建或同步 `DEMO_MESSAGE`。

应用启动时只检查必要配置和表是否存在：

- 如果 OAuth 配置缺失，应用启动失败并输出脱敏错误。
- 如果 MariaDB 配置缺失，应用启动失败并输出脱敏错误。
- 如果 `DEMO_MESSAGE` 不存在，首页显示“请先运行初始化命令”的提示，不自动执行 DDL。

Docker 运行时容器对外暴露 `81` 端口。未来并入 BPMT Compose 时，保留同一环境变量接口，允许容器内访问 BPMT 和 MariaDB 服务名。

## 安全规则

- `client_secret`、`BPMT_API_APP_SECRET`、数据库密码、授权 `code`、`access_token` 和用户密码不得写入浏览器、公开文档或日志。
- 被 Git 跟踪的示例配置只能使用占位符，例如 `<BPMT_OAUTH_CLIENT_SECRET>` 和 `<BPMT_API_APP_SECRET>`。
- session cookie 使用 `httpOnly`。本地开发默认不强制 `secure`，但需要保留生产环境开关。
- 所有 SQL 必须使用参数化查询。
- 服务端日志只能记录脱敏错误，不记录请求中的 OAuth code、token、secret 或数据库凭据。

## 错误处理

- OAuth `invalid_client`、`invalid_request`、`access_denied` 等错误显示为安全可见提示。
- token 换取失败时提示重新登录，不暴露 `code`、token 或 secret。
- `state` 校验失败时拒绝回调并提示重新登录。
- 表不存在时提示先运行初始化命令。
- 非创建人编辑或删除时提示无权限。
- BPMT API 或 MariaDB 不可用时显示维护提示，服务端记录脱敏日志。

## 验证计划

- 单元测试覆盖 OAuth `state` 校验、字段校验、权限判断和 SQL 参数生成。
- `npm run setup` 验证可以通过 BPMT API 创建或同步 `DEMO_MESSAGE`。
- Docker 验证容器监听 `81` 端口。
- 浏览器验证完整 OAuth 登录、列表、查询、新增、查看、编辑、删除和退出 demo。
- 浏览器验证非创建人可以查看全部留言，但不能编辑或删除他人留言。
- 每次有意义的实现或验证步骤，都在 `docs/codex/prompts/` 追加中文提示词归档。

## 已知限制

- 本系统只做 demo 本地 session 退出，不承诺退出 BPMT 登录态。
- 本系统不提供 refresh token，也不续期 BPMT OAuth token。
- 本系统不实现复杂角色权限，编辑和删除只按创建人判断。
- 当前只设计一张留言表，不包含附件、评论、流程或处理状态。
