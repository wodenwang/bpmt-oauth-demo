import test from 'node:test';
import assert from 'node:assert/strict';
import { inspect } from 'node:util';
import { createBpmtApiClient } from '../src/bpmt/api.js';
import { DEMO_MESSAGE_TABLE } from '../src/setup/tableDefinition.js';

test('createDynamicTable posts signed request to BPMT API', async () => {
  const calls = [];
  const client = createBpmtApiClient({
    baseUrl: 'http://127.0.0.1/api',
    appKey: 'bpmt-api',
    appSecret: 'api-secret',
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return {
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: { name: 'DEMO_MESSAGE' } }),
        text: async () => JSON.stringify({ success: true, data: { name: 'DEMO_MESSAGE' } })
      };
    },
    now: () => 1777867200,
    nonce: () => 'nonce-1'
  });

  const result = await client.createDynamicTable(DEMO_MESSAGE_TABLE);
  assert.equal(result.data.name, 'DEMO_MESSAGE');
  assert.equal(calls[0].url, 'http://127.0.0.1/api/v1/dynamic-tables');
  assert.equal(calls[0].options.method, 'POST');
  assert.equal(calls[0].options.headers['X-BPMT-App-Key'], 'bpmt-api');
  assert.equal(
    calls[0].options.headers['X-BPMT-Signature'],
    'faf2c8c2dce79b8fac84a307c5db6efb505864e6d3b235486b1c449115f18cec'
  );
  assert.equal(JSON.parse(calls[0].options.body).name, 'DEMO_MESSAGE');
});

test('syncDynamicTableDdl posts signed request using public canonical path', async () => {
  const calls = [];
  const client = createBpmtApiClient({
    baseUrl: 'http://127.0.0.1/api',
    appKey: 'bpmt-api',
    appSecret: 'api-secret',
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ success: true })
      };
    },
    now: () => 1777867200,
    nonce: () => 'nonce-1'
  });

  await client.syncDynamicTableDdl('DEMO_MESSAGE');
  assert.equal(calls[0].url, 'http://127.0.0.1/api/v1/dynamic-tables/DEMO_MESSAGE/ddl:sync');
  assert.equal(calls[0].options.method, 'POST');
  assert.equal(
    calls[0].options.headers['X-BPMT-Signature'],
    'c0e62d244495ce6aface2e0cad6af53e9dc94b0c569114d8fc03d45521719cfa'
  );
});

test('createDynamicTable treats existing table conflict as already initialized', async () => {
  const client = createBpmtApiClient({
    baseUrl: 'http://127.0.0.1/api',
    appKey: 'bpmt-api',
    appSecret: 'api-secret',
    fetchImpl: async () => ({
      ok: false,
      status: 409,
      json: async () => ({ error: 'conflict', message: 'table exists' }),
      text: async () => JSON.stringify({ error: 'conflict', message: 'table exists' })
    }),
    now: () => 1777867200,
    nonce: () => 'nonce-1'
  });

  const result = await client.createDynamicTable(DEMO_MESSAGE_TABLE);
  assert.equal(result.alreadyExists, true);
});

test('createDynamicTable includes safe BPMT diagnostics for non-conflict errors', async () => {
  const client = createBpmtApiClient({
    baseUrl: 'http://127.0.0.1/api',
    appKey: 'bpmt-api',
    appSecret: 'api-secret',
    fetchImpl: async () => ({
      ok: false,
      status: 401,
      text: async () =>
        JSON.stringify({
          code: 'INVALID_SIGNATURE',
          error: 'invalid_signature',
          message: 'bad sign',
          appSecret: 'api-secret'
        })
    }),
    now: () => 1777867200,
    nonce: () => 'nonce-1'
  });

  await assert.rejects(
    () => client.createDynamicTable(DEMO_MESSAGE_TABLE),
    (error) => {
      assert.equal(error.status, 401);
      assert.match(error.message, /INVALID_SIGNATURE/);
      assert.match(error.message, /invalid_signature/);
      assert.match(error.message, /bad sign/);
      assert.doesNotMatch(error.message, /api-secret/);
      return true;
    }
  );
});

test('createDynamicTable includes nested BPMT error envelope diagnostics without leaking secrets', async () => {
  const client = createBpmtApiClient({
    baseUrl: 'http://127.0.0.1/api',
    appKey: 'bpmt-api',
    appSecret: 'api-secret',
    fetchImpl: async () => ({
      ok: false,
      status: 401,
      text: async () =>
        JSON.stringify({
          error: {
            code: 'INVALID_SIGNATURE',
            message: 'bad sign',
            requestId: 'req-123',
            details: {
              appSecret: 'api-secret',
              accessToken: 'api-secret',
              hint: 'check signature'
            }
          },
          appSecret: 'api-secret'
        })
    }),
    now: () => 1777867200,
    nonce: () => 'nonce-1'
  });

  await assert.rejects(
    () => client.createDynamicTable(DEMO_MESSAGE_TABLE),
    (error) => {
      assert.equal(error.status, 401);
      assert.match(error.message, /INVALID_SIGNATURE/);
      assert.match(error.message, /bad sign/);
      assert.match(error.message, /requestId=req-123/);
      assert.doesNotMatch(error.message, /\[object Object\]/);
      assert.doesNotMatch(JSON.stringify(error.payload), /api-secret/);
      assert.doesNotMatch(inspect(error), /api-secret/);
      return true;
    }
  );
});
