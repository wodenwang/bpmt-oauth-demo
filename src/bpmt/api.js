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
      const error = new Error(`BPMT API 调用失败: ${method} ${publicPath} HTTP ${response.status}`);
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
