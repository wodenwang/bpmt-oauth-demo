# BPMT OAuth Agent 初始化提示词套件

本文面向需要把第三方系统接入 BPMT OAuth 登录的开发者。推荐使用方式是：创建一个新的空白项目后，先把“初始化提示词”提交给 Codex 或 Claude Code，让工具生成 `AGENTS.md` 或 `CLAUDE.md`，后续开发都以该文件作为项目约束。若团队工具约定使用 `AGENT.md`，可把同一内容写入 `AGENT.md`。

这套提示词只覆盖 BPMT 已支持的 OAuth2 Authorization Code 登录流程，不要求开发者额外理解 BPMT 的组织、角色、密码登录实现，也不引入 OIDC、`id_token`、refresh token、密码模式或跨系统单点登出。

## 使用前准备

请先从 BPMT 管理员处取得并确认以下信息：

| 信息 | 说明 |
| --- | --- |
| `BPMT_BASE_URL` | 用户浏览器可访问的 BPMT 基础地址，例如 `https://bpmt.example.com`。 |
| `BPMT_OAUTH_CLIENT_ID` | BPMT 第三方系统配置中的 `client_id`。 |
| `BPMT_OAUTH_CLIENT_SECRET` | BPMT 第三方系统生成的 `clientSecret`，在 `/oauth/token` 请求中参数名是 `client_secret`。 |
| `BPMT_OAUTH_CALLBACK_URL` | BPMT 后台登记的回调地址，必须和程序实际使用的 `redirect_uri` 精确一致。 |

OAuth 参考文档：

- `https://github.com/wodenwang/bpmt-doc/tree/main/docs/11.OAuth%E7%AC%AC%E4%B8%89%E6%96%B9%E7%99%BB%E5%BD%95`

## 提示词 1：初始化 AGENTS.md 或 CLAUDE.md

把下面整段提示词复制到 Codex 或 Claude Code。若使用 Codex，目标文件优先写入 `AGENTS.md`；若使用 Claude Code，目标文件优先写入 `CLAUDE.md`。如果你的团队工具只识别 `AGENT.md`，也可以写入 `AGENT.md`。多个文件同时存在时，内容应保持一致。

