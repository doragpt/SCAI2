import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader } from '../jwt';
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
    log('info', '認証処理を開始', {
      path: req.path,
      method: req.method,
      headers: {
        ...req.headers,
        authorization: req.headers.authorization ? '[REDACTED]' : undefined
      }
    });

    const token = extractTokenFromHeader(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ message: '認証トークンが見つかりません' });
    }

    const payload = verifyToken(token);

    // ユーザーの存在確認
    const [user] = await db
      .select({
        id: users.id,
        role: users.role,
        username: users.username,
        displayName: users.displayName
      })
      .from(users)
      .where(eq(users.id, payload.userId));

    if (!user) {
      log('warn', 'ユーザーが見つかりません', { userId: payload.userId });
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