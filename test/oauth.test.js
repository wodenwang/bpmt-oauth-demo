import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import session from 'express-session';
import request from 'supertest';
import { buildAuthorizeUrl, exchangeCodeForToken, fetchUserInfo, verifyState } from '../src/auth/oauth.js';
import { clearUserSession, currentUser, requireLogin, saveUserSession } from '../src/auth/session.js';
import { createAuthRouter } from '../src/auth/routes.js';

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

  assert.equal(url.origin + url.pathname, 'http://localhost/oauth/authorize');
  assert.equal(url.searchParams.get('response_type'), 'code');
  assert.equal(url.searchParams.get('client_id'), 'bpmt-oauth-demo');
  assert.equal(url.searchParams.get('redirect_uri'), 'http://localhost:81/oauth/callback');
  assert.equal(url.searchParams.get('state'), 'state-1');
});

test('verifyState accepts matching state and rejects missing or mismatched state', () => {
  assert.equal(verifyState('state-1', 'state-1'), true);

  for (const [expectedState, actualState] of [
    ['state-1', 'state-2'],
    ['state-1', undefined],
    [undefined, 'state-1']
  ]) {
    assert.throws(
      () => verifyState(expectedState, actualState),
      (error) => {
        assert.equal(error.status, 400);
        assert.equal(error.message, 'OAuth state 校验失败，请重新登录');
        return true;
      }
    );
  }
});

test('exchangeCodeForToken posts authorization_code form body', async () => {
  const calls = [];
  const token = await exchangeCodeForToken({
    config: oauthConfig,
    code: 'code-1',
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ access_token: 'token-1', token_type: 'Bearer', userid: 'admin' })
      };
    }
  });

  assert.equal(token.userid, 'admin');
  assert.equal(calls[0].url, 'http://localhost/oauth/token');
  assert.equal(calls[0].options.method, 'POST');
  assert.equal(calls[0].options.headers['Content-Type'], 'application/x-www-form-urlencoded');
  const body = new URLSearchParams(calls[0].options.body);
  assert.equal(body.get('grant_type'), 'authorization_code');
  assert.equal(body.get('code'), 'code-1');
  assert.equal(body.get('redirect_uri'), 'http://localhost:81/oauth/callback');
  assert.equal(body.get('client_id'), 'bpmt-oauth-demo');
  assert.equal(body.get('client_secret'), 'client-secret');
});

test('fetchUserInfo sends bearer token', async () => {
  const user = await fetchUserInfo({
    config: oauthConfig,
    accessToken: 'token-1',
    fetchImpl: async (url, options) => {
      assert.equal(url, 'http://localhost/oauth/userinfo');
      assert.equal(options.method, 'GET');
      assert.equal(options.headers.Authorization, 'Bearer token-1');
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ userid: 'admin', name: '管理员' })
      };
    }
  });

  assert.equal(user.userid, 'admin');
});

test('OAuth HTTP errors use status and do not leak secrets, code, token, or raw response', async () => {
  await assert.rejects(
    () =>
      exchangeCodeForToken({
        config: oauthConfig,
        code: 'secret-code',
        fetchImpl: async () => ({
          ok: false,
          status: 401,
          text: async () =>
            JSON.stringify({
              error: 'invalid_client',
              message: 'bad client_secret client-secret and code secret-code'
            })
        })
      }),
    (error) => {
      assert.equal(error.status, 401);
      assert.match(error.message, /OAuth token 换取失败/);
      assert.match(error.message, /HTTP 401/);
      assert.doesNotMatch(error.message, /client-secret/);
      assert.doesNotMatch(error.message, /secret-code/);
      assert.doesNotMatch(error.message, /bad client_secret/);
      return true;
    }
  );

  await assert.rejects(
    () =>
      fetchUserInfo({
        config: oauthConfig,
        accessToken: 'secret-token',
        fetchImpl: async () => ({
          ok: false,
          status: 403,
          text: async () => 'access_token secret-token forbidden'
        })
      }),
    (error) => {
      assert.equal(error.status, 403);
      assert.match(error.message, /OAuth 用户信息获取失败/);
      assert.doesNotMatch(error.message, /secret-token/);
      assert.doesNotMatch(error.message, /forbidden/);
      return true;
    }
  );
});

