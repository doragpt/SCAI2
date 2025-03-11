import express from 'express';
import session from 'express-session';
import MemoryStore from 'memorystore';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';
import { log } from './utils/logger';
import { registerRoutes } from './routes';
import { setupAuth } from './auth';
import { setupVite } from './vite';

const app = express();
const MemoryStoreSession = MemoryStore(session);

// CORSの設定
app.use(cors({
  origin: true,
  credentials: true,
  exposedHeaders: ['Content-Type'],
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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
    sameSite: 'lax'
  }
};

app.use(session(sessionConfig));

// リクエストボディのパース設定
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 認証セットアップ
setupAuth(app);

// APIルートの登録（Viteミドルウェアの前に配置）
registerRoutes(app);

// Viteミドルウェアのセットアップ（APIルートの後に配置）
setupVite(app);

// グローバルエラーハンドラーの設定
app.use(errorHandler);

export default app;