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
  exposedHeaders: ['Content-Length', 'Content-Type'],
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
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

// ボディパーサーの制限を調整
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// アップロード用の制限を別途設定
app.use('/api/upload-photo-chunk', express.json({ limit: '1mb' }));
app.use('/api/upload-photo', express.json({ limit: '1mb' }));

export default app;