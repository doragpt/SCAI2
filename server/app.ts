import express from 'express';
import session from 'express-session';
import MemoryStore from 'memorystore';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';
import { log } from './utils/logger';

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

// アップロード用の制限を別途設定
app.use('/api/upload-photo-chunk', express.json({ limit: '1mb' }));
app.use('/api/upload-photo', express.json({ limit: '1mb' }));

// APIリクエストのロギング
app.use('/api/*', (req, res, next) => {
  log('info', 'APIリクエスト受信', {
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.method !== 'GET' ? req.body : undefined
  });
  next();
});

// グローバルエラーハンドラーの設定
app.use(errorHandler);

export default app;