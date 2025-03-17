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
      timestamp: new Date().toISOString()
    });

    // データベースクエリの実行
    const jobListings = await db
      .select()
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
      timestamp: new Date().toISOString()
    });

    // クエリ結果をログに出力（デバッグ用）
    console.log('Jobs Query Result:', jobListings);

    return res.json({
      jobs: jobListings,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: jobListings.length
      }
    });
  } catch (error) {
    log('error', 'パブリック求人一覧取得エラー', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    return res.status(500).json({ message: "求人情報の取得に失敗しました" });
  }
});

export default router;