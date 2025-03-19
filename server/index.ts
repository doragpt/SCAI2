import express, { type Request, Response, NextFunction } from "express";
import { setupVite, serveStatic } from "./vite";
import { db, sql } from "./db";
import cors from "cors";
import { setupCronJobs } from "./cron";
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
      environment: process.env.NODE_ENV
    });

    // データベース接続テスト
    try {
      log('info', 'データベース接続を試行中...', {
        host: process.env.PGHOST,
        database: process.env.PGDATABASE,
        port: process.env.PGPORT
      });

      await db.execute(sql`SELECT 1`);
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

    // Expressアプリケーションの作成
    const app = express();

    // CORSの設定
    app.use(cors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }));

    // APIルートのプレフィックス設定
    app.use('/api', (req, res, next) => {
      res.setHeader('Content-Type', 'application/json');
      next();
    });

    // 先にAPIルートを登録
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // 認証関連のルートをインポート
    const { setupAuth } = await import('./auth');
    await setupAuth(app);

    // その他のルートをインポート
    const { registerRoutes } = await import('./routes');
    await registerRoutes(app);

    // 開発環境の場合のみViteミドルウェアを設定
    if (process.env.NODE_ENV === "development") {
      log('info', 'Viteミドルウェアのセットアップを開始');
      try {
        // HTTPサーバーの作成
        const server = createServer(app);
        await setupVite(app, server);
        log('info', 'Viteセットアップ完了');

        const port = Number(process.env.PORT) || 5000;
        server.listen(port, '0.0.0.0', () => {
          log('info', `サーバーを起動しました: http://0.0.0.0:${port}`, {
            environment: process.env.NODE_ENV,
            totalStartupTime: Date.now() - startTime
          });

          // cronジョブのセットアップ
          setupCronJobs();
        });
      } catch (error) {
        log('error', 'Viteセットアップ失敗', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
      }
    } else {
      // 本番環境では静的ファイルを提供
      serveStatic(app);
    }
  } catch (error) {
    log('error', "致命的な起動エラー", {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
  }
})();