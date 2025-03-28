import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { sendSuccess } from '../utils/api-response';
import { log } from '../utils/logger';

const router = express.Router();

/**
 * デザインプレビューAPI
 * デザイン管理画面のiframeプレビュー用データを返す
 */
router.get('/', authenticate, authorize('store'), async (req, res) => {
  try {
    log('info', 'プレビューAPIリクエスト受信', { 
      userId: req.user!.id,
      query: req.query 
    });

    // プレビュー用の最小限のデータを返す
    // プレビューページのReactコンポーネントは親ウィンドウからデータを受け取るため
    // ここでは単純な成功レスポンスを返す
    return sendSuccess(res, {
      message: 'プレビュー用APIエンドポイント',
      timestamp: new Date().toISOString(),
      mode: 'preview'
    });
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