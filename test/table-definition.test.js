import test from 'node:test';
import assert from 'node:assert/strict';
import { DEMO_MESSAGE_TABLE } from '../src/setup/tableDefinition.js';

test('DEMO_MESSAGE table definition matches confirmed design', () => {
  assert.equal(DEMO_MESSAGE_TABLE.name, 'DEMO_MESSAGE');
  assert.equal(DEMO_MESSAGE_TABLE.cacheFlag, 0);
  assert.deepEqual(
    DEMO_MESSAGE_TABLE.columns.map((column) => column.name),
    ['ID', 'TITLE', 'CONTENT', 'CREATOR_USERID', 'CREATE_TIME', 'UPDATE_TIME']
  );
  assert.equal(DEMO_MESSAGE_TABLE.columns.find((column) => column.name === 'ID').primaryKey, true);
  assert.equal(DEMO_MESSAGE_TABLE.columns.find((column) => column.name === 'CONTENT').type, 'Clob');
});
