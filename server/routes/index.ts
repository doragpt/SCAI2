import type { Express } from "express";
import { createServer, type Server } from "http";
import authRoutes from './auth';
import jobsRoutes from './jobs';
import applicationsRoutes from './applications';
import blogRoutes from './blog';
import { log } from '../utils/logger';
import { db } from '../db';
import { sql } from 'drizzle-orm';

export async function registerRoutes(app: Express): Promise<Server> {
  const server = createServer(app);

  // 診断用エンドポイント
  app.get("/api/ping", async (_req, res) => {
    try {
      const startTime = Date.now();

      // データベース接続テスト
      const result = await db.execute(sql`SELECT 1`);
      const duration = Date.now() - startTime;

      log('info', 'Ping成功', { 
        duration,
        timestamp: new Date().toISOString(),
        result
      });

      res.json({ 
        status: "ok",
        message: "Server is running",
        dbStatus: "connected",
        timestamp: new Date().toISOString(),
        responseTime: duration,
        details: {
          dbConnected: true,
          environment: process.env.NODE_ENV
        }
      });
    } catch (error) {
      log('error', 'Pingエンドポイントエラー', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      res.status(500).json({ 
        status: "error",
        message: "Database connection failed",
        timestamp: new Date().toISOString(),
        details: {
          dbConnected: false,
          environment: process.env.NODE_ENV
        }
      });
    }
  });

  // APIリクエストの共通ミドルウェア
  app.use("/api/*", (req, res, next) => {
    log('info', 'APIリクエスト受信', {
      method: req.method,
      path: req.path,
      query: req.query,
      body: req.method !== 'GET' ? req.body : undefined,
      timestamp: new Date().toISOString()
    });
    res.setHeader("Content-Type", "application/json");
    next();
  });

  // 各ルーターを登録
  app.use('/api/auth', authRoutes);
  app.use('/api/jobs', jobsRoutes);
  app.use('/api/applications', applicationsRoutes);
  app.use('/api/blog', blogRoutes);

  // 共通のエラーハンドリング
  app.use((err: Error, req: any, res: any, next: any) => {
    log('error', 'APIエラー', {
      error: err instanceof Error ? err.message : 'Unknown error',
      path: req.path,
      method: req.method,
      stack: err.stack
    });
    res.status(500).json({
      message: process.env.NODE_ENV === 'development' ? err.message : '内部サーバーエラー'
    });
  });

  return server;
}