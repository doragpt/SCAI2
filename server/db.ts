import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import ws from "ws";
import * as schema from "@shared/schema";
import { log } from "./utils/logger";

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Poolの設定
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000
};

// プールの作成と接続エラーハンドリング
export const pool = new Pool(poolConfig);

// エラーイベントのハンドリング
pool.on('error', (err) => {
  log('error', 'Unexpected error on idle client', { error: err.message });
});

// プールの接続テスト関数
export async function testConnection() {
  try {
    const client = await pool.connect();
    log('info', 'Database connection test successful');
    client.release();
    return true;
  } catch (error) {
    log('error', 'Database connection test failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return false;
  }
}

// DrizzleORMの設定
export const db = drizzle(pool, { schema });

// connect-pg-simpleで使用するための設定
export const config = {
  pool,
  schema: 'public',
  table: 'session'
};

// 接続テストの実行
testConnection().catch(err => {
  log('error', 'Initial connection test failed', {
    error: err instanceof Error ? err.message : 'Unknown error'
  });
});

export { sql };