```text
你正在帮助我初始化一个接入 BPMT OAuth 登录的第三方系统项目。

请在当前空白项目中创建 AGENTS.md 或 CLAUDE.md，用于约束后续所有 AI 编码工作。如果项目工具约定使用 AGENT.md，也可以创建 AGENT.md。文件内容必须使用中文说明，技术标识、URL、端点、参数名和代码片段可以保留英文。

项目背景：
- 本项目是一个第三方业务系统。
- 用户登录统一交给 BPMT OAuth 处理。
- BPMT 已经为本系统配置了一个第三方应用。
- 我只需要在本系统中建立自己的本地会话和业务权限，不要重新实现 BPMT 的组织、角色、密码登录或用户体系。

BPMT OAuth 配置：
- BPMT_BASE_URL：<替换为 BPMT 基础地址>
- BPMT_OAUTH_CLIENT_ID：<替换为 client_id>
- BPMT_OAUTH_CLIENT_SECRET：<只允许写占位符，不要写真实密钥>
- BPMT_OAUTH_CALLBACK_URL：<替换为 BPMT 后台登记的 callback url>
- 上游文档：https://github.com/wodenwang/bpmt-doc/tree/main/docs/11.OAuth%E7%AC%AC%E4%B8%89%E6%96%B9%E7%99%BB%E5%BD%95

必须遵守的 OAuth 流程：
1. 用户访问第三方系统。
2. 如果第三方系统没有自己的本地会话，服务端生成 state，并把浏览器跳转到 BPMT：
   GET <BPMT_BASE_URL>/oauth/authorize?response_type=code&client_id=<client_id>&redirect_uri=<callback_url>&state=<state>
3. 如果用户尚未登录 BPMT，由 BPMT 展示登录页并完成登录。
4. BPMT 校验 client_id、redirect_uri 精确匹配和用户第三方系统权限。
5. BPMT 使用 302 跳回 callback url，并携带 code 和 state。
6. 第三方系统在服务端校验 state。
7. 第三方系统在服务端调用：
   POST <BPMT_BASE_URL>/oauth/token
   参数：grant_type=authorization_code、code、redirect_uri、client_id、client_secret
8. 第三方系统收到 access_token、token_type、expires_in、userid 后，建立自己的本地 session。
9. 第三方系统在服务端使用 Authorization: Bearer <access_token> 调用：
   GET <BPMT_BASE_URL>/oauth/userinfo
10. 第三方系统把 userinfo 中的 userid、name、group、role 作为当前登录用户上下文，只在本系统内处理自己的业务数据和业务权限。
11. 第三方系统必须提供退出本地会话的路径。退出本地会话不等于退出 BPMT。

必须写入文件的开发边界：
- 只实现 BPMT OAuth2 Authorization Code。
- 不实现 OIDC、id_token、refresh token、password grant、自定义 BPMT token 端点或跨系统单点登出。
- 不把 BPMT access_token 当成本系统永久会话。
- 不在前端代码、URL、公开文档、日志或 Git 提交中写入 client_secret、access_token、授权 code、密码或数据库凭据。
- client_secret 只能由服务端读取，建议来自环境变量或未提交的本地配置。
- redirect_uri 必须和 BPMT 后台登记的 callback url 精确一致。
- state 必须由服务端生成、保存并在 callback 中校验，用于防止跨站请求伪造和错误回调。
- 业务页面只检查本系统本地 session；没有本地 session 时重新发起 BPMT OAuth 登录。
- 如需展示用户信息，以 /oauth/userinfo 返回的 userid、name、group、role 为准。

请在 AGENTS.md 或 CLAUDE.md 中加入“后续开发任务模板”，要求每次让 AI 编码时都包含：
- 本轮目标
- BPMT OAuth 配置占位符
- 需要修改的文件
- 不允许触碰的边界
- 验证命令
- 敏感信息检查

请不要生成真实 client_secret，不要臆造 BPMT 私有端点，不要把本项目设计成独立账号密码登录系统。
```

## 提示词 2：生成项目骨架

在 `AGENTS.md` 或 `CLAUDE.md` 已生成后，使用这一段让 AI 创建基础工程。

```text
请基于本项目的 AGENTS.md 或 CLAUDE.md 创建第三方系统项目骨架。

本轮目标：
- 创建最小可运行 Web 服务。
- 增加环境变量读取和配置校验。
- 增加 .env.example，但只写占位符，不写真实密钥。
- 增加基础测试，验证缺少必要 OAuth 配置时启动会失败或给出清晰错误。

必须支持的配置：
- BPMT_BASE_URL
- BPMT_OAUTH_CLIENT_ID
- BPMT_OAUTH_CLIENT_SECRET
- BPMT_OAUTH_CALLBACK_URL
- SESSION_SECRET

边界：
- 本轮不实现 BPMT OAuth 跳转。
- 本轮不创建独立账号密码登录。
- 本轮不引入 OIDC、refresh token 或自定义 BPMT 端点。

验证：
- 运行项目测试。
- 检查 .env.example 中没有真实密钥。
- 检查 Git diff 中没有 client_secret、access_token、授权 code 或密码。
```

## 提示词 3：实现 OAuth 登录入口和回调

```text
请基于 AGENTS.md 或 CLAUDE.md 实现 BPMT OAuth 登录入口和 callback。

本轮目标：
- 新增登录入口，例如 /login。
- 当用户没有本地 session 时，服务端生成 state 并跳转到 BPMT /oauth/authorize。
- 新增 callback 路由，例如 /oauth/callback。
- callback 中必须校验 state。
- state 通过后，在服务端调用 BPMT /oauth/token 换取 access_token 和 userid。
- 成功后建立本系统本地 session。

必须使用的 BPMT OAuth 请求：
- authorize：GET <BPMT_BASE_URL>/oauth/authorize
- token：POST <BPMT_BASE_URL>/oauth/token
- grant_type 固定为 authorization_code
- redirect_uri 必须等于 BPMT_OAUTH_CALLBACK_URL

边界：
- client_secret 只能在服务端读取。
- 不把 code、access_token、client_secret 写入浏览器、公开日志或错误页。
- 不实现 refresh token。
- 不把 BPMT access_token 当作长期 session。

验证：
- 增加单元测试覆盖 authorize URL 参数。
- 增加测试覆盖 state 不匹配时拒绝 callback。
- 增加测试覆盖 token 换取失败时给出安全错误。
- 运行完整测试。
```

