import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// プールの設定をエクスポート
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// DrizzleORMの設定
export const db = drizzle(pool, { schema });

// connect-pg-simpleで使用するための設定
export const config = {
  pool,
  schema: 'public',
  table: 'session'
};

export { sql };