import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { db } from '../db';
import { jobs, jobSchema } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';
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

// 他の求人関連エンドポイントも同様に実装

export default router;
