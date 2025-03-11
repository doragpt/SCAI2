import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { log } from '../utils/logger';

// ユーザーロールの型定義
export type UserRole = "talent" | "store";

// ユーザー型の拡張
declare global {
  namespace Express {
    interface User {
      id: number;
      role: UserRole;
      username: string;
      displayName: string | null;
    }
  }
}

// 認証ミドルウェア
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // デバッグ用のセッション情報ログ
    log('info', '認証ミドルウェア開始', {
      sessionID: req.sessionID,
      session: req.session ? 'exists' : 'none',
      userId: req.session?.userId,
      path: req.path,
      cookies: req.headers.cookie
    });

    if (!req.session) {
      log('warn', '認証失敗：セッションなし', {
        path: req.path,
        sessionID: req.sessionID
      });
      return res.status(401).json({ message: '認証が必要です' });
    }

    if (!req.session.userId) {
      log('warn', '認証失敗：ユーザーIDなし', {
        path: req.path,
        sessionID: req.sessionID
      });
      return res.status(401).json({ message: '認証が必要です' });
    }

    // ユーザーの存在確認
    const [user] = await db
      .select({
        id: users.id,
        role: users.role,
        username: users.username,
        displayName: users.displayName
      })
      .from(users)
      .where(eq(users.id, req.session.userId));

    if (!user) {
      log('warn', 'ユーザーが見つかりません', { 
        userId: req.session.userId,
        path: req.path,
        sessionID: req.sessionID
      });
      return res.status(401).json({ message: 'ユーザーが見つかりません' });
    }

    log('info', '認証成功', {
      userId: user.id,
      role: user.role,
      path: req.path,
      sessionID: req.sessionID
    });

    req.user = user;
    next();
  } catch (error) {
    log('error', '認証エラー', {
      error: error instanceof Error ? error.message : 'Unknown error',
      path: req.path,
      sessionID: req.sessionID
    });
    return res.status(401).json({ 
      message: error instanceof Error ? error.message : '認証に失敗しました'
    });
  }
}

// ロールベースの認可ミドルウェア
export function authorize(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      log('warn', '認可エラー: ユーザーが認証されていません', {
        path: req.path,
        sessionID: req.sessionID
      });
      return res.status(401).json({ message: '認証が必要です' });
    }

    if (!roles.includes(req.user.role)) {
      log('warn', '認可エラー: 権限不足', {
        userRole: req.user.role,
        requiredRoles: roles,
        path: req.path,
        sessionID: req.sessionID
      });
      return res.status(403).json({ message: 'アクセス権限がありません' });
    }

    log('info', '認可成功', {
      userId: req.user.id,
      role: req.user.role,
      requiredRoles: roles,
      path: req.path,
      sessionID: req.sessionID
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