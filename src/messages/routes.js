import { currentUser, requireLogin } from '../auth/session.js';

function firstQueryValue(value, fallback = '') {
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0] : fallback;
  }
  return typeof value === 'string' ? value : fallback;
}

function parseFilters(query = {}) {
  return {
    title: firstQueryValue(query.title),
    creatorUserid: firstQueryValue(query.creatorUserid),
    page: firstQueryValue(query.page, '1'),
    pageSize: firstQueryValue(query.pageSize, '20')
  };
}

function selectedIds(body = {}) {
  const rawIds = body.ids;
  if (!rawIds) {
    return [];
  }
  return Array.isArray(rawIds) ? rawIds.filter(Boolean) : [rawIds].filter(Boolean);
}

function consumeFlash(req) {
  const flash = req.session?.flash || null;
  if (req.session) {
    delete req.session.flash;
  }
  return flash;
}

function emptyResult(filters) {
  return {
    rows: [],
    total: 0,
    page: Number.parseInt(filters.page, 10) || 1,
    pageSize: Number.parseInt(filters.pageSize, 10) || 20,
    totalPages: 1
  };
}

function isOwner(message, user) {
  return Boolean(message && user && message.creatorUserid === user.userid);
}

function notFound(message = '留言不存在') {
  const error = new Error(message);
  error.status = 404;
  return error;
}

function forbidden(message = '只能编辑自己创建的留言') {
  const error = new Error(message);
  error.status = 403;
  return error;
}

export function createMessageRouter({ express, service }) {
  const router = express.Router();

  router.get('/', requireLogin, async (req, res, next) => {
    try {
      const filters = parseFilters(req.query);
      const setupRequired = typeof service.isReady === 'function' ? !(await service.isReady()) : false;
      const result = setupRequired ? emptyResult(filters) : await service.list(filters);
      const flash = consumeFlash(req);

      res.render('messages/index', {
        title: '留言登记',
        user: currentUser(req),
        filters,
        result,
        setupRequired,
        flash
      });
    } catch (error) {
      next(error);
    }
  });

  router.get('/messages/new', requireLogin, (req, res) => {
    res.render('messages/form', {
      title: '新增留言',
      user: currentUser(req),
      message: {},
      mode: 'create',
      action: '/messages',
      backHref: '/'
    });
  });

  router.get('/messages/:id', requireLogin, async (req, res, next) => {
    try {
      const message = await service.findById(req.params.id);
      if (!message) {
        throw notFound();
      }

      res.render('messages/detail', {
        title: '留言详情',
        user: currentUser(req),
        message,
        owned: isOwner(message, currentUser(req))
      });
    } catch (error) {
      next(error);
    }
  });

  router.get('/messages/:id/edit', requireLogin, async (req, res, next) => {
    try {
      const message = await service.findById(req.params.id);
      if (!message) {
        throw notFound();
      }
      if (!isOwner(message, currentUser(req))) {
        throw forbidden();
      }

      const encodedId = encodeURIComponent(message.id);
      res.render('messages/form', {
        title: '编辑留言',
        user: currentUser(req),
        message,
        mode: 'edit',
        action: `/messages/${encodedId}/update`,
        backHref: `/messages/${encodedId}`
      });
    } catch (error) {
      next(error);
    }
  });

  router.post('/messages', requireLogin, async (req, res, next) => {
    try {
      await service.create(req.body, currentUser(req));
      req.session.flash = { type: 'success', message: '留言已新增' };
      res.redirect('/');
    } catch (error) {
      next(error);
    }
  });

  router.post('/messages/:id/update', requireLogin, async (req, res, next) => {
    try {
      await service.update(req.params.id, req.body, currentUser(req));
      req.session.flash = { type: 'success', message: '留言已更新' };
      res.redirect('/');
    } catch (error) {
      next(error);
    }
  });

  router.post('/messages/:id/delete', requireLogin, async (req, res, next) => {
    try {
      await service.delete(req.params.id, currentUser(req));
      req.session.flash = { type: 'success', message: '留言已删除' };
      res.redirect('/');
    } catch (error) {
      next(error);
    }
  });

  router.post('/messages/bulk-delete', requireLogin, async (req, res, next) => {
    try {
      await service.deleteMany(selectedIds(req.body), currentUser(req));
      req.session.flash = { type: 'success', message: '选中留言已删除' };
      res.redirect('/');
    } catch (error) {
      next(error);
    }
  });

  return router;
}
