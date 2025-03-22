import { Router, Request, Response } from "express";
import { uploadToS3, getSignedS3Url } from "../utils/s3";
import { authenticate, authorize } from "../middleware/auth";
import { log } from "../utils/logger";

const router = Router();

// Base64形式の写真をS3にアップロードするエンドポイント
router.post("/photo", authenticate, async (req: Request, res: Response) => {
  try {
    const { base64Data, fileName } = req.body;
    
    if (!base64Data || !fileName) {
      return res.status(400).json({
        message: "リクエストの形式が正しくありません。base64DataとfileNameが必要です。"
      });
    }

    log("info", "S3写真アップロード開始", {
      userId: req.user?.id,
      fileName
    });

    // ファイル名からサニタイズして安全なものに変換
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    
    // S3にアップロード
    const signedUrl = await uploadToS3(base64Data, sanitizedFileName);
    
    log("info", "S3アップロード成功", {
      userId: req.user?.id,
      fileName: sanitizedFileName
    });

    return res.status(200).json({
      message: "写真のアップロードに成功しました",
      url: signedUrl,
      fileName: sanitizedFileName
    });
  } catch (error) {
    log("error", "S3アップロードエラー", {
      error: error instanceof Error ? error.message : "未知のエラー",
      userId: req.user?.id
    });
    
    return res.status(500).json({
      message: "写真のアップロードに失敗しました",
      error: error instanceof Error ? error.message : "未知のエラー"
    });
  }
});

// すでにアップロード済みの写真のURLを更新するエンドポイント
router.get("/signed-url/:key", authenticate, async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    
    if (!key) {
      return res.status(400).json({
        message: "キーパラメータが必要です"
      });
    }

    log("info", "署名付きURL生成開始", {
      userId: req.user?.id,
      key
    });

    const signedUrl = await getSignedS3Url(key);
    
    log("info", "署名付きURL生成成功", {
      userId: req.user?.id,
      key
    });

    return res.status(200).json({
      url: signedUrl
    });
  } catch (error) {
    log("error", "署名付きURL生成エラー", {
      error: error instanceof Error ? error.message : "未知のエラー",
      userId: req.user?.id,
      key: req.params.key
    });
    
    return res.status(500).json({
      message: "署名付きURLの生成に失敗しました",
      error: error instanceof Error ? error.message : "未知のエラー"
    });
  }
});

export default router;