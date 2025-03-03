import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveVite, log } from "./vite";
import { db, sql } from "./db";
import cors from "cors";

const app = express();

// CORSミドルウェアを追加
app.use(cors({
  origin: true,
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

// データベース接続テスト（タイムアウト付き）
async function testDatabaseConnection() {
  try {
    log("データベース接続を開始...");
    log(`DATABASE_URL: ${process.env.DATABASE_URL ? "設定済み" : "未設定"}`);
    log(`PGHOST: ${process.env.PGHOST || "未設定"}`);
    log(`PGPORT: ${process.env.PGPORT || "未設定"}`);
    log(`PGDATABASE: ${process.env.PGDATABASE || "未設定"}`);
    log(`PGUSER: ${process.env.PGUSER ? "設定済み" : "未設定"}`);
    log(`PGPASSWORD: ${process.env.PGPASSWORD ? "設定済み" : "未設定"}`);

    // タイムアウト付きでクエリを実行
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("データベース接続がタイムアウトしました")), 5000);
    });

    const queryPromise = db.execute(sql`SELECT 1`);
    await Promise.race([queryPromise, timeoutPromise]);

    log("データベース接続テスト成功");
    return true;
  } catch (error) {
    log("データベース接続エラーの詳細:");
    if (error instanceof Error) {
      log(`エラーメッセージ: ${error.message}`);
      log(`スタックトレース: ${error.stack}`);
    } else {
      log(`不明なエラー: ${error}`);
    }
    return false;
  }
}

(async () => {
  try {
    // 必須環境変数のチェック
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URLが設定されていません");
    }

    // データベース接続テスト
    const isDbConnected = await testDatabaseConnection();
    if (!isDbConnected) {
      throw new Error("データベース接続に失敗しました");
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
    } else {
      serveVite(app);
    }

    // サーバー起動
    server.listen({
      port: 5000,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`サーバーを起動しました: http://0.0.0.0:5000`);
    });
  } catch (error) {
    console.error("Server startup error:", error);
    process.exit(1);
  }
})();