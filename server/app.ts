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
  origin: process.env.NODE_ENV === 'production' ? false : true,
  credentials: true,
  exposedHeaders: ['set-cookie']
}));

// リクエストボディのパース設定（セッションの前に配置）
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// セッションの設定
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: new MemoryStoreSession({
    checkPeriod: 86400000 // 24時間でクリア
  }),
  name: 'sessionId',
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24時間
  }
}));

// Passportの初期化とセッション管理
setupAuth(app);

// APIリクエストのログ記録とヘッダー設定
app.use('/api/*', (req, res, next) => {
  log('info', 'APIリクエスト受信', {
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.method !== 'GET' ? req.body : undefined,
    userId: req.user?.id,
    isAuthenticated: req.isAuthenticated(),
    sessionID: req.sessionID
  });

  res.setHeader('Content-Type', 'application/json');
  next();
});

// APIルートの登録
app.use('/api/talent', talentRouter);
registerRoutes(app);

// グローバルエラーハンドラー
app.use(errorHandler);

// 認証エラー時のJSONレスポンス
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