test('OAuth responses must include required fields', async () => {
  await assert.rejects(
    () =>
      exchangeCodeForToken({
        config: oauthConfig,
        code: 'code-1',
        fetchImpl: async () => ({
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ token_type: 'Bearer' })
        })
      }),
    /OAuth token 响应缺少 access_token/
  );

  await assert.rejects(
    () =>
      fetchUserInfo({
        config: oauthConfig,
        accessToken: 'token-1',
        fetchImpl: async () => ({
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ name: '管理员' })
        })
      }),
    /OAuth 用户信息缺少 userid/
  );
});

test('session helpers only store local user fields and never store BPMT access token', async () => {
  const req = {
    session: {
      destroy(callback) {
        this.destroyed = true;
        callback();
      }
    }
  };

  assert.equal(currentUser(req), null);
  saveUserSession(req, {
    userid: 'admin',
    name: '管理员',
    group: '系统管理',
    role: 'admin',
    access_token: 'token-1',
    extra: 'ignored'
  });

  assert.deepEqual(currentUser(req), {
    userid: 'admin',
    name: '管理员',
    group: '系统管理',
    role: 'admin'
  });
  assert.equal('access_token' in req.session.user, false);
  assert.equal('extra' in req.session.user, false);

  await clearUserSession(req);
  assert.equal(req.session.destroyed, true);
});

test('requireLogin continues for logged-in users and redirects anonymous users', () => {
  let nextCalled = false;
  requireLogin({ session: { user: { userid: 'admin' } } }, {}, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, true);

  let redirectTarget = null;
  requireLogin({ session: {} }, { redirect: (target) => (redirectTarget = target) }, () => {
    throw new Error('未登录用户不应继续执行');
  });
  assert.equal(redirectTarget, '/login');
});

test('callback exchanges code, fetches userinfo, saves local session, and redirects home', async () => {
  const app = express();
  let regenerateCalls = 0;
  app.use(
    session({
      secret: 'test-session-secret',
      resave: false,
      saveUninitialized: true
    })
  );
  app.use((req, res, next) => {
    const originalRegenerate = req.session.regenerate.bind(req.session);
    req.session.regenerate = (callback) => {
      regenerateCalls += 1;
      originalRegenerate(callback);
    };
    next();
  });
  app.use(createAuthRouter({ express, config: oauthConfig }));
  app.get('/session-user', (req, res) => res.json(req.session.user || null));
  app.use((error, req, res, next) => {
    res.status(error.status || 500).json({ message: error.message });
  });

  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    if (url === 'http://localhost/oauth/token') {
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ access_token: 'token-1', userid: 'admin' })
      };
    }
    if (url === 'http://localhost/oauth/userinfo') {
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ userid: 'admin', name: '管理员', access_token: 'ignored' })
      };
    }
    throw new Error(`未预期的请求: ${url}`);
  };

  try {
    const agent = request.agent(app);
    const loginResponse = await agent.get('/login').expect(302);
    const authorizeUrl = new URL(loginResponse.headers.location);
    const state = authorizeUrl.searchParams.get('state');

    await agent.get(`/oauth/callback?code=code-1&state=${state}`).expect(302).expect('Location', '/');
    const sessionResponse = await agent.get('/session-user').expect(200);

    assert.equal(regenerateCalls, 1);
    assert.equal(calls[0].url, 'http://localhost/oauth/token');
    assert.equal(new URLSearchParams(calls[0].options.body).get('code'), 'code-1');
    assert.equal(calls[1].url, 'http://localhost/oauth/userinfo');
    assert.equal(calls[1].options.headers.Authorization, 'Bearer token-1');
    assert.deepEqual(sessionResponse.body, {
      userid: 'admin',
      name: '管理员',
      group: null,
      role: null
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
