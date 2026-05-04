import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import ejs from 'ejs';
import { createApp } from '../src/app.js';
import { createMessageRouter } from '../src/messages/routes.js';

const appConfig = {
  nodeEnv: 'test',
  port: 81,
  sessionSecret: 'test-session-secret',
  bpmtBaseUrl: 'http://localhost',
  oauth: {
    clientId: 'bpmt-oauth-demo',
    clientSecret: 'test-client-secret',
    redirectUri: 'http://localhost:81/oauth/callback'
  },
  bpmtApi: {
    baseUrl: 'http://127.0.0.1/api',
    appKey: 'bpmt-api',
    appSecret: 'test-api-secret'
  }
};

function createLoggedInRouterApp({ service, flash } = {}) {
  const app = express();
  app.set('view engine', 'ejs');
  app.set('views', 'views');
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());
  app.use((req, res, next) => {
    req.session = {
      user: { userid: 'admin', name: '管理员' },
      flash
    };
    next();
  });
  app.use(createMessageRouter({ express, service }));
  app.use((error, req, res, next) => {
    if (res.headersSent) {
      next(error);
      return;
    }
    res.status(error.status || 500).render('error', {
      title: '系统提示',
      status: error.status || 500,
      message: (error.status || 500) >= 500 ? '系统暂时不可用，请稍后重试' : error.message,
      user: req.session?.user || null
    });
  });
  return app;
}

function createAnonymousRouterApp() {
  const app = express();
  app.use((req, res, next) => {
    req.session = {};
    next();
  });
  app.use(createMessageRouter({ express, service: {} }));
  return app;
}

function createTestApp(service) {
  const app = createApp({ appConfig, messageService: service });
  app.get('/test-login', (req, res) => {
    req.session.user = { userid: 'admin', name: '管理员', group: null, role: null };
    res.status(204).end();
  });
  return app;
}

test('匿名用户访问首页会重定向到登录入口', async () => {
  const response = await request(createAnonymousRouterApp()).get('/');

  assert.equal(response.status, 302);
  assert.equal(response.headers.location, '/login');
});

test('匿名用户访问留言操作路由均重定向到登录入口', async () => {
  const app = createAnonymousRouterApp();
  const cases = [
    request(app).get('/messages/message-1'),
    request(app).post('/messages').type('form').send({ title: '标题', content: '内容' }),
    request(app).post('/messages/message-1/update').type('form').send({ title: '标题', content: '内容' }),
    request(app).post('/messages/message-1/delete'),
    request(app).post('/messages/bulk-delete').type('form').send({ ids: 'message-1' })
  ];

  for (const pendingResponse of cases) {
    const response = await pendingResponse;
    assert.equal(response.status, 302);
    assert.equal(response.headers.location, '/login');
  }
});

test('登录用户访问首页会解析筛选条件并渲染留言列表', async () => {
  const calls = [];
  const app = createLoggedInRouterApp({
    flash: { type: 'success', message: '留言已新增' },
    service: {
      async isReady() {
        return true;
      },
      async list(filters) {
        calls.push(filters);
        return {
          rows: [
            {
              id: 'message-1',
              title: '任务标题',
              content: '留言内容',
              creatorUserid: 'admin',
              createTime: '2026-05-04 09:30:00',
              updateTime: '2026-05-04 09:30:00'
            }
          ],
          total: 1,
          page: 2,
          pageSize: 10,
          totalPages: 1
        };
      }
    }
  });

  const response = await request(app)
    .get('/')
    .query({ title: '任务', creatorUserid: 'admin', page: '2', pageSize: '10' });

  assert.equal(response.status, 200);
  assert.deepEqual(calls[0], { title: '任务', creatorUserid: 'admin', page: '2', pageSize: '10' });
  assert.match(response.text, /留言登记/);
  assert.match(response.text, /管理员/);
  assert.match(response.text, /任务标题/);
  assert.match(response.text, /留言已新增/);
});

