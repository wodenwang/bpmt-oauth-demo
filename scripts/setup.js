import 'dotenv/config';
import { loadConfig, redactConfig } from '../src/config.js';
import { createBpmtApiClient } from '../src/bpmt/api.js';
import { DEMO_MESSAGE_TABLE } from '../src/setup/tableDefinition.js';

async function main() {
  const config = loadConfig();
  const client = createBpmtApiClient(config.bpmtApi);
  console.log('开始初始化 BPMT demo 表结构');
  console.log(`BPMT API 配置：${JSON.stringify(redactConfig(config).bpmtApi)}`);

  const createResult = await client.createDynamicTable(DEMO_MESSAGE_TABLE);
  if (createResult.alreadyExists) {
    console.log('DEMO_MESSAGE 已存在，执行 DDL 同步');
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
