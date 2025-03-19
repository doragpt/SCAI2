import { Request, Response, NextFunction } from 'express';
import { log } from '../utils/logger';

// 認証ミドルウェア
export function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    // セッション状態をログ
    log('debug', '認証ミドルウェア: セッション状態', {
      sessionId: req.sessionID,
      session: req.session,
      isAuthenticated: req.isAuthenticated(),
      user: req.user
    });

    if (!req.isAuthenticated()) {
      log('warn', '認証ミドルウェア: 未認証アクセス');
      return res.status(401).json({ message: '認証が必要です' });
    }

    if (!req.user?.id || !req.user?.role) {
      log('warn', '認証ミドルウェア: 不完全なユーザー情報', {
        sessionId: req.sessionID,
        user: req.user
      });
      return res.status(401).json({ message: 'ユーザー情報が不完全です' });
    }

    if (req.user.role !== 'store') {
      log('warn', '認証ミドルウェア: 権限不足', {
        userId: req.user.id,
        role: req.user.role
      });
      return res.status(403).json({ message: 'この操作には店舗権限が必要です' });
    }

    log('info', '認証成功', {
      userId: req.user.id,
      role: req.user.role
    });

    next();
  } catch (error) {
    log('error', '認証エラー', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return res.status(500).json({ message: '認証処理中にエラーが発生しました' });
  }
}

// ロールベースの認可ミドルウェア
export function authorize(...roles: Array<'talent' | 'store'>) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.role) {
      return res.status(401).json({ message: '認証が必要です' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'アクセス権限がありません' });
    }

    next();
  };
}

// リクエストバリデーションミドルウェア
export function validateRequest(schema: any) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
}