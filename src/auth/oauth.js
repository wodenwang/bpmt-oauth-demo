function safeError(message, status = 500) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function parseResponse(response, failureMessage) {
  const text = await response.text();
  let payload = {};

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = {};
    }
  }

  if (!response.ok) {
    throw safeError(`${failureMessage}: HTTP ${response.status}`, response.status);
  }

  return payload;
}

function serverBaseUrl(config) {
  return config.bpmtServerBaseUrl || config.bpmtBaseUrl;
}

export function buildAuthorizeUrl(config, state) {
  const url = new URL('/oauth/authorize', config.bpmtBaseUrl);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', config.oauth.clientId);
  url.searchParams.set('redirect_uri', config.oauth.redirectUri);
  url.searchParams.set('state', state);
  return url.toString();
}

export function verifyState(expectedState, actualState) {
  if (!expectedState || !actualState || expectedState !== actualState) {
    throw safeError('OAuth state 校验失败，请重新登录', 400);
  }
  return true;
}

export async function exchangeCodeForToken({ config, code, fetchImpl = fetch }) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.oauth.redirectUri,
    client_id: config.oauth.clientId,
    client_secret: config.oauth.clientSecret
  });

  const response = await fetchImpl(new URL('/oauth/token', serverBaseUrl(config)).toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  const token = await parseResponse(response, 'OAuth token 换取失败');

  if (!token.access_token) {
    throw safeError('OAuth token 响应缺少 access_token', 502);
  }

  return token;
}

export async function fetchUserInfo({ config, accessToken, fetchImpl = fetch }) {
  const response = await fetchImpl(new URL('/oauth/userinfo', serverBaseUrl(config)).toString(), {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const userInfo = await parseResponse(response, 'OAuth 用户信息获取失败');

  if (!userInfo.userid) {
    throw safeError('OAuth 用户信息缺少 userid', 502);
  }

  return userInfo;
}
