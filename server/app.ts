import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';
import { log } from './utils/logger';
import { registerRoutes } from './routes';
import { setupAuth } from './auth';
import talentRouter from './routes/talent';

const app = express();

// CORSの設定
app.use(cors({
  origin: true,
  credentials: true,
  exposedHeaders: ['ETag', 'Content-Length', 'Content-Type'],
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// リクエストボディのパース設定
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 認証セットアップ
setupAuth(app);

// APIミドルウェア
app.use('/api', (req, res, next) => {
  log('info', 'APIリクエスト受信', {
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.method !== 'GET' ? req.body : undefined
  });
  next();
});

// APIルートの登録
app.use('/api/talent', talentRouter);

// その他のAPIルートを登録
log('info', 'APIルートの登録を開始');
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
    path: req.path
  });
  res.status(404).json({
    error: 'NotFound',
    message: '指定されたAPIエンドポイントが見つかりません'
  });
});

export default app;