import {
  buildCountMessagesQuery,
  buildDeleteMessageQuery,
  buildFindMessageQuery,
  buildInsertMessageQuery,
  buildListMessagesQuery,
  buildTableExistsQuery,
  buildUpdateMessageQuery
} from './sql.js';

function mapRow(row) {
  return {
    id: row.ID,
    title: row.TITLE,
    content: row.CONTENT,
    creatorUserid: row.CREATOR_USERID,
    createTime: row.CREATE_TIME,
    updateTime: row.UPDATE_TIME
  };
}

export function createMessageRepository(pool) {
  return {
    async tableExists() {
      const query = buildTableExistsQuery();
      const [rows] = await pool.execute(query.sql, query.args);
      return Number(rows[0]?.total || 0) === 1;
    },

    async list(filters) {
      const countQuery = buildCountMessagesQuery(filters);
      const listQuery = buildListMessagesQuery(filters);
      const [countRows] = await pool.execute(countQuery.sql, countQuery.args);
      const [rows] = await pool.execute(listQuery.sql, listQuery.args);
      const total = Number(countRows[0]?.total || 0);

      return {
        rows: rows.map(mapRow),
        total,
        page: listQuery.page,
        pageSize: listQuery.pageSize,
        totalPages: Math.max(1, Math.ceil(total / listQuery.pageSize))
      };
    },

    async findById(id) {
      const query = buildFindMessageQuery(id);
      const [rows] = await pool.execute(query.sql, query.args);
      return rows[0] ? mapRow(rows[0]) : null;
    },

    async insert(message) {
      const query = buildInsertMessageQuery(message);
      await pool.execute(query.sql, query.args);
      return this.findById(message.id);
    },

    async update(message) {
      const query = buildUpdateMessageQuery(message);
      await pool.execute(query.sql, query.args);
      return this.findById(message.id);
    },

    async delete(id) {
      const query = buildDeleteMessageQuery(id);
      const [result] = await pool.execute(query.sql, query.args);
      return result.affectedRows === 1;
    }
  };
}
