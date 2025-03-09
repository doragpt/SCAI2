import express from 'express';
import session from 'express-session';
import MemoryStore from 'memorystore';
import cors from 'cors';

// グローバルエラーハンドラーの追加
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // エラーログを詳細に出力するが、機密情報は含めない
  console.error('Error details:', {
    name: err.name,
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString()
  });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', {
    reason: reason instanceof Error ? reason.message : reason,
    timestamp: new Date().toISOString()
  });
});

const app = express();
const MemoryStoreSession = MemoryStore(session);

// 起動時の環境変数チェック（機密情報は出力しない）
console.log('Server starting with configuration:', {
  hasAwsConfig: !!(process.env.AWS_BUCKET_NAME && process.env.AWS_REGION),
  environment: process.env.NODE_ENV,
  timestamp: new Date().toISOString()
});

// CORSの設定を強化
app.use(cors({
  origin: true,
  credentials: true,
  exposedHeaders: ['ETag', 'Content-Length', 'Content-Type'],
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400 // CORS プリフライトリクエストの結果をキャッシュ
}));

// セッションの設定
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  store: new MemoryStoreSession({
    checkPeriod: 86400000 // 24時間でクリア
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 86400000, // 24時間
    httpOnly: true,
    sameSite: 'lax'
  }
}));

// リクエストボディのパーサー設定
app.use(express.json({ 
  limit: '50mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf.toString());
    } catch (e) {
      res.status(400).json({ error: 'Invalid JSON' });
      throw new Error('Invalid JSON');
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// APIエラーハンドリングミドルウェア
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('API Error:', {
    error: err.message,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  res.status(err.status || 500).json({
    error: true,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  });
});

// ヘルスチェックエンドポイント
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    hasAwsConfig: !!(process.env.AWS_BUCKET_NAME && process.env.AWS_REGION)
  });
});

export default app;