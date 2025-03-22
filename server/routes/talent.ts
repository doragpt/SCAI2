import { Router } from 'express';
import { storage } from '../storage';
import { talentProfileSchema } from '@shared/schema';
import { log } from '../utils/logger';
import { performAIMatching } from '../utils/matching';

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
    log('info', 'タレントプロフィール取得リクエスト', { 
      userId: req.user?.id,
      session: req.session,
      isAuthenticated: req.isAuthenticated()
    });

    if (!req.user?.id) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: "認証が必要です" 
      });
    }

    const profile = await storage.getTalentProfile(req.user.id);
    log('info', 'タレントプロフィール取得結果', { 
      userId: req.user?.id,
      hasProfile: !!profile,
      profileData: profile 
    });

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
      requestBody: req.body
    });

    const validatedData = talentProfileSchema.parse(req.body);
    const profile = await storage.createOrUpdateTalentProfile(req.user.id, validatedData);

    log('info', 'タレントプロフィール更新成功', {
      userId: req.user.id,
      updatedProfile: profile
    });

    res.json(profile);
  } catch (error) {
    log('error', 'タレントプロフィール更新エラー', { 
      error,
      requestBody: req.body 
    });
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

// AIマッチング機能
router.get('/ai-matching', requireAuth, async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: "認証が必要です" 
      });
    }

    log('info', 'AIマッチングリクエスト', { 
      userId: req.user.id,
      query: req.query
    });

    // オプションのクエリパラメータ
    const searchOptions = {
      // 検索条件の追加は必要に応じて実装
      filterByLocation: req.query.location,
      filterByService: req.query.serviceType,
    };

    // マッチング処理の実行
    const matchResults = await performAIMatching(req.user.id, searchOptions);

    if (matchResults.error) {
      return res.status(400).json({
        error: 'MatchingError',
        message: matchResults.error
      });
    }

    log('info', 'AIマッチング結果', { 
      userId: req.user.id,
      totalMatches: matchResults.totalMatches || 0
    });

    res.json(matchResults);
  } catch (error) {
    log('error', 'AIマッチングエラー', { error });
    res.status(500).json({ 
      error: 'InternalServerError',
      message: "マッチング処理中にエラーが発生しました" 
    });
  }
});

export default router;