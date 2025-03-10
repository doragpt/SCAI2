import type { Express } from "express";
import { createServer, type Server } from "http";
import authRoutes from './auth';
import jobsRoutes from './jobs';
import { log } from '../utils/logger';

export async function registerRoutes(app: Express): Promise<Server> {
  const server = createServer(app);

  // APIルートのプレフィックス設定
  app.use('/api/auth', authRoutes);
  app.use('/api/jobs', jobsRoutes);

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
