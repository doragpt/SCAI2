import type { Express } from "express";
import { createServer, type Server } from "http";
import authRoutes from './auth';
import jobsRoutes from './jobs';
import applicationsRoutes from './applications';
import blogRoutes from './blog';
import { log } from '../utils/logger';

export async function registerRoutes(app: Express): Promise<Server> {
  const server = createServer(app);

  // APIリクエストの共通ミドルウェア
  app.use("/api/*", (req, res, next) => {
    log('info', 'APIリクエスト受信', {
      method: req.method,
      path: req.path,
      query: req.query,
      body: req.method !== 'GET' ? req.body : undefined,
      isAuthenticated: req.isAuthenticated && req.isAuthenticated(),
      sessionID: req.sessionID,
      user: req.user ? { id: req.user.id, role: req.user.role } : null,
      timestamp: new Date().toISOString()
    });
    res.setHeader("Content-Type", "application/json");
    next();
  });

  // 認証関連のルートを最初に登録
  app.use('/api/auth', authRoutes);

  // 認証が必要なルートを登録
  app.use('/api/jobs', jobsRoutes);
  app.use('/api/applications', applicationsRoutes);
  app.use('/api/blog', blogRoutes);

  // 共通のエラーハンドリング
  app.use((err: Error, req: any, res: any, next: any) => {
    log('error', 'APIエラー発生', {
      error: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : undefined,
      path: req.path,
      method: req.method,
      isAuthenticated: req.isAuthenticated && req.isAuthenticated(),
      sessionID: req.sessionID,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      message: process.env.NODE_ENV === 'development' ? err.message : '内部サーバーエラー'
    });
  });

  return server;
}