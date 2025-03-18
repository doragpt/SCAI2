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
      displayName: string;
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

    if (!req.user) {
      log('warn', '認証ミドルウェア: ユーザー情報なし', {
        sessionId: req.sessionID
      });
      return res.status(401).json({ message: 'ユーザー情報が見つかりません' });
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
      .where(eq(users.id, req.user.id));

    if (!user) {
      log('warn', '認証ミドルウェア: DBユーザーなし', { 
        userId: req.user.id 
      });
      return res.status(401).json({ message: 'ユーザーが見つかりません' });
    }

    log('info', '認証成功', {
      userId: user.id,
      role: user.role
    });

    req.user = user;
    next();
  } catch (error) {
    log('error', '認証エラー', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return res.status(500).json({ 
      message: error instanceof Error ? error.message : '認証に失敗しました'
    });
  }
}

// ロールベースの認可ミドルウェア
export function authorize(...roles: UserRole[]) {
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