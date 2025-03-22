import type { Express } from "express";
import { createServer, type Server } from "http";
import authRoutes from './auth';
import { log } from '../utils/logger';
import { authenticate } from '../middleware/auth';

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

  // 各ルーターを登録
  app.use('/auth', authRoutes);
  
  // 認証チェックエンドポイント
  app.get('/check', authenticate, (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "認証が必要です" });
    }
    return res.json(req.user);
  });
  
  // その他のAPIルートは今後実装予定

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