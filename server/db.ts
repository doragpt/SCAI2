import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import ws from "ws";
import * as schema from "@shared/schema";
import { log } from './utils/logger';

// WebSocket設定
neonConfig.webSocketConstructor = ws;

// 環境変数チェック
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

log('info', 'データベース接続を試行中...', {
  host: new URL(process.env.DATABASE_URL).hostname,
  database: new URL(process.env.DATABASE_URL).pathname.slice(1),
  port: new URL(process.env.DATABASE_URL).port
});

// プールの設定
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  maxUses: 7500,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  max: 10, // 最大接続数
});

// エラーハンドリングの設定
pool.on('error', (err) => {
  log('error', 'Unexpected error on idle client', {
    error: err.message,
    stack: err.stack
  });
});

pool.on('connect', (client) => {
  log('info', 'New database connection established', {
    pid: client.processID
  });
});

// 接続テスト
async function testConnection() {
  try {
    const startTime = Date.now();
    await pool.query('SELECT 1');
    const duration = Date.now() - startTime;
    log('info', 'データベース接続成功', { duration });
    return true;
  } catch (error) {
    log('error', 'データベース接続テストエラー', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return false;
  }
}

// DrizzleORMの設定
export const db = drizzle(pool, { 
  schema,
  logger: true
});

// connect-pg-simpleで使用するための設定
export const config = {
  pool,
  schema: 'public',
  table: 'session'
};

export { sql, testConnection };