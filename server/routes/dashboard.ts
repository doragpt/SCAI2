import { Router } from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { jobs, applications } from '@shared/schema';
import { log } from '../utils/logger';

const router = Router();

// 店舗ダッシュボードの統計情報を取得
router.get('/stats', async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'store') {
      return res.status(403).json({ message: '権限がありません' });
    }

    // 公開中の求人数を取得
    const activeJobsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(jobs)
      .where(sql`status = 'published' AND "storeId" = ${req.user.id}`)
      .then(result => result[0]?.count || 0);

    // 応募総数を取得
    const totalApplicationsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(applications)
      .where(sql`"storeId" = ${req.user.id}`)
      .then(result => result[0]?.count || 0);

    log('info', '店舗ダッシュボード統計取得', {
      storeId: req.user.id,
      activeJobs: activeJobsCount,
      totalApplications: totalApplicationsCount
    });

    res.json({
      activeJobsCount,
      totalApplicationsCount
    });
  } catch (error) {
    log('error', '店舗ダッシュボード統計取得エラー', {
      error: error instanceof Error ? error.message : 'Unknown error',
      storeId: req.user?.id
    });
    res.status(500).json({ message: '統計情報の取得に失敗しました' });
  }
});

export default router;