test('留言首页加载 BPMT 风格静态资源并按创建人控制行内操作', async () => {
  const app = createLoggedInRouterApp({
    service: {
      async isReady() {
        return true;
      },
      async list() {
        return {
          rows: [
            {
              id: 'message-own',
              title: '自己标题',
              content: '自己留言内容',
              creatorUserid: 'admin',
              createTime: '2026-05-04 09:30:00',
              updateTime: '2026-05-04 09:40:00'
            },
            {
              id: 'message-other',
              title: '他人标题',
              content: '他人留言内容',
              creatorUserid: 'lisi',
              createTime: '2026-05-04 10:30:00',
              updateTime: '2026-05-04 10:40:00'
            }
          ],
          total: 2,
          page: 1,
          pageSize: 20,
          totalPages: 1
        };
      }
    }
  });

  const response = await request(app).get('/');

  assert.equal(response.status, 200);
  assert.match(response.text, /\/static\/styles\/bpmt\.css/);
  assert.match(response.text, /\/static\/scripts\/messages\.js/);
  assert.match(response.text, /标题\(模糊\)/);
  assert.match(response.text, /内容摘要/);
  assert.match(response.text, /data-message-id="message-own" onclick="openEditDialog\(this\.dataset\.messageId\)"/);
  assert.match(response.text, /data-message-id="message-own" onclick="deleteOne\(this\.dataset\.messageId\)"/);
  assert.match(response.text, /name="ids" value="message-own"/);
  assert.match(response.text, /value="message-other" disabled/);
  assert.match(response.text, /disabled title="只能编辑自己创建的留言"/);
  assert.match(response.text, /disabled title="只能删除自己创建的留言"/);
});

test('flash 只展示一次', async () => {
  const app = createTestApp({
    async create() {
      return { id: 'message-1' };
    },
    async list() {
      return { rows: [], total: 0, page: 1, pageSize: 20, totalPages: 1 };
    }
  });
  const agent = request.agent(app);
  await agent.get('/test-login');

  await agent.post('/messages').type('form').send({ title: '标题', content: '内容' });
  const first = await agent.get('/');
  const second = await agent.get('/');

  assert.match(first.text, /留言已新增/);
  assert.doesNotMatch(second.text, /留言已新增/);
});

test('DEMO_MESSAGE 未初始化时首页显示初始化提示且不查询列表', async () => {
  let listCalled = false;
  const app = createLoggedInRouterApp({
    service: {
      async isReady() {
        return false;
      },
      async list() {
        listCalled = true;
      }
    }
  });

  const response = await request(app).get('/');

  assert.equal(response.status, 200);
  assert.equal(listCalled, false);
  assert.match(response.text, /请先运行初始化命令/);
  assert.match(response.text, /DEMO_MESSAGE/);
  assert.match(response.text, /npm run setup/);
});

test('POST /messages 新增留言后设置 flash 并重定向首页', async () => {
  const calls = [];
  const app = createTestApp({
    async create(body, user) {
      calls.push({ body, user });
      return { id: 'message-1' };
    },
    async list() {
      return { rows: [], total: 0, page: 1, pageSize: 20, totalPages: 1 };
    }
  });
  const agent = request.agent(app);
  await agent.get('/test-login');

  const response = await agent.post('/messages').type('form').send({ title: '新标题', content: '新内容' });
  const follow = await agent.get('/');

  assert.equal(response.status, 302);
  assert.equal(response.headers.location, '/');
  assert.equal(calls[0].body.title, '新标题');
  assert.equal(calls[0].body.content, '新内容');
  assert.equal(calls[0].user.userid, 'admin');
  assert.match(follow.text, /留言已新增/);
});

test('POST /messages/:id/update 更新留言后设置 flash 并重定向首页', async () => {
  const calls = [];
  const app = createTestApp({
    async update(id, body, user) {
      calls.push({ id, body, user });
      return { id };
    },
    async list() {
      return { rows: [], total: 0, page: 1, pageSize: 20, totalPages: 1 };
    }
  });
  const agent = request.agent(app);
  await agent.get('/test-login');

  const response = await agent.post('/messages/message-1/update').type('form').send({ title: '改标题', content: '改内容' });
  const follow = await agent.get('/');

  assert.equal(response.status, 302);
  assert.equal(response.headers.location, '/');
  assert.equal(calls[0].id, 'message-1');
  assert.equal(calls[0].body.title, '改标题');
  assert.equal(calls[0].body.content, '改内容');
  assert.deepEqual(calls[0].user, { userid: 'admin', name: '管理员', group: null, role: null });
  assert.match(follow.text, /留言已更新/);
});

test('POST /messages/:id/delete 删除留言后设置 flash 并重定向首页', async () => {
  const calls = [];
  const app = createTestApp({
    async delete(id, user) {
      calls.push({ id, user });
      return true;
    },
    async list() {
      return { rows: [], total: 0, page: 1, pageSize: 20, totalPages: 1 };
    }
  });
  const agent = request.agent(app);
  await agent.get('/test-login');

  const response = await agent.post('/messages/message-1/delete');
  const follow = await agent.get('/');

  assert.equal(response.status, 302);
  assert.equal(response.headers.location, '/');
  assert.equal(calls[0].id, 'message-1');
  assert.equal(calls[0].user.userid, 'admin');
  assert.match(follow.text, /留言已删除/);
});

