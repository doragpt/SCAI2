import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { log } from '../utils/logger';

// ユーザーロールの型定義
export type UserRole = "talent" | "store";

// セッション型の拡張
declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

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
    if (!req.session || !req.session.userId) {
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
      log('warn', 'ユーザーが見つかりません', { userId: req.session.userId });
      req.session.destroy(() => {});
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
      error: error instanceof Error ? error.message : 'Unknown error'
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