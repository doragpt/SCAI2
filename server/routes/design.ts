import express, { Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { db } from '../db';
import { store_profiles } from '@shared/schema';
import { designSettingsSchema, type DesignSettings } from '@shared/schema';
import { storage } from '../storage';
import { eq } from 'drizzle-orm';
import { dataUtils } from '@shared/utils/dataTypeUtils';
import { log } from '../utils/logger';
import { getDefaultDesignSettings } from '../shared/defaultDesignSettings';

const router = express.Router();

// デザイン設定を取得するエンドポイント
router.get('/', authenticate, authorize('store'), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    log('info', 'デザイン設定取得リクエスト受信', { userId });
    
    // 店舗プロフィールを取得
    const storeProfile = await storage.getStoreProfile(userId);
    
    if (!storeProfile) {
      log('error', '店舗プロフィールが見つかりません', { userId });
      return res.status(404).json({ 
        success: false,
        error: '店舗プロフィールが見つかりません'
      });
    }
    
    // design_settingsフィールドがあればそれを返す、なければデフォルト設定を返す
    if (storeProfile.design_settings) {
      // 返却前に整合性をチェック
      const processedSettings = dataUtils.processDesignSettings(storeProfile.design_settings);
      
      log('info', 'デザイン設定取得成功', { 
        userId, 
        sectionsCount: processedSettings.sections ? processedSettings.sections.length : 0,
        hasGlobalSettings: !!processedSettings.globalSettings
      });
      
      return res.json({
        success: true,
        data: processedSettings
      });
    } else {
      // デフォルトのデザイン設定を使用
      const defaultSettings = getDefaultDesignSettings();
      
      log('info', 'デフォルトデザイン設定を返却', { 
        userId,
        sectionsCount: defaultSettings.sections.length
      });
      
      return res.json({
        success: true,
        data: defaultSettings,
        isDefault: true
      });
    }
  } catch (error) {
    log('error', 'デザイン設定の取得中にエラーが発生しました', { 
      error: error instanceof Error ? error.message : String(error)
    });
    res.status(500).json({ 
      success: false,
      error: 'デザイン設定の取得中にエラーが発生しました'
    });
  }
});

// デザイン設定を保存するエンドポイント
router.post('/', authenticate, authorize('store'), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    log('info', 'デザイン設定の保存リクエスト受信', { userId });
    
    // 入力データの事前処理（構造整合性の確保）
    const processedData = dataUtils.processDesignSettings(req.body);
    
    // リクエストボディをバリデーション
    const validationResult = designSettingsSchema.safeParse(processedData);
    if (!validationResult.success) {
      log('error', 'デザイン設定のバリデーションエラー', {
        details: validationResult.error.format()
      });
      return res.status(400).json({ 
        success: false,
        error: 'デザイン設定のバリデーションに失敗しました',
        details: validationResult.error.format()
      });
    }
    
    const designSettings = validationResult.data;
    log('info', 'バリデーション成功', { 
      sectionsCount: designSettings.sections.length, 
      sectionIds: designSettings.sections.map(s => s.id).join(','),
      hasGlobalSettings: !!designSettings.globalSettings
    });
    
    // 店舗プロフィールを取得
    const storeProfile = await storage.getStoreProfile(userId);
    
    if (!storeProfile) {
      log('error', '店舗プロフィールが見つかりません', { userId });
      return res.status(404).json({ 
        success: false,
        error: '店舗プロフィールが見つかりません'
      });
    }
    
    log('info', '店舗プロフィール取得成功', { 
      storeId: storeProfile.id, 
      businessName: storeProfile.business_name
    });
    
    try {
      // デザイン設定を更新（Drizzle ORMを使用）
      await db.update(store_profiles)
        .set({ 
          design_settings: designSettings,
          updated_at: new Date()
        })
        .where(eq(store_profiles.user_id, userId));
      
      log('info', 'デザイン設定更新成功', {
        userId,
        sectionsCount: designSettings.sections.length
      });
      
      res.json({ 
        success: true, 
        message: 'デザイン設定が正常に保存されました',
        data: designSettings
      });
    } catch (dbError) {
      log('error', 'データベース更新エラー', { 
        error: dbError instanceof Error ? dbError.message : String(dbError),
        userId
      });
      
      // データベースエラーの場合は明確なエラーメッセージを返す
      return res.status(500).json({ 
        success: false,
        error: 'デザイン設定の保存時にデータベースエラーが発生しました'
      });
    }
  } catch (error) {
    log('error', 'デザイン設定の保存中にエラーが発生しました', { 
      error: error instanceof Error ? error.message : String(error)
    });
    
    res.status(500).json({ 
      success: false,
      error: 'デザイン設定の保存中にエラーが発生しました'
    });
  }
});

export default router;