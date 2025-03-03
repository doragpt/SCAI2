import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, log } from "./vite";
import { db, sql } from "./db";
import cors from "cors";

const app = express();

// CORSミドルウェアを追加
app.use(cors({
  origin: process.env.NODE_ENV === "development" 
    ? ["http://localhost:3000", "http://localhost:5000"]
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// リクエストロギング
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

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

    // エラーハンドリングミドルウェア
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error("Server error:", err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
    });

    // 開発環境の場合はViteをセットアップ
    if (app.get("env") === "development") {
      await setupVite(app, server);
    }

    // サーバー起動
    server.listen({
      port: 5000,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`サーバーを起動しました: http://0.0.0.0:5000`);
      log(`環境: ${app.get("env")}`);
      log(`CORS設定: ${JSON.stringify({
        origin: process.env.NODE_ENV === "development" 
          ? ["http://localhost:3000", "http://localhost:5000"]
          : true
      })}`);
    });
  } catch (error) {
    console.error("Server startup error:", error);
    process.exit(1);
  }
})();