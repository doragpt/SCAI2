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
import { db } from './db';
import { store_profiles } from '../shared/schema';
import { eq, and, like, sql } from 'drizzle-orm';

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
import { db } from './db';
import { store_profiles } from '../shared/schema';
import { eq, and, like, sql } from 'drizzle-orm';

app.get('/api/jobs', async (req, res) => {
  log('info', 'API 求人一覧リクエスト', { query: req.query });
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const location = req.query.location as string;
    const serviceType = req.query.serviceType as string;
    
    // データベースからの取得条件を構築
    let conditions = [];
    
    // published状態の店舗のみを取得
    conditions.push(eq(store_profiles.status, 'published'));
    
    // 位置情報でフィルタリング
    if (location && location !== 'all') {
      conditions.push(like(store_profiles.location, `%${location}%`));
    }
    
    // サービスタイプでフィルタリング
    if (serviceType && serviceType !== 'all') {
      conditions.push(sql`${store_profiles.service_type} = ${serviceType}`);
    }
    
    // 総件数のカウント
    const countResult = await db.select({ count: sql`count(*)` })
      .from(store_profiles)
      .where(and(...conditions));
    
    const totalItems = Number(countResult[0].count);
    const totalPages = Math.ceil(totalItems / limit);
    
    // 店舗データの取得
    const storeProfiles = await db.select({
      id: store_profiles.id,
      businessName: store_profiles.business_name,
      location: store_profiles.location,
      serviceType: store_profiles.service_type,
      catchPhrase: store_profiles.catch_phrase,
      description: store_profiles.description,
      transportationSupport: store_profiles.transportation_support,
      housingSupport: store_profiles.housing_support,
      minimumGuarantee: store_profiles.minimum_guarantee,
      maximumGuarantee: store_profiles.maximum_guarantee,
      workingHours: store_profiles.working_hours,
      requirements: store_profiles.requirements,
      benefits: store_profiles.benefits,
      status: store_profiles.status,
      createdAt: store_profiles.created_at,
      updatedAt: store_profiles.updated_at
    })
    .from(store_profiles)
    .where(and(...conditions))
    .limit(limit)
    .offset((page - 1) * limit);
    
    log('info', 'API 求人情報を返却', { 
      count: storeProfiles.length,
      page,
      totalPages,
      totalItems
    });
    
    // 結果をフォーマットして返却
    return res.json({
      jobs: storeProfiles,
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
app.get('/api/jobs/:id', async (req, res) => {
  log('info', 'API 求人詳細リクエスト', { jobId: req.params.id });
  try {
    const jobId = parseInt(req.params.id);
    
    // データベースから求人詳細を取得
    const job = await db.select({
      id: store_profiles.id,
      businessName: store_profiles.business_name,
      location: store_profiles.location,
      serviceType: store_profiles.service_type,
      catchPhrase: store_profiles.catch_phrase,
      description: store_profiles.description,
      transportationSupport: store_profiles.transportation_support,
      housingSupport: store_profiles.housing_support,
      minimumGuarantee: store_profiles.minimum_guarantee,
      maximumGuarantee: store_profiles.maximum_guarantee,
      workingHours: store_profiles.working_hours,
      requirements: store_profiles.requirements,
      benefits: store_profiles.benefits,
      status: store_profiles.status,
      createdAt: store_profiles.created_at,
      updatedAt: store_profiles.updated_at,
      // 詳細ページ用の追加情報
      top_image: store_profiles.top_image,
      address: store_profiles.address,
      access_info: store_profiles.access_info,
      security_measures: store_profiles.security_measures,
      recruiter_name: store_profiles.recruiter_name,
      phone_numbers: store_profiles.phone_numbers,
      email_addresses: store_profiles.email_addresses,
      pc_website_url: store_profiles.pc_website_url,
      mobile_website_url: store_profiles.mobile_website_url,
      application_requirements: store_profiles.application_requirements
    })
    .from(store_profiles)
    .where(and(
      sql`${store_profiles.id} = ${jobId}`,
      sql`${store_profiles.status} = 'published'`
    ))
    .limit(1);
    
    if (!job || job.length === 0) {
      return res.status(404).json({
        error: 'NotFound',
        message: '指定された求人が見つかりませんでした'
      });
    }
    
    return res.json(job[0]);
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