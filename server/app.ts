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
  origin: true,
  credentials: true,
  exposedHeaders: ['ETag', 'Content-Length', 'Content-Type'],
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// セッションの設定
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: new MemoryStoreSession({
    checkPeriod: 86400000 // 24時間でクリア
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 86400000, // 24時間
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
  }
};

app.use(session(sessionConfig));

// リクエストボディのパース設定
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 認証セットアップ
setupAuth(app);

// APIリクエストのログ記録とヘッダー設定
app.use('/api/*', (req, res, next) => {
  log('info', 'APIリクエスト受信', {
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.method !== 'GET' ? req.body : undefined
  });

  // APIリクエストには必ずJSONを返す
  res.setHeader('Content-Type', 'application/json');
  next();
});

// APIルートの登録（Viteミドルウェアの前に配置）
app.use('/api/talent', talentRouter);
registerRoutes(app);

// グローバルエラーハンドラーの設定
app.use(errorHandler);

// 認証エラー時のJSONレスポンス
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err.name === 'UnauthorizedError' || err.status === 401) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: '認証が必要です'
    });
  }
  next(err);
});

export default app;