import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { db } from '../db';
import { talentProfiles } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { log } from '../utils/logger';

const router = Router();

// タレントプロフィール取得
router.get("/profile", authenticate, async (req: any, res) => {
  try {
    log('info', 'タレントプロフィール取得開始', {
      userId: req.user?.id
    });

    const [profile] = await db
      .select()
      .from(talentProfiles)
      .where(eq(talentProfiles.userId, req.user.id));

    if (!profile) {
      return res.status(404).json({
        message: "プロフィールが見つかりません"
      });
    }

    log('info', 'タレントプロフィール取得成功', {
      userId: req.user?.id,
      profileId: profile.id
    });

    return res.json(profile);
  } catch (error) {
    log('error', 'タレントプロフィール取得エラー', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id
    });
    return res.status(500).json({
      message: "プロフィールの取得に失敗しました"
    });
  }
});

export default router;
