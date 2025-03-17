import { Router } from 'express';
import { db } from '../db';
import { jobs } from '@shared/schema';
import { eq, desc, and, isNotNull } from 'drizzle-orm';
import { log } from '../utils/logger';
import { sql } from 'drizzle-orm';

const router = Router();

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
      .select({ count: sql`count(*)` })
      .from(jobs)
      .where(
        and(
          eq(jobs.status, 'published'),
          isNotNull(jobs.businessName),
          isNotNull(jobs.location)
        )
      );

    // データを取得
    const jobListings = await db
      .select({
        id: jobs.id,
        businessName: jobs.businessName,
        location: jobs.location,
        serviceType: jobs.serviceType,
        title: jobs.title,
        minimumGuarantee: jobs.minimumGuarantee,
        maximumGuarantee: jobs.maximumGuarantee,
        transportationSupport: jobs.transportationSupport,
        housingSupport: jobs.housingSupport,
        status: jobs.status,
        createdAt: jobs.createdAt,
        updatedAt: jobs.updatedAt
      })
      .from(jobs)
      .where(
        and(
          eq(jobs.status, 'published'),
          isNotNull(jobs.businessName),
          isNotNull(jobs.location)
        )
      )
      .orderBy(desc(jobs.createdAt))
      .limit(limit)
      .offset(offset);

    log('info', 'データベースクエリ実行結果', {
      count: jobListings.length,
      totalCount: count,
      page,
      limit,
      timestamp: new Date().toISOString()
    });

    const totalPages = Math.ceil(count / limit);

    return res.json({
      jobs: jobListings,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: count
      }
    });
  } catch (error) {
    log('error', 'パブリック求人一覧取得エラー', {
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
        businessName: jobs.businessName,
        location: jobs.location,
        serviceType: jobs.serviceType,
        title: jobs.title,
        minimumGuarantee: jobs.minimumGuarantee,
        maximumGuarantee: jobs.maximumGuarantee,
        transportationSupport: jobs.transportationSupport,
        housingSupport: jobs.housingSupport,
        status: jobs.status,
        createdAt: jobs.createdAt,
        updatedAt: jobs.updatedAt
      })
      .from(jobs)
      .where(
        and(
          eq(jobs.status, 'published'),
          isNotNull(jobs.businessName),
          isNotNull(jobs.location)
        )
      )
      .orderBy(desc(jobs.createdAt));

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