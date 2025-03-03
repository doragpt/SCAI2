import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, log } from "./vite";
import { db, sql } from "./db";
import cors from "cors";

const app = express();

// CORSミドルウェアの設定を改善
app.use(cors({
  origin: true, // すべてのオリジンを許可（開発環境用）
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// リクエストロギングの改善
app.use((req, res, next) => {
  const start = Date.now();
  console.log('Request received:', {
    method: req.method,
    path: req.path,
    origin: req.headers.origin,
    host: req.headers.host,
    timestamp: new Date().toISOString()
  });

  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log('Response sent:', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
  });

  next();
});

(async () => {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URLが設定されていません");
    }

    const server = await registerRoutes(app);

    // エラーハンドリングミドルウェア
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error("Server error:", {
        error: err,
        message: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString()
      });

      res.status(err.status || 500).json({
        message: err.message || "Internal Server Error",
        timestamp: new Date().toISOString()
      });
    });

    if (app.get("env") === "development") {
      await setupVite(app, server);
    }

    server.listen({
      port: 5000,
      host: "0.0.0.0",
    }, () => {
      log(`Server started: http://0.0.0.0:5000`);
      log(`Environment: ${app.get("env")}`);
      log(`CORS: enabled for all origins`);
    });
  } catch (error) {
    console.error("Server startup error:", error);
    process.exit(1);
  }
})();