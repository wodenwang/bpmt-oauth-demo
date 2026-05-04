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

test('loadConfig removes trailing slashes from BPMT base URLs', () => {
  const config = loadConfig({
    ...baseEnv,
    BPMT_BASE_URL: 'http://localhost///',
    BPMT_API_BASE_URL: 'http://127.0.0.1/api///'
  });
  assert.equal(config.bpmtBaseUrl, 'http://localhost');
  assert.equal(config.bpmtApi.baseUrl, 'http://127.0.0.1/api');
});

test('loadConfig reports missing required values without leaking secrets', () => {
  const env = { ...baseEnv, BPMT_OAUTH_CLIENT_SECRET: '' };
  assert.throws(
    () => loadConfig(env),
    (error) => {
      assert.match(error.message, /缺少必要环境变量: BPMT_OAUTH_CLIENT_SECRET/);
      assert.doesNotMatch(error.message, /api-secret-value/);
      assert.doesNotMatch(error.message, /db-password/);
      assert.doesNotMatch(error.message, /test-session-secret/);
      return true;
    }
  );
});

test('loadConfig rejects non-numeric port values', () => {
  assert.throws(
    () => loadConfig({ ...baseEnv, PORT: '81abc' }),
    /环境变量 PORT 必须是有效端口/
  );
  assert.throws(
    () => loadConfig({ ...baseEnv, DB_PORT: '3306x' }),
    /环境变量 DB_PORT 必须是有效端口/
  );
});

test('redactConfig removes secrets from diagnostic output', () => {
  const config = loadConfig(baseEnv);
  const redacted = redactConfig(config);
  assert.equal(redacted.sessionSecret, '<redacted>');
  assert.equal(redacted.oauth.clientSecret, '<redacted>');
  assert.equal(redacted.bpmtApi.appSecret, '<redacted>');
  assert.equal(redacted.db.password, '<redacted>');
});
