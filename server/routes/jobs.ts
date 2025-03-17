import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { db } from '../db';
import { jobs } from '@shared/schema';
import { eq, desc, and, isNotNull } from 'drizzle-orm';
import { log } from '../utils/logger';

const router = Router();

// 求人一覧取得（店舗用）
router.get("/store", authenticate, async (req: any, res) => {
  try {
    if (!req.user?.id || req.user.role !== "store") {
      return res.status(403).json({ message: "店舗アカウントのみアクセス可能です" });
    }

    const jobListings = await db
      .select()
      .from(jobs)
      .where(eq(jobs.storeId, req.user.id))
      .orderBy(desc(jobs.createdAt));

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
    log('error', '求人情報取得エラー', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id
    });
    return res.status(500).json({ message: "求人情報の取得に失敗しました" });
  }
});

// パブリック求人一覧取得
router.get("/public", async (_req, res) => {
  try {
    log('info', 'パブリック求人一覧の取得を開始');

    const jobListings = await db
      .select({
        id: jobs.id,
        businessName: jobs.businessName,
        location: jobs.location,
        serviceType: jobs.serviceType,
        displayServiceType: jobs.displayServiceType,
        title: jobs.title,
        minimumGuarantee: jobs.minimumGuarantee,
        maximumGuarantee: jobs.maximumGuarantee,
        selectedBenefits: jobs.selectedBenefits,
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
      .limit(12);

    log('info', 'パブリック求人一覧取得成功', {
      count: jobListings.length,
      firstJob: jobListings[0]
    });

    return res.json({ jobs: jobListings });
  } catch (error) {
    log('error', 'パブリック求人一覧取得エラー', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return res.status(500).json({ message: "求人情報の取得に失敗しました" });
  }
});

export default router;