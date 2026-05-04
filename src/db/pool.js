import mysql from 'mysql2/promise';
import { loadConfig } from '../config.js';

export function createDbPool(dbConfig = loadConfig().db) {
  return mysql.createPool({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database,
    waitForConnections: true,
    connectionLimit: 10,
    dateStrings: true,
    namedPlaceholders: false
  });
}
