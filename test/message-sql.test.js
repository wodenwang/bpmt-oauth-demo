import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCountMessagesQuery,
  buildDeleteMessageQuery,
  buildFindMessageQuery,
  buildInsertMessageQuery,
  buildListMessagesQuery,
  buildTableExistsQuery,
  buildUpdateMessageQuery
} from '../src/messages/sql.js';

test('buildListMessagesQuery uses filters, limit, offset and parameter args', () => {
  const query = buildListMessagesQuery({ title: '测试', creatorUserid: 'admin', page: 2, pageSize: 20 });
  assert.match(query.sql, /FROM DEMO_MESSAGE/);
  assert.match(query.sql, /DEMO_TITLE LIKE \?/);
  assert.match(query.sql, /DEMO_CREATOR_USERID = \?/);
  assert.match(query.sql, /ORDER BY DEMO_CREATE_TIME DESC, DEMO_ID DESC/);
  assert.deepEqual(query.args, ['%测试%', 'admin', 20, 20]);
});

test('buildCountMessagesQuery mirrors list filters without pagination', () => {
  const query = buildCountMessagesQuery({ title: '测试', creatorUserid: '' });
  assert.match(query.sql, /COUNT\(\*\) AS total/);
  assert.deepEqual(query.args, ['%测试%']);
});

test('buildInsertMessageQuery inserts server-owned creator and timestamps', () => {
  const query = buildInsertMessageQuery({
    id: 'uuid-1',
    title: '标题',
    content: '内容',
    creatorUserid: 'admin',
    now: '2026-05-04 09:30:00'
  });
  assert.match(query.sql, /INSERT INTO DEMO_MESSAGE/);
  assert.deepEqual(query.args, ['uuid-1', '标题', '内容', 'admin', '2026-05-04 09:30:00', '2026-05-04 09:30:00']);
});

test('buildUpdateMessageQuery updates title, content and update time by id', () => {
  const query = buildUpdateMessageQuery({
    id: 'uuid-1',
    title: '新标题',
    content: '新内容',
    now: '2026-05-04 10:00:00'
  });
  assert.deepEqual(query.args, ['新标题', '新内容', '2026-05-04 10:00:00', 'uuid-1']);
});

test('find and delete queries stay parameterized', () => {
  assert.deepEqual(buildFindMessageQuery('uuid-1').args, ['uuid-1']);
  assert.deepEqual(buildDeleteMessageQuery('uuid-1').args, ['uuid-1']);
});

test('buildTableExistsQuery checks current database metadata', () => {
  const query = buildTableExistsQuery();
  assert.match(query.sql, /information_schema\.TABLES/);
  assert.deepEqual(query.args, ['DEMO_MESSAGE']);
});

test('buildListMessagesQuery rejects partial numeric pagination values', () => {
  const query = buildListMessagesQuery({ page: '2abc', pageSize: '30xyz' });
  assert.equal(query.page, 1);
  assert.equal(query.pageSize, 20);
  assert.deepEqual(query.args, [20, 0]);
});

test('buildListMessagesQuery clamps strict pageSize values to 100', () => {
  const query = buildListMessagesQuery({ page: '3', pageSize: '150' });
  assert.equal(query.page, 3);
  assert.equal(query.pageSize, 100);
  assert.deepEqual(query.args, [100, 200]);
});

test('buildListMessagesQuery escapes LIKE wildcard characters for substring search', () => {
  const query = buildListMessagesQuery({ title: '100%_\\abc' });
  assert.ok(query.sql.includes("DEMO_TITLE LIKE ? ESCAPE '\\\\'"));
  assert.deepEqual(query.args, ['%100\\%\\_\\\\abc%', 20, 0]);
});

test('buildListMessagesQuery ignores non-string filters safely', () => {
  const query = buildListMessagesQuery({ title: 123, creatorUserid: { id: 'admin' } });
  assert.doesNotMatch(query.sql, /DEMO_TITLE LIKE/);
  assert.doesNotMatch(query.sql, /DEMO_CREATOR_USERID =/);
  assert.deepEqual(query.args, [20, 0]);
});