## 提示词 4：读取 BPMT 用户信息并保护业务页面

```text
请基于 AGENTS.md 或 CLAUDE.md 完成 BPMT userinfo 读取和业务页面保护。

本轮目标：
- token 换取成功后，服务端使用 Authorization: Bearer <access_token> 调用 BPMT /oauth/userinfo。
- 从 userinfo 中读取 userid、name、group、role。
- 将必要用户上下文写入本系统本地 session。
- 增加一个受保护业务页面，未登录时跳转到 /login，已登录时显示当前 BPMT 用户信息。
- 增加退出本地 session 的路由。

边界：
- 不实现本系统自己的账号密码登录。
- 不修改 BPMT 用户、组织或角色。
- 不把 access_token 显示在页面上。
- 退出本地 session 不等同于退出 BPMT。

验证：
- 测试未登录访问业务页面会进入 OAuth 登录。
- 测试已登录访问业务页面可以读取本地 session 用户。
- 测试退出后本地 session 被清理。
- 运行完整测试。
```

## 提示词 5：真实联调和安全收口

```text
请基于 AGENTS.md 或 CLAUDE.md 对 BPMT OAuth 集成做真实联调和安全收口。

本轮目标：
- 使用真实 BPMT_BASE_URL、BPMT_OAUTH_CLIENT_ID 和 BPMT_OAUTH_CALLBACK_URL 完整跑通登录。
- 在本地未提交配置中填入真实 BPMT_OAUTH_CLIENT_SECRET。
- 验证未登录 BPMT 时会先进入 BPMT 登录页。
- 验证 BPMT 登录成功后回跳第三方系统 callback。
- 验证第三方系统建立本地 session，并能显示 userid、name、group、role。
- 验证退出只清理第三方系统本地 session。

必须检查的错误场景：
- redirect_uri 和 BPMT 后台不一致时，应识别为配置错误。
- 用户没有第三方系统权限时，应显示可理解的无权限提示。
- callback state 不匹配时，必须拒绝登录。
- code 重复使用或过期时，必须重新发起登录。

安全检查：
- Git 跟踪文件不得包含真实 client_secret、access_token、授权 code、密码或数据库凭据。
- 日志不得输出真实 client_secret、access_token 或授权 code。
- 前端页面不得显示 access_token。

验证：
- 运行完整测试。
- 运行格式或 lint 检查，如果项目已配置。
- 执行敏感信息扫描。
- 记录实际验证结果和已知限制。
```

## 可直接放入 AGENTS.md 或 CLAUDE.md 的后续任务模板

```text
本轮目标：
- <明确本轮只完成什么>

BPMT OAuth 配置：
- BPMT_BASE_URL：<占位符或本地未提交配置>
- BPMT_OAUTH_CLIENT_ID：<client_id>
- BPMT_OAUTH_CLIENT_SECRET：<只允许出现在未提交服务端配置中>
- BPMT_OAUTH_CALLBACK_URL：<callback url，必须与 BPMT 后台精确一致>

开发边界：
- 只使用 BPMT OAuth2 Authorization Code。
- 不实现 OIDC、id_token、refresh token、password grant 或自定义 BPMT OAuth 端点。
- 不实现独立账号密码登录，用户身份来自 BPMT OAuth 和 /oauth/userinfo。
- client_secret、code、access_token、密码和数据库凭据不得进入前端、公开文档、日志或 Git 提交。

交付文件：
- <列出预计新增或修改的文件>

验证命令：
- <列出测试、构建、浏览器联调或敏感信息扫描命令>

完成后请说明：
- 修改了哪些文件。
- 运行了哪些验证。
- OAuth 流程是否仍符合 /oauth/authorize -> /oauth/token -> /oauth/userinfo。
- 是否发现任何敏感信息泄漏风险。
```
