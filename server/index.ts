import express, { type Request, Response, NextFunction } from "express";
import { db, sql } from "./db";
import cors from "cors";
import { log } from "./utils/logger";
import { createServer } from "http";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 開発環境を設定
process.env.NODE_ENV = "development";

(async () => {
  try {
    const startTime = Date.now();
    log('info', 'アプリケーション起動開始', {
      timestamp: startTime,
      nodeVersion: process.version,
      environmentVariables: {
        DATABASE_URL: !!process.env.DATABASE_URL,
        SESSION_SECRET: !!process.env.SESSION_SECRET,
        PORT: process.env.PORT || 5000
      }
    });

    // 最小構成のExpressアプリケーション
    const app = express();
    app.use(cors());
    app.use(express.json());

    // データベース接続テスト（タイムアウト付き）
    try {
      log('info', 'データベース接続を試行中...', {
        host: process.env.PGHOST,
        database: process.env.PGDATABASE,
        port: process.env.PGPORT
      });

      const dbTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Database connection timeout')), 5000);
      });

      await Promise.race([
        db.execute(sql`SELECT 1`),
        dbTimeout
      ]);

      log('info', 'データベース接続成功', {
        duration: Date.now() - startTime
      });
    } catch (error) {
      log('error', 'データベース接続失敗', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      process.exit(1);
    }

    // HTTPサーバーの作成
    const server = createServer(app);
    log('info', 'HTTPサーバー作成完了');

    // 基本的なルートハンドラー
    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok' });
    });

    const port = Number(process.env.PORT) || 5000;
    server.listen(port, '0.0.0.0', () => {
      log('info', `最小構成でサーバーを起動しました: http://0.0.0.0:${port}`, {
        environment: process.env.NODE_ENV,
        totalStartupTime: Date.now() - startTime
      });
    });

  } catch (error) {
    log('error', "致命的な起動エラー", {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
  }
})();