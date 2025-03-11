import { Router } from 'express';
import { storage } from '../storage';
import { authenticate } from '../middleware/auth';
import { log } from '../utils/logger';
import { talentProfileSchema } from '@shared/schema';

const router = Router();

// タレントプロフィール取得API
router.get("/profile", authenticate, async (req, res) => {
  try {
    if (!req.user) {
      log('warn', 'タレントプロフィール取得：認証なし');
      return res.status(401).json({ message: "認証が必要です" });
    }

    const profile = await storage.getTalentProfile(req.user.id);
    if (!profile) {
      log('info', 'タレントプロフィールが未作成', { userId: req.user.id });
      return res.status(404).json({ message: "プロフィールが未作成です" });
    }

    log('info', 'タレントプロフィール取得成功', { userId: req.user.id });
    res.json(profile);
  } catch (error) {
    log('error', 'タレントプロフィール取得エラー', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    res.status(500).json({ message: "プロフィールの取得に失敗しました" });
  }
});

// タレントプロフィール作成/更新API
router.post("/profile", authenticate, async (req, res) => {
  try {
    if (!req.user) {
      log('warn', 'タレントプロフィール更新：認証なし');
      return res.status(401).json({ message: "認証が必要です" });
    }

    // バリデーション
    const validatedData = talentProfileSchema.parse(req.body);

    // プロフィールの保存
    const profile = await storage.createOrUpdateTalentProfile(req.user.id, validatedData);

    log('info', 'タレントプロフィール保存成功', { userId: req.user.id });
    res.json(profile);
  } catch (error) {
    log('error', 'タレントプロフィール保存エラー', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    res.status(500).json({ message: "プロフィールの保存に失敗しました" });
  }
});

export default router;