import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';
import { log } from './utils/logger';
import { registerRoutes } from './routes';
import { setupAuth } from './auth';
import talentRouter from './routes/talent';
import authRouter from './routes/auth';
import storeRouter from './routes/store';
import blogRouter from './routes/blog';
import uploadRouter from './routes/upload';
import { authenticate } from './middleware/auth';

const app = express();

// CORSの設定（認証情報を含むリクエストを許可）
app.use(cors({
  origin: true,
  credentials: true,
  exposedHeaders: ['Set-Cookie', 'Date', 'ETag'],
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// リクエストボディのパース設定
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 認証セットアップ（最初に配置）
setupAuth(app);

// APIミドルウェア（ログ設定）
app.use('/api', (req, res, next) => {
  log('info', 'APIリクエスト受信', {
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.method !== 'GET' ? req.body : undefined,
    isAuthenticated: req.isAuthenticated(),
    sessionID: req.sessionID,
    timestamp: new Date().toISOString()
  });

  res.setHeader('Content-Type', 'application/json');
  next();
});

// 認証関連のルートを最初に登録
app.use('/auth', authRouter);

// 認証状態チェック用エンドポイント
app.get('/check', authenticate, (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "認証が必要です" });
  }
  return res.json(req.user);
});

// 保護されたAPIルートを登録
app.use('/api/talent', talentRouter);
app.use('/talent', talentRouter); // 両方のパスをサポート
app.use('/store', storeRouter);
app.use('/api/store', storeRouter); // クライアント側からのAPIリクエスト用のパスを追加
// ブログルーターの登録
app.use('/api/blog', blogRouter);
app.use('/api/upload', uploadRouter);

// 求人関連のAPIルートを登録
app.get('/api/jobs', (req, res) => {
  log('info', 'API 求人一覧リクエスト', { query: req.query });
  try {
    // モックデータを返す
    const mockJobs = [
      {
        id: 1,
        businessName: "エステサロンA",
        location: "東京都",
        serviceType: "エステ",
        catchPhrase: "高収入・寮完備・未経験歓迎",
        description: "未経験者歓迎の高級エステサロンです。充実した研修制度があります。",
        transportationSupport: true,
        housingSupport: true,
        minimumGuarantee: 15000,
        maximumGuarantee: 30000,
        workingHours: "12:00～翌0:00",
        requirements: "18歳以上（高校生不可）、未経験者歓迎",
        benefits: ["交通費支給", "寮完備", "日払い可"],
        status: "published",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        businessName: "メンズエステB",
        location: "大阪府",
        serviceType: "メンズエステ",
        catchPhrase: "働きやすい環境が自慢です",
        description: "大阪で人気のメンズエステ。アットホームな雰囲気で働きやすいと評判です。",
        transportationSupport: true,
        housingSupport: false,
        minimumGuarantee: 18000,
        maximumGuarantee: 35000,
        workingHours: "14:00～翌2:00",
        requirements: "18歳以上（高校生不可）、未経験者歓迎、経験者優遇",
        benefits: ["交通費支給", "週払い可", "制服貸与"],
        status: "published",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        businessName: "高級ソープC",
        location: "神奈川県",
        serviceType: "ソープ",
        catchPhrase: "完全自由出勤・高収入",
        description: "完全自由出勤制で、あなたのライフスタイルに合わせた働き方が可能です。",
        transportationSupport: true,
        housingSupport: true,
        minimumGuarantee: 25000,
        maximumGuarantee: 50000,
        workingHours: "9:00～翌1:00",
        requirements: "20歳以上、未経験者大歓迎",
        benefits: ["交通費支給", "寮完備", "日払い可", "託児所完備"],
        status: "published",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const location = req.query.location as string;
    const serviceType = req.query.serviceType as string;
    
    // フィルタリング
    let filteredJobs = [...mockJobs];
    if (location && location !== 'all') {
      filteredJobs = filteredJobs.filter(job => job.location === location);
    }
    if (serviceType && serviceType !== 'all') {
      filteredJobs = filteredJobs.filter(job => job.serviceType === serviceType);
    }
    
    const totalItems = filteredJobs.length;
    const totalPages = Math.ceil(totalItems / limit);
    
    // ページネーション
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedJobs = filteredJobs.slice(startIndex, endIndex);
    
    log('info', 'API 求人情報を返却', { 
      count: paginatedJobs.length,
      page,
      totalPages
    });
    
    return res.json({
      jobs: paginatedJobs,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalItems
      }
    });
  } catch (error) {
    log('error', 'API 求人一覧取得エラー', { error });
    return res.status(500).json({
      error: 'InternalServerError',
      message: '求人情報の取得に失敗しました'
    });
  }
});

// 求人詳細を返すAPIエンドポイント
app.get('/api/jobs/:id', (req, res) => {
  log('info', 'API 求人詳細リクエスト', { jobId: req.params.id });
  try {
    const jobId = parseInt(req.params.id);
    
    // モックデータ
    const mockJobs = [
      {
        id: 1,
        businessName: "エステサロンA",
        location: "東京都",
        serviceType: "エステ",
        catchPhrase: "高収入・寮完備・未経験歓迎",
        description: "未経験者歓迎の高級エステサロンです。充実した研修制度があります。",
        transportationSupport: true,
        housingSupport: true,
        minimumGuarantee: 15000,
        maximumGuarantee: 30000,
        workingHours: "12:00～翌0:00",
        requirements: "18歳以上（高校生不可）、未経験者歓迎",
        benefits: ["交通費支給", "寮完備", "日払い可"],
        status: "published",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        businessName: "メンズエステB",
        location: "大阪府",
        serviceType: "メンズエステ",
        catchPhrase: "働きやすい環境が自慢です",
        description: "大阪で人気のメンズエステ。アットホームな雰囲気で働きやすいと評判です。",
        transportationSupport: true,
        housingSupport: false,
        minimumGuarantee: 18000,
        maximumGuarantee: 35000,
        workingHours: "14:00～翌2:00",
        requirements: "18歳以上（高校生不可）、未経験者歓迎、経験者優遇",
        benefits: ["交通費支給", "週払い可", "制服貸与"],
        status: "published",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        businessName: "高級ソープC",
        location: "神奈川県",
        serviceType: "ソープ",
        catchPhrase: "完全自由出勤・高収入",
        description: "完全自由出勤制で、あなたのライフスタイルに合わせた働き方が可能です。",
        transportationSupport: true,
        housingSupport: true,
        minimumGuarantee: 25000,
        maximumGuarantee: 50000,
        workingHours: "9:00～翌1:00",
        requirements: "20歳以上、未経験者大歓迎",
        benefits: ["交通費支給", "寮完備", "日払い可", "託児所完備"],
        status: "published",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    const job = mockJobs.find(job => job.id === jobId);
    
    if (!job) {
      return res.status(404).json({
        error: 'NotFound',
        message: '指定された求人が見つかりませんでした'
      });
    }
    
    return res.json(job);
  } catch (error) {
    log('error', 'API 求人詳細取得エラー', { error });
    return res.status(500).json({
      error: 'InternalServerError',
      message: '求人詳細の取得に失敗しました'
    });
  }
});

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
    path: req.path,
    isAuthenticated: req.isAuthenticated(),
    sessionID: req.sessionID
  });
  res.status(404).json({
    message: '指定されたAPIエンドポイントが見つかりません'
  });
});

export default app;