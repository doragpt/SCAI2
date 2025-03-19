import { Request, Response, NextFunction } from 'express';
import { log } from '../utils/logger';
import { ZodError } from 'zod';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  // エラー情報をログに記録
  log('error', 'APIエラー発生', {
    path: req.path,
    method: req.method,
    error: err instanceof Error ? err.message : 'Unknown error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    timestamp: new Date().toISOString()
  });

  // レスポンスヘッダーの設定
  res.setHeader('Content-Type', 'application/json');

  // Zodバリデーションエラーの処理
  if (err instanceof ZodError) {
    return res.status(400).json({
      status: 'error',
      message: 'バリデーションエラー',
      errors: err.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message
      }))
    });
  }

  // APIエラーの処理
  if ((err as ApiError).statusCode) {
    const apiError = err as ApiError;
    const statusCode = apiError.statusCode || 500;
    return res.status(statusCode).json({
      status: 'error',
      message: apiError.message,
      code: apiError.code
    });
  }

  // その他のエラーの処理
  const defaultStatusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(defaultStatusCode).json({
    status: 'error',
    message: process.env.NODE_ENV === 'development' 
      ? err.message 
      : '内部サーバーエラー',
    timestamp: new Date().toISOString()
  });
}