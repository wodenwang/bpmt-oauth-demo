import crypto from 'node:crypto';

function encodeQueryComponent(value) {
  return encodeURIComponent(value).replace(/[!'()~]/g, (char) =>
    `%${char.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

function compareUtf16(left, right) {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

export function normalizeQuery(query = '') {
  const raw = query.startsWith('?') ? query.slice(1) : query;
  if (!raw) return '';

  const pairs = [];
  for (const [name, value] of new URLSearchParams(raw).entries()) {
    pairs.push([name, value]);
  }

  return pairs
    .sort(([leftName, leftValue], [rightName, rightValue]) => {
      const nameOrder = compareUtf16(leftName, rightName);
      if (nameOrder !== 0) return nameOrder;
      return compareUtf16(leftValue, rightValue);
    })
    .map(([name, value]) => `${encodeQueryComponent(name)}=${encodeQueryComponent(value)}`)
    .join('&');
}

function sha256Hex(body) {
  return crypto.createHash('sha256').update(body || '').digest('hex');
}

export function buildCanonicalString({ method, path, query = '', timestamp, nonce, body = '' }) {
  return [
    method.toUpperCase(),
    path,
    normalizeQuery(query),
    String(timestamp),
    nonce,
    sha256Hex(body)
  ].join('\n');
}

export function signBpmtRequest({ method, path, query = '', body = '', appKey, appSecret, timestamp, nonce }) {
  const canonical = buildCanonicalString({ method, path, query, timestamp, nonce, body });
  const signature = crypto.createHmac('sha256', appSecret).update(canonical).digest('hex');

  return {
    'X-BPMT-App-Key': appKey,
    'X-BPMT-Timestamp': String(timestamp),
    'X-BPMT-Nonce': nonce,
    'X-BPMT-Signature': signature
  };
}
