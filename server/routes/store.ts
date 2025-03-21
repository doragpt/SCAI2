import { Router } from 'express';
import { db } from '../db';
import { store_profiles, storeProfileSchema } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { log } from '../utils/logger';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// 店舗プロフィール取得
router.get("/profile", authenticate, authorize("store"), async (req: any, res) => {
  try {
    log('info', '店舗プロフィール取得開始', {
      userId: req.user.id,
      displayName: req.user.display_name
    });

    const [profile] = await db
      .select()
      .from(store_profiles)
      .where(eq(store_profiles.user_id, req.user.id));

    if (!profile) {
      return res.status(404).json({ message: "店舗プロフィールが見つかりません" });
    }

    log('info', '店舗プロフィール取得成功', {
      userId: req.user.id,
      profileId: profile.id
    });

    return res.json(profile);
  } catch (error) {
    log('error', '店舗プロフィール取得エラー', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id
    });
    return res.status(500).json({ message: "店舗プロフィールの取得に失敗しました" });
  }
});

// 店舗プロフィール更新
router.patch("/profile", authenticate, authorize("store"), async (req: any, res) => {
  try {
    log('info', '店舗プロフィール更新開始', {
      userId: req.user.id,
      displayName: req.user.display_name
    });

    const [existingProfile] = await db
      .select()
      .from(store_profiles)
      .where(eq(store_profiles.user_id, req.user.id));

    if (!existingProfile) {
      return res.status(404).json({ message: "店舗プロフィールが見つかりません" });
    }

    // バリデーション
    const validatedData = storeProfileSchema.parse(req.body);

    // 更新データの準備
    const updateData = {
      ...validatedData,
      updated_at: new Date()
    };

    const [updatedProfile] = await db
      .update(store_profiles)
      .set(updateData)
      .where(eq(store_profiles.user_id, req.user.id))
      .returning();

    log('info', '店舗プロフィール更新成功', {
      userId: req.user.id,
      profileId: updatedProfile.id
    });

    return res.json(updatedProfile);
  } catch (error) {
    log('error', '店舗プロフィール更新エラー', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id
    });

    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({
        message: '入力内容に誤りがあります',
        details: error.message
      });
    }

    return res.status(500).json({ message: "店舗プロフィールの更新に失敗しました" });
  }
});

export default router;
