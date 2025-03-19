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
      sessionID: req.sessionID,
      hasSession: !!req.session,
      hasSessionUser: !!req.session?.user,
      requestUser: req.user ? {
        id: req.user.id,
        role: req.user.role
      } : null,
      sessionUser: req.session?.user ? {
        id: req.session.user.id,
        role: req.session.user.role
      } : null
    });

    if (!req.isAuthenticated() || !req.user) {
      log('warn', '未認証アクセス', {
        path: req.path,
        method: req.method,
        sessionID: req.sessionID
      });
      return res.status(401).json({ message: '認証が必要です' });
    }

    // セッションの有効性を確認
    if (!req.session || !req.session.user) {
      log('warn', 'セッション無効', {
        path: req.path,
        sessionID: req.sessionID,
        hasSession: !!req.session,
        hasSessionUser: !!req.session?.user
      });
      return res.status(401).json({ message: 'セッションが無効です' });
    }

    // セッションとユーザー情報の整合性チェック
    if (req.session.user.id !== req.user.id) {
      log('warn', 'セッション不一致', {
        sessionUserId: req.session.user.id,
        requestUserId: req.user.id,
        sessionID: req.sessionID
      });
      return res.status(401).json({ message: '認証情報が一致しません' });
    }

    log('info', '認証成功', {
      userId: req.user.id,
      role: req.user.role,
      path: req.path,
      sessionID: req.sessionID
    });

    next();
  } catch (error) {
    log('error', '認証エラー', {
      error: error instanceof Error ? error.message : 'Unknown error',
      path: req.path,
      sessionID: req.sessionID
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
      log('warn', '認可エラー: ユーザーが認証されていません', {
        path: req.path,
        sessionID: req.sessionID
      });
      return res.status(401).json({ message: '認証が必要です' });
    }

    if (req.user.role !== role) {
      log('warn', '認可エラー: 権限不足', {
        userRole: req.user.role,
        requiredRole: role,
        path: req.path,
        sessionID: req.sessionID
      });
      return res.status(403).json({ 
        message: `この操作には${role === 'store' ? '店舗' : '女性'}アカウントが必要です`
      });
    }

    log('info', '認可成功', {
      userId: req.user.id,
      role: req.user.role,
      requiredRole: role,
      path: req.path,
      sessionID: req.sessionID
    });

    next();
  };
}