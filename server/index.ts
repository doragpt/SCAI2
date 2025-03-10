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

// 開発環境を強制的に設定
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
    log('info', 'Startup phase: initialization', {
      timestamp: startTime,
      environment: process.env.NODE_ENV
    });

    // データベース接続テスト
    try {
      await db.execute(sql`SELECT 1`);
      log('info', 'Database connection successful', {
        duration: Date.now() - startTime
      });
    } catch (error) {
      log('error', 'Database connection failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      process.exit(1);
    }

    // HTTP サーバーの作成
    const server = createServer(app);

    // 認証セットアップ
    const authStartTime = Date.now();
    setupAuth(app);
    log('info', 'Auth setup completed', {
      duration: Date.now() - authStartTime
    });

    // APIリクエストの共通ミドルウェア
    app.use("/api/*", (req, res, next) => {
      log('info', 'API request received', {
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
    await registerRoutes(app);
    log('info', 'Routes registered', {
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
      log('info', 'Setting up Vite middleware for development');
      const viteStartTime = Date.now();

      try {
        await setupVite(app, server);
        log('info', 'Vite setup completed', {
          duration: Date.now() - viteStartTime
        });
      } catch (error) {
        log('error', 'Vite setup failed', {
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
    server.listen(port, () => {
      log('info', `Server started at http://0.0.0.0:${port}`, {
        environment: process.env.NODE_ENV,
        totalStartupTime: Date.now() - startTime
      });

      // cronジョブは非同期で遅延セットアップ
      setTimeout(() => {
        const cronStartTime = Date.now();
        setupCronJobs();
        log('info', 'Cron jobs setup completed', {
          duration: Date.now() - cronStartTime
        });
      }, 5000);
    });
  } catch (error) {
    log('error', "Fatal startup error", {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
  }
})();