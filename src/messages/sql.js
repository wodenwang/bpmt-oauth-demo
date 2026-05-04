const TABLE = 'DEMO_MESSAGE';

function normalizePositiveInteger(value, fallback) {
  if (typeof value === 'number') {
    return Number.isInteger(value) && value > 0 ? value : fallback;
  }

  if (typeof value !== 'string') {
    return fallback;
  }

  const normalized = value.trim();
  if (!/^\d+$/.test(normalized)) {
    return fallback;
  }

  const parsed = Number.parseInt(normalized, 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizePage(page) {
  return normalizePositiveInteger(page, 1);
}

function normalizePageSize(pageSize) {
  const parsed = normalizePositiveInteger(pageSize, 20);
  return Math.min(parsed, 100);
}

function normalizeFilterValue(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function escapeLikeValue(value) {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

function buildWhere(filters = {}) {
  const clauses = [];
  const args = [];
  const title = normalizeFilterValue(filters.title);
  const creatorUserid = normalizeFilterValue(filters.creatorUserid);

  if (title) {
    clauses.push(`DEMO_TITLE LIKE ? ESCAPE '\\\\'`);
    args.push(`%${escapeLikeValue(title)}%`);
  }

  if (creatorUserid) {
    clauses.push('DEMO_CREATOR_USERID = ?');
    args.push(creatorUserid);
  }

  return {
    whereSql: clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '',
    args
  };
}

export function buildListMessagesQuery(filters = {}) {
  const page = normalizePage(filters.page);
  const pageSize = normalizePageSize(filters.pageSize);
  const offset = (page - 1) * pageSize;
  const { whereSql, args } = buildWhere(filters);

  return {
    sql: `SELECT DEMO_ID, DEMO_TITLE, DEMO_CONTENT, DEMO_CREATOR_USERID, DEMO_CREATE_TIME, DEMO_UPDATE_TIME FROM ${TABLE}${whereSql} ORDER BY DEMO_CREATE_TIME DESC, DEMO_ID DESC LIMIT ? OFFSET ?`,
    args: [...args, pageSize, offset],
    page,
    pageSize
  };
}

export function buildCountMessagesQuery(filters = {}) {
  const { whereSql, args } = buildWhere(filters);
  return {
    sql: `SELECT COUNT(*) AS total FROM ${TABLE}${whereSql}`,
    args
  };
}

export function buildFindMessageQuery(id) {
  return {
    sql: `SELECT DEMO_ID, DEMO_TITLE, DEMO_CONTENT, DEMO_CREATOR_USERID, DEMO_CREATE_TIME, DEMO_UPDATE_TIME FROM ${TABLE} WHERE DEMO_ID = ?`,
    args: [id]
  };
}

export function buildInsertMessageQuery({ id, title, content, creatorUserid, now }) {
  return {
    sql: `INSERT INTO ${TABLE} (DEMO_ID, DEMO_TITLE, DEMO_CONTENT, DEMO_CREATOR_USERID, DEMO_CREATE_TIME, DEMO_UPDATE_TIME) VALUES (?, ?, ?, ?, ?, ?)`,
    args: [id, title, content, creatorUserid, now, now]
  };
}

export function buildUpdateMessageQuery({ id, title, content, now }) {
  return {
    sql: `UPDATE ${TABLE} SET DEMO_TITLE = ?, DEMO_CONTENT = ?, DEMO_UPDATE_TIME = ? WHERE DEMO_ID = ?`,
    args: [title, content, now, id]
  };
}

export function buildDeleteMessageQuery(id) {
  return {
    sql: `DELETE FROM ${TABLE} WHERE DEMO_ID = ?`,
    args: [id]
  };
}

export function buildTableExistsQuery() {
  return {
    sql: 'SELECT COUNT(*) AS total FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',
    args: [TABLE]
  };
}
