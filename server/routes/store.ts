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
      displayName: req.user.display_name,
      requestBody: req.body
    });

    // 認証済みユーザー情報の確認
    if (!req.user.display_name || !req.user.location || !req.user.service_type) {
      log('error', '店舗情報が不足しています', {
        userId: req.user.id,
        displayName: req.user.display_name,
        location: req.user.location,
        serviceType: req.user.service_type,
      });
      return res.status(400).json({
        message: "店舗情報が正しく設定されていません。管理者にお問い合わせください。"
      });
    }

    const [existingProfile] = await db
      .select()
      .from(store_profiles)
      .where(eq(store_profiles.user_id, req.user.id));

    if (!existingProfile) {
      // プロフィールが存在しない場合は新規作成
      log('info', '店舗プロフィール新規作成', {
        userId: req.user.id,
        displayName: req.user.display_name
      });

      const insertData = {
        user_id: req.user.id,
        business_name: req.user.display_name,
        location: req.user.location,
        service_type: req.user.service_type,
        catch_phrase: req.body.catch_phrase,
        description: req.body.description,
        benefits: req.body.benefits || [],
        minimum_guarantee: Number(req.body.minimum_guarantee) || 0,
        maximum_guarantee: Number(req.body.maximum_guarantee) || 0,
        status: req.body.status || "draft",
        created_at: new Date(),
        updated_at: new Date()
      };

      log('info', '新規作成データ', { insertData });

      // バリデーション
      const validatedData = storeProfileSchema.parse(insertData);

      const [newProfile] = await db
        .insert(store_profiles)
        .values(validatedData)
        .returning();

      log('info', '店舗プロフィール作成成功', {
        userId: req.user.id,
        profileId: newProfile.id
      });

      return res.status(201).json(newProfile);
    }

    // 既存プロフィールの更新
    const updateData = {
      catch_phrase: req.body.catch_phrase,
      description: req.body.description,
      benefits: req.body.benefits || existingProfile.benefits,
      minimum_guarantee: Number(req.body.minimum_guarantee) || existingProfile.minimum_guarantee,
      maximum_guarantee: Number(req.body.maximum_guarantee) || existingProfile.maximum_guarantee,
      status: req.body.status || existingProfile.status,
      updated_at: new Date()
    };

    log('info', '更新データ', { updateData });

    // バリデーション
    const validatedData = storeProfileSchema.parse(updateData);

    const [updatedProfile] = await db
      .update(store_profiles)
      .set(validatedData)
      .where(eq(store_profiles.user_id, req.user.id))
      .returning();

    log('info', '店舗プロフィール更新成功', {
      userId: req.user.id,
      profileId: updatedProfile.id,
      updatedData: validatedData
    });

    return res.json(updatedProfile);
  } catch (error) {
    log('error', '店舗プロフィール更新エラー', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      requestBody: req.body
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