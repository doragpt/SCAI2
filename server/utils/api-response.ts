import { Response } from 'express';
import { log } from './logger';

/**
 * API応答の標準化されたエラータイプ
 */
export type ApiErrorType = 
  | 'BadRequest'
  | 'Unauthorized'
  | 'Forbidden'
  | 'NotFound'
  | 'ValidationError'
  | 'InternalServerError'
  | 'ServiceUnavailable'
  | 'ConflictError';

/**
 * API応答の標準化されたステータスコード
 */
export const ApiStatusCodes: Record<ApiErrorType, number> = {
  BadRequest: 400,
  Unauthorized: 401,
  Forbidden: 403,
  NotFound: 404,
  ValidationError: 422,
  InternalServerError: 500,
  ServiceUnavailable: 503,
  ConflictError: 409
};

/**
 * API応答の標準化されたエラーメッセージ
 */
export const ApiErrorMessages: Record<ApiErrorType, string> = {
  BadRequest: 'リクエストが不正です',
  Unauthorized: '認証が必要です',
  Forbidden: 'アクセス権限がありません',
  NotFound: 'リソースが見つかりません',
  ValidationError: '入力データが不正です',
  InternalServerError: 'サーバー内部エラーが発生しました',
  ServiceUnavailable: 'サービスが一時的に利用できません',
  ConflictError: 'リソースの競合が発生しました'
};

/**
 * 成功レスポンスを返す
 */
export function sendSuccess<T>(res: Response, data: T, status = 200): void {
  res.status(status).json(data);
}

/**
 * エラーレスポンスを返す（標準形式）
 */
export function sendError(
  res: Response, 
  type: ApiErrorType, 
  message?: string, 
  details?: any, 
  logLevel: 'error' | 'warn' | 'info' = 'error'
): void {
  const statusCode = ApiStatusCodes[type] || 500;
  const defaultMessage = ApiErrorMessages[type];
  
  const errorResponse = {
    error: type,
    message: message || defaultMessage,
    ...(details && { details })
  };
  
  log(logLevel, `APIエラーレスポンス: ${type}`, {
    status: statusCode,
    error: type,
    message: message || defaultMessage,
    details,
    timestamp: new Date().toISOString()
  });
  
  res.status(statusCode).json(errorResponse);
}