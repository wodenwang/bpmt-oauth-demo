import test from 'node:test';
import assert from 'node:assert/strict';
import { DEMO_MESSAGE_TABLE } from '../src/setup/tableDefinition.js';

test('DEMO_MESSAGE table definition matches confirmed design', () => {
  assert.equal(DEMO_MESSAGE_TABLE.name, 'DEMO_MESSAGE');
  assert.equal(DEMO_MESSAGE_TABLE.cacheFlag, 0);
  assert.deepEqual(
    DEMO_MESSAGE_TABLE.columns.map((column) => column.name),
    ['DEMO_ID', 'DEMO_TITLE', 'DEMO_CONTENT', 'DEMO_CREATOR_USERID', 'DEMO_CREATE_TIME', 'DEMO_UPDATE_TIME']
  );
  assert.deepEqual(DEMO_MESSAGE_TABLE.columns, [
    {
      name: 'DEMO_ID',
      description: '主键',
      type: 'String',
      totalSize: 36,
      primaryKey: true,
      required: true
    },
    {
      name: 'DEMO_TITLE',
      description: '留言标题',
      type: 'String',
      totalSize: 200,
      required: true
    },
    {
      name: 'DEMO_CONTENT',
      description: '留言内容',
      type: 'Clob',
      required: true
    },
    {
      name: 'DEMO_CREATOR_USERID',
      description: '创建人 userid',
      type: 'String',
      totalSize: 64,
      required: true
    },
    {
      name: 'DEMO_CREATE_TIME',
      description: '创建时间',
      type: 'Date',
      required: true
    },
    {
      name: 'DEMO_UPDATE_TIME',
      description: '更新时间',
      type: 'Date',
      required: true
    }
  ]);
  assert.equal(DEMO_MESSAGE_TABLE.columns.find((column) => column.name === 'DEMO_ID').primaryKey, true);
  assert.equal(DEMO_MESSAGE_TABLE.columns.find((column) => column.name === 'DEMO_CONTENT').type, 'Clob');
});
