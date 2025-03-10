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

    // 最小限のデータベース接続テスト
    try {
      await db.execute(sql`SELECT 1`);
      log('Database connection verified');
    } catch (error) {
      log('Database connection failed, but continuing startup');
    }

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
    server.listen(5000, "0.0.0.0", () => {
      log(`Server started on port 5000`);
    });

    return server;
  } catch (error) {
    log("Fatal startup error:", error);
    process.exit(1);
  }
}

startServer();