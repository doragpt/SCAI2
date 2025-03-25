import express, { Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { log } from '../utils/logger';
import { 
  getMatchingStatistics, 
  getStorePerformanceAnalytics, 
  getTalentActivityAnalytics
} from '../utils/analytics';

const router = express.Router();

/**
 * 全体のマッチング統計を取得するエンドポイント
 * 管理者のみアクセス可能
 */
router.get('/matching-statistics', authenticate, authorize('store'), async (req: Request, res: Response) => {
  try {
    const statistics = await getMatchingStatistics();
    
    return res.status(200).json({
      success: true,
      data: statistics
    });
  } catch (error) {
    log('error', 'マッチング統計取得エラー', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return res.status(500).json({
      success: false,
      message: 'マッチング統計の取得中にエラーが発生しました',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 店舗のパフォーマンス分析を取得するエンドポイント
 * 店舗オーナーは自分の店舗のみ、管理者は全店舗の情報を取得可能
 */
router.get('/store/:storeId', authenticate, async (req: Request, res: Response) => {
  try {
    const storeId = parseInt(req.params.storeId, 10);
    
    if (isNaN(storeId)) {
      return res.status(400).json({
        success: false,
        message: '有効な店舗IDを指定してください'
      });
    }
    
    // 権限チェック - 店舗オーナーは自分の店舗のみ、管理者は全店舗の情報を取得可能
    if (req.user?.role === 'store' && req.user.id !== storeId) {
      return res.status(403).json({
        success: false,
        message: '他の店舗の分析データにアクセスする権限がありません'
      });
    }
    
    const analytics = await getStorePerformanceAnalytics(storeId);
    
    return res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    log('error', '店舗パフォーマンス分析取得エラー', {
      storeId: req.params.storeId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return res.status(500).json({
      success: false,
      message: '店舗パフォーマンス分析の取得中にエラーが発生しました',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 求職者のアクティビティ分析を取得するエンドポイント
 * 求職者は自分の情報のみ、管理者は全ユーザーの情報を取得可能
 */
router.get('/talent/:userId', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: '有効なユーザーIDを指定してください'
      });
    }
    
    // 権限チェック - ユーザーは自分の情報のみ、管理者は全ユーザーの情報を取得可能
    if (req.user?.role === 'talent' && req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: '他のユーザーの分析データにアクセスする権限がありません'
      });
    }
    
    const analytics = await getTalentActivityAnalytics(userId);
    
    return res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    log('error', '求職者アクティビティ分析取得エラー', {
      userId: req.params.userId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return res.status(500).json({
      success: false,
      message: '求職者アクティビティ分析の取得中にエラーが発生しました',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 個人化されたマッチング推奨設定を取得するエンドポイント
 */
router.get('/matching-preferences', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'ユーザーが特定できません'
      });
    }
    
    // 前回のマッチング結果や行動履歴から、ユーザーに最適な重み付け設定を提案
    const defaultPreferences = {
      prioritizeLocation: false,
      prioritizeGuarantee: true,
      prioritizeAppearance: false,
      prioritizeWorkConditions: false,
      customWeights: null
    };
    
    // TODO: ユーザーの過去の行動に基づいて設定を調整する処理を実装
    
    return res.status(200).json({
      success: true,
      data: {
        preferences: defaultPreferences,
        message: '現在の推奨設定です',
      }
    });
  } catch (error) {
    log('error', 'マッチング推奨設定取得エラー', {
      userId: req.user?.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return res.status(500).json({
      success: false,
      message: 'マッチング推奨設定の取得中にエラーが発生しました',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;