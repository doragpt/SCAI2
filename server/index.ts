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

    // HTTPサーバーの作成
    const server = createServer(app);

    if (process.env.NODE_ENV === "development") {
      // 開発環境: Viteミドルウェアを設定（APIルートの後に配置）
      log('info', 'Viteミドルウェアのセットアップを開始');
      const viteStartTime = Date.now();

      try {
        await setupVite(app, server);
        log('info', 'Viteセットアップ完了', {
          duration: Date.now() - viteStartTime
        });
      } catch (error) {
        log('error', 'Viteセットアップ失敗', {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
        throw error;
      }
    } else {
      // 本番環境: 静的ファイルの提供
      serveStatic(app);
    }

    const port = Number(process.env.PORT) || 5000;
    server.listen(port, '0.0.0.0', () => {
      log('info', `サーバーを起動しました: http://0.0.0.0:${port}`, {
        environment: process.env.NODE_ENV,
        totalStartupTime: Date.now() - startTime
      });

      // cronジョブは非同期で遅延セットアップ
      setTimeout(() => {
        const cronStartTime = Date.now();
        setupCronJobs();
        log('info', 'Cronジョブのセットアップ完了', {
          duration: Date.now() - cronStartTime
        });
      }, 5000);
    });
  } catch (error) {
    log('error', "致命的な起動エラー", {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
  }
})();