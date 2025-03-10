import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, log } from "./vite";
import { db, sql } from "./db";
import cors from "cors";
import { setupCronJobs } from "./cron";

const app = express();

// CORSミドルウェアの設定
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 簡略化されたリクエストロギング
app.use((req, res, next) => {
  const start = Date.now();
  log('Request:', `${req.method} ${req.path}`);

  res.on("finish", () => {
    const duration = Date.now() - start;
    log('Response:', `${res.statusCode} ${duration}ms`);
  });

  next();
});

// ヘルスチェックエンドポイント
app.get('/health', async (_req, res) => {
  try {
    await db.execute(sql`SELECT 1`);
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (error) {
    log('Health check failed:', error);
    res.status(500).json({ 
      status: 'error',
      timestamp: new Date().toISOString()
    });
  }
});

// メインのアプリケーション起動処理
async function startServer() {
  try {
    log('Starting server...');
    const server = await registerRoutes(app);

    // エラーハンドリングミドルウェア
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      log("Error:", err.message);
      res.status(err.status || 500).json({
        error: true,
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
      });
    });

    if (app.get("env") === "development") {
      await setupVite(app, server);
    }

    const port = process.env.PORT || 5000;
    server.listen(port, "0.0.0.0", () => {
      log(`Server started at http://0.0.0.0:${port}`);

      // サーバー起動後に非同期で初期化処理を実行
      initializeServices().catch(error => {
        log("Service initialization error:", error);
      });
    });

    return server;
  } catch (error) {
    log("Fatal startup error:", error);
    process.exit(1);
  }
}

// 非同期の初期化処理
async function initializeServices() {
  try {
    // データベース接続テスト
    await db.execute(sql`SELECT 1`);
    log('Database connection successful');

    // cronジョブのセットアップ
    await setupCronJobs();
    log('Cron jobs setup completed');
  } catch (error) {
    log('Service initialization error:', error);
    // エラーをスローせず、サービスは継続
  }
}

startServer();