import test from 'node:test';
import assert from 'node:assert/strict';
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
  assert.equal(JSON.parse(calls[0].options.body).name, 'DEMO_MESSAGE');
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
