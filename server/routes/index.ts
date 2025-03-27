import type { Express } from "express";
import { createServer, type Server } from "http";
import authRoutes from './auth';
import talentRoutes from './talent';
import applicationsRoutes from './applications';
import uploadRoutes from './upload';
import analyticsRoutes from './analytics';
import designRoutes from './design';
import { log } from '../utils/logger';
import { authenticate } from '../middleware/auth';

export async function registerRoutes(app: Express): Promise<Server> {
  const server = createServer(app);

  // APIリクエストの共通ミドルウェア - すべてのパスに適用
  app.use((req, res, next) => {
    log('info', 'APIリクエスト受信', {
      method: req.method,
      path: req.path,
      query: req.query,
      isAuthenticated: !!req.user,
      sessionID: req.sessionID,
      timestamp: new Date().toISOString()
    });
    res.setHeader("Content-Type", "application/json");
    next();
  });

  // 各ルーターを/apiプレフィックスで登録
  app.use('/api/applications', applicationsRoutes);
  app.use('/api/analytics', analyticsRoutes);
  
  // 以下のルートはapp.tsですでに登録されているため、重複を避けるためコメントアウト
  // app.use('/api/auth', authRoutes);
  // app.use('/api/upload', uploadRoutes);
  // app.use('/api/design', designRoutes);
  // app.use('/api/talent', talentRoutes);
  
  // 認証チェックエンドポイントもapp.tsで対応済み
  
  // 後方互換性のためレガシーエンドポイント
  // 現在は/api/jobsエンドポイントに転送
  app.get('/jobs', (req, res) => {
    log('warn', '非推奨パス使用', { path: req.path, method: req.method });
    res.redirect(307, `/api${req.url}`);
  });
  
  // 求人詳細の後方互換性
  app.get('/jobs/:id', (req, res) => {
    log('warn', '非推奨パス使用', { path: req.path, method: req.method });
    res.redirect(307, `/api${req.url}`);
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