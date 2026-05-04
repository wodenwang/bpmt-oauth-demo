import test from 'node:test';
import assert from 'node:assert/strict';
import { createDbPool } from '../src/db/pool.js';
import { createMessageRepository } from '../src/messages/repository.js';

function createFakePool(responses) {
  const calls = [];
  return {
    calls,
    async execute(sql, args) {
      calls.push({ sql, args });
      if (responses.length === 0) {
        throw new Error(`unexpected query: ${sql}`);
      }
      const response = responses.shift();
      return typeof response === 'function' ? response(sql, args, calls) : response;
    }
  };
}

function createRow(overrides = {}) {
  return {
    DEMO_ID: 'uuid-1',
    DEMO_TITLE: '标题',
    DEMO_CONTENT: '内容',
    DEMO_CREATOR_USERID: 'admin',
    DEMO_CREATE_TIME: '2026-05-04 09:30:00',
    DEMO_UPDATE_TIME: '2026-05-04 10:00:00',
    ...overrides
  };
}

test('tableExists returns true only when DEMO_MESSAGE exists once', async () => {
  const truePool = createFakePool([[[{ total: 1 }]]]);
  const falsePool = createFakePool([[[{ total: 0 }]]]);

  assert.equal(await createMessageRepository(truePool).tableExists(), true);
  assert.equal(await createMessageRepository(falsePool).tableExists(), false);
  assert.match(truePool.calls[0].sql, /information_schema\.TABLES/);
  assert.deepEqual(truePool.calls[0].args, ['DEMO_MESSAGE']);
});

test('list executes count and list queries and maps paginated rows', async () => {
  const pool = createFakePool([
    [[{ total: 2 }]],
    [[
      createRow({ DEMO_ID: 'uuid-2', DEMO_TITLE: '第二条' }),
      createRow({ DEMO_ID: 'uuid-1', DEMO_TITLE: '第一条' })
    ]]
  ]);
  const repo = createMessageRepository(pool);

  const result = await repo.list({ title: '条', creatorUserid: 'admin', page: '2', pageSize: '1' });

  assert.equal(pool.calls.length, 2);
  assert.match(pool.calls[0].sql, /COUNT\(\*\) AS total/);
  assert.match(pool.calls[1].sql, /ORDER BY DEMO_CREATE_TIME DESC, DEMO_ID DESC/);
  assert.deepEqual(pool.calls[0].args, ['%条%', 'admin']);
  assert.deepEqual(pool.calls[1].args, ['%条%', 'admin', 1, 1]);
  assert.deepEqual(result, {
    rows: [
      {
        id: 'uuid-2',
        title: '第二条',
        content: '内容',
        creatorUserid: 'admin',
        createTime: '2026-05-04 09:30:00',
        updateTime: '2026-05-04 10:00:00'
      },
      {
        id: 'uuid-1',
        title: '第一条',
        content: '内容',
        creatorUserid: 'admin',
        createTime: '2026-05-04 09:30:00',
        updateTime: '2026-05-04 10:00:00'
      }
    ],
    total: 2,
    page: 2,
    pageSize: 1,
    totalPages: 2
  });
});

test('findById returns null when no row is found', async () => {
  const pool = createFakePool([[[]]]);
  const repo = createMessageRepository(pool);

  assert.equal(await repo.findById('missing-id'), null);
  assert.match(pool.calls[0].sql, /WHERE DEMO_ID = \?/);
  assert.deepEqual(pool.calls[0].args, ['missing-id']);
});

test('insert writes and reads back without depending on dynamic this binding', async () => {
  const pool = createFakePool([
    [{ affectedRows: 1 }],
    [[createRow({ DEMO_ID: 'uuid-new', DEMO_TITLE: '新留言' })]]
  ]);
  const { insert } = createMessageRepository(pool);

  const result = await insert({
    id: 'uuid-new',
    title: '新留言',
    content: '内容',
    creatorUserid: 'admin',
    now: '2026-05-04 11:00:00'
  });

  assert.match(pool.calls[0].sql, /INSERT INTO DEMO_MESSAGE/);
  assert.match(pool.calls[1].sql, /WHERE DEMO_ID = \?/);
  assert.deepEqual(pool.calls[1].args, ['uuid-new']);
  assert.equal(result.id, 'uuid-new');
  assert.equal(result.title, '新留言');
});

test('update writes and reads back without depending on dynamic this binding', async () => {
  const pool = createFakePool([
    [{ affectedRows: 1 }],
    [[createRow({ DEMO_ID: 'uuid-1', DEMO_TITLE: '更新后' })]]
  ]);
  const { update } = createMessageRepository(pool);

  const result = await update({
    id: 'uuid-1',
    title: '更新后',
    content: '新内容',
    now: '2026-05-04 12:00:00'
  });

  assert.match(pool.calls[0].sql, /UPDATE DEMO_MESSAGE/);
  assert.match(pool.calls[1].sql, /WHERE DEMO_ID = \?/);
  assert.deepEqual(pool.calls[1].args, ['uuid-1']);
  assert.equal(result.id, 'uuid-1');
  assert.equal(result.title, '更新后');
});

test('delete returns true only when one row is affected', async () => {
  const truePool = createFakePool([[{ affectedRows: 1 }]]);
  const falsePool = createFakePool([[{ affectedRows: 0 }]]);

  assert.equal(await createMessageRepository(truePool).delete('uuid-1'), true);
  assert.equal(await createMessageRepository(falsePool).delete('missing-id'), false);
  assert.match(truePool.calls[0].sql, /DELETE FROM DEMO_MESSAGE/);
  assert.deepEqual(truePool.calls[0].args, ['uuid-1']);
});

test('createDbPool keeps MariaDB date columns as strings', async () => {
  const pool = createDbPool({
    host: 'localhost',
    port: 3306,
    user: 'demo',
    password: 'placeholder',
    database: 'bpmt'
  });

  try {
    assert.equal(pool.pool.config.connectionConfig.dateStrings, true);
  } finally {
    await pool.end();
  }
});
