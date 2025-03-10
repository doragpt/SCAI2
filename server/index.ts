import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { db, sql } from "./db";
import cors from "cors";
import { setupCronJobs } from "./cron";
import { log } from "./utils/logger";
import { setupAuth } from "./auth";
import { createServer } from "http";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 開発環境を設定
process.env.NODE_ENV = "development";

const app = express();

// 基本的なミドルウェアの設定
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORSの設定
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// セキュリティヘッダーの設定
app.use((req, res, next) => {
  const cspDirectives = process.env.NODE_ENV === 'development' 
    ? "default-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' ws: wss:; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
    : "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' ws: wss:;";

  res.setHeader('Content-Security-Policy', cspDirectives);
  next();
});

// メインのアプリケーション起動処理
(async () => {
  try {
    const startTime = Date.now();
    log('info', 'アプリケーション起動開始', {
      timestamp: startTime,
      environment: process.env.NODE_ENV
    });

    // データベース接続テスト
    try {
      log('info', 'データベース接続を試行中...');
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

    // HTTP サーバーの作成
    const server = createServer(app);

    // 認証セットアップ
    const authStartTime = Date.now();
    log('info', '認証システムのセットアップを開始');
    setupAuth(app);
    log('info', '認証システムのセットアップ完了', {
      duration: Date.now() - authStartTime
    });

    // APIリクエストの共通ミドルウェア
    app.use("/api/*", (req, res, next) => {
      log('info', 'APIリクエスト受信', {
        method: req.method,
        path: req.path,
        query: req.query,
        body: req.method !== 'GET' ? req.body : undefined
      });
      res.setHeader("Content-Type", "application/json");
      next();
    });

    // APIルートを登録
    const routesStartTime = Date.now();
    log('info', 'APIルートの登録を開始');
    await registerRoutes(app);
    log('info', 'APIルートの登録完了', {
      duration: Date.now() - routesStartTime
    });

    // APIエラーハンドリング
    app.use("/api/*", (err: Error, _req: Request, res: Response, _next: NextFunction) => {
      log('error', 'API error', {
        error: err instanceof Error ? err.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });

      res.status(500).json({
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
      });
    });

    if (process.env.NODE_ENV === "development") {
      // 開発環境: Viteミドルウェアを設定
      log('info', 'Viteミドルウェアのセットアップを開始');
      const viteStartTime = Date.now();

      try {
        await setupVite(app, server);
        log('info', 'Viteセットアップ完了', {
          duration: Date.now() - viteStartTime
        });
      } catch (error) {
        log('error', 'Viteセットアップ失敗', {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
        throw error;
      }
    } else {
      // 本番環境: 静的ファイルの提供
      serveStatic(app);
    }

    const port = process.env.PORT || 5000;
    server.listen(port, '0.0.0.0', () => {
      log('info', `サーバーを起動しました: http://0.0.0.0:${port}`, {
        environment: process.env.NODE_ENV,
        totalStartupTime: Date.now() - startTime
      });

      // cronジョブは非同期で遅延セットアップ
      setTimeout(() => {
        const cronStartTime = Date.now();
        setupCronJobs();
        log('info', 'Cronジョブのセットアップ完了', {
          duration: Date.now() - cronStartTime
        });
      }, 5000);
    });
  } catch (error) {
    log('error', "致命的な起動エラー", {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
  }
})();