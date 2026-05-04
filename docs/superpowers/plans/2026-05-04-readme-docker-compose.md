# README Docker Compose Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `bpmt-oauth-demo` 收口成提示词优先、Docker Compose 可快速运行的 BPMT OAuth 集成示例。

**Architecture:** 继续保留现有 Node.js/Express OAuth demo 主流程，只新增 Compose 编排、Compose 环境示例、README Quick Start 和 Codex 提示词复刻说明。Compose 只运行 demo 应用和一次性 setup 命令，不内置 BPMT 或 MariaDB。

**Tech Stack:** Node.js 20、Express、Docker、Docker Compose、Markdown。

---

### Task 1: Compose 运行入口

**Files:**
- Create: `docker-compose.yml`
- Create: `compose.env.example`

- [x] **Step 1: 新增 Compose 文件**

添加 `app` 服务和 `setup` profile。`app` 使用当前 Dockerfile 构建镜像并监听宿主机 `81` 端口；`setup` 使用同一镜像执行 `npm run setup`。

- [x] **Step 2: 新增 Compose 环境示例**

添加 `compose.env.example`，区分浏览器访问 BPMT 的 `BPMT_BASE_URL=http://localhost` 和容器内访问宿主机服务的 `BPMT_SERVER_BASE_URL=http://host.docker.internal`。

- [x] **Step 3: 校验 Compose 配置**

Run: `docker compose --env-file compose.env.example --profile setup config`

Expected: 输出 `app` 和 `setup` 服务，不出现 YAML 解析错误。

### Task 2: README Quick Start 和提示词复刻路径

**Files:**
- Modify: `README.md`

- [x] **Step 1: 把 Docker Compose Quick Start 提到 README 前部**

说明前置条件、复制环境文件、填写密钥、运行 setup、启动 app 和访问 `http://localhost:81`。

- [x] **Step 2: 补充提示词撰写原则**

说明每次提示词都要写清目标、依据、边界、环境、交付物、验证命令、安全规则和归档要求。

- [x] **Step 3: 补充提示词提交顺序**

按初始化、设计、配置骨架、BPMT API、setup、数据库、OAuth、页面、Docker、真实验证、提交收口的顺序组织，方便读者复刻。

### Task 3: 本次提示词归档

**Files:**
- Create: `docs/codex/prompts/2026-05-04-04-readme-docker-compose-quickstart.md`

- [x] **Step 1: 新增归档文件**

记录用户目标、Codex 任务提示词、环境假设、修改文件、验证命令、结果摘要和限制。

- [x] **Step 2: 安全扫描**

Run: `rg -n '(^|[[:space:]])(client_secret|BPMT_API_APP_SECRET|BPMT_OAUTH_CLIENT_SECRET|access_token|授权码|密码|DB_PASSWORD)\s*[:=]\s*[^<\$\s]' README.md docker-compose.yml compose.env.example docs/codex/prompts/2026-05-04-04-readme-docker-compose-quickstart.md`

Expected: 不出现真实密钥或敏感值。
