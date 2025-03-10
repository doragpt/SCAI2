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

// パブリック求人一覧取得
router.get("/public", async (_req, res) => {
  try {
    const jobListings = await db
      .select()
      .from(jobs)
      .where(eq(jobs.status, 'published'))
      .orderBy(desc(jobs.createdAt))
      .limit(12);

    log('info', 'パブリック求人一覧取得成功', {
      count: jobListings.length
    });

    return res.json(jobListings);
  } catch (error) {
    log('error', 'パブリック求人一覧取得エラー', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return res.status(500).json({ message: "求人情報の取得に失敗しました" });
  }
});

export default router;