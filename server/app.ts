import express from 'express';
import session from 'express-session';
import MemoryStore from 'memorystore';
import cors from 'cors';
import passport from 'passport';
import { errorHandler } from './middleware/errorHandler';
import { log } from './utils/logger';
import { setupAuth } from './auth';
import talentRouter from './routes/talent';

const app = express();
const MemoryStoreSession = MemoryStore(session);

// CORSの設定
app.use(cors({
  origin: true,
  credentials: true
}));

// リクエストボディのパース設定
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
    sameSite: 'lax' as const
  }
};

app.set('trust proxy', 1);

// 認証セットアップ
setupAuth(app);

// APIリクエストのログ記録
app.use('/api/*', (req, res, next) => {
  log('info', 'APIリクエスト受信', {
    method: req.method,
    path: req.path,
    body: req.method !== 'GET' ? req.body : undefined
  });
  next();
});

// APIルートの登録
app.use('/api/talent', talentRouter);

// グローバルエラーハンドラー
app.use(errorHandler);

export default app;