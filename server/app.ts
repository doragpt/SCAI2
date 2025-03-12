import express from 'express';
import session from 'express-session';
import MemoryStore from 'memorystore';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';
import { log } from './utils/logger';
import { registerRoutes } from './routes';
import { setupAuth } from './auth';
import talentRouter from './routes/talent';

const app = express();
const MemoryStoreSession = MemoryStore(session);

// CORSの設定
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Set-Cookie']
}));

// セキュリティヘッダー
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// リクエストボディのパース設定
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// セッションストアの設定
const sessionStore = new MemoryStoreSession({
  checkPeriod: 86400000 // 24時間でクリア
});

// セッション設定
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  name: 'sessionId',
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24時間
  }
}));

// Passportの初期化
setupAuth(app);

// APIリクエストのログ記録
app.use('/api/*', (req, res, next) => {
  log('info', 'APIリクエスト受信', {
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.method !== 'GET' ? req.body : undefined,
    userId: req.user?.id,
    isAuthenticated: req.isAuthenticated(),
    sessionID: req.sessionID,
    cookies: req.cookies
  });

  res.setHeader('Content-Type', 'application/json');
  next();
});

// ルート設定
app.use('/api/talent', talentRouter);
registerRoutes(app);

// エラーハンドリング
app.use(errorHandler);

// 認証エラーハンドラ
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err.name === 'UnauthorizedError' || err.status === 401) {
    log('warn', '認証エラー', {
      path: req.path,
      method: req.method,
      userId: req.user?.id,
      sessionID: req.sessionID
    });
    return res.status(401).json({
      error: 'Unauthorized',
      message: '認証が必要です'
    });
  }
  next(err);
});

export default app;