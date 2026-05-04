import crypto from 'node:crypto';
import { signBpmtRequest } from './signature.js';

function makeNonce() {
  return crypto.randomBytes(16).toString('hex');
}

async function readJson(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function redactSecret(value, secret) {
  const text = String(value);
  if (!secret) return text;
  return text.split(secret).join('<redacted>');
}

function formatSafeDiagnostics(payload, appSecret) {
  const diagnostics = [];
  for (const field of ['code', 'error', 'message']) {
    const value = payload?.[field];
    if (value === undefined || value === null || value === '') continue;
    diagnostics.push(`${field}=${redactSecret(value, appSecret)}`);
  }
  return diagnostics.join(' ');
}

export function createBpmtApiClient({ baseUrl, appKey, appSecret, fetchImpl = fetch, now, nonce }) {
  async function requestJson({ method, publicPath, bodyObject }) {
    const body = bodyObject ? JSON.stringify(bodyObject) : '';
    const timestamp = now ? now() : Math.floor(Date.now() / 1000);
    const nonceValue = nonce ? nonce() : makeNonce();
    const headers = {
      'Content-Type': 'application/json',
      ...signBpmtRequest({
        method,
        path: `/api${publicPath}`,
        query: '',
        body,
        appKey,
        appSecret,
        timestamp,
        nonce: nonceValue
      })
    };

    const response = await fetchImpl(`${baseUrl}${publicPath}`, {
      method,
      headers,
      body: body || undefined
    });
    const payload = await readJson(response);

    if (!response.ok) {
      const safeDiagnostics = formatSafeDiagnostics(payload, appSecret);
      const message = [
        `BPMT API 调用失败: ${method} ${publicPath} HTTP ${response.status}`,
        safeDiagnostics
      ]
        .filter(Boolean)
        .join(' ');
      const error = new Error(message);
      error.status = response.status;
      error.payload = payload;
      throw error;
    }

    return payload;
  }

  return {
    async createDynamicTable(tableDefinition) {
      try {
        return await requestJson({
          method: 'POST',
          publicPath: '/v1/dynamic-tables',
          bodyObject: tableDefinition
        });
      } catch (error) {
        if (error.status === 409) {
          return { alreadyExists: true, payload: error.payload };
        }
        throw error;
      }
    },

    async syncDynamicTableDdl(tableName) {
      return requestJson({
        method: 'POST',
        publicPath: `/v1/dynamic-tables/${encodeURIComponent(tableName)}/ddl:sync`
      });
    }
  };
}
