import { Request, Response, NextFunction } from 'express';
import { log } from '../utils/logger';
import { ZodError } from 'zod';
import { ApiErrorType, sendError } from '../utils/api-response';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  type?: ApiErrorType;
  details?: any;
}

/**
 * 標準化された集中エラーハンドリングミドルウェア
 */
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

  // Zodバリデーションエラーの処理
  if (err instanceof ZodError) {
    return sendError(
      res, 
      'ValidationError', 
      'バリデーションエラー', 
      {
        errors: err.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }))
      }
    );
  }

  // 明示的なAPIエラータイプがある場合
  const apiError = err as ApiError;
  if (apiError.type) {
    return sendError(
      res,
      apiError.type,
      apiError.message,
      apiError.details
    );
  }

  // 旧形式のAPIエラー（statusCodeがある場合）
  if (apiError.statusCode) {
    // 旧形式のステータスコードから新しいエラータイプへのマッピング
    let errorType: ApiErrorType = 'InternalServerError';
    
    switch(apiError.statusCode) {
      case 400: errorType = 'BadRequest'; break;
      case 401: errorType = 'Unauthorized'; break;
      case 403: errorType = 'Forbidden'; break;
      case 404: errorType = 'NotFound'; break;
      case 409: errorType = 'ConflictError'; break;
      case 422: errorType = 'ValidationError'; break;
      case 503: errorType = 'ServiceUnavailable'; break;
      default: errorType = 'InternalServerError';
    }
    
    return sendError(
      res,
      errorType,
      apiError.message,
      apiError.code ? { code: apiError.code } : undefined
    );
  }

  // その他の予期しないエラー
  return sendError(
    res,
    'InternalServerError',
    process.env.NODE_ENV === 'development' 
      ? err.message 
      : undefined
  );
}
