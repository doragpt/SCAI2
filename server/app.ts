import express from 'express';
import session from 'express-session';
import MemoryStore from 'memorystore';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';
import { log } from './utils/logger';
import { registerRoutes } from './routes';
import { setupAuth } from './auth';

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

// リクエストボディのパース設定（セッション設定の前に配置）
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// セッションの設定
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: new MemoryStoreSession({
    checkPeriod: 86400000 // 24時間でクリア
  }),
  cookie: {
    secure: false, // 開発環境ではfalse
    maxAge: 86400000, // 24時間
    httpOnly: true,
    path: '/',
    sameSite: 'lax'
  },
  name: 'scai.sid'
};

// プロダクション環境での設定
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
  sessionConfig.cookie.secure = true;
  sessionConfig.cookie.sameSite = 'strict';
}

app.use(session(sessionConfig));

// APIリクエストのログ記録とヘッダー設定
app.use('/api/*', (req, res, next) => {
  log('info', 'APIリクエスト受信', {
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.method !== 'GET' ? req.body : undefined,
    sessionId: req.sessionID,
    hasSession: !!req.session,
    userId: req.session?.userId
  });

  // APIリクエストには必ずJSONを返す
  res.setHeader('Content-Type', 'application/json');
  next();
});

// 認証セットアップ（express-sessionの後に配置）
setupAuth(app);

// APIルートの登録
registerRoutes(app);

// グローバルエラーハンドラーの設定
app.use(errorHandler);

export default app;