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

    // まずユーザー基本情報を取得
    const userData = await storage.getUser(req.user.id);
    if (!userData) {
      return res.status(404).json({ 
        error: 'NotFound',
        message: "ユーザー情報が見つかりません" 
      });
    }

    // タレントプロフィール情報を取得
    const profile = await storage.getTalentProfile(req.user.id);
    
    log('info', 'タレントプロフィール取得結果', { 
      userId: req.user?.id,
      hasProfile: !!profile,
      userData: !!userData,
      profileData: profile 
    });

    if (!profile) {
      // プロフィールが存在しない場合は、空のプロフィールを返す
      log('info', 'プロフィールが存在しないため、空のプロフィールを返します', { userId: req.user?.id });
      return res.json(null);
    }

    // 生年月日情報がない場合は、ユーザーデータから追加
    if (!profile.birth_date && userData.birth_date) {
      profile.birth_date = userData.birth_date;
      log('info', '生年月日情報を補完', { birth_date: profile.birth_date });
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

    // クエリパラメータの処理
    // 文字列の安全な数値変換関数
    const safeParseInt = (value: any): number | undefined => {
      if (value === undefined || value === null || value === '') return undefined;
      const parsed = parseInt(value as string, 10);
      return isNaN(parsed) ? undefined : parsed;
    };

    // 配列パラメータを処理する関数
    const parseArrayParam = (param: any): string[] => {
      if (!param) return [];
      if (Array.isArray(param)) return param as string[];
      return [param as string];
    };

    // 検索オプションの構築
    const searchOptions = {
      // 基本検索条件
      minGuarantee: safeParseInt(req.query.minGuarantee),
      location: parseArrayParam(req.query.location),
      serviceType: parseArrayParam(req.query.serviceType),
      
      // 追加フィルタリング条件
      filterByLocation: req.query.filterByLocation as string,
      filterByService: req.query.filterByService as string,
      filterByMinGuarantee: safeParseInt(req.query.filterByMinGuarantee),
      
      // 特定項目でのマッチング重視
      prioritizeLocation: req.query.prioritizeLocation === 'true',
      prioritizeGuarantee: req.query.prioritizeGuarantee === 'true',
      
      // 検索結果の制限
      limit: safeParseInt(req.query.limit) || 50,
      
      // デバッグ用フラグ
      includeScores: req.query.includeScores === 'true',
    };

    // マッチング処理の実行
    const matchResults = await performAIMatching(req.user.id, searchOptions);

    if (matchResults.error) {
      return res.status(400).json({
        error: 'MatchingError',
        message: matchResults.error
      });
    }

    // 検索結果の制限（デフォルトでは上限50件）
    const limitedResults = {
      ...matchResults,
      matches: matchResults.matches.slice(0, searchOptions.limit)
    };

    log('info', 'AIマッチング結果', { 
      userId: req.user.id,
      totalMatches: matchResults.totalMatches || 0,
      returnedMatches: limitedResults.matches.length,
      topScore: limitedResults.matches.length > 0 ? limitedResults.matches[0].matchScore : 0
    });

    res.json(limitedResults);
  } catch (error) {
    log('error', 'AIマッチングエラー', { error });
    res.status(500).json({ 
      error: 'InternalServerError',
      message: "マッチング処理中にエラーが発生しました" 
    });
  }
});

export default router;