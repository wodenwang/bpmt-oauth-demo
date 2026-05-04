import 'dotenv/config';
import { loadConfig, redactConfig } from '../src/config.js';
import { createBpmtApiClient } from '../src/bpmt/api.js';
import { DEMO_MESSAGE_TABLE } from '../src/setup/tableDefinition.js';

function unwrapEnvelope(payload) {
  return payload?.data && typeof payload.data === 'object' ? payload.data : payload;
}

function normalizeColumn(column, expectedColumn = column) {
  const normalized = {
    name: column.name,
    type: column.type,
    primaryKey: Boolean(column.primaryKey),
    required: Boolean(column.required)
  };

  if (Object.prototype.hasOwnProperty.call(expectedColumn, 'totalSize')) {
    normalized.totalSize = column.totalSize ?? null;
  }

  return normalized;
}

function normalizedColumns(tableDefinition, expectedDefinition = tableDefinition) {
  const expectedColumns = expectedDefinition?.columns || [];
  return (tableDefinition?.columns || []).map((column, index) => normalizeColumn(column, expectedColumns[index]));
}

function tableDefinitionMatches(currentPayload, expectedDefinition) {
  const current = unwrapEnvelope(currentPayload);
  return JSON.stringify(normalizedColumns(current, expectedDefinition)) === JSON.stringify(normalizedColumns(expectedDefinition));
}

async function main() {
  const config = loadConfig();
  const client = createBpmtApiClient(config.bpmtApi);
  console.log('开始初始化 BPMT demo 表结构');
  console.log(`BPMT API 配置：${JSON.stringify(redactConfig(config).bpmtApi)}`);

  const createResult = await client.createDynamicTable(DEMO_MESSAGE_TABLE);
  if (createResult.alreadyExists) {
    const currentTable = await client.getDynamicTable(DEMO_MESSAGE_TABLE.name);
    if (tableDefinitionMatches(currentTable, DEMO_MESSAGE_TABLE)) {
      console.log('DEMO_MESSAGE 已存在，定义一致，执行 DDL 同步');
    } else {
      console.log('DEMO_MESSAGE 已存在，更新定义并执行 DDL 同步');
      await client.updateDynamicTable(DEMO_MESSAGE_TABLE.name, DEMO_MESSAGE_TABLE);
    }
    await client.syncDynamicTableDdl(DEMO_MESSAGE_TABLE.name);
  } else {
    console.log('DEMO_MESSAGE 已创建');
  }

  console.log('BPMT demo 表结构初始化完成');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
