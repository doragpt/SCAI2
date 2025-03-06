import express from 'express';
import session from 'express-session';
import MemoryStore from 'memorystore';
import cors from 'cors';

const app = express();
const MemoryStoreSession = MemoryStore(session);

// CORSの設定
app.use(cors({
  origin: true,
  credentials: true,
  exposedHeaders: ['ETag', 'Content-Length', 'Content-Type'],
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// セッションの設定
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  store: new MemoryStoreSession({
    checkPeriod: 86400000 // 24時間でクリア
  }),
  cookie: {
    secure: false, // 開発環境ではfalse
    maxAge: 86400000, // 24時間
    httpOnly: true
  }
}));

// 通常のリクエスト用のボディパーサー設定
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// 写真アップロード用の特別な制限設定
app.use('/api/upload-photo-chunk', express.json({ 
  limit: '1mb',
  type: 'application/json'
}));

app.use('/api/upload-photo', express.json({ 
  limit: '1mb',
  type: 'application/json'
}));

// エラーハンドリングミドルウェア
app.use((err: any, req: any, res: any, next: any) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      error: true,
      message: 'リクエストサイズが大きすぎます',
      details: err.message
    });
  }
  next(err);
});

export default app;