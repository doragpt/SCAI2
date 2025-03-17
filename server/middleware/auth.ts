import { Request, Response, NextFunction } from 'express';
import { log } from '../utils/logger';

// 認証ミドルウェア
export function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    log('info', '認証チェック開始', {
      isAuthenticated: req.isAuthenticated(),
      hasSession: !!req.session,
      hasUser: !!req.user,
      sessionID: req.sessionID,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });

    if (!req.isAuthenticated()) {
      log('warn', '認証失敗: 未認証', {
        path: req.path,
        method: req.method,
        sessionID: req.sessionID,
        timestamp: new Date().toISOString()
      });
      return res.status(401).json({ message: '認証が必要です' });
    }

    log('info', '認証成功', {
      userId: req.user?.id,
      role: req.user?.role,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });

    next();
  } catch (error) {
    log('error', '認証エラー', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      path: req.path,
      method: req.method,
      sessionID: req.sessionID,
      timestamp: new Date().toISOString()
    });
    return res.status(401).json({ 
      message: error instanceof Error ? error.message : '認証に失敗しました'
    });
  }
}

// ロールベースの認可ミドルウェア
export function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      log('warn', '認可エラー: ユーザーが認証されていません');
      return res.status(401).json({ message: '認証が必要です' });
    }

    if (!roles.includes(req.user.role)) {
      log('warn', '認可エラー: 権限不足', {
        userRole: req.user.role,
        requiredRoles: roles
      });
      return res.status(403).json({ message: 'アクセス権限がありません' });
    }

    log('info', '認可成功', {
      userId: req.user.id,
      role: req.user.role,
      requiredRoles: roles
    });

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