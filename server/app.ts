import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';
import { log } from './utils/logger';
import { registerRoutes } from './routes';
import { setupAuth } from './auth';
import { pool } from './db';

// Expressアプリケーションの作成
const app = express();

// CORSの設定
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
}));

// リクエストボディのパース設定
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// セッション設定前のデータベース接続確認
async function checkDatabaseConnection() {
  try {
    const result = await pool.query('SELECT 1');
    log('info', 'データベース接続確認成功', { result });
    return true;
  } catch (error) {
    log('error', 'データベース接続確認失敗', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return false;
  }
}

// 初期化処理
async function initialize() {
  try {
    // データベース接続確認
    const isConnected = await checkDatabaseConnection();
    if (!isConnected) {
      throw new Error('データベースに接続できません');
    }

    // 認証セットアップ
    setupAuth(app);

    // ルート登録
    await registerRoutes(app);

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

    app.set("trust proxy", 1);

    return app;
  } catch (error) {
    log('error', 'アプリケーション初期化エラー', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

export default initialize();