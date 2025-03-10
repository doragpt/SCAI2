import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite } from "./vite";
import { db, sql } from "./db";
import cors from "cors";
import { setupCronJobs } from "./cron";

const app = express();

// ロギング関数の改善
function log(level: 'info' | 'error' | 'warn', message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logData = data ? JSON.stringify(data, null, 2) : '';
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message} ${logData}`);
}

// パフォーマンスメトリクスの追跡
function trackStartupMetric(phase: string) {
  const timestamp = Date.now();
  log('info', `Startup phase: ${phase}`, { timestamp });
  return timestamp;
}

// CORSミドルウェアの設定
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// APIルートのプレフィックスチェックを最初に配置
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

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

// ヘルスチェックエンドポイント
app.get('/health', async (_req, res) => {
  try {
    await db.execute(sql`SELECT 1`);
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      env: app.get('env'),
      database: true
    });
  } catch (error) {
    log('error', 'Health check failed', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      env: app.get('env'),
      database: false,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

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
      log('warn', 'Warning: Database connection failed, but continuing application startup');
    }

    // APIルートを先に登録
    const routesStartTime = trackStartupMetric('routes_registration');
    const server = await registerRoutes(app);
    log('info', 'Routes registered', {
      duration: Date.now() - routesStartTime
    });

    // エラーハンドリングミドルウェア
    app.use((err: Error & { status?: number }, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || 500;
      const message = process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error';

      log('error', 'Server error', {
        error: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        status
      });

      res.status(status).json({
        error: true,
        message,
        timestamp: new Date().toISOString()
      });
    });

    // 開発環境の場合のみViteのセットアップ
    if (app.get("env") === "development") {
      const viteStartTime = trackStartupMetric('vite_setup');
      await setupVite(app, server);
      log('info', 'Vite setup completed', {
        duration: Date.now() - viteStartTime
      });
    }

    const port = process.env.PORT || 5000;
    server.listen(port, "0.0.0.0", () => {
      log('info', `Server started at http://0.0.0.0:${port}`, {
        environment: app.get("env"),
        totalStartupTime: Date.now() - startTime,
        cors: "Enabled with full access",
        database: "Connection attempted"
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
    log('error', "Fatal startup error", error);
    process.exit(1);
  }
})();