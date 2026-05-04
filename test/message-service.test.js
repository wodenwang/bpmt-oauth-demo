import test from 'node:test';
import assert from 'node:assert/strict';
import { createMessageService, ValidationError, PermissionError, NotFoundError } from '../src/messages/service.js';

function createRepo(seed = {}) {
  const store = new Map(Object.entries(seed));
  return {
    async list(filters) {
      return { rows: [...store.values()], total: store.size, page: Number(filters.page || 1), pageSize: 20, totalPages: 1 };
    },
    async findById(id) {
      return store.get(id) || null;
    },
    async insert(message) {
      const row = { ...message, createTime: message.now, updateTime: message.now };
      store.set(message.id, row);
      return row;
    },
    async update(message) {
      const old = store.get(message.id);
      const row = { ...old, title: message.title, content: message.content, updateTime: message.now };
      store.set(message.id, row);
      return row;
    },
    async delete(id) {
      return store.delete(id);
    },
    async tableExists() {
      return true;
    }
  };
}

test('isReady reports table existence from repository', async () => {
  const service = createMessageService({ repository: createRepo() });
  assert.equal(await service.isReady(), true);
});

test('create writes current userid as creator', async () => {
  const service = createMessageService({
    repository: createRepo(),
    idFactory: () => 'uuid-1',
    clock: () => '2026-05-04 09:30:00'
  });

  const row = await service.create({ title: '标题', content: '内容' }, { userid: 'admin' });
  assert.equal(row.creatorUserid, 'admin');
});

test('create rejects blank title and content', async () => {
  const service = createMessageService({ repository: createRepo() });
  await assert.rejects(() => service.create({ title: ' ', content: '内容' }, { userid: 'admin' }), ValidationError);
  await assert.rejects(() => service.create({ title: '标题', content: ' ' }, { userid: 'admin' }), ValidationError);
});

test('create rejects non-object input as validation error', async () => {
  const service = createMessageService({ repository: createRepo() });
  await assert.rejects(() => service.create(null, { userid: 'admin' }), ValidationError);
});

test('update allows only creator', async () => {
  const repo = createRepo({
    'uuid-1': { id: 'uuid-1', title: '旧', content: '旧内容', creatorUserid: 'admin' }
  });
  const service = createMessageService({ repository: repo, clock: () => '2026-05-04 10:00:00' });

  await assert.rejects(
    () => service.update('uuid-1', { title: '新', content: '新内容' }, { userid: 'other' }),
    PermissionError
  );

  const row = await service.update('uuid-1', { title: '新', content: '新内容' }, { userid: 'admin' });
  assert.equal(row.title, '新');
});

test('delete allows only creator and reports missing rows', async () => {
  const repo = createRepo({
    'uuid-1': { id: 'uuid-1', title: '旧', content: '旧内容', creatorUserid: 'admin' }
  });
  const service = createMessageService({ repository: repo });

  await assert.rejects(() => service.delete('missing', { userid: 'admin' }), NotFoundError);
  await assert.rejects(() => service.delete('uuid-1', { userid: 'other' }), PermissionError);
  assert.equal(await service.delete('uuid-1', { userid: 'admin' }), true);
});

test('deleteMany uses delete permission path without dynamic this binding', async () => {
  const repo = createRepo({
    'uuid-1': { id: 'uuid-1', title: '第一条', content: '内容', creatorUserid: 'admin' },
    'uuid-2': { id: 'uuid-2', title: '第二条', content: '内容', creatorUserid: 'admin' }
  });
  const { deleteMany } = createMessageService({ repository: repo });

  assert.deepEqual(await deleteMany(['uuid-1', 'uuid-2'], { userid: 'admin' }), [true, true]);
  await assert.rejects(() => deleteMany(['uuid-1'], { userid: 'admin' }), NotFoundError);
});
