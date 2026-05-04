# 2026-05-04 02 留言登记表设计

## 用户目标

作为独立系统，实现一个留言登记表功能，提供增删改查。系统自身不实现独立登录鉴权模块，必须通过 BPMT OAuth 登录。登录后新增留言的创建人必须是当前登录态的 `userid`。页面最终会通过外部链接或 iframe 嵌入 BPMT，需要保持接近 BPMT 截图红框中的灰色查询区、工具条、表格和分页风格。

## Codex 任务提示词

```text
作为独立系统，实现一个留言登记表的功能，实现增删改查。

要点：
1、系统自身没有独立的登录鉴权模块，需通过bpmt的oauth实现登录。登录后留言的创建人就是当前登录态的userid。
2、参考截图中，红色框选中的布局和ui风格。因为最终页面我需要通过外部链接（iframe）方式嵌入在bpmt内，我要保持风格统一。
3、必要的表结构，通过bpmt api创建和管理，并严格符合bpmt命名风格。本项目统一采用DEMO_前缀。
4、由于BPMT的第三方系统已配置来81端口回调，所以本项目最终采用81端口运行，先用独立docker，未来可融入到bpmt docker compose中，可以直连bpmt数据库。
5、本系统的首页就是留言列表页面。
```

## 环境假设

- 本地仓库：`/Users/wenzhewang/workspace/bpmt_project/bpmt-oauth-demo`
- BPMT 基础地址：`http://localhost`
- BPMT OAuth 回调地址：`http://localhost:81/oauth/callback`
- BPMT OpenAPI：`http://127.0.0.1/api/openapi.json`
- OAuth client id：`bpmt-oauth-demo`
- OAuth client secret：`<BPMT_OAUTH_CLIENT_SECRET>`
- BPMT API app key：`bpmt-api`
- BPMT API app secret：`<BPMT_API_APP_SECRET>`
- 数据库：`bpmt`
- 文档和对话语言：中文

## 设计确认过程

本轮使用 `superpowers:brainstorming` 进行设计评审，先确认需求再写规格，不直接进入实现。

已确认选项：

- 业务字段范围：最小版，包含 `留言标题`、`留言内容`、`创建人 userid`、`创建时间`、`更新时间`。
- 权限边界：所有已登录 BPMT 用户能查看全部留言，但只能编辑和删除自己创建的留言。
- 表结构初始化：一次性初始化命令负责建表，应用启动时只做轻量检查。
- 技术栈：Node.js + Express + 服务端模板和少量前端 JS。
- 数据访问：表结构通过 BPMT API 创建和管理；运行期业务行 CRUD 直连 MariaDB。
- 页面布局：单页表格 + 弹窗表单，贴近 BPMT 截图红框风格。

## 修改文件

- `AGENTS.md`
- `.gitignore`
- `docs/superpowers/specs/2026-05-04-message-registry-design.md`
- `docs/codex/prompts/2026-05-04-02-message-registry-design.md`

## 验证命令

设计阶段验证命令：

```bash
curl -fsS http://127.0.0.1/api/openapi.json | jq -r '.info'
curl -fsS http://127.0.0.1/api/openapi.json | jq -r '.paths | keys[]'
rg -n "T[O]DO|T[B]D|F[I]XME|待[定]|未[定]" docs/superpowers/specs/2026-05-04-message-registry-design.md docs/codex/prompts/2026-05-04-02-message-registry-design.md
```

## 结果摘要

已形成留言登记表功能设计。推荐并确认采用 Express 服务端渲染方案：OAuth 登录通过 BPMT 授权码流程完成，本地 session 保存 `userid`；初始化命令通过 BPMT API 创建 `DEMO_MESSAGE` 动态表；运行期 CRUD 直连 MariaDB；首页为 BPMT 风格留言列表页。

## 已知限制

- 本轮只完成设计规格，不进入实现。
- 本系统不实现 OIDC、`id_token`、`refresh_token`、跨系统单点登出或自定义 BPMT OAuth 端点。
- 本系统只做 demo 本地 session 退出，不承诺退出 BPMT 登录态。
- 本系统不提供附件、评论、处理状态或复杂角色权限。