test('POST /messages/bulk-delete 兼容字符串和数组 ids', async () => {
  const calls = [];
  const app = createTestApp({
    async deleteMany(ids, user) {
      calls.push({ ids, user });
      return ids.map(() => true);
    },
    async list() {
      return { rows: [], total: 0, page: 1, pageSize: 20, totalPages: 1 };
    }
  });
  const agent = request.agent(app);
  await agent.get('/test-login');

  const one = await agent.post('/messages/bulk-delete').type('form').send({ ids: 'message-1' });
  const many = await agent.post('/messages/bulk-delete').type('form').send('ids=message-2&ids=message-3');
  const follow = await agent.get('/');

  assert.equal(one.status, 302);
  assert.equal(many.status, 302);
  assert.deepEqual(calls[0].ids, ['message-1']);
  assert.deepEqual(calls[1].ids, ['message-2', 'message-3']);
  assert.equal(calls[1].user.userid, 'admin');
  assert.match(follow.text, /选中留言已删除/);
});

test('GET /messages/:id 按 mode 渲染查看和编辑 modal', async () => {
  const app = createLoggedInRouterApp({
    service: {
      async findById(id) {
        return { id, title: '详情标题', content: '详情内容', creatorUserid: 'admin' };
      }
    }
  });

  const viewResponse = await request(app).get('/messages/message-1');
  const editResponse = await request(app).get('/messages/message-1?mode=edit');

  assert.equal(viewResponse.status, 200);
  assert.match(viewResponse.text, /查看留言/);
  assert.match(viewResponse.text, /详情标题/);
  assert.equal(editResponse.status, 200);
  assert.match(editResponse.text, /编辑留言/);
  assert.match(editResponse.text, /action="\/messages\/message-1\/update"/);
  assert.doesNotMatch(editResponse.text, /readonly/);
  assert.match(viewResponse.text, /readonly/);
});

test('留言 modal 支持新增、编辑、查看三种模式', async () => {
  const createHtml = await ejs.renderFile('views/messages/modal.ejs', {
    mode: 'create',
    message: null
  });
  const editHtml = await ejs.renderFile('views/messages/modal.ejs', {
    mode: 'edit',
    message: { id: 'message-1', title: '编辑标题', content: '编辑内容', creatorUserid: 'admin' }
  });
  const viewHtml = await ejs.renderFile('views/messages/modal.ejs', {
    mode: 'view',
    message: { id: 'message-1', title: '查看标题', content: '查看内容', creatorUserid: 'admin' }
  });

  assert.match(createHtml, /新增留言/);
  assert.match(createHtml, /action="\/messages"/);
  assert.doesNotMatch(createHtml, /readonly/);
  assert.match(editHtml, /编辑留言/);
  assert.match(editHtml, /action="\/messages\/message-1\/update"/);
  assert.doesNotMatch(editHtml, /readonly/);
  assert.match(viewHtml, /查看留言/);
  assert.match(viewHtml, /readonly/);
  assert.doesNotMatch(viewHtml, /access_token|client_secret|BPMT_API_APP_SECRET/i);
});

test('业务错误保留 status 并进入错误页', async () => {
  const app = createLoggedInRouterApp({
    service: {
      async findById() {
        const error = new Error('留言不存在');
        error.status = 404;
        throw error;
      }
    }
  });

  const response = await request(app).get('/messages/missing');

  assert.equal(response.status, 404);
  assert.match(response.text, /\/static\/styles\/bpmt\.css/);
  assert.match(response.text, /留言不存在/);
});

test('createApp 注入 messageService 时不要求数据库配置且可访问路由', async () => {
  const app = createApp({
    appConfig: {
      nodeEnv: 'test',
      port: 81,
      sessionSecret: 'test-session-secret',
      bpmtBaseUrl: 'http://localhost',
      oauth: {
        clientId: 'bpmt-oauth-demo',
        clientSecret: 'test-client-secret',
        redirectUri: 'http://localhost:81/oauth/callback'
      }
    },
    messageService: {
      async list() {
        return { rows: [], total: 0, page: 1, pageSize: 20, totalPages: 1 };
      }
    }
  });
  app.get('/test-login', (req, res) => {
    req.session.user = { userid: 'admin', name: '管理员', group: null, role: null };
    res.status(204).end();
  });

  const agent = request.agent(app);
  await agent.get('/test-login');
  const response = await agent.get('/');

  assert.equal(response.status, 200);
  assert.match(response.text, /留言登记/);
});
