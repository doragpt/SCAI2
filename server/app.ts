import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';
import { log } from './utils/logger';
import { registerRoutes } from './routes';
import { setupAuth } from './auth';
import session from 'express-session';
import { db } from './db';

const app = express();

// CORSの設定（セッション管理のために重要）
app.use(cors({
  origin: true,
  credentials: true,
  exposedHeaders: ['Set-Cookie'],
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cookie']
}));

// リクエストボディのパース設定
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// セッション設定（重要: 認証設定の前に配置）
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24時間
  }
}));

// セッションのデバッグミドルウェア（開発環境のみ）
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    log('debug', 'セッション状態', {
      sessionID: req.sessionID,
      isAuthenticated: req.isAuthenticated(),
      hasUser: !!req.user,
      user: req.user ? { id: req.user.id, role: req.user.role } : null,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });
    next();
  });
}

// 認証セットアップ（セッション設定の後に配置）
setupAuth(app);

// APIミドルウェア
app.use('/api', (req, res, next) => {
  log('info', 'APIリクエスト受信', {
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.method !== 'GET' ? req.body : undefined,
    isAuthenticated: req.isAuthenticated(),
    sessionID: req.sessionID,
    timestamp: new Date().toISOString()
  });
  next();
});

// ルート登録
registerRoutes(app).catch(error => {
  log('error', 'ルート登録エラー', {
    error: error instanceof Error ? error.message : 'Unknown error'
  });
  process.exit(1);
});

// エラーハンドリング
app.use(errorHandler);

// APIルートが見つからない場合のハンドラー
app.use('/api/*', (req, res) => {
  log('warn', 'APIルートが見つかりません', {
    method: req.method,
    path: req.path,
    isAuthenticated: req.isAuthenticated(),
    sessionID: req.sessionID
  });
  res.status(404).json({
    error: 'NotFound',
    message: '指定されたAPIエンドポイントが見つかりません'
  });
});

export default app;