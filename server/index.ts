import express, { type Request, Response, NextFunction } from "express";
import { setupVite, serveStatic } from "./vite";
import { db, sql } from "./db";
import cors from "cors";
import { setupCronJobs } from "./cron";
import { log } from "./utils/logger";
import { createServer } from "http";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import app from "./app";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 開発環境を設定
process.env.NODE_ENV = "development";

(async () => {
  try {
    const startTime = Date.now();
    console.log('アプリケーション起動開始');
    log('info', 'アプリケーション起動開始', {
      timestamp: startTime,
      environment: process.env.NODE_ENV
    });

    // データベース接続テスト
    try {
      log('info', 'データベース接続を試行中...', {
        host: process.env.PGHOST,
        database: process.env.PGDATABASE,
        port: process.env.PGPORT
      });

      await db.execute(sql`SELECT 1`);
      log('info', 'データベース接続成功', {
        duration: Date.now() - startTime
      });
    } catch (error) {
      log('error', 'データベース接続失敗', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      process.exit(1);
    }

    console.log('アプリケーション初期化中...');
    
    // HTTPサーバーの作成
    const server = createServer(app);
    console.log('HTTPサーバー作成完了');

    // 開発環境の場合のみViteミドルウェアを設定
    if (process.env.NODE_ENV === "development") {
      console.log('Viteミドルウェアのセットアップを開始');
      log('info', 'Viteミドルウェアのセットアップを開始');
      try {
        await setupVite(app, server);
        console.log('Viteセットアップ完了');
        log('info', 'Viteセットアップ完了');
      } catch (error) {
        console.error('Viteセットアップ失敗:', error instanceof Error ? error.message : 'Unknown error');
        log('error', 'Viteセットアップ失敗', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
      }
    } else {
      // 本番環境では静的ファイルを提供
      serveStatic(app);
    }

    // Replitの環境に適応するためにポート設定を調整
    const port = Number(process.env.PORT) || 5000;
    server.listen(port, '0.0.0.0', () => {
      log('info', `サーバーを起動しました: http://0.0.0.0:${port}`, {
        environment: process.env.NODE_ENV,
        port: port,
        totalStartupTime: Date.now() - startTime
      });

      // cronジョブのセットアップ
      setupCronJobs();
    });
  } catch (error) {
    console.error("致命的な起動エラー:", error instanceof Error ? error.message : 'Unknown error');
    console.error("スタックトレース:", error instanceof Error ? error.stack : undefined);
    log('error', "致命的な起動エラー", {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
  }
})();