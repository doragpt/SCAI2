import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, log } from "./vite";
import { db, sql } from "./db";
import cors from "cors";
import { setupCronJobs } from "./cron";

const app = express();

// 必須ミドルウェアの設定
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// 開発に必要なリソースを許可するCSP設定
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:;"
  );
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 最小限のリクエストロギング
app.use((req, res, next) => {
  log(`${req.method} ${req.path}`);
  next();
});

// 簡易ヘルスチェック
app.get('/health', async (_req, res) => {
  try {
    await db.execute(sql`SELECT 1`);
    res.json({ status: 'ok' });
  } catch (error) {
    res.status(500).json({ status: 'error' });
  }
});

// メインのアプリケーション起動処理
async function startServer() {
  try {
    log('Starting server...');

    // 必須機能の初期化
    const server = await registerRoutes(app);

    // エラーハンドリングミドルウェア
    app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
      log("Error:", err.message);
      res.status(500).json({
        error: true,
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
      });
    });

    // サーバーをポート5000で起動
    server.listen(5000, "0.0.0.0", async () => {
      log(`Server started on port 5000`);

      // 開発環境の場合、即時にViteをセットアップ
      if (process.env.NODE_ENV === 'development') {
        try {
          await setupVite(app, server);
          log('Vite setup completed successfully');
        } catch (error) {
          log('Failed to setup Vite:', error instanceof Error ? error.message : 'Unknown error');
          log('Stack trace:', error instanceof Error ? error.stack : '');
        }

        // cronジョブは遅延実行
        setTimeout(async () => {
          try {
            await setupCronJobs();
            log('Cron jobs initialized');
          } catch (error) {
            log('Cron jobs setup error:', error);
          }
        }, 5000);
      }
    });

    return server;
  } catch (error) {
    log("Fatal startup error:", error);
    process.exit(1);
  }
}

startServer();