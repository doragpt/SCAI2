import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import ws from "ws";
import * as schema from "@shared/schema";
import { log } from './utils/logger';

// WebSocket設定
neonConfig.webSocketConstructor = ws;
neonConfig.wsProxy = process.env.WS_PROXY_URL;
neonConfig.useSecureWebSocket = true;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// プールの設定をエクスポート
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  maxConnections: 10,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  maxUses: 7500,
  connectionRetryLimit: 3,
});

// エラーハンドリングの追加
pool.on('error', (err) => {
  log('error', 'Unexpected error on idle client', {
    error: err.message,
    stack: err.stack
  });
  process.exit(-1);
});

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

export { sql };