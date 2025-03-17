import { Router } from 'express';
import { db } from '../db';
import { jobs } from '@shared/schema';
import { eq, desc, and, isNotNull } from 'drizzle-orm';
import { log } from '../utils/logger';
import { sql } from 'drizzle-orm';
import { authenticate } from '../middleware/auth';

const router = Router();

// 求人基本情報の保存
router.post("/basic-info", authenticate, async (req: any, res) => {
  try {
    log('info', '求人基本情報の保存リクエスト', {
      userId: req.user?.id,
      requestBody: req.body
    });

    // データの変換（フィールド名の調整）
    const jobData = {
      title: req.body.mainCatch?.substring(0, 50) || '',
      catch_phrase: req.body.mainCatch,
      description: req.body.mainDescription,
      business_name: req.body.businessName,
      location: req.body.location,
      service_type: req.body.serviceType,
      minimum_guarantee: req.body.minimumGuarantee,
      maximum_guarantee: req.body.maximumGuarantee,
      transportation_support: req.body.transportationSupport,
      housing_support: req.body.housingSupport,
      benefits: JSON.stringify(req.body.selectedBenefits),
      status: req.body.status || 'draft'
    };

    log('info', '変換後のデータ', { jobData });

    // 新規求人データを作成
    const [job] = await db
      .insert(jobs)
      .values(jobData)
      .returning();

    log('info', '求人基本情報の保存成功', {
      jobId: job.id,
      userId: req.user?.id,
      savedData: job
    });

    res.status(201).json(job);
  } catch (error) {
    log('error', '求人基本情報の保存エラー', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      requestBody: req.body
    });
    res.status(500).json({
      message: "求人情報の保存に失敗しました",
      error: error instanceof Error ? error.message : undefined
    });
  }
});

// パブリック求人一覧取得（ページネーション対応）
router.get("/public", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const offset = (page - 1) * limit;

    log('info', 'パブリック求人一覧の取得を開始', {
      path: req.path,
      method: req.method,
      query: { page, limit },
      timestamp: new Date().toISOString()
    });

    // 総件数を取得
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::integer` })
      .from(jobs)
      .where(
        and(
          eq(jobs.status, 'published'),
          isNotNull(jobs.business_name),
          isNotNull(jobs.location)
        )
      );

    // データを取得
    const jobListings = await db
      .select()
      .from(jobs)
      .where(
        and(
          eq(jobs.status, 'published'),
          isNotNull(jobs.business_name),
          isNotNull(jobs.location)
        )
      )
      .orderBy(desc(jobs.created_at))
      .limit(limit)
      .offset(offset);

    return res.json({
      jobs: jobListings,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(Number(count) / limit),
        totalItems: Number(count)
      }
    });
  } catch (error) {
    log('error', 'パブリック求人一覧取得エラー', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });

    return res.status(500).json({
      message: "求人情報の取得に失敗しました"
    });
  }
});

// 基本の求人一覧取得エンドポイントは維持
router.get("/", async (_req, res) => {
  try {
    log('info', '求人一覧の取得を開始', {
      path: _req.path,
      method: _req.method,
      timestamp: new Date().toISOString()
    });

    const jobListings = await db
      .select({
        id: jobs.id,
        business_name: jobs.business_name,
        location: jobs.location,
        service_type: jobs.service_type,
        title: jobs.title,
        minimum_guarantee: jobs.minimum_guarantee,
        maximum_guarantee: jobs.maximum_guarantee,
        transportation_support: jobs.transportation_support,
        housing_support: jobs.housing_support,
        status: jobs.status,
        created_at: jobs.created_at,
        updated_at: jobs.updated_at
      })
      .from(jobs)
      .where(
        and(
          eq(jobs.status, 'published'),
          isNotNull(jobs.business_name),
          isNotNull(jobs.location)
        )
      )
      .orderBy(desc(jobs.created_at));

    return res.json({
      jobs: jobListings,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: jobListings.length
      }
    });
  } catch (error) {
    log('error', '求人一覧取得エラー', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });

    return res.status(500).json({
      error: 'InternalServerError',
      message: "求人情報の取得に失敗しました",
      details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
    });
  }
});

export default router;