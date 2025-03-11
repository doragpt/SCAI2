import type { Express } from "express";
import { createServer, type Server } from "http";
import { log } from './utils/logger';

export async function registerRoutes(app: Express): Promise<Server> {
  const server = createServer(app);

  // APIリクエストの共通ミドルウェア
  app.use("/api/*", (req, res, next) => {
    log('info', 'APIリクエスト受信', {
      method: req.method,
      path: req.path,
      query: req.query,
      body: req.method !== 'GET' ? req.body : undefined
    });
    res.setHeader("Content-Type", "application/json");
    next();
  });

  // テスト用のエンドポイント
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // 求人一覧を取得するエンドポイント
  app.get('/api/jobs/public', (req, res) => {
    res.json([
      {
        id: 1,
        business_name: "テスト求人",
        location: "東京都",
        service_type: { id: "esthe", label: "エステ" },
        minimum_guarantee: 30000,
        maximum_guarantee: 50000,
        transportation_support: true,
        housing_support: false
      }
    ]);
  });


  // 共通のエラーハンドリング
  app.use((err: Error, req: any, res: any, next: any) => {
    log('error', 'APIエラー', {
      error: err instanceof Error ? err.message : 'Unknown error',
      path: req.path,
      method: req.method
    });
    res.status(500).json({
      message: process.env.NODE_ENV === 'development' ? err.message : '内部サーバーエラー'
    });
  });

  return server;
}