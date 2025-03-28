import express, { Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { sendSuccess } from '../utils/api-response';
import { log } from '../utils/logger';
import { storage } from '../storage';
import path from 'path';
import { dataUtils } from '@shared/utils/dataTypeUtils';
import { getDefaultDesignSettings } from '../shared/defaultDesignSettings';

const router = express.Router();

/**
 * デザインプレビューAPI
 * デザイン管理画面のiframeプレビュー用データを返す
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 認証情報があれば取得、なければデモモード
    const userId = req.user?.id;
    const isDemo = !userId;
    
    log('info', 'プレビューAPIリクエスト受信', { 
      userId: userId || 'demo-mode',
      isDemo,
      query: req.query 
    });

    // embedded=true の場合はJSON APIとして動作
    if (req.query.embedded === 'true') {
      let storeProfile;
      let designData;
      
      if (isDemo) {
        // デモモード: デフォルトデータを使用
        log('info', 'デモモードでプレビューを提供します');
        
        // デモ用店舗プロフィール
        storeProfile = {
          business_name: 'デモ店舗',
          location: '東京都',
          service_type: 'デリヘル',
          catch_phrase: 'プレビューモードのサンプル表示です',
          description: '<p>ここにはお店の説明文が表示されます。</p>',
          gallery_photos: []
        };
        
        // デモ用デザインデータ
        designData = getDefaultDesignSettings();
      } else {
        // 通常モード: データベースからデータを取得
        storeProfile = await storage.getStoreProfile(userId);
        
        if (!storeProfile) {
          log('error', '店舗プロフィールが見つかりません', { userId });
          return res.status(404).json({ 
            success: false,
            error: '店舗プロフィールが見つかりません'
          });
        }
        
        // デザイン設定を取得
        designData = await storage.getDesignSettings(userId);
      
        // デザイン設定が見つからない場合はデフォルト設定を使用
        if (!designData) {
          log('info', 'デザイン設定が見つかりません。デフォルト設定を使用します', { userId });
          designData = getDefaultDesignSettings();
        } else {
          // データ型変換の一貫性を確保するために処理
          try {
            designData = dataUtils.processDesignSettings(designData);
            log('info', 'デザイン設定の処理が成功しました', { 
              userId,
              sectionsCount: designData.sections ? designData.sections.length : 0,
              hasGlobalSettings: !!designData.globalSettings
            });
          } catch (processError) {
            log('error', 'デザイン設定の処理中にエラーが発生しました', { 
              error: processError instanceof Error ? processError.message : String(processError),
              userId 
            });
            // エラー発生時はデフォルト設定を使用
            designData = getDefaultDesignSettings();
            log('info', 'エラーのためデフォルト設定を使用します', { userId });
          }
        }
      }
      
      // プレビュー用のデータを返す
      log('info', 'プレビューデータ送信', {
        hasDesignData: !!designData,
        sectionsCount: designData?.sections?.length || 0
      });
      
      return sendSuccess(res, {
        message: 'プレビュー用データ取得成功',
        timestamp: new Date().toISOString(),
        mode: 'preview',
        storeProfile,
        designData
      });
    } 
    
    // embedded=true パラメータがない場合は、SPAとして処理
    // Viteのミドルウェアを使用してindex.htmlを処理する
    return next();
  } catch (error) {
    log('error', 'プレビューAPIエラー', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    res.status(500).json({
      success: false,
      error: 'プレビューデータの取得中にエラーが発生しました'
    });
  }
});

export default router;