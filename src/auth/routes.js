import crypto from 'node:crypto';
import { buildAuthorizeUrl, exchangeCodeForToken, fetchUserInfo, verifyState } from './oauth.js';
import { clearUserSession, saveUserSession } from './session.js';

function safeError(message, status = 500) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function regenerateSession(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

export function createAuthRouter({ express, config }) {
  const router = express.Router();

  router.get('/login', (req, res) => {
    const state = crypto.randomBytes(16).toString('hex');
    req.session.oauthState = state;
    res.redirect(buildAuthorizeUrl(config, state));
  });

  router.get('/oauth/callback', async (req, res, next) => {
    try {
      const { code, state, error } = req.query;
      if (error) {
        throw safeError('OAuth 登录失败，请重新登录', 400);
      }
      if (!code) {
        throw safeError('OAuth 回调缺少 code，请重新登录', 400);
      }

      verifyState(req.session.oauthState, state);
      delete req.session.oauthState;

      const token = await exchangeCodeForToken({ config, code });
      const userInfo = await fetchUserInfo({ config, accessToken: token.access_token });
      await regenerateSession(req);
      saveUserSession(req, userInfo);
      res.redirect('/');
    } catch (caughtError) {
      next(caughtError);
    }
  });

  router.post('/logout', async (req, res, next) => {
    try {
      await clearUserSession(req);
      res.redirect('/');
    } catch (caughtError) {
      next(caughtError);
    }
  });

  return router;
}
