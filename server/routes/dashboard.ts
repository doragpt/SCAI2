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

    // 求人状態ごとの数を取得
    const jobStats = await db
      .select({
        status: jobs.status,
        count: sql<number>`count(*)`
      })
      .from(jobs)
      .where(sql`"storeId" = ${req.user.id}`)
      .groupBy(jobs.status)
      .execute();

    // 応募状態ごとの数を取得
    const applicationStats = await db
      .select({
        status: applications.status,
        count: sql<number>`count(*)`
      })
      .from(applications)
      .where(sql`"storeId" = ${req.user.id}`)
      .groupBy(applications.status)
      .execute();

    // 統計を集計
    const stats = {
      // 求人関連の統計
      activeJobsCount: jobStats.find(stat => stat.status === 'published')?.count || 0,
      draftJobsCount: jobStats.find(stat => stat.status === 'draft')?.count || 0,
      closedJobsCount: jobStats.find(stat => stat.status === 'closed')?.count || 0,

      // 応募関連の統計
      totalApplicationsCount: applicationStats.reduce((sum, stat) => sum + stat.count, 0),
      pendingApplicationsCount: applicationStats.find(stat => stat.status === 'pending')?.count || 0,
      completedApplicationsCount: applicationStats.find(stat => ['accepted', 'rejected'].includes(stat.status))?.count || 0
    };

    log('info', '店舗ダッシュボード統計取得', {
      storeId: req.user.id,
      stats
    });

    res.json(stats);
  } catch (error) {
    log('error', '店舗ダッシュボード統計取得エラー', {
      error: error instanceof Error ? error.message : 'Unknown error',
      storeId: req.user?.id
    });
    res.status(500).json({ message: '統計情報の取得に失敗しました' });
  }
});

export default router;