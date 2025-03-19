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
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  maxUses: 7500,
});

// エラーハンドリングの追加
pool.on('error', (err) => {
  log('error', 'データベースプールエラー', {
    error: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString()
  });

  // 重大なエラーの場合のみアプリケーションを終了
  if (err.message.includes('terminating connection due to administrator command')) {
    log('warn', 'データベース接続の再試行を開始します');
    return;
  }

  process.exit(-1);
});

pool.on('connect', () => {
  log('info', 'データベース接続成功', {
    timestamp: new Date().toISOString()
  });
});

pool.on('remove', () => {
  log('info', 'データベース接続が解放されました', {
    timestamp: new Date().toISOString()
  });
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