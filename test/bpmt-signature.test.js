import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { buildCanonicalString, signBpmtRequest, normalizeQuery } from '../src/bpmt/signature.js';

test('normalizeQuery sorts decoded query pairs and encodes spaces as %20', () => {
  assert.equal(normalizeQuery('b=two&a=hello world&a=alpha'), 'a=alpha&a=hello%20world&b=two');
});

test('buildCanonicalString follows BPMT OpenAPI description', () => {
  const body = JSON.stringify({ name: 'DEMO_MESSAGE' });
  const canonical = buildCanonicalString({
    method: 'POST',
    path: '/api/v1/dynamic-tables',
    query: '',
    timestamp: '1777867200',
    nonce: 'nonce-1',
    body
  });

  const bodyHash = crypto.createHash('sha256').update(body).digest('hex');
  assert.equal(canonical, `POST\n/api/v1/dynamic-tables\n\n1777867200\nnonce-1\n${bodyHash}`);
});

test('signBpmtRequest returns required BPMT headers', () => {
  const headers = signBpmtRequest({
    method: 'POST',
    path: '/api/v1/dynamic-tables',
    query: '',
    body: '{"name":"DEMO_MESSAGE"}',
    appKey: 'bpmt-api',
    appSecret: 'api-secret',
    timestamp: '1777867200',
    nonce: 'nonce-1'
  });

  assert.equal(headers['X-BPMT-App-Key'], 'bpmt-api');
  assert.equal(headers['X-BPMT-Timestamp'], '1777867200');
  assert.equal(headers['X-BPMT-Nonce'], 'nonce-1');
  assert.match(headers['X-BPMT-Signature'], /^[a-f0-9]{64}$/);
});
