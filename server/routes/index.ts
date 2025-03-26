import type { Express } from "express";
import { createServer, type Server } from "http";
import authRoutes from './auth';
import talentRoutes from './talent';
import applicationsRoutes from './applications';
import uploadRoutes from './upload';
import analyticsRoutes from './analytics';
import designRoutes from './design';
import { log } from '../utils/logger';
import { authenticate } from '../middleware/auth';

export async function registerRoutes(app: Express): Promise<Server> {
  const server = createServer(app);

  // APIリクエストの共通ミドルウェア - すべてのパスに適用
  app.use((req, res, next) => {
    log('info', 'APIリクエスト受信', {
      method: req.method,
      path: req.path,
      query: req.query,
      isAuthenticated: !!req.user,
      sessionID: req.sessionID,
      timestamp: new Date().toISOString()
    });
    res.setHeader("Content-Type", "application/json");
    next();
  });

  // 各ルーターを登録
  app.use('/auth', authRoutes);
  app.use('/applications', applicationsRoutes);
  app.use('/upload', uploadRoutes);
  app.use('/analytics', analyticsRoutes);
  app.use('/design', designRoutes);
  // 注意: /talent のルーティングは app.ts で /api/talent として登録されているため、
  // ここでは登録しません。
  
  // 認証チェックエンドポイント
  app.get('/check', authenticate, (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "認証が必要です" });
    }
    return res.json(req.user);
  });
  
  // 求人一覧を返すAPIエンドポイント
  app.get('/jobs', (req, res) => {
    log('info', '求人一覧リクエスト', { query: req.query });
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
          workingHours: "13:00～翌0:00",
          requirements: "20歳以上、未経験者歓迎",
          benefits: ["交通費支給", "週払い可"],
          status: "published",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 3,
          businessName: "リラクゼーションC",
          location: "福岡県",
          serviceType: "リラクゼーション",
          catchPhrase: "完全自由出勤制度",
          description: "福岡で人気のリラクゼーションサロン。自分のペースで働けます。",
          transportationSupport: true,
          housingSupport: true,
          minimumGuarantee: 12000,
          maximumGuarantee: 25000,
          workingHours: "10:00～22:00",
          requirements: "18歳以上（高校生不可）、経験者優遇",
          benefits: ["交通費支給", "寮完備", "自由出勤"],
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
      
      log('info', '求人情報を返却', { 
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
      log('error', '求人一覧取得エラー', { error });
      return res.status(500).json({
        error: 'InternalServerError',
        message: '求人情報の取得に失敗しました'
      });
    }
  });
  
  // 求人詳細を返すAPIエンドポイント
  app.get('/jobs/:id', (req, res) => {
    log('info', '求人詳細リクエスト', { jobId: req.params.id });
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
          workingHours: "13:00～翌0:00",
          requirements: "20歳以上、未経験者歓迎",
          benefits: ["交通費支給", "週払い可"],
          status: "published",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 3,
          businessName: "リラクゼーションC",
          location: "福岡県",
          serviceType: "リラクゼーション",
          catchPhrase: "完全自由出勤制度",
          description: "福岡で人気のリラクゼーションサロン。自分のペースで働けます。",
          transportationSupport: true,
          housingSupport: true,
          minimumGuarantee: 12000,
          maximumGuarantee: 25000,
          workingHours: "10:00～22:00",
          requirements: "18歳以上（高校生不可）、経験者優遇",
          benefits: ["交通費支給", "寮完備", "自由出勤"],
          status: "published",
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      const job = mockJobs.find(job => job.id === jobId);
      
      if (!job) {
        return res.status(404).json({ 
          error: 'NotFound',
          message: "求人が見つかりません" 
        });
      }
      
      log('info', '求人詳細を返却', { jobId, job: job.businessName });
      return res.json(job);
    } catch (error) {
      log('error', '求人詳細取得エラー', { 
        jobId: req.params.id, 
        error 
      });
      return res.status(500).json({
        error: 'InternalServerError',
        message: '求人情報の取得に失敗しました'
      });
    }
  });
  
  // その他のAPIルートは今後実装予定

  // 共通のエラーハンドリング
  app.use((err: Error, req: any, res: any, next: any) => {
    log('error', 'APIエラー', {
      error: err instanceof Error ? err.message : 'Unknown error',
      path: req.path,
      method: req.method
    });
    res.status(500).json({
      message: process.env.NODE_ENV === 'development' ? err.message : '内部サーバーエラー'
    });
  });

  return server;
}