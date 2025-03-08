import { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { accessLogs } from "@shared/schema";
import { createHash } from "crypto";

export const accessLogger = async (req: Request, res: Response, next: NextFunction) => {
  // リクエストの処理を継続
  next();

  // ログ記録は非同期で行い、メインの処理をブロックしない
  try {
    // 店舗ページへのアクセスのみ記録
    if (req.path.startsWith('/store/') && req.method === 'GET') {
      const storeIdMatch = req.path.match(/^\/store\/(\d+)/);
      const storeId = storeIdMatch ? parseInt(storeIdMatch[1]) : null;

      if (storeId) {
        const ipHash = createHash('sha256')
          .update((req.ip || '') + (process.env.JWT_SECRET || ''))
          .digest('hex');

        await db
          .insert(accessLogs)
          .values({
            storeId,
            url: req.path,
            ipHash,
            userAgent: req.headers['user-agent'] || '',
            referer: req.headers.referer || '',
          });

        console.log('Access log recorded:', {
          path: req.path,
          storeId,
          timestamp: new Date().toISOString()
        });
      }
    }
  } catch (error) {
    // エラーはログに記録するだけで、アプリケーションの動作には影響を与えない
    console.error('Access log recording error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
};
