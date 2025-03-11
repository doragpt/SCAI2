import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { db } from '../db';
import { talents } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { log } from '../utils/logger';

const router = Router();

// タレントプロフィール取得
router.get("/profile", authenticate, async (req: any, res) => {
  try {
    log('info', 'タレントプロフィール取得リクエスト', {
      userId: req.user?.id
    });

    if (!req.user) {
      return res.status(401).json({ message: "認証が必要です" });
    }

    const [talent] = await db
      .select()
      .from(talents)
      .where(eq(talents.userId, req.user.id));

    if (!talent) {
      log('info', 'タレントプロフィールが未作成', {
        userId: req.user.id
      });
      return res.status(404).json({ message: "プロフィールが未作成です" });
    }

    log('info', 'タレントプロフィール取得成功', {
      userId: req.user.id,
      talentId: talent.id
    });

    res.json(talent);
  } catch (error) {
    log('error', 'タレントプロフィール取得エラー', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id
    });
    res.status(500).json({
      message: "プロフィールの取得に失敗しました"
    });
  }
});

// タレントプロフィール作成・更新
router.post("/profile", authenticate, async (req: any, res) => {
  try {
    log('info', 'タレントプロフィール更新リクエスト', {
      userId: req.user?.id,
      data: req.body
    });

    if (!req.user) {
      return res.status(401).json({ message: "認証が必要です" });
    }

    const [existingTalent] = await db
      .select()
      .from(talents)
      .where(eq(talents.userId, req.user.id));

    let talent;
    if (existingTalent) {
      // 更新
      [talent] = await db
        .update(talents)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(talents.userId, req.user.id))
        .returning();
    } else {
      // 新規作成
      [talent] = await db
        .insert(talents)
        .values({
          ...req.body,
          userId: req.user.id,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
    }

    log('info', 'タレントプロフィール更新成功', {
      userId: req.user.id,
      talentId: talent.id
    });

    res.json(talent);
  } catch (error) {
    log('error', 'タレントプロフィール更新エラー', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id
    });
    res.status(500).json({
      message: "プロフィールの更新に失敗しました"
    });
  }
});

export default router;
