import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { db } from '../db';
import { applications, applicationSchema, users, store_profiles } from '@shared/schema';
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

    // 求人情報の存在確認
    const [job] = await db
      .select()
      .from(store_profiles)
      .where(eq(store_profiles.id, jobId));

    if (!job) {
      return res.status(404).json({ message: "指定された求人が見つかりません" });
    }

    // バリデーション
    const validatedData = applicationSchema.parse({
      ...req.body,
      user_id: req.user.id,
      store_profile_id: jobId,
      message: req.body.message || null,
      status: "pending"
    });

    // 重複応募チェック
    const [existingApplication] = await db
      .select()
      .from(applications)
      .where(and(
        eq(applications.store_profile_id, jobId),
        eq(applications.user_id, req.user.id)
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
    // ストアプロフィール情報も含めて取得
    const applicationHistory = await db
      .select({
        id: applications.id,
        store_profile_id: applications.store_profile_id,
        user_id: applications.user_id,
        status: applications.status,
        message: applications.message,
        created_at: applications.created_at,
        updated_at: applications.updated_at,
        businessName: store_profiles.business_name,
        location: store_profiles.location,
        serviceType: store_profiles.service_type,
      })
      .from(applications)
      .innerJoin(
        store_profiles,
        eq(applications.store_profile_id, store_profiles.id)
      )
      .where(eq(applications.user_id, req.user.id))
      .orderBy(applications.created_at);

    log('info', "応募履歴取得成功", {
      userId: req.user.id,
      count: applicationHistory.length
    });

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

// 店舗向け応募一覧の取得
router.get("/store", authenticate, async (req: any, res) => {
  try {
    // ストアが保有している求人に対する応募を取得
    const storeApplications = await db
      .select({
        id: applications.id,
        store_profile_id: applications.store_profile_id,
        user_id: applications.user_id,
        status: applications.status,
        message: applications.message,
        created_at: applications.created_at,
        updated_at: applications.updated_at,
        username: users.username,
        location: users.location,
      })
      .from(applications)
      .innerJoin(
        users,
        eq(applications.user_id, users.id)
      )
      .innerJoin(
        store_profiles,
        eq(applications.store_profile_id, store_profiles.id)
      )
      .where(eq(store_profiles.user_id, req.user.id))
      .orderBy(applications.created_at);

    log('info', "店舗向け応募一覧取得成功", {
      userId: req.user.id,
      count: storeApplications.length
    });

    res.json(storeApplications);
  } catch (error) {
    log('error', "店舗向け応募一覧取得エラー", {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id
    });
    res.status(500).json({
      message: "応募一覧の取得に失敗しました"
    });
  }
});

export default router;
