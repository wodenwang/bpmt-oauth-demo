import 'dotenv/config';
import { createApp } from './app.js';
import { loadConfig, redactConfig } from './config.js';

const config = loadConfig();
const app = createApp({ appConfig: config });

app.listen(config.port, () => {
  console.log(`bpmt-oauth-demo listening on ${config.port}`);
  console.log(JSON.stringify(redactConfig(config)));
});
