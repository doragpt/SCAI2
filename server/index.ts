import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite } from "./vite";
import { db, sql } from "./db";
import cors from "cors";
import { setupCronJobs } from "./cron";
import { log } from "./utils/logger";
import { setupAuth } from "./auth";
import { createServer } from "http";

const app = express();

// CORSミドルウェアの設定
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// JSONパーサーを早めに設定
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// セキュリティヘッダーの設定
app.use((req, res, next) => {
  // Content Security Policyの設定
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' ws: wss:;"
  );
  next();
});

// パフォーマンスメトリクスの追跡
function trackStartupMetric(phase: string) {
  const timestamp = Date.now();
  log('info', `Startup phase: ${phase}`, { timestamp });
  return timestamp;
}

// メインのアプリケーション起動処理
(async () => {
  try {
    const startTime = trackStartupMetric('initialization');

    // データベース接続テスト
    const dbStartTime = trackStartupMetric('database_connection');
    try {
      await db.execute(sql`SELECT 1`);
      log('info', 'Database connection successful', {
        duration: Date.now() - dbStartTime
      });
    } catch (error) {
      log('error', 'Database connection failed', error);
      process.exit(1);
    }

    // HTTP サーバーの作成
    const server = createServer(app);

    // 認証セットアップ
    const authStartTime = trackStartupMetric('auth_setup');
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
    const routesStartTime = trackStartupMetric('routes_registration');
    await registerRoutes(app);
    log('info', 'Routes registered', {
      duration: Date.now() - routesStartTime
    });

    // 開発環境の場合はViteのセットアップを行う
    if (process.env.NODE_ENV === "development") {
      const viteStartTime = trackStartupMetric('vite_setup');
      await setupVite(app, server);
      log('info', 'Vite setup completed', {
        duration: Date.now() - viteStartTime
      });
    }

    // APIエラーハンドリング
    app.use("/api/*", (err: Error, _req: Request, res: Response, _next: NextFunction) => {
      log('error', 'API error', {
        error: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });

      res.status(500).json({
        error: true,
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
      });
    });

    // リクエストロギングミドルウェア
    app.use((req, res, next) => {
      const start = Date.now();

      res.on("finish", () => {
        const duration = Date.now() - start;
        log('info', 'Response sent', {
          method: req.method,
          path: req.path,
          status: res.statusCode,
          duration: `${duration}ms`
        });
      });

      next();
    });

    const port = process.env.PORT || 5000;
    server.listen(port, () => {
      log('info', `Server started at http://0.0.0.0:${port}`, {
        environment: process.env.NODE_ENV,
        totalStartupTime: Date.now() - startTime
      });

      // cronジョブは非同期で遅延セットアップ
      setTimeout(() => {
        const cronStartTime = trackStartupMetric('cron_setup');
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