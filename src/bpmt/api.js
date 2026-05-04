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

function isSensitiveKey(key) {
  const normalized = String(key).replace(/[-_]/g, '').toLowerCase();
  return ['appsecret', 'clientsecret', 'password', 'secret', 'accesstoken', 'refreshtoken', 'token'].includes(
    normalized
  );
}

function sanitizePayload(value, appSecret) {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') return redactSecret(value, appSecret);
  if (Array.isArray(value)) return value.map((item) => sanitizePayload(item, appSecret));
  if (typeof value !== 'object') return value;

  const sanitized = {};
  for (const [key, item] of Object.entries(value)) {
    sanitized[key] = isSensitiveKey(key) ? '<redacted>' : sanitizePayload(item, appSecret);
  }
  return sanitized;
}

function pushDiagnostic(diagnostics, field, value) {
  if (value === undefined || value === null || value === '') return;
  const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
  diagnostics.push(`${field}=${text}`);
}

function formatSafeDiagnostics(payload) {
  const diagnostics = [];
  for (const field of ['code', 'error', 'message', 'error_description']) {
    const value = payload?.[field];
    if (field === 'error' && value && typeof value === 'object') continue;
    pushDiagnostic(diagnostics, field, value);
  }

  if (payload?.error && typeof payload.error === 'object') {
    for (const field of ['code', 'message', 'requestId', 'details']) {
      pushDiagnostic(diagnostics, field, payload.error[field]);
    }
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
      const safePayload = sanitizePayload(payload, appSecret);
      const safeDiagnostics = formatSafeDiagnostics(safePayload);
      const message = [
        `BPMT API 调用失败: ${method} ${publicPath} HTTP ${response.status}`,
        safeDiagnostics
      ]
        .filter(Boolean)
        .join(' ');
      const error = new Error(message);
      error.status = response.status;
      error.payload = safePayload;
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
