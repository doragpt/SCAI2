import { Request, Response, NextFunction } from 'express';
import { log } from '../utils/logger';

// ユーザーロールの型定義
export type UserRole = "talent" | "store";

// ユーザー型の拡張
declare global {
  namespace Express {
    interface User {
      id: number;
      role: UserRole;
      email: string;
      displayName: string | null;
    }
  }
}

// 認証ミドルウェア
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    log('info', '認証チェック開始', {
      path: req.path,
      method: req.method,
      isAuthenticated: req.isAuthenticated(),
      sessionID: req.sessionID
    });

    if (!req.isAuthenticated() || !req.user) {
      log('warn', '未認証アクセス', {
        path: req.path,
        method: req.method
      });
      return res.status(401).json({ message: '認証が必要です' });
    }

    log('info', '認証成功', {
      userId: req.user.id,
      role: req.user.role,
      path: req.path
    });

    next();
  } catch (error) {
    log('error', '認証エラー', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return res.status(500).json({ 
      message: error instanceof Error ? error.message : '認証に失敗しました'
    });
  }
}

// ロールベースの認可ミドルウェア
export function authorize(role: UserRole) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      log('warn', '認可エラー: ユーザーが認証されていません');
      return res.status(401).json({ message: '認証が必要です' });
    }

    if (req.user.role !== role) {
      log('warn', '認可エラー: 権限不足', {
        userRole: req.user.role,
        requiredRole: role
      });
      return res.status(403).json({ message: 'アクセス権限がありません' });
    }

    log('info', '認可成功', {
      userId: req.user.id,
      role: req.user.role,
      requiredRole: role
    });

    next();
  };
}