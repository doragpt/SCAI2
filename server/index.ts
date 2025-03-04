import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, log } from "./vite";
import { db, sql } from "./db";
import cors from "cors";

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

// 詳細なリクエストロギングミドルウェア
app.use((req, res, next) => {
  const start = Date.now();
  log('Request received:', {
    method: req.method,
    path: req.path,
    headers: {
      ...req.headers,
      authorization: req.headers.authorization ? '[HIDDEN]' : undefined,
      cookie: req.headers.cookie ? '[HIDDEN]' : undefined
    },
    query: req.query,
    body: req.method !== 'GET' ? req.body : undefined,
    timestamp: new Date().toISOString()
  });

  res.on("finish", () => {
    const duration = Date.now() - start;
    log('Response sent:', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
  });

  next();
});

// ヘルスチェックエンドポイント
app.get('/health', async (_req, res) => {
  try {
    // 最小限のデータベース接続テスト
    await db.execute(sql`SELECT 1`);

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      env: app.get('env'),
      database: true
    });
  } catch (error) {
    log('Health check failed:', error);
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
    // 環境変数のチェック
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URLが設定されていません");
    }

    log('Starting server initialization...');

    // 初期データベース接続テスト
    try {
      log('Testing database connection...');
      await db.execute(sql`SELECT 1`);
      log('Database connection successful');
    } catch (error) {
      log('Database connection failed:', error);
      // エラーをスローせずに、アプリケーションは続行
      log('Warning: Database connection failed, but continuing application startup');
    }

    log('Registering routes...');
    const server = await registerRoutes(app);

    // エラーハンドリングミドルウェア
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      log("Server error:", {
        error: err,
        name: err.name,
        message: err.message,
        code: err.code,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        timestamp: new Date().toISOString()
      });

      res.status(err.status || 500).json({
        error: true,
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
        timestamp: new Date().toISOString()
      });
    });

    if (app.get("env") === "development") {
      log('Setting up Vite in development mode...');
      await setupVite(app, server);
    }

    // ポート設定の取得とログ出力
    const port = process.env.PORT || 5000;
    log(`Using port: ${port} (from ${process.env.PORT ? 'environment' : 'default'})`);

    // サーバー起動
    server.listen(port, "0.0.0.0", () => {
      log(`Server started at http://0.0.0.0:${port}`);
      log(`Environment: ${app.get("env")}`);
      log(`CORS: Enabled with full access`);
      log(`Database: Connection attempted`);
    });
  } catch (error) {
    log("Fatal startup error:", error);
    process.exit(1);
  }
})();