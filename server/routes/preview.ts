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
      query: req.query,
      contentType: req.headers['content-type'],
      accept: req.headers.accept
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
      
      // データが適切に処理されていることを確認
      if (designData && typeof designData === 'string') {
        try {
          // 文字列の場合はJSONパースを試みる
          const parsedData = JSON.parse(designData);
          // 正常にパースできれば利用
          designData = parsedData;
          log('info', '文字列形式のデザインデータをJSONに変換しました', { userId });
        } catch (parseError) {
          log('error', 'デザインデータのパースに失敗しました', { 
            error: parseError instanceof Error ? parseError.message : String(parseError),
            userId 
          });
          // パースに失敗した場合はデフォルト設定を使用
          designData = getDefaultDesignSettings();
        }
      }
      
      // セクションと設定データを検証・修正
      if (designData && typeof designData === 'object') {
        // セクションが配列であることを確認
        if (!designData.sections || !Array.isArray(designData.sections)) {
          log('info', 'デザインデータのセクションが無効なため空配列を使用', { userId });
          designData.sections = [];
        }
        
        // グローバル設定がオブジェクトであることを確認
        if (!designData.globalSettings || typeof designData.globalSettings !== 'object') {
          log('info', 'デザインデータのグローバル設定が無効なためデフォルト設定を使用', { userId });
          designData.globalSettings = {
            mainColor: '#ff6b81',
            secondaryColor: '#f9f9f9',
            accentColor: '#41a0ff',
            backgroundColor: '#ffffff',
            fontFamily: 'sans-serif',
            borderRadius: 8,
            maxWidth: 1200,
            hideSectionTitles: false
          };
        }
      } else {
        // designDataがオブジェクトでない場合、デフォルトオブジェクトを使用
        designData = getDefaultDesignSettings();
        log('info', 'デザインデータが無効なためデフォルト設定を使用', { 
          designDataType: typeof designData,
          userId 
        });
      }
      
      // 明示的に整形したデータを作成（クライアントでの処理をシンプルにするため）
      const formattedData = {
        success: true,
        message: 'プレビュー用データ取得成功',
        timestamp: new Date().toISOString(),
        mode: 'preview',
        storeProfile: storeProfile || {
          business_name: 'デフォルト店舗',
          location: '東京都',
          service_type: 'デリヘル',
          catch_phrase: 'プレビュー表示用のデフォルトデータです',
          description: '<p>店舗情報が設定されていません。</p>'
        },
        designData: designData
      };
      
      // 安全のために重要なJSONデータの構造を検証
      log('info', 'フォーマット済みデザインデータの構造', {
        hasData: !!formattedData.designData,
        dataType: typeof formattedData.designData,
        hasSections: !!(formattedData.designData && formattedData.designData.sections),
        sectionsIsArray: formattedData.designData && Array.isArray(formattedData.designData.sections),
        sectionsCount: formattedData.designData && Array.isArray(formattedData.designData.sections) 
          ? formattedData.designData.sections.length 
          : 'not an array',
        hasGlobalSettings: !!(formattedData.designData && formattedData.designData.globalSettings),
        storeProfileExists: !!formattedData.storeProfile
      });
      
      // 明示的にContent-Typeを設定
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      
      // 結果を返す
      return res.status(200).json(formattedData);
    } 
    
    // embedded=true パラメータがない場合は、SPAとして処理
    // Viteのミドルウェアを使用してindex.htmlを処理する
    return next();
  } catch (error) {
    log('error', 'プレビューAPIエラー', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // 明示的にContent-Typeを設定
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    
    // エラーレスポンスを返す
    return res.status(500).json({
      success: false,
      error: 'プレビューデータの取得中にエラーが発生しました',
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
});

export default router;