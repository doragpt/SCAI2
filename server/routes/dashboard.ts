import { Router } from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { log } from '../utils/logger';

const router = Router();

// 店舗ダッシュボードの統計情報を取得
router.get('/stats', async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'store') {
      return res.status(403).json({ message: '権限がありません' });
    }

    // 店舗の掲載情報を取得
    const storeStats = {
      storePlan: 'free', // デフォルトは無料プラン
      storeArea: req.user.location || '未設定',
      displayRank: 1, // 表示順位（実装時に適切なロジックを追加）

      // アクセス状況（仮の実装）
      todayPageViews: 0,
      todayUniqueVisitors: 0,
      monthlyPageViews: 0,
      monthlyUniqueVisitors: 0,

      // 応募者対応状況（仮の実装）
      newInquiriesCount: 0,
      pendingInquiriesCount: 0,
      completedInquiriesCount: 0
    };

    log('info', '店舗ダッシュボード統計取得', {
      storeId: req.user.id,
      stats: storeStats
    });

    res.json(storeStats);
  } catch (error) {
    log('error', '店舗ダッシュボード統計取得エラー', {
      error: error instanceof Error ? error.message : 'Unknown error',
      storeId: req.user?.id
    });
    res.status(500).json({ message: '統計情報の取得に失敗しました' });
  }
});

export default router;