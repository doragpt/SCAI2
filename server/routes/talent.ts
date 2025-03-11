import { Router } from 'express';
import { storage } from '../storage';
import { talentProfileSchema } from '@shared/schema';
import { log } from '../utils/logger';

const router = Router();

// 認証ミドルウェア
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: "認証が必要です" 
    });
  }
  next();
};

// タレントプロフィールの取得
router.get('/profile', requireAuth, async (req, res) => {
  try {
    log('info', 'タレントプロフィール取得リクエスト', { userId: req.user?.id });

    if (!req.user?.id) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: "認証が必要です" 
      });
    }

    const profile = await storage.getTalentProfile(req.user.id);

    if (!profile) {
      return res.status(404).json({ 
        error: 'NotFound',
        message: "プロフィールが見つかりません" 
      });
    }

    res.json(profile);
  } catch (error) {
    log('error', 'タレントプロフィール取得エラー', { error });
    res.status(500).json({ 
      error: 'InternalServerError',
      message: "プロフィールの取得に失敗しました" 
    });
  }
});

// タレントプロフィールの作成・更新
router.post('/profile', requireAuth, async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: "認証が必要です" 
      });
    }

    log('info', 'タレントプロフィール更新リクエスト', {
      userId: req.user.id,
      data: req.body
    });

    const validatedData = talentProfileSchema.parse(req.body);
    const profile = await storage.createOrUpdateTalentProfile(req.user.id, validatedData);

    res.json(profile);
  } catch (error) {
    log('error', 'タレントプロフィール更新エラー', { error });
    if (error instanceof Error) {
      res.status(400).json({ 
        error: 'ValidationError',
        message: error.message 
      });
    } else {
      res.status(500).json({ 
        error: 'InternalServerError',
        message: "プロフィールの更新に失敗しました" 
      });
    }
  }
});

export default router;