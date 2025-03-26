import express, { Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { db } from '../db';
import { store_profiles, eq } from '@shared/schema';
import { designSettingsSchema, type DesignSettings } from '@shared/schema';
import { storage } from '../storage';

const router = express.Router();

// デザイン設定を取得するエンドポイント
router.get('/', authenticate, authorize('store'), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    
    // 店舗プロフィールを取得
    const storeProfile = await storage.getStoreProfile(userId);
    
    if (!storeProfile) {
      return res.status(404).json({ error: '店舗プロフィールが見つかりません' });
    }
    
    // design_settingsフィールドがあればそれを返す、なければデフォルト設定を返す
    if (storeProfile.design_settings) {
      return res.json(storeProfile.design_settings);
    } else {
      // デフォルトのデザイン設定
      const defaultDesignSettings: DesignSettings = {
        sections: [
          {
            id: 'catchphrase',
            title: 'キャッチコピー・仕事内容',
            visible: true,
            order: 1,
            settings: {
              backgroundColor: '#ffffff',
              textColor: '#333333',
              borderColor: '#e0e0e0',
              titleColor: '#ff6b81',
              fontSize: 16,
              padding: 20,
              borderRadius: 8,
              borderWidth: 1
            }
          },
          {
            id: 'benefits',
            title: '待遇・環境',
            visible: true,
            order: 2,
            settings: {
              backgroundColor: '#fafafa',
              textColor: '#333333',
              borderColor: '#e0e0e0',
              titleColor: '#ff6b81',
              fontSize: 16, 
              padding: 20,
              borderRadius: 8,
              borderWidth: 1
            }
          },
          {
            id: 'requirements',
            title: '応募条件',
            visible: true,
            order: 3,
            settings: {
              backgroundColor: '#ffffff',
              textColor: '#333333',
              borderColor: '#e0e0e0',
              titleColor: '#ff6b81',
              fontSize: 16,
              padding: 20,
              borderRadius: 8,
              borderWidth: 1
            }
          },
          {
            id: 'salary',
            title: '給与情報',
            visible: true,
            order: 4,
            settings: {
              backgroundColor: '#fff9fa',
              textColor: '#333333',
              borderColor: '#ffd6dd',
              titleColor: '#ff6b81',
              fontSize: 16,
              padding: 20,
              borderRadius: 8,
              borderWidth: 1
            }
          },
          {
            id: 'schedule',
            title: '勤務時間',
            visible: true,
            order: 5,
            settings: {
              backgroundColor: '#ffffff',
              textColor: '#333333',
              borderColor: '#e0e0e0',
              titleColor: '#ff6b81',
              fontSize: 16,
              padding: 20,
              borderRadius: 8,
              borderWidth: 1
            }
          },
          {
            id: 'access',
            title: 'アクセス・住所',
            visible: true,
            order: 6,
            settings: {
              backgroundColor: '#f8f8f8',
              textColor: '#333333',
              borderColor: '#e0e0e0',
              titleColor: '#ff6b81',
              fontSize: 16,
              padding: 20,
              borderRadius: 8,
              borderWidth: 1
            }
          },
          {
            id: 'contact',
            title: '応募方法・連絡先',
            visible: true,
            order: 7,
            settings: {
              backgroundColor: '#fff9fa',
              textColor: '#333333',
              borderColor: '#ffd6dd',
              titleColor: '#ff6b81',
              fontSize: 16,
              padding: 20,
              borderRadius: 8,
              borderWidth: 1
            }
          },
          {
            id: 'trial_entry',
            title: '体験入店情報',
            visible: true,
            order: 8,
            settings: {
              backgroundColor: '#fff0f5',
              textColor: '#333333',
              borderColor: '#ffcce0',
              titleColor: '#ff6b81',
              fontSize: 16,
              padding: 20,
              borderRadius: 8,
              borderWidth: 1
            }
          },
          {
            id: 'campaigns',
            title: 'キャンペーン情報',
            visible: true,
            order: 9,
            settings: {
              backgroundColor: '#fff9f0',
              textColor: '#333333',
              borderColor: '#ffe0cc',
              titleColor: '#ff6b81',
              fontSize: 16,
              padding: 20,
              borderRadius: 8,
              borderWidth: 1
            }
          }
        ],
        globalSettings: {
          mainColor: '#ff6b81',
          secondaryColor: '#f9f9f9',
          accentColor: '#41a0ff',
          backgroundColor: '#ffffff',
          fontFamily: 'sans-serif',
          borderRadius: 8,
          maxWidth: 1200
        }
      };
      
      return res.json(defaultDesignSettings);
    }
  } catch (error) {
    console.error('デザイン設定の取得中にエラーが発生しました:', error);
    res.status(500).json({ error: 'デザイン設定の取得中にエラーが発生しました' });
  }
});

// デザイン設定を保存するエンドポイント
router.post('/', authenticate, authorize('store'), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    
    // リクエストボディをバリデーション
    const validationResult = designSettingsSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'デザイン設定のバリデーションに失敗しました',
        details: validationResult.error.format()
      });
    }
    
    const designSettings = validationResult.data;
    
    // 店舗プロフィールを取得
    const storeProfile = await storage.getStoreProfile(userId);
    
    if (!storeProfile) {
      return res.status(404).json({ error: '店舗プロフィールが見つかりません' });
    }
    
    // デザイン設定を更新
    await db.update(store_profiles)
      .set({ design_settings: designSettings })
      .where(eq(store_profiles.user_id, userId));
    
    res.json({ 
      success: true, 
      message: 'デザイン設定が正常に保存されました',
      data: designSettings
    });
    
  } catch (error) {
    console.error('デザイン設定の保存中にエラーが発生しました:', error);
    res.status(500).json({ error: 'デザイン設定の保存中にエラーが発生しました' });
  }
});

export default router;