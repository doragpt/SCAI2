import express, { Request, Response } from 'express';
import { log } from '../utils/logger';
import { authenticate, authorize } from '../middleware/auth';
import { storage } from '../storage';
import { sendSuccess, sendError } from '../utils/api-response';
import { getDefaultDesignSettings } from '../shared/defaultDesignSettings';
import { dataUtils } from '@shared/utils/dataTypeUtils';

const router = express.Router();

/**
 * デザイン設定の取得
 */
router.get('/', authenticate, authorize('store'), async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, 'Unauthorized', '認証が必要です');
    }

    // データベースからデザイン設定を取得
    const designSettings = await storage.getDesignSettings(userId);
    
    // 設定が見つからない場合はデフォルト設定を返す
    if (!designSettings) {
      log('info', 'デザイン設定が見つかりません。デフォルト設定を使用します。', { userId });
      return sendSuccess(res, { 
        data: getDefaultDesignSettings(),
        isDefault: true
      });
    }
    
    // 取得したデータを処理（型の一貫性確保）
    const processedSettings = dataUtils.processDesignSettings(designSettings);
    
    return sendSuccess(res, { 
      data: processedSettings,
      isDefault: false
    });
  } catch (error) {
    log('error', 'デザイン設定の取得エラー', { 
      error: error instanceof Error ? error.message : String(error)
    });
    return sendError(res, 'InternalServerError', 'デザイン設定の取得に失敗しました');
  }
});

/**
 * デザイン設定の保存
 */
router.post('/', authenticate, authorize('store'), async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, 'Unauthorized', '認証が必要です');
    }
    
    const { settings } = req.body;
    if (!settings) {
      return sendError(res, 'BadRequest', 'デザイン設定データが不足しています');
    }
    
    // 入力データを検証・加工
    try {
      // セクションが配列であることを確認
      if (!settings.sections || !Array.isArray(settings.sections)) {
        settings.sections = [];
        log('warn', 'デザイン設定のセクションが無効です。空配列を使用します。', { userId });
      }
      
      // グローバル設定がオブジェクトであることを確認
      if (!settings.globalSettings || typeof settings.globalSettings !== 'object') {
        settings.globalSettings = {
          mainColor: '#ff6b81',
          secondaryColor: '#f9f9f9',
          accentColor: '#41a0ff',
          backgroundColor: '#ffffff',
          fontFamily: 'sans-serif',
          borderRadius: 8,
          maxWidth: 1200,
          hideSectionTitles: false
        };
        log('warn', 'デザイン設定のグローバル設定が無効です。デフォルト値を使用します。', { userId });
      }
    } catch (validationError) {
      log('error', 'デザイン設定の検証エラー', { 
        error: validationError instanceof Error ? validationError.message : String(validationError),
        userId
      });
      return sendError(res, 'BadRequest', 'デザイン設定データが無効です');
    }
    
    // 設定を保存
    await storage.saveDesignSettings(userId, settings);
    
    log('info', 'デザイン設定を保存しました', { 
      userId,
      sectionsCount: settings.sections?.length || 0
    });
    
    return sendSuccess(res, { 
      message: 'デザイン設定を保存しました',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    log('error', 'デザイン設定の保存エラー', { 
      error: error instanceof Error ? error.message : String(error)
    });
    return sendError(res, 'InternalServerError', 'デザイン設定の保存に失敗しました');
  }
});

/**
 * プレビュー用のデータを取得
 * クライアント側から直接呼び出されるエンドポイント（共通のプレビューデータを返す）
 */
router.get('/preview', authenticate, authorize('store'), async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, 'Unauthorized', '認証が必要です');
    }
    
    // 店舗プロフィールを取得
    const storeProfile = await storage.getStoreProfile(userId);
    if (!storeProfile) {
      log('error', '店舗プロフィールが見つかりません', { userId });
      return sendError(res, 'NotFound', '店舗プロフィールが見つかりません');
    }
    
    // デザイン設定を取得
    let designData = await storage.getDesignSettings(userId);
    
    // 設定が見つからない場合はデフォルト設定を使用
    if (!designData) {
      log('info', 'デザイン設定が見つかりません。デフォルト設定を使用します', { userId });
      designData = getDefaultDesignSettings();
    } else {
      // データ型変換の一貫性を確保
      try {
        designData = dataUtils.processDesignSettings(designData);
      } catch (processError) {
        log('error', 'デザイン設定の処理中にエラー', { 
          error: processError instanceof Error ? processError.message : String(processError),
          userId 
        });
        // エラー時はデフォルト設定
        designData = getDefaultDesignSettings();
      }
    }
    
    // プレビュー用のデータを返す
    return sendSuccess(res, {
      storeProfile,
      designData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    log('error', 'プレビューデータの取得エラー', { 
      error: error instanceof Error ? error.message : String(error)
    });
    return sendError(res, 'InternalServerError', 'プレビューデータの取得に失敗しました');
  }
});

export default router;