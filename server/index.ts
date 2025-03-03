import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, log } from "./vite";
import { db, sql } from "./db";
import cors from "cors";

const app = express();

// CORSミドルウェアの設定を改善
app.use(cors({
  origin: process.env.NODE_ENV === "development" 
    ? ["http://localhost:5000", "https://*.replit.dev"]
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Length', 'X-Content-Type-Options'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// リクエストロギングの改善
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  // ヘッダー情報のログ出力を追加
  console.log('Request Headers:', {
    origin: req.headers.origin,
    host: req.headers.host,
    authorization: req.headers.authorization ? 'Present' : 'Not Present',
    timestamp: new Date().toISOString()
  });

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // 必須環境変数のチェック
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URLが設定されていません");
    }

    const server = await registerRoutes(app);

    // エラーハンドリングミドルウェアの改善
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error("Server error:", {
        error: err,
        message: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString()
      });

      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      const details = process.env.NODE_ENV === "development" ? err.stack : undefined;

      res.status(status).json({ 
        message,
        details,
        timestamp: new Date().toISOString()
      });
    });

    // 開発環境の場合はViteをセットアップ
    if (app.get("env") === "development") {
      await setupVite(app, server);
    }

    // サーバー起動設定の改善
    server.listen({
      port: 5000,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`サーバーを起動しました: http://0.0.0.0:5000`);
      log(`環境: ${app.get("env")}`);
      log(`CORS設定: ${JSON.stringify({
        origin: process.env.NODE_ENV === "development" 
          ? ["http://localhost:5000", "https://*.replit.dev"]
          : true,
        credentials: true
      })}`);
    });
  } catch (error) {
    console.error("Server startup error:", error);
    process.exit(1);
  }
})();