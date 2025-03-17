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

// 認証セットアップ（セッション設定含む）
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