import { Router } from 'express';
import { db } from '../db';
import { jobs } from '@shared/schema';
import { eq, desc, and, isNotNull } from 'drizzle-orm';
import { log } from '../utils/logger';

const router = Router();

// パブリック求人一覧取得（認証不要）
router.get("/", async (_req, res) => {
  try {
    log('info', 'パブリック求人一覧の取得を開始', {
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

    log('info', 'データベースクエリ実行結果', {
      count: jobListings.length,
      timestamp: new Date().toISOString(),
      firstJob: jobListings[0] ? {
        id: jobListings[0].id,
        businessName: jobListings[0].businessName
      } : null
    });

    const response = {
      jobs: jobListings,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: jobListings.length
      }
    };

    return res.json(response);
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

export default router;