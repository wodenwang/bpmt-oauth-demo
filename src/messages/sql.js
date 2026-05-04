const TABLE = 'DEMO_MESSAGE';

function normalizePage(page) {
  const parsed = Number.parseInt(page || '1', 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function normalizePageSize(pageSize) {
  const parsed = Number.parseInt(pageSize || '20', 10);
  if (!Number.isInteger(parsed) || parsed < 1) return 20;
  return Math.min(parsed, 100);
}

function buildWhere(filters = {}) {
  const clauses = [];
  const args = [];

  if (filters.title && filters.title.trim()) {
    clauses.push('TITLE LIKE ?');
    args.push(`%${filters.title.trim()}%`);
  }

  if (filters.creatorUserid && filters.creatorUserid.trim()) {
    clauses.push('CREATOR_USERID = ?');
    args.push(filters.creatorUserid.trim());
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
    sql: `SELECT ID, TITLE, CONTENT, CREATOR_USERID, CREATE_TIME, UPDATE_TIME FROM ${TABLE}${whereSql} ORDER BY CREATE_TIME DESC LIMIT ? OFFSET ?`,
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
    sql: `SELECT ID, TITLE, CONTENT, CREATOR_USERID, CREATE_TIME, UPDATE_TIME FROM ${TABLE} WHERE ID = ?`,
    args: [id]
  };
}

export function buildInsertMessageQuery({ id, title, content, creatorUserid, now }) {
  return {
    sql: `INSERT INTO ${TABLE} (ID, TITLE, CONTENT, CREATOR_USERID, CREATE_TIME, UPDATE_TIME) VALUES (?, ?, ?, ?, ?, ?)`,
    args: [id, title, content, creatorUserid, now, now]
  };
}

export function buildUpdateMessageQuery({ id, title, content, now }) {
  return {
    sql: `UPDATE ${TABLE} SET TITLE = ?, CONTENT = ?, UPDATE_TIME = ? WHERE ID = ?`,
    args: [title, content, now, id]
  };
}

export function buildDeleteMessageQuery(id) {
  return {
    sql: `DELETE FROM ${TABLE} WHERE ID = ?`,
    args: [id]
  };
}

export function buildTableExistsQuery() {
  return {
    sql: 'SELECT COUNT(*) AS total FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',
    args: [TABLE]
  };
}
