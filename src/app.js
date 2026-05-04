import express from 'express';
import session from 'express-session';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAuthRouter } from './auth/routes.js';
import { loadConfig } from './config.js';
import { createDbPool } from './db/pool.js';
import { createMessageRepository } from './messages/repository.js';
import { createMessageRouter } from './messages/routes.js';
import { createMessageService } from './messages/service.js';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function createDefaultMessageService(appConfig) {
  const pool = createDbPool(appConfig.db);
  const repository = createMessageRepository(pool);
  return createMessageService({ repository });
}

export function createApp({ appConfig = loadConfig(), messageService } = {}) {
  const app = express();
  const service = messageService || createDefaultMessageService(appConfig);

  app.set('view engine', 'ejs');
  app.set('views', path.join(rootDir, 'views'));

  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());
  app.use('/static', express.static(path.join(rootDir, 'public')));
  app.use(
    session({
      name: 'bpmt_oauth_demo_sid',
      secret: appConfig.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: appConfig.nodeEnv === 'production'
      }
    })
  );

  app.use(createAuthRouter({ express, config: appConfig }));
  app.use(createMessageRouter({ express, service }));

  app.use((error, req, res, next) => {
    if (res.headersSent) {
      next(error);
      return;
    }

    const status = error.status || 500;
    res.status(status).render('error', {
      title: '系统提示',
      status,
      message: status >= 500 ? '系统暂时不可用，请稍后重试' : error.message,
      user: req.session?.user || null
    });
  });

  return app;
}
