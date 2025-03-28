import express, { Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { sendSuccess } from '../utils/api-response';
import { log } from '../utils/logger';
import { storage } from '../storage';
import path from 'path';

const router = express.Router();

/**
 * デザインプレビューAPI
 * デザイン管理画面のiframeプレビュー用データを返す
 */
router.get('/', authenticate, authorize('store'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    log('info', 'プレビューAPIリクエスト受信', { 
      userId,
      query: req.query 
    });

    // embedded=true の場合はJSON APIとして動作
    if (req.query.embedded === 'true') {
      // 店舗プロフィールを取得
      const storeProfile = await storage.getStoreProfile(userId);
      
      if (!storeProfile) {
        log('error', '店舗プロフィールが見つかりません', { userId });
        return res.status(404).json({ 
          success: false,
          error: '店舗プロフィールが見つかりません'
        });
      }
      
      // デザイン設定を取得
      const designData = await storage.getDesignSettings(userId);
      
      // プレビュー用のデータを返す
      return sendSuccess(res, {
        message: 'プレビュー用データ取得成功',
        timestamp: new Date().toISOString(),
        mode: 'preview',
        storeProfile,
        designData: designData || null
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