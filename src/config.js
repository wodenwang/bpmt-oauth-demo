const REQUIRED_KEYS = [
  'SESSION_SECRET',
  'BPMT_BASE_URL',
  'BPMT_OAUTH_CLIENT_ID',
  'BPMT_OAUTH_CLIENT_SECRET',
  'BPMT_OAUTH_REDIRECT_URI',
  'BPMT_API_BASE_URL',
  'BPMT_API_APP_KEY',
  'BPMT_API_APP_SECRET',
  'DB_HOST',
  'DB_PORT',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME'
];

function requireValue(env, key) {
  const value = env[key];
  if (!value || String(value).trim() === '') {
    throw new Error(`缺少必要环境变量: ${key}`);
  }
  return String(value).trim();
}

function parsePort(value, key) {
  const rawValue = String(value).trim();
  if (!/^\d+$/.test(rawValue)) {
    throw new Error(`环境变量 ${key} 必须是有效端口`);
  }

  const port = Number.parseInt(rawValue, 10);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`环境变量 ${key} 必须是有效端口`);
  }
  return port;
}

export function loadConfig(env = process.env) {
  for (const key of REQUIRED_KEYS) {
    requireValue(env, key);
  }

  return {
    nodeEnv: env.NODE_ENV || 'development',
    port: parsePort(env.PORT || '81', 'PORT'),
    sessionSecret: requireValue(env, 'SESSION_SECRET'),
    bpmtBaseUrl: requireValue(env, 'BPMT_BASE_URL').replace(/\/$/, ''),
    oauth: {
      clientId: requireValue(env, 'BPMT_OAUTH_CLIENT_ID'),
      clientSecret: requireValue(env, 'BPMT_OAUTH_CLIENT_SECRET'),
      redirectUri: requireValue(env, 'BPMT_OAUTH_REDIRECT_URI')
    },
    bpmtApi: {
      baseUrl: requireValue(env, 'BPMT_API_BASE_URL').replace(/\/$/, ''),
      appKey: requireValue(env, 'BPMT_API_APP_KEY'),
      appSecret: requireValue(env, 'BPMT_API_APP_SECRET')
    },
    db: {
      host: requireValue(env, 'DB_HOST'),
      port: parsePort(requireValue(env, 'DB_PORT'), 'DB_PORT'),
      user: requireValue(env, 'DB_USER'),
      password: requireValue(env, 'DB_PASSWORD'),
      database: requireValue(env, 'DB_NAME')
    }
  };
}

export function redactConfig(config) {
  return {
    ...config,
    sessionSecret: '<redacted>',
    oauth: { ...config.oauth, clientSecret: '<redacted>' },
    bpmtApi: { ...config.bpmtApi, appSecret: '<redacted>' },
    db: { ...config.db, password: '<redacted>' }
  };
}
