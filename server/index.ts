import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, log } from "./vite";
import { db, sql } from "./db";
import cors from "cors";

const app = express();

// CORSミドルウェアの設定をさらに緩和
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  preflightContinue: true,
  optionsSuccessStatus: 204
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// リクエストロギングの強化
app.use((req, res, next) => {
  const start = Date.now();
  console.log('Detail Request Info:', {
    method: req.method,
    path: req.path,
    headers: {
      ...req.headers,
      authorization: req.headers.authorization ? '[HIDDEN]' : undefined
    },
    query: req.query,
    body: req.method !== 'GET' ? req.body : undefined,
    timestamp: new Date().toISOString()
  });

  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log('Detail Response Info:', {
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

    // エラーハンドリングミドルウェアの強化
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error("Detailed Server Error:", {
        error: err,
        name: err.name,
        message: err.message,
        code: err.code,
        stack: err.stack,
        timestamp: new Date().toISOString()
      });

      res.status(err.status || 500).json({
        error: true,
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
      log(`Server started at http://0.0.0.0:5000`);
      log(`Environment: ${app.get("env")}`);
      log(`CORS: Enabled with full access`);
    });
  } catch (error) {
    console.error("Detailed Startup Error:", error);
    process.exit(1);
  }
})();