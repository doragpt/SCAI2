import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { db } from '../db';
import { applications, applicationSchema } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { log } from '../utils/logger';

const router = Router();

// 求人応募エンドポイント
router.post("/:jobId", authenticate, async (req: any, res) => {
  try {
    const jobId = parseInt(req.params.jobId);
    if (isNaN(jobId)) {
      return res.status(400).json({ message: "無効な求人IDです" });
    }

    // バリデーション
    const validatedData = applicationSchema.parse({
      ...req.body,
      userId: req.user.id,
      jobId
    });

    // 重複応募チェック
    const [existingApplication] = await db
      .select()
      .from(applications)
      .where(and(
        eq(applications.jobId, jobId),
        eq(applications.userId, req.user.id)
      ));

    if (existingApplication) {
      return res.status(400).json({ message: "既に応募済みです" });
    }

    // 応募データを作成
    const [application] = await db
      .insert(applications)
      .values(validatedData)
      .returning();

    log('info', '求人応募成功', {
      userId: req.user.id,
      jobId,
      applicationId: application.id
    });

    res.status(201).json(application);
  } catch (error) {
    log('error', "求人応募エラー", {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      jobId: req.params.jobId
    });
    res.status(500).json({
      message: "応募処理に失敗しました",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// 応募履歴の取得
router.get("/history", authenticate, async (req: any, res) => {
  try {
    const applicationHistory = await db
      .select()
      .from(applications)
      .where(eq(applications.userId, req.user.id))
      .orderBy(applications.appliedAt);

    res.json(applicationHistory);
  } catch (error) {
    log('error', "応募履歴取得エラー", {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id
    });
    res.status(500).json({
      message: "応募履歴の取得に失敗しました"
    });
  }
});

export default router;
