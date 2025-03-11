import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';
import { log } from './utils/logger';
import { registerRoutes } from './routes';
import { setupVite } from './vite';

const app = express();

// CORSの設定
app.use(cors({
  origin: true,
  credentials: true,
  exposedHeaders: ['Content-Type'],
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// リクエストボディのパース設定
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// APIルートの登録（Viteミドルウェアの前に配置）
registerRoutes(app);

// Viteミドルウェアのセットアップ（APIルートの後に配置）
setupVite(app);

// グローバルエラーハンドラーの設定
app.use(errorHandler);

export default